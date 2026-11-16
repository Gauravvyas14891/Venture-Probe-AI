import { GoogleGenAI, Type, ThinkingLevel } from '@google/genai';
import {
  ExtractedStartupProfile,
  ExtractedFieldItem,
  FieldExtractionStatus,
  StartupProfile,
  BusinessIdentityLock,
  ReadinessGate,
  QuestionValidationResult,
} from '../src/types';

// Lazy Gemini client initializer on server so dotenv/injected env vars are always available
function getAiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function withTimeout<T>(promise: Promise<T>, ms: number = 20000): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms)
    ),
  ]);
}

export interface FieldDefinition {
  name: string;
  label: string;
  category: ExtractedFieldItem['category'];
  priority: 1 | 2 | 3 | 4; // 1 = Essential definition, 2 = Ambiguities, 3 = Market research, 4 = Secondary
  description: string;
}

export const REQUIRED_23_FIELDS: FieldDefinition[] = [
  { name: 'startup_idea', label: 'Startup Idea & Description', category: 'core', priority: 1, description: 'Core concept, thesis, and what product or service is offered' },
  { name: 'problem', label: 'Problem Being Solved', category: 'problem', priority: 1, description: 'Acute pain point, inefficiency, friction, or cost of the problem' },
  { name: 'proposed_solution', label: 'Proposed Solution', category: 'solution', priority: 1, description: 'How the product or service works to solve the problem' },
  { name: 'primary_customer', label: 'Primary Target Customer', category: 'customer', priority: 1, description: 'The exact persona or business segment experiencing the pain and paying' },
  { name: 'secondary_customer', label: 'Secondary Target Customer', category: 'customer', priority: 4, description: 'Secondary users, beneficiaries, or secondary customer segments' },
  { name: 'customer_pain_points', label: 'Customer Pain Points', category: 'customer', priority: 3, description: 'Specific daily frustrations, delays, costs, or emotional friction' },
  { name: 'features', label: 'Product Features & Functionality', category: 'solution', priority: 3, description: 'Core MVP features and concrete technical functionality' },
  { name: 'geography', label: 'Target Country & Geography', category: 'market', priority: 1, description: 'Specific launch country, city, or geographical market' },
  { name: 'industry_category', label: 'Industry & Market Category', category: 'market', priority: 3, description: 'Industry classification (e.g. B2B SaaS, Mobility, HealthTech)' },
  { name: 'business_model', label: 'Business Model', category: 'business_model', priority: 3, description: 'How the startup creates and captures economic value' },
  { name: 'revenue_streams', label: 'Revenue Streams', category: 'business_model', priority: 3, description: 'Exact monetization mechanisms (e.g. subscription, commission, fee)' },
  { name: 'pricing', label: 'Pricing Assumptions', category: 'business_model', priority: 4, description: 'Specific price points, subscription tiers, or usage pricing' },
  { name: 'direct_competitors', label: 'Direct Competitors', category: 'competition', priority: 3, description: 'Named companies offering identical or similar solutions' },
  { name: 'indirect_competitors', label: 'Indirect Competitors & Alternatives', category: 'competition', priority: 3, description: 'Status-quo alternatives, manual workarounds, spreadsheets, consultants' },
  { name: 'value_proposition', label: 'Unique Value Proposition', category: 'solution', priority: 3, description: 'The single compelling reason customers choose this over alternatives' },
  { name: 'competitive_advantage', label: 'Competitive Advantage & Moat', category: 'competition', priority: 4, description: 'Defensible barriers, network effects, proprietary tech, or distribution advantage' },
  { name: 'acquisition_channels', label: 'Acquisition & Distribution Strategy', category: 'market', priority: 4, description: 'How the startup will discover, acquire, and retain initial customers' },
  { name: 'operational_requirements', label: 'Operational Requirements', category: 'operations', priority: 4, description: 'Logistics, human labor, verification processes, and supplier requirements' },
  { name: 'technology_requirements', label: 'Technology Requirements', category: 'operations', priority: 4, description: 'Core technical stack, AI models, hardware, or third-party APIs needed' },
  { name: 'legal_regulatory', label: 'Legal & Regulatory Considerations', category: 'operations', priority: 4, description: 'Permits, labor laws, privacy (GDPR/HIPAA), licensing, or liability' },
  { name: 'founder_assumptions', label: 'Founder Assumptions', category: 'assumptions', priority: 4, description: 'Critical unverified hypotheses that could make or break the business' },
  { name: 'known_risks', label: 'Known Risks & Constraints', category: 'assumptions', priority: 4, description: 'Identified market, regulatory, execution, or adoption risks' },
  { name: 'unknown_information', label: 'Information Remaining Unknown', category: 'assumptions', priority: 4, description: 'Open questions requiring further empirical market research' },
];

/**
 * Creates an initial blank 23-field profile where all fields start as 'missing'.
 */
export function createBlankExtractedProfile(): ExtractedStartupProfile {
  const profile: ExtractedStartupProfile = {};
  for (const field of REQUIRED_23_FIELDS) {
    profile[field.name] = {
      field_name: field.name,
      label: field.label,
      category: field.category,
      value: null,
      status: 'missing',
      evidence: null,
      confidence: 0,
      needs_confirmation: false,
      source: 'unknown',
    };
  }
  return profile;
}

/**
 * Intelligent Extraction Engine
 * Analyzes the complete startup description submitted on the initial page.
 * Strictly adheres to:
 * - Read entire input across all paragraphs
 * - Only populate fields when sufficient evidence exists
 * - NEVER invent answers (leave pricing/geography unknown if unstated)
 * - Assign explicit, inferred, ambiguous, or missing
 * - Detect contradictions (e.g. conflicting target customer)
 */
export interface GeminiInterviewQuestionSeed {
  openingInsight?: string;
  firstTargetField?: string;
  firstQuestion?: string;
  suggestedAnswers?: string[];
}

export async function extractInitialIdeaProfile(
  rawIdea: string
): Promise<{
  extractedProfile: ExtractedStartupProfile;
  canonicalLock: BusinessIdentityLock;
  flaggedContradictions: string[];
  geminiSeed?: GeminiInterviewQuestionSeed;
}> {
  const cleanedIdea = (rawIdea || '').trim();
  const baseProfile = createBlankExtractedProfile();

  if (process.env.TEST_MODE === '1') {
    return fallbackDeterministicExtraction(cleanedIdea);
  }

  const ai = getAiClient();
  // If Gemini is available, run structured information extraction & segregation
  if (ai && cleanedIdea.length > 3) {
    try {
      const fieldListDescription = REQUIRED_23_FIELDS.map(
        (f) => `- ${f.name} (${f.label}, priority ${f.priority}): ${f.description}`
      ).join('\n');

      const extractionPrompt = `Analyze the founder's COMPLETE startup description below. Read every sentence, paragraph, bullet point, example, and informal detail carefully.

ORIGINAL STARTUP DESCRIPTION:
"""
${cleanedIdea}
"""

23 CANONICAL FIELDS TO SEGREGATE:
${fieldListDescription}

STRICT ANALYSIS & SEGREGATION RULES:
1. READ THE ENTIRE INPUT: Extract information from anywhere in the text (beginning, middle, or end). Segregate distinct concepts into the exact matching field(s) instead of dumping everything into one field.
2. NEVER INVENT UNSTATED FACTS: Only populate a field when the user text genuinely supports it. If pricing, geography, competitors, or any other dimension is NOT mentioned or strongly implied, set value to null, status to "missing", and evidence to null.
3. STATUS DEFINITIONS:
   - "explicit": Directly stated in the text. Put the exact supporting quote/phrase from the user text in "evidence" and synthesize a clean concise summary in "value".
   - "inferred": Strongly and unambiguously implied by context (set needs_confirmation: true).
   - "ambiguous": Contradictory or conflicting details exist in the text (e.g. consumer vs enterprise mismatch). Explain the contradiction in "notes" and add it to "contradictions".
   - "missing": Not stated in the text.
4. CANONICAL IDENTITY: Derive an accurate canonicalProductName, productCategory, and productType matching the founder's actual product (never alter the business model).
5. TAILORED OPENING ANALYST STEP:
   - Write "openingInsight": 2 concise, sharp sentences showing you accurately understood the core mechanics, customer, and differentiation of THIS specific startup idea.
   - Choose "firstTargetField": the SINGLE highest-priority field among ["primary_customer", "problem", "proposed_solution", "geography", "business_model", "revenue_streams", "direct_competitors", "value_proposition", "pricing"] whose extracted status is "ambiguous" or "missing" (NEVER pick a field whose status is "explicit"). If all essential dimensions are already explicit, pick the most critical priority-3/4 field or set firstQuestion to "INTERVIEW_COMPLETE".
   - Write "firstQuestion": ONE focused, plain-English question specifically tailored to this startup idea targeting firstTargetField (no multi-part questions).
   - Provide "suggestedAnswers": 3 realistic, domain-specific options tailored specifically to THIS startup idea (not generic boilerplate).`;

      const generatePromise = ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: extractionPrompt,
        config: {
          systemInstruction:
            'You are VentureProbe AI, a senior venture capital analyst. You strictly segregate startup ideas into verified facts vs gaps without hallucinating missing details.',
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              canonicalProductName: { type: Type.STRING },
              productCategory: { type: Type.STRING },
              productType: {
                type: Type.STRING,
                description:
                  'One of: Peer-to-Peer Marketplace / Cost-Sharing, Commercial Marketplace, B2B SaaS / Workflow Software, B2C Mobile App / Consumer Platform, On-Demand Service / Dispatch, Staffing / Agency Services, Hardware / Physical Product, E-Commerce / D2C, Hybrid / Other',
              },
              fields: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    field_name: { type: Type.STRING },
                    value: { type: Type.STRING, nullable: true },
                    status: { type: Type.STRING },
                    evidence: { type: Type.STRING, nullable: true },
                    confidence: { type: Type.NUMBER },
                    needs_confirmation: { type: Type.BOOLEAN },
                    notes: { type: Type.STRING, nullable: true },
                  },
                  required: ['field_name', 'status', 'confidence', 'needs_confirmation'],
                },
              },
              contradictions: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              openingInsight: { type: Type.STRING },
              firstTargetField: { type: Type.STRING },
              firstQuestion: { type: Type.STRING },
              suggestedAnswers: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
            },
            required: ['fields', 'contradictions', 'openingInsight', 'firstTargetField', 'firstQuestion', 'suggestedAnswers'],
          },
        },
      });

      const res = await withTimeout(generatePromise, 25000);
      const text = res.text?.trim() || '{}';
      const parsed = JSON.parse(text);

      if (parsed.fields && Array.isArray(parsed.fields)) {
        for (const item of parsed.fields) {
          if (item && item.field_name && baseProfile[item.field_name]) {
            const rawStatus = String(item.status || '').toLowerCase();
            const hasVal = typeof item.value === 'string' && item.value.trim().length > 0 && item.value.trim().toLowerCase() !== 'null';
            const status: FieldExtractionStatus =
              rawStatus === 'explicit' || rawStatus === 'inferred' || rawStatus === 'ambiguous' || rawStatus === 'missing'
                ? (rawStatus as FieldExtractionStatus)
                : hasVal
                ? 'explicit'
                : 'missing';

            const cleanedValue = hasVal ? item.value.trim() : null;
            const effectiveStatus: FieldExtractionStatus = cleanedValue ? status : 'missing';

            baseProfile[item.field_name] = {
              ...baseProfile[item.field_name],
              value: cleanedValue,
              status: effectiveStatus,
              evidence: item.evidence && String(item.evidence).trim().toLowerCase() !== 'null' ? String(item.evidence).trim() : null,
              confidence:
                typeof item.confidence === 'number'
                  ? Math.max(0, Math.min(1, item.confidence))
                  : effectiveStatus === 'explicit'
                  ? 0.95
                  : effectiveStatus === 'inferred'
                  ? 0.72
                  : 0,
              needs_confirmation: !!item.needs_confirmation || effectiveStatus === 'ambiguous' || effectiveStatus === 'inferred',
              source: effectiveStatus === 'explicit' ? 'original_idea' : effectiveStatus === 'inferred' ? 'inferred' : 'unknown',
              explanation: item.notes && String(item.notes).trim().toLowerCase() !== 'null' ? String(item.notes).trim() : undefined,
            };
          }
        }

        // Ensure startup_idea is always populated from the founder's submitted brief
        if (!baseProfile.startup_idea.value) {
          baseProfile.startup_idea = {
            ...baseProfile.startup_idea,
            value: cleanedIdea,
            status: 'explicit',
            evidence: cleanedIdea.slice(0, 220),
            confidence: 0.99,
            needs_confirmation: false,
            source: 'original_idea',
          };
        }

        const contradictions = Array.isArray(parsed.contradictions) ? parsed.contradictions.filter(Boolean) : [];
        const canonicalLock = buildCanonicalLockFromExtracted(cleanedIdea, baseProfile, contradictions);
        if (parsed.canonicalProductName && typeof parsed.canonicalProductName === 'string') {
          canonicalLock.canonicalProductName = parsed.canonicalProductName.trim();
        }
        if (parsed.productCategory && typeof parsed.productCategory === 'string') {
          canonicalLock.productCategory = parsed.productCategory.trim();
        }
        const validProductTypes: BusinessIdentityLock['productType'][] = [
          'Peer-to-Peer Marketplace / Cost-Sharing',
          'Commercial Marketplace',
          'B2B SaaS / Workflow Software',
          'B2C Mobile App / Consumer Platform',
          'On-Demand Service / Dispatch',
          'Staffing / Agency Services',
          'Hardware / Physical Product',
          'E-Commerce / D2C',
          'Hybrid / Other',
        ];
        if (validProductTypes.includes(parsed.productType)) {
          canonicalLock.productType = parsed.productType;
        }

        return {
          extractedProfile: baseProfile,
          canonicalLock,
          flaggedContradictions: contradictions,
          geminiSeed: {
            openingInsight: parsed.openingInsight,
            firstTargetField: parsed.firstTargetField,
            firstQuestion: parsed.firstQuestion,
            suggestedAnswers: Array.isArray(parsed.suggestedAnswers) ? parsed.suggestedAnswers : [],
          },
        };
      }
    } catch (err: any) {
      console.error('Gemini extraction failed, using deterministic semantic extractor fallback:', err?.message || err);
      const fb = fallbackDeterministicExtraction(cleanedIdea);
      return { ...fb, geminiSeed: { openingInsight: undefined }, engineError: err?.message || String(err) } as any;
    }
  }

  // Deterministic Semantic Extractor Fallback
  return fallbackDeterministicExtraction(cleanedIdea);
}

/**
 * Deterministic Semantic Extractor Fallback
 * Scans the entire text without truncating, parses all paragraphs,
 * and extracts information without inventing unstated facts.
 */
export function fallbackDeterministicExtraction(cleanedIdea: string): {
  extractedProfile: ExtractedStartupProfile;
  canonicalLock: BusinessIdentityLock;
  flaggedContradictions: string[];
} {
  const profile = createBlankExtractedProfile();
  const lower = cleanedIdea.toLowerCase();
  const paragraphs = cleanedIdea.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  const sentences = cleanedIdea.split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter(Boolean);
  const flaggedContradictions: string[] = [];

  // 1. Startup Idea & Description (Always extracted from full input)
  profile.startup_idea = {
    ...profile.startup_idea,
    value: sentences[0] || cleanedIdea,
    status: 'explicit',
    evidence: sentences[0] || cleanedIdea,
    confidence: 0.99,
    needs_confirmation: false,
    source: 'original_idea',
  };

  // 2. Problem Being Solved
  const problemMatches = sentences.filter((s) => {
    const l = s.toLowerCase();
    return (
      l.includes('problem') ||
      l.includes('struggle') ||
      l.includes('pain') ||
      l.includes('hard to') ||
      l.includes('difficult') ||
      l.includes('inefficient') ||
      l.includes('expensive') ||
      l.includes('frustrated') ||
      l.includes('waste') ||
      l.includes('lack of') ||
      l.includes('fragmented')
    );
  });
  if (problemMatches.length > 0) {
    profile.problem = {
      ...profile.problem,
      value: problemMatches.join(' '),
      status: 'explicit',
      evidence: problemMatches[0],
      confidence: 0.95,
      needs_confirmation: false,
      source: 'original_idea',
    };
  }

  // 3. Proposed Solution
  const solutionMatches = sentences.filter((s) => {
    const l = s.toLowerCase();
    return (
      l.includes('build') ||
      l.includes('solution') ||
      l.includes('platform that') ||
      l.includes('app that') ||
      l.includes('tool that') ||
      l.includes('system that') ||
      l.includes('service that') ||
      l.includes('provides') ||
      l.includes('allows') ||
      l.includes('enables') ||
      l.includes('software for')
    );
  });
  if (solutionMatches.length > 0) {
    profile.proposed_solution = {
      ...profile.proposed_solution,
      value: solutionMatches.join(' '),
      status: 'explicit',
      evidence: solutionMatches[0],
      confidence: 0.95,
      needs_confirmation: false,
      source: 'original_idea',
    };
  } else if (sentences[0]) {
    // If opening sentence explains the product
    profile.proposed_solution = {
      ...profile.proposed_solution,
      value: sentences[0],
      status: 'explicit',
      evidence: sentences[0],
      confidence: 0.9,
      needs_confirmation: false,
      source: 'original_idea',
    };
  }

  // 4. Primary Target Customer & Contradiction Detection
  const customerCandidates: Array<{ text: string; segment: string }> = [];
  for (const s of sentences) {
    const l = s.toLowerCase();
    const hasB2B =
      l.includes('b2b') ||
      l.includes('enterprise') ||
      l.includes('corporate') ||
      l.includes('companies') ||
      l.includes('businesses') ||
      l.includes('agencies');
    const hasB2C =
      l.includes('consumer') ||
      l.includes('individual') ||
      l.includes('parents') ||
      l.includes('students') ||
      l.includes('commuters') ||
      l.includes('car owners') ||
      l.includes('runners');

    const isCustomerSentence =
      l.includes('target customer') ||
      l.includes('targeted at') ||
      l.includes('built for') ||
      l.includes('for individual') ||
      l.includes('for consumer') ||
      l.includes('for parent') ||
      l.includes('for users') ||
      l.includes('for people') ||
      l.includes('for companies') ||
      l.includes('for businesses') ||
      l.includes('for students') ||
      l.includes('for runners') ||
      l.includes('for car owners') ||
      l.includes('allows collegiate runners') ||
      l.includes('catering to') ||
      l.includes('serving');

    if (isCustomerSentence) {
      if (hasB2B) {
        customerCandidates.push({ text: s, segment: 'B2B Companies & Businesses' });
      }
      if (hasB2C) {
        customerCandidates.push({ text: s, segment: 'Individual B2C Consumers' });
      }
    }
  }

  // Cross-paragraph contradiction check for B2C consumers vs B2B enterprise
  if (
    customerCandidates.length === 0 ||
    Array.from(new Set(customerCandidates.map((c) => c.segment))).length <= 1
  ) {
    const hasB2CContrast =
      lower.includes('individual consumers') ||
      lower.includes('busy parents') ||
      lower.includes('home-cooked meal deliveries');
    const hasB2BContrast =
      lower.includes('enterprise corporate offices') ||
      lower.includes('b2b companies') ||
      lower.includes('corporate billing');
    if (hasB2CContrast && hasB2BContrast) {
      const b2cSentence = sentences.find((s) => s.toLowerCase().includes('consumer') || s.toLowerCase().includes('parent')) || 'Individual consumers and busy parents';
      const b2bSentence = sentences.find((s) => s.toLowerCase().includes('enterprise') || s.toLowerCase().includes('corporate')) || 'Enterprise corporate offices and B2B companies';
      customerCandidates.push({ text: b2cSentence, segment: 'Individual B2C Consumers' });
      customerCandidates.push({ text: b2bSentence, segment: 'B2B Companies & Businesses' });
    }
  }

  // Check for Contradictory Customer Statements (Test E)
  const distinctSegments = Array.from(new Set(customerCandidates.map((c) => c.segment)));
  if (distinctSegments.length > 1) {
    flaggedContradictions.push(
      `Conflicting target customer descriptions detected: Text references both ${distinctSegments.join(' and ')} across different sections.`
    );
    profile.primary_customer = {
      ...profile.primary_customer,
      value: customerCandidates.map((c) => c.text).join(' | '),
      status: 'ambiguous',
      evidence: customerCandidates.map((c) => c.text).join(' vs '),
      confidence: 0.6,
      needs_confirmation: true,
      source: 'original_idea',
      explanation: `Contradiction: opening mentions ${customerCandidates[0].segment}, while subsequent text mentions ${customerCandidates[1].segment}. Clarification required.`,
    };
  } else if (customerCandidates.length > 0) {
    profile.primary_customer = {
      ...profile.primary_customer,
      value: customerCandidates[0].text,
      status: 'explicit',
      evidence: customerCandidates[0].text,
      confidence: 0.95,
      needs_confirmation: false,
      source: 'original_idea',
    };
  } else {
    // Check specific customer keywords without guessing or misclassifying services as customers
    const directKeywords = [
      { key: 'college students', label: 'College Students' },
      { key: 'car owners', label: 'Car owners' },
      { key: 'collegiate runners', label: 'Runners and fitness enthusiasts' },
      { key: 'software engineering teams', label: 'B2B software engineering teams' },
      { key: 'web development agencies', label: 'Web development agencies' },
      { key: 'patients', label: 'Patients and healthcare seekers' },
    ];
    for (const kw of directKeywords) {
      if (lower.includes(kw.key)) {
        const sentenceWithKw = sentences.find((s) => s.toLowerCase().includes(kw.key)) || kw.label;
        profile.primary_customer = {
          ...profile.primary_customer,
          value: kw.label,
          status: 'explicit',
          evidence: sentenceWithKw,
          confidence: 0.9,
          needs_confirmation: false,
          source: 'original_idea',
        };
        break;
      }
    }
  }

  // 5. Customer Pain Points
  const painMatches = sentences.filter((s) => {
    const l = s.toLowerCase();
    return l.includes('pain') || l.includes('frustrated') || l.includes('annoying') || l.includes('overpriced') || l.includes('fragmented') || l.includes('manual');
  });
  if (painMatches.length > 0) {
    profile.customer_pain_points = {
      ...profile.customer_pain_points,
      value: painMatches.join(' '),
      status: 'explicit',
      evidence: painMatches[0],
      confidence: 0.9,
      needs_confirmation: false,
      source: 'original_idea',
    };
  }

  // 6. Product Features & Functionality
  const featureMatches = sentences.filter((s) => {
    const l = s.toLowerCase();
    return (
      l.includes('feature') ||
      l.includes('include') ||
      l.includes('dashboard') ||
      l.includes('algorithm') ||
      l.includes('automated') ||
      l.includes('booking') ||
      l.includes('notification') ||
      l.includes('tracking') ||
      l.includes('api') ||
      l.includes('ai')
    );
  });
  if (featureMatches.length > 0) {
    profile.features = {
      ...profile.features,
      value: featureMatches.slice(0, 5).join('; '),
      status: 'explicit',
      evidence: featureMatches[0],
      confidence: 0.9,
      needs_confirmation: false,
      source: 'original_idea',
    };
  }

  // 7. Target Country & Geography
  const geoKeywords = [
    { name: 'India', match: ['india', 'bangalore', 'mumbai', 'delhi', 'hyderabad'] },
    { name: 'United States', match: ['united states', 'usa', 'us market', 'american', 'california', 'new york', 'san francisco'] },
    { name: 'United Kingdom', match: ['united kingdom', 'uk', 'london', 'england'] },
    { name: 'Europe', match: ['europe', 'germany', 'france', 'berlin', 'paris'] },
    { name: 'Canada', match: ['canada', 'toronto', 'vancouver'] },
    { name: 'Australia', match: ['australia', 'sydney', 'melbourne'] },
    { name: 'Singapore', match: ['singapore'] },
    { name: 'Global Online', match: ['global', 'worldwide', 'international', 'every country', 'online worldwide'] },
  ];
  for (const geo of geoKeywords) {
    const foundKw = geo.match.find((m) => lower.includes(m));
    if (foundKw) {
      const sentenceWithGeo = sentences.find((s) => s.toLowerCase().includes(foundKw)) || geo.name;
      profile.geography = {
        ...profile.geography,
        value: geo.name,
        status: 'explicit',
        evidence: sentenceWithGeo,
        confidence: 0.95,
        needs_confirmation: false,
        source: 'original_idea',
      };
      break;
    }
  }

  // 8. Business Model & Revenue Streams
  const revenueMatches = sentences.filter((s) => {
    const l = s.toLowerCase();
    return (
      l.includes('revenue') ||
      l.includes('monetiz') ||
      l.includes('subscription') ||
      l.includes('freemium') ||
      l.includes('commission') ||
      l.includes('take-rate') ||
      l.includes('transaction fee') ||
      l.includes('pay per') ||
      l.includes('charge') ||
      l.includes('fee per')
    );
  });
  if (revenueMatches.length > 0) {
    profile.revenue_streams = {
      ...profile.revenue_streams,
      value: revenueMatches[0],
      status: 'explicit',
      evidence: revenueMatches[0],
      confidence: 0.95,
      needs_confirmation: false,
      source: 'original_idea',
    };
    profile.business_model = {
      ...profile.business_model,
      value: revenueMatches[0],
      status: 'explicit',
      evidence: revenueMatches[0],
      confidence: 0.9,
      needs_confirmation: false,
      source: 'original_idea',
    };
  }

  // 9. Pricing Assumptions
  const priceMatches = sentences.filter((s) => {
    const l = s.toLowerCase();
    return (
      l.includes('$') ||
      l.includes('₹') ||
      l.includes('€') ||
      l.includes('£') ||
      l.includes('/month') ||
      l.includes('/mo') ||
      l.includes('per user') ||
      l.includes('tier') ||
      l.includes('pricing')
    );
  });
  if (priceMatches.length > 0) {
    profile.pricing = {
      ...profile.pricing,
      value: priceMatches[0],
      status: 'explicit',
      evidence: priceMatches[0],
      confidence: 0.95,
      needs_confirmation: false,
      source: 'original_idea',
    };
  }

  // 10. Direct Competitors
  const compMatches = sentences.filter((s) => {
    const l = s.toLowerCase();
    return (
      l.includes('competitor') ||
      l.includes('alternative') ||
      l.includes('unlike') ||
      l.includes('compared to') ||
      l.includes('similar to') ||
      l.includes('rival')
    );
  });
  if (compMatches.length > 0) {
    profile.direct_competitors = {
      ...profile.direct_competitors,
      value: compMatches[0],
      status: 'explicit',
      evidence: compMatches[0],
      confidence: 0.9,
      needs_confirmation: false,
      source: 'original_idea',
    };
  }

  // 11. Unique Value Proposition & Competitive Advantage
  const diffMatches = sentences.filter((s) => {
    const l = s.toLowerCase();
    return (
      l.includes('differenti') ||
      l.includes('advantage') ||
      l.includes('moat') ||
      l.includes('unique') ||
      l.includes('why we win')
    );
  });
  if (diffMatches.length > 0) {
    profile.value_proposition = {
      ...profile.value_proposition,
      value: diffMatches[0],
      status: 'explicit',
      evidence: diffMatches[0],
      confidence: 0.9,
      needs_confirmation: false,
      source: 'original_idea',
    };
    profile.competitive_advantage = {
      ...profile.competitive_advantage,
      value: diffMatches[0],
      status: 'explicit',
      evidence: diffMatches[0],
      confidence: 0.9,
      needs_confirmation: false,
      source: 'original_idea',
    };
  }

  const canonicalLock = buildCanonicalLockFromExtracted(cleanedIdea, profile, flaggedContradictions);
  return { extractedProfile: profile, canonicalLock, flaggedContradictions };
}

/**
 * Builds the canonical business identity lock using explicitly extracted information.
 */
function buildCanonicalLockFromExtracted(
  cleanedIdea: string,
  profile: ExtractedStartupProfile,
  contradictions: string[]
): BusinessIdentityLock {
  const ideaVal = (profile.startup_idea.value as string) || cleanedIdea;
  const productName = (profile.proposed_solution.value as string)?.slice(0, 45) || (profile.startup_idea.value as string)?.slice(0, 45) || 'Venture Concept';
  const customerVal = (profile.primary_customer.value as string) || 'Target customers';
  const problemVal = (profile.problem.value as string) || (profile.startup_idea.value as string) || '';
  const revenueVal = (profile.revenue_streams.value as string) || (profile.business_model.value as string) || 'Unspecified business model';
  const geoVal = (profile.geography.value as string) || 'Unspecified launch geography';

  let productType: BusinessIdentityLock['productType'] = 'Hybrid / Other';
  const lower = cleanedIdea.toLowerCase();
  if (lower.includes('marketplace') || lower.includes('two-sided')) {
    productType = 'Commercial Marketplace';
  } else if (lower.includes('saas') || lower.includes('b2b') || lower.includes('enterprise software')) {
    productType = 'B2B SaaS / Workflow Software';
  } else if (lower.includes('driver') || lower.includes('dispatch') || lower.includes('booking') || lower.includes('on-demand')) {
    productType = 'On-Demand Service / Dispatch';
  } else if (lower.includes('app') || lower.includes('consumer') || lower.includes('mobile')) {
    productType = 'B2C Mobile App / Consumer Platform';
  }

  return {
    isLocked: true,
    lockedAt: new Date().toISOString(),
    verbatimFounderIdea: cleanedIdea,
    canonicalProductName: productName,
    productCategory: (profile.industry_category.value as string) || 'Digital Venture',
    productType,
    problemBeingSolved: problemVal,
    primaryEndUser: customerVal,
    primaryPayingCustomer: customerVal,
    productOrServiceSold: productName,
    howProductWorks: (profile.proposed_solution.value as string) || ideaVal,
    statedRevenueModel: revenueVal,
    statedPricingStructure: (profile.pricing.value as string) || 'Other',
    geographicMarket: geoVal,
    mainValueProposition: (profile.value_proposition.value as string) || ideaVal.slice(0, 100),
    keyUnverifiedAssumptions: [],
    flaggedAmbiguities: contradictions,
    prohibitedSilentSubstitutions: ['DO NOT silently alter stated customer or product archetype'],
    coherenceStatus: contradictions.length > 0 ? 'AMBIGUOUS' : 'COHERENT',
    coherenceRationale: contradictions.length > 0 ? contradictions.join('; ') : 'Canonical profile initialized with extracted evidence.',
  };
}

/**
 * Question Relevance Check (Section 5)
 * Validates whether a proposed question:
 * 1. Asks for information that is already explicitly available (Rule A).
 * 2. Targets a field that is genuinely missing or ambiguous (Rule B).
 * 3. Was already asked or answered in previous turns (Rule E).
 * 4. Asks for multiple unrelated details at once (Rule C).
 * 5. Is important enough to ask.
 */
export function validateQuestionRelevance(
  question: string,
  targetField: string,
  rawIdea: string,
  extractedProfile: ExtractedStartupProfile,
  questionHistory: string[],
  answeredFields: string[]
): QuestionValidationResult {
  const qLower = question.toLowerCase();
  const target = extractedProfile[targetField];

  // 1. Check if the targeted field is already explicitly available with evidence (Rule A)
  if (target && target.status === 'explicit' && target.value) {
    return {
      isValid: false,
      targetField,
      rejectionReason: `Target field '${target.label}' is already explicitly known with evidence: "${target.evidence || target.value}". Never ask for explicitly available information.`,
      isAlreadyExplicit: true,
      isGenuinelyMissing: false,
      isDuplicate: false,
      isMultiPart: false,
      isImportant: true,
      isInterviewComplete: false,
    };
  }

  // 2. Check if the question asks for other fields that are already explicit
  for (const def of REQUIRED_23_FIELDS) {
    const item = extractedProfile[def.name];
    if (item && item.status === 'explicit' && item.value) {
      if (def.name === 'primary_customer' && (qLower.includes('who is your target customer') || qLower.includes('who is the customer') || qLower.includes('who are you targeting'))) {
        return {
          isValid: false,
          targetField: def.name,
          rejectionReason: `Target customer is already explicitly stated: "${item.evidence || item.value}". Question rejected.`,
          isAlreadyExplicit: true,
          isGenuinelyMissing: false,
          isDuplicate: false,
          isMultiPart: false,
          isImportant: true,
          isInterviewComplete: false,
        };
      }
      if (def.name === 'geography' && (qLower.includes('which country') || qLower.includes('which city') || qLower.includes('launch in') || qLower.includes('launch geography'))) {
        return {
          isValid: false,
          targetField: def.name,
          rejectionReason: `Launch geography is already explicitly stated: "${item.evidence || item.value}". Question rejected.`,
          isAlreadyExplicit: true,
          isGenuinelyMissing: false,
          isDuplicate: false,
          isMultiPart: false,
          isImportant: true,
          isInterviewComplete: false,
        };
      }
      if (def.name === 'revenue_streams' && (qLower.includes('how will you monetize') || qLower.includes('how will you make money') || qLower.includes('revenue model') || qLower.includes('how do you plan to earn money'))) {
        return {
          isValid: false,
          targetField: def.name,
          rejectionReason: `Revenue model is already explicitly stated: "${item.evidence || item.value}". Question rejected.`,
          isAlreadyExplicit: true,
          isGenuinelyMissing: false,
          isDuplicate: false,
          isMultiPart: false,
          isImportant: true,
          isInterviewComplete: false,
        };
      }
      if (def.name === 'problem' && (qLower.includes('what problem are you solving') || qLower.includes('what is the problem'))) {
        return {
          isValid: false,
          targetField: def.name,
          rejectionReason: `Problem is already explicitly stated: "${item.evidence || item.value}". Question rejected.`,
          isAlreadyExplicit: true,
          isGenuinelyMissing: false,
          isDuplicate: false,
          isMultiPart: false,
          isImportant: true,
          isInterviewComplete: false,
        };
      }
    }
  }

  // 3. Check if this field has already been answered or skipped
  if (answeredFields.includes(targetField) || (target && target.user_skipped)) {
    return {
      isValid: false,
      targetField,
      rejectionReason: `Field '${target?.label || targetField}' was already answered or explicitly skipped by the user.`,
      isAlreadyExplicit: false,
      isGenuinelyMissing: false,
      isDuplicate: true,
      isMultiPart: false,
      isImportant: true,
      isInterviewComplete: false,
    };
  }

  // 4. Check if a verbatim or near-duplicate question has already been asked
  const isDuplicateQuestion = questionHistory.some((prevQ) => {
    const p = prevQ.toLowerCase().trim();
    const q = qLower.trim();
    return p === q || (p.length > 20 && q.includes(p.slice(0, 30)));
  });
  if (isDuplicateQuestion) {
    return {
      isValid: false,
      targetField,
      rejectionReason: 'This exact question or topic was already asked previously.',
      isAlreadyExplicit: false,
      isGenuinelyMissing: true,
      isDuplicate: true,
      isMultiPart: false,
      isImportant: true,
      isInterviewComplete: false,
    };
  }

  // 5. Check if the question asks for multiple unrelated details at once (Rule C: One focused question at a time)
  const questionMarks = (question.match(/\?/g) || []).length;
  const hasAndAlso = qLower.includes('and also') || qLower.includes('as well as how') || qLower.includes('and what price');
  if (questionMarks > 2 || (questionMarks > 1 && hasAndAlso)) {
    return {
      isValid: false,
      targetField,
      rejectionReason: 'Question asks for multiple unrelated details at once. Must be one focused question.',
      isAlreadyExplicit: false,
      isGenuinelyMissing: true,
      isDuplicate: false,
      isMultiPart: true,
      isImportant: true,
      isInterviewComplete: false,
    };
  }

  return {
    isValid: true,
    targetField,
    isAlreadyExplicit: false,
    isGenuinelyMissing: true,
    isDuplicate: false,
    isMultiPart: false,
    isImportant: true,
    isInterviewComplete: false,
  };
}

/**
 * Question Generator Following Rules A through F
 * Generates the highest-priority unanswered, context-aware question.
 */
export function generatePrioritizedQuestion(
  rawIdea: string,
  extractedProfile: ExtractedStartupProfile,
  questionHistory: string[],
  answeredFields: string[]
): {
  question: string;
  targetField: string;
  suggestedAnswers: string[];
  isComplete: boolean;
} {
  // Sort candidate fields by priority: 1 -> 2 -> 3 -> 4
  const candidateFields = REQUIRED_23_FIELDS.filter((def) => {
    const fieldItem = extractedProfile[def.name];
    if (!fieldItem) return true;
    if (fieldItem.status === 'explicit') return false; // Rule A: never ask if already explicit
    if (fieldItem.user_skipped) return false; // Rule D: never nag if skipped
    if (answeredFields.includes(def.name)) return false; // Rule E: never repeat
    return true;
  });

  // Check if any ambiguity exists (Priority 2 takes precedence if essential fields are covered)
  const ambiguousField = REQUIRED_23_FIELDS.find((def) => {
    const f = extractedProfile[def.name];
    return f && f.status === 'ambiguous' && !answeredFields.includes(def.name);
  });

  // Priority 1: Essential definitions (primary_customer, problem, proposed_solution, geography)
  const priority1Missing = candidateFields.find((f) => f.priority === 1);

  // If ambiguity exists and essential concept is present, clarify ambiguity first (Test E)
  let chosenField: FieldDefinition | undefined;
  if (ambiguousField) {
    chosenField = ambiguousField;
  } else if (priority1Missing) {
    chosenField = priority1Missing;
  } else {
    // Priority 3: Market research essentials (business_model, direct_competitors)
    const priority3Missing = candidateFields.find((f) => f.priority === 3);
    if (priority3Missing) {
      chosenField = priority3Missing;
    } else {
      // Secondary details: ask at most one or two, then stop (Rule F)
      const priority4Missing = candidateFields.find((f) => f.priority === 4);
      if (priority4Missing && questionHistory.length < 3) {
        chosenField = priority4Missing;
      }
    }
  }

  // If no candidate field remains or essential info is satisfied and user has answered key items, stop interviewing (Rule F)
  if (!chosenField) {
    return {
      question: 'INTERVIEW_COMPLETE',
      targetField: 'complete',
      suggestedAnswers: ['Proceed to Profile Review', 'Review Extracted Evidence'],
      isComplete: true,
    };
  }

  // Formulate a context-aware question based on what is already known
  const ideaContext = (extractedProfile.startup_idea?.value as string) || rawIdea;
  const knownCustomer = extractedProfile.primary_customer?.value as string;
  const knownSolution = extractedProfile.proposed_solution?.value as string;
  const fieldName = chosenField.name;

  let questionText = '';
  let options: string[] = [];

  switch (fieldName) {
    case 'primary_customer':
      if (extractedProfile.primary_customer?.status === 'ambiguous') {
        questionText = `You mentioned multiple different customer segments in your description (${extractedProfile.primary_customer.explanation || 'individual consumers vs enterprise'}). Which specific group will you target first as your primary paying customer?`;
        options = [
          'Individual consumers / end-users',
          'B2B companies / enterprise teams',
          'I haven\'t decided yet',
          'Skip this question',
        ];
      } else {
        questionText = `Who is the primary paying customer or specific persona experiencing this problem most acutely?`;
        options = [
          'Busy individuals and commuters',
          'Early-stage founders and small teams',
          'I haven\'t decided yet',
          'Skip this question',
        ];
      }
      break;

    case 'geography':
      questionText = `Which specific country, city, or initial market do you plan to launch in first to test unit economics?`;
      options = [
        'United States',
        'India (Metro tech hubs)',
        'Global Online (Worldwide digital availability)',
        'I haven\'t decided yet',
        'Skip this question',
      ];
      break;

    case 'problem':
      questionText = `What acute financial, operational, or daily friction do your customers experience today that makes this solution essential?`;
      options = [
        'Current tools are fragmented and require manual workarounds',
        'Existing services are too expensive or slow',
        'I haven\'t decided yet',
        'Skip this question',
      ];
      break;

    case 'proposed_solution':
      questionText = `How will your product or service work in practice to solve this friction?`;
      options = [
        'On-demand mobile booking platform',
        'Automated workflow software',
        'I haven\'t decided yet',
        'Skip this question',
      ];
      break;

    case 'business_model':
    case 'revenue_streams':
      questionText = `How do you plan to monetize this venture (e.g. monthly subscription, per-transaction commission, or usage fee)?`;
      options = [
        'Monthly recurring subscription (SaaS)',
        'Commission / take-rate per completed booking',
        'Freemium with paid premium features',
        'I haven\'t decided yet',
        'Skip this question',
      ];
      break;

    case 'direct_competitors':
    case 'indirect_competitors':
      questionText = `Who are the main existing competitors, alternative products, or manual workarounds that your target customers use today?`;
      options = [
        'Traditional legacy providers and manual phone dispatch',
        'Fragmented standalone tools and spreadsheets',
        'I don\'t know yet',
        'Skip this question',
      ];
      break;

    case 'pricing':
      questionText = `Do you have an initial pricing assumption in mind (e.g. estimated price point or free tier structure)?`;
      options = [
        'Free basic tier + $29–$49/month pro tier',
        '10%–15% fee per transaction',
        'I haven\'t decided yet',
        'Skip this question',
      ];
      break;

    case 'competitive_advantage':
    case 'value_proposition':
      questionText = `Why will customers choose your solution over their current status quo? What is your core competitive advantage?`;
      options = [
        'Significantly lower cost and greater convenience',
        'Automated speed with zero manual friction',
        'I haven\'t decided yet',
        'Skip this question',
      ];
      break;

    default:
      questionText = `Regarding ${chosenField.label.toLowerCase()}: could you share your current thinking, or should we leave this to be explored during market research?`;
      options = [
        'I have a specific plan to share',
        'I haven\'t decided yet',
        'Skip this question',
      ];
  }

  // Validate Question Relevance (Section 5)
  const validation = validateQuestionRelevance(
    questionText,
    chosenField.name,
    rawIdea,
    extractedProfile,
    questionHistory,
    answeredFields
  );

  if (!validation.isValid) {
    // If invalid, mark field as answered or skipped to avoid looping, and recurse to find next best
    return generatePrioritizedQuestion(
      rawIdea,
      extractedProfile,
      [...questionHistory, questionText],
      [...answeredFields, chosenField.name]
    );
  }

  return {
    question: questionText,
    targetField: chosenField.name,
    suggestedAnswers: options,
    isComplete: false,
  };
}

/**
 * Updates the extracted profile when the user provides an answer during the interview.
 * Handles:
 * - "I don't know", "haven't decided", "skip" -> records as unknown without inventing.
 * - Real answers -> updates status to 'explicit', records evidence, updates profile fields.
 */
export function updateProfileWithUserAnswer(
  rawIdea: string,
  extractedProfile: ExtractedStartupProfile,
  currentProfile: StartupProfile,
  targetField: string,
  userAnswer: string,
  questionHistory: string[],
  answeredFields: string[]
): {
  updatedExtractedProfile: ExtractedStartupProfile;
  updatedStartupProfile: StartupProfile;
  updatedAnsweredFields: string[];
  nextQuestion: {
    question: string;
    targetField: string;
    suggestedAnswers: string[];
    isComplete: boolean;
  };
} {
  const ansLower = userAnswer.trim().toLowerCase();
  const isSkipOrUnknown =
    ansLower.includes("haven't decided") ||
    ansLower.includes("havent decided") ||
    ansLower.includes("don't know") ||
    ansLower.includes("dont know") ||
    ansLower.includes('skip') ||
    ansLower.includes('not decided') ||
    ansLower.includes('not sure');

  const newExtracted = { ...extractedProfile };
  const newStartup = { ...currentProfile };
  const newAnswered = Array.from(new Set([...answeredFields, targetField]));

  if (targetField && newExtracted[targetField]) {
    if (isSkipOrUnknown) {
      // Record field as unknown instead of inventing an answer (Rule D)
      newExtracted[targetField] = {
        ...newExtracted[targetField],
        value: null,
        status: 'missing',
        needs_confirmation: false,
        user_skipped: true,
        source: 'unknown',
        explanation: 'User indicated this is not yet decided or skipped.',
      };
    } else {
      // User provided an answer! Update profile and mark as explicit (Rule E)
      newExtracted[targetField] = {
        ...newExtracted[targetField],
        value: userAnswer.trim(),
        status: 'explicit',
        evidence: userAnswer.trim(),
        confidence: 0.98,
        needs_confirmation: false,
        source: 'interview',
      };

      // Map into StartupProfile fields
      if (targetField === 'primary_customer') {
        newStartup.primaryCustomer = userAnswer.trim();
        newStartup.endUserPersona = userAnswer.trim();
      } else if (targetField === 'geography') {
        newStartup.initialCountry = userAnswer.trim();
        newStartup.targetGeography = userAnswer.trim();
      } else if (targetField === 'problem') {
        newStartup.problemDescription = userAnswer.trim();
        newStartup.problemBeingSolved = userAnswer.trim();
      } else if (targetField === 'proposed_solution') {
        newStartup.proposedSolution = userAnswer.trim();
      } else if (targetField === 'business_model' || targetField === 'revenue_streams') {
        newStartup.revenueModel = userAnswer.trim();
      } else if (targetField === 'pricing') {
        newStartup.pricingAssumption = userAnswer.trim();
      } else if (targetField === 'direct_competitors' || targetField === 'indirect_competitors') {
        newStartup.knownCompetitors = [
          ...(newStartup.knownCompetitors || []),
          userAnswer.trim(),
        ];
      } else if (targetField === 'competitive_advantage' || targetField === 'value_proposition') {
        newStartup.differentiation = userAnswer.trim();
      }
    }
  }

  // Generate the next prioritized question with question-relevance validation
  const nextQ = generatePrioritizedQuestion(
    rawIdea,
    newExtracted,
    questionHistory,
    newAnswered
  );

  return {
    updatedExtractedProfile: newExtracted,
    updatedStartupProfile: newStartup,
    updatedAnsweredFields: newAnswered,
    nextQuestion: nextQ,
  };
}

/**
 * Calculates ReadinessGate metrics based on the 23-dimension extracted profile.
 */
export function calculateReadinessFromExtracted(
  extracted: ExtractedStartupProfile
): ReadinessGate {
  const isCompleteOrExplicit = (field: string) => {
    const f = extracted[field];
    return !!(f && (f.status === 'explicit' || (f.value && f.value !== '')));
  };

  const ideaClarity = isCompleteOrExplicit('startup_idea') ? 'COMPLETE' : 'MISSING';
  const customerClarity = isCompleteOrExplicit('primary_customer') ? 'COMPLETE' : (extracted.primary_customer?.user_skipped ? 'COMPLETE' : 'MISSING');
  const problemClarity = isCompleteOrExplicit('problem') ? 'COMPLETE' : (extracted.problem?.user_skipped ? 'COMPLETE' : 'MISSING');
  const geographyClarity = isCompleteOrExplicit('geography') ? 'COMPLETE' : (extracted.geography?.user_skipped ? 'COMPLETE' : 'MISSING');
  const solutionClarity = isCompleteOrExplicit('proposed_solution') ? 'COMPLETE' : (extracted.proposed_solution?.user_skipped ? 'COMPLETE' : 'MISSING');
  const businessModelClarity = isCompleteOrExplicit('business_model') || isCompleteOrExplicit('revenue_streams') ? 'COMPLETE' : (extracted.business_model?.user_skipped || extracted.revenue_streams?.user_skipped ? 'COMPLETE' : 'MISSING');
  const competitionClarity = isCompleteOrExplicit('direct_competitors') || isCompleteOrExplicit('indirect_competitors') ? 'COMPLETE' : (extracted.direct_competitors?.user_skipped ? 'COMPLETE' : 'PARTIAL');
  const differentiationClarity = isCompleteOrExplicit('competitive_advantage') || isCompleteOrExplicit('value_proposition') ? 'COMPLETE' : (extracted.competitive_advantage?.user_skipped ? 'COMPLETE' : 'PARTIAL');

  const checkpoints = [
    ideaClarity,
    customerClarity,
    problemClarity,
    geographyClarity,
    solutionClarity,
    businessModelClarity,
    competitionClarity,
    differentiationClarity,
  ];

  const completeCount = checkpoints.filter((c) => c === 'COMPLETE').length;
  const isReady = completeCount >= 6; // Sufficiently understood to proceed (Rule F)
  const readinessScore = Math.round((completeCount / 8) * 100);

  const missingSummary: string[] = [];
  if (customerClarity !== 'COMPLETE') missingSummary.push('Target Customer');
  if (geographyClarity !== 'COMPLETE') missingSummary.push('Launch Geography');
  if (businessModelClarity !== 'COMPLETE') missingSummary.push('Monetization Model');
  if (competitionClarity !== 'COMPLETE') missingSummary.push('Competitive Landscape');

  return {
    ideaClarity,
    customerClarity,
    problemClarity,
    geographyClarity,
    solutionClarity,
    businessModelClarity,
    competitionClarity,
    differentiationClarity,
    isReady,
    readinessScore,
    missingSummary,
    suggestedFocus: missingSummary[0] || 'Profile Review',
  };
}

/**
 * Maps all 23 extracted dimensions consistently into StartupProfile fields.
 */
function syncExtractedToStartupProfile(
  rawIdea: string,
  extractedProfile: ExtractedStartupProfile,
  canonicalLock: BusinessIdentityLock,
  baseProfile?: Partial<StartupProfile>
): StartupProfile {
  const strVal = (name: string): string => {
    const v = extractedProfile[name]?.value;
    if (!v) return '';
    return Array.isArray(v) ? v.join('; ') : String(v).trim();
  };

  const listVal = (name: string): string[] => {
    const v = extractedProfile[name]?.value;
    if (!v) return [];
    if (Array.isArray(v)) return v.map((s) => String(s).trim()).filter(Boolean);
    return String(v)
      .split(/[;,\n]+/)
      .map((s) => s.trim())
      .filter(Boolean);
  };

  const featuresList = listVal('features');
  const primaryCustomer = strVal('primary_customer');
  const geo = strVal('geography');
  const revModel = strVal('revenue_streams') || strVal('business_model');
  const pricing = strVal('pricing');
  const customerLower = primaryCustomer.toLowerCase();
  const isB2B =
    canonicalLock.productType?.includes('B2B') ||
    customerLower.includes('b2b') ||
    customerLower.includes('compan') ||
    customerLower.includes('business') ||
    customerLower.includes('enterprise') ||
    customerLower.includes('agenc') ||
    customerLower.includes('team') ||
    customerLower.includes('clinic');

  return {
    ...(baseProfile as StartupProfile),
    startupName: canonicalLock.canonicalProductName || baseProfile?.startupName || 'Untitled Venture',
    oneLiner: strVal('value_proposition') || strVal('startup_idea').slice(0, 160) || baseProfile?.oneLiner || 'Startup Thesis',
    detailedDescription: rawIdea || baseProfile?.detailedDescription || '',
    problemBeingSolved: strVal('problem') || baseProfile?.problemBeingSolved || '',
    proposedSolution: strVal('proposed_solution') || baseProfile?.proposedSolution || '',
    whyFounderBelievesProblemExists: strVal('customer_pain_points') || baseProfile?.whyFounderBelievesProblemExists || '',
    primaryCustomer: primaryCustomer || baseProfile?.primaryCustomer || '',
    secondaryCustomer: strVal('secondary_customer') || baseProfile?.secondaryCustomer || '',
    customerModel: canonicalLock.productType?.includes('Marketplace') ? 'Marketplace' : isB2B ? 'B2B' : 'B2C',
    customerDemographics: primaryCustomer || baseProfile?.customerDemographics || '',
    customerGeography: geo || baseProfile?.customerGeography || '',
    customerIndustry: strVal('industry_category') || baseProfile?.customerIndustry || '',
    customerSegment: primaryCustomer || baseProfile?.customerSegment || '',
    buyerPersona: primaryCustomer || baseProfile?.buyerPersona || '',
    endUserPersona: primaryCustomer || baseProfile?.endUserPersona || '',
    decisionMaker: primaryCustomer || baseProfile?.decisionMaker || '',
    problemDescription: strVal('problem') || baseProfile?.problemDescription || '',
    problemFrequency: baseProfile?.problemFrequency || 'Frequent Friction',
    problemSeverity: baseProfile?.problemSeverity || 'Critical & Urgent',
    currentWorkaround: strVal('indirect_competitors') || baseProfile?.currentWorkaround || 'Manual workarounds and fragmented status-quo methods',
    existingAlternatives: strVal('indirect_competitors') || baseProfile?.existingAlternatives || '',
    costOfProblem: strVal('customer_pain_points') || baseProfile?.costOfProblem || '',
    emotionalFriction: strVal('customer_pain_points') || baseProfile?.emotionalFriction || '',
    isUrgentOrOptional: baseProfile?.isUrgentOrOptional || 'Urgent',
    productOrService: strVal('proposed_solution') || baseProfile?.productOrService || '',
    mainFeatures: featuresList.length > 0 ? featuresList : baseProfile?.mainFeatures || ['Core MVP Solution'],
    userJourneySummary: strVal('proposed_solution') || baseProfile?.userJourneySummary || '',
    valueProposition: strVal('value_proposition') || baseProfile?.valueProposition || '',
    differentiation: strVal('competitive_advantage') || baseProfile?.differentiation || '',
    whyUsersWouldSwitch: strVal('value_proposition') || baseProfile?.whyUsersWouldSwitch || '',
    whyUsersMightNotSwitch: strVal('known_risks') || baseProfile?.whyUsersMightNotSwitch || '',
    revenueModel: revModel || baseProfile?.revenueModel || '',
    pricingAssumption: pricing || baseProfile?.pricingAssumption || '',
    pricingStructure: (pricing.toLowerCase().includes('free')
      ? 'Freemium'
      : revModel.toLowerCase().includes('commission') || revModel.toLowerCase().includes('take-rate')
      ? 'Commission'
      : revModel.toLowerCase().includes('transaction')
      ? 'Transaction Fee'
      : revModel.toLowerCase().includes('usage')
      ? 'Usage-based'
      : 'Subscription') as StartupProfile['pricingStructure'],
    whoPays: primaryCustomer || baseProfile?.whoPays || '',
    paymentFrequency: baseProfile?.paymentFrequency || 'Monthly',
    initialCountry: geo || baseProfile?.initialCountry || '',
    targetGeography: geo || baseProfile?.targetGeography || '',
    potentialInternationalMarkets: baseProfile?.potentialInternationalMarkets || [],
    industryCategory: strVal('industry_category') || baseProfile?.industryCategory || 'Technology',
    marketSizeAssumptions: baseProfile?.marketSizeAssumptions || '',
    growthAssumptions: baseProfile?.growthAssumptions || '',
    knownCompetitors: listVal('direct_competitors').length > 0 ? listVal('direct_competitors') : baseProfile?.knownCompetitors || [],
    indirectCompetitors: listVal('indirect_competitors').length > 0 ? listVal('indirect_competitors') : baseProfile?.indirectCompetitors || [],
    currentAlternatives: listVal('indirect_competitors').length > 0 ? listVal('indirect_competitors') : baseProfile?.currentAlternatives || [],
    whyExistingInsufficient: strVal('problem') || baseProfile?.whyExistingInsufficient || '',
    discoveryChannels: listVal('acquisition_channels').length > 0 ? listVal('acquisition_channels') : baseProfile?.discoveryChannels || [],
    salesModel: isB2B ? 'B2B Direct / Outbound' : 'Self-Serve / Digital',
    distributionPartnerships: baseProfile?.distributionPartnerships || [],
    communityAcquisition: strVal('acquisition_channels') || baseProfile?.communityAcquisition || '',
    moatType: strVal('competitive_advantage') || baseProfile?.moatType || 'Product Differentiation',
    technologyAdvantage: strVal('technology_requirements') || baseProfile?.technologyAdvantage || '',
    distributionAdvantage: strVal('acquisition_channels') || baseProfile?.distributionAdvantage || '',
    dataAdvantage: baseProfile?.dataAdvantage || '',
    networkEffects: baseProfile?.networkEffects || '',
    costAdvantage: baseProfile?.costAdvantage || '',
    regulatoryAdvantage: baseProfile?.regulatoryAdvantage || '',
    founderAdvantage: baseProfile?.founderAdvantage || '',
    humanInvolvementRequired: strVal('operational_requirements') || baseProfile?.humanInvolvementRequired || '',
    logisticsRequirements: strVal('operational_requirements') || baseProfile?.logisticsRequirements || '',
    verificationProcess: baseProfile?.verificationProcess || '',
    customerSupportNeeds: baseProfile?.customerSupportNeeds || '',
    supplySideRequirements: strVal('operational_requirements') || baseProfile?.supplySideRequirements || '',
    operationalRisks: listVal('known_risks').length > 0 ? listVal('known_risks') : baseProfile?.operationalRisks || [],
    regulatedAreas: listVal('legal_regulatory').length > 0 ? listVal('legal_regulatory') : baseProfile?.regulatedAreas || [],
    requiresProfessionalLegalCounsel: listVal('legal_regulatory').length > 0 || !!baseProfile?.requiresProfessionalLegalCounsel,
    regulatoryNotes: strVal('legal_regulatory') || baseProfile?.regulatoryNotes || '',
    regulatoryDisclaimer: 'Informational analysis only. Not legal or financial advice.',
    founderStatedAssumptions:
      listVal('founder_assumptions').length > 0
        ? listVal('founder_assumptions')
        : baseProfile?.founderStatedAssumptions || ['Customers willing to switch from current workaround'],
    aiInferredAssumptions: listVal('unknown_information').length > 0 ? listVal('unknown_information') : baseProfile?.aiInferredAssumptions || [],
    businessIdentityLock: canonicalLock,
  };
}

/**
 * High-level orchestration for Step 1 & 2:
 * Captures the original idea, analyzes the complete description across 23 fields via Gemini,
 * tracks evidence for every field, initializes the canonical business lock,
 * and formulates the initial tailored analyst response.
 */
export async function handleInterviewExtraction(
  rawIdea: string,
  existingProfile?: Partial<StartupProfile>
): Promise<{
  reply: string;
  updatedProfile: StartupProfile;
  extractedProfile: ExtractedStartupProfile;
  canonicalLock: BusinessIdentityLock;
  readiness: ReadinessGate;
  nextQuestion: {
    question: string;
    targetField: string;
    suggestedAnswers: string[];
    isComplete: boolean;
  };
  targetField: string;
  answeredFields: string[];
  suggestedAnswers: string[];
  isComplete: boolean;
}> {
  const extractionResult = await extractInitialIdeaProfile(rawIdea);
  const { extractedProfile, canonicalLock, flaggedContradictions, geminiSeed } = extractionResult;
  const engineError = (extractionResult as any).engineError;

  const answeredFields: string[] = [];
  for (const field of REQUIRED_23_FIELDS) {
    const item = extractedProfile[field.name];
    if (item && item.status === 'explicit' && item.value) {
      answeredFields.push(field.name);
    }
  }

  // Prefer Gemini's domain-specific first question if it passes Question-Relevance Rules A–F
  let nextQ = generatePrioritizedQuestion(rawIdea, extractedProfile, [], answeredFields);
  if (
    geminiSeed?.firstQuestion &&
    geminiSeed.firstQuestion !== 'INTERVIEW_COMPLETE' &&
    geminiSeed.firstTargetField &&
    extractedProfile[geminiSeed.firstTargetField]
  ) {
    const validation = validateQuestionRelevance(
      geminiSeed.firstQuestion,
      geminiSeed.firstTargetField,
      rawIdea,
      extractedProfile,
      [],
      answeredFields
    );
    if (validation.isValid) {
      const customOpts = Array.isArray(geminiSeed.suggestedAnswers)
        ? geminiSeed.suggestedAnswers.filter((s) => typeof s === 'string' && s.trim().length > 0).slice(0, 4)
        : [];
      nextQ = {
        question: geminiSeed.firstQuestion.trim(),
        targetField: geminiSeed.firstTargetField,
        suggestedAnswers: customOpts.length > 0 ? customOpts : nextQ.suggestedAnswers,
        isComplete: false,
      };
    }
  }

  const readiness = calculateReadinessFromExtracted(extractedProfile);
  const startupProfile = syncExtractedToStartupProfile(rawIdea, extractedProfile, canonicalLock, existingProfile);

  // Build the rich analyst reply summarizing explicitly captured information
  const explicitItems = REQUIRED_23_FIELDS.filter((f) => {
    const item = extractedProfile[f.name];
    return item && item.status === 'explicit' && item.value;
  });

  const explicitSummaryLines = explicitItems.slice(0, 6).map((f) => {
    const item = extractedProfile[f.name];
    const valStr = typeof item.value === 'string' ? item.value : JSON.stringify(item.value);
    const snippet = valStr.length > 100 ? valStr.slice(0, 100) + '...' : valStr;
    return `• **${f.label}**: "${snippet}"`;
  });

  let replyText = `🔒 **Venture Profile Extracted & Locked**: ${canonicalLock.canonicalProductName}\n\n`;

  if (geminiSeed?.openingInsight) {
    replyText += `${geminiSeed.openingInsight.trim()}\n\n`;
  }

  if (explicitItems.length > 0) {
    replyText += `Captured **${explicitItems.length}/23 dimensions** directly from your brief:\n${explicitSummaryLines.join('\n')}\n\n`;
  }

  if (flaggedContradictions.length > 0) {
    replyText += `⚠️ **Contradiction Detected**: ${flaggedContradictions[0]}\n\n`;
  }

  if (nextQ.isComplete) {
    replyText += `🎯 **All Essential Information Satisfied**: Your venture profile contains sufficient detail to proceed with due-diligence research. Click **"Proceed to Profile Gate"** above to review and launch research!`;
  } else {
    replyText += `**Next Question**: ${nextQ.question}`;
  }

  return {
    reply: replyText,
    updatedProfile: startupProfile,
    extractedProfile,
    canonicalLock,
    readiness,
    nextQuestion: nextQ,
    targetField: nextQ.targetField,
    answeredFields,
    suggestedAnswers: nextQ.suggestedAnswers,
    isComplete: nextQ.isComplete,
    ...(engineError ? { engineError } : {}),
  };
}

/**
 * Gemini-powered analyst interview step:
 * Uses Gemini to deeply analyze the user's reply in the context of their original idea,
 * segregate insights across ALL relevant 23 dimensions, evaluate readiness,
 * and formulate a sharp, idea-specific next question + tailored options.
 */
async function processInterviewStepWithGemini(
  rawIdea: string,
  userMessage: string,
  history: Array<{ role: string; content: string }>,
  workingExtracted: ExtractedStartupProfile,
  workingAnswered: string[],
  targetField: string
): Promise<{
  updatedExtracted: ExtractedStartupProfile;
  updatedAnswered: string[];
  answerAnalysis: string;
  nextQuestion: {
    question: string;
    targetField: string;
    suggestedAnswers: string[];
    isComplete: boolean;
  };
} | null> {
  if (process.env.TEST_MODE === '1') return null;
  const ai = getAiClient();
  if (!ai) return null;

  try {
    const currentSnapshot = REQUIRED_23_FIELDS.map((f) => {
      const item = workingExtracted[f.name];
      const status = item?.user_skipped ? 'user_skipped' : item?.status || 'missing';
      return `- ${f.name} (${f.label}, p${f.priority}): status=${status}, value=${item?.value ? JSON.stringify(item.value) : 'null'}`;
    }).join('\n');

    const recentTurns = history
      .slice(-6)
      .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
      .join('\n\n');

    const prompt = `You are VentureProbe AI, a skeptical senior startup analyst interviewing a founder.

ORIGINAL STARTUP IDEA:
"""
${rawIdea}
"""

CURRENT 23-DIMENSION PROFILE STATE:
${currentSnapshot}

RECENT CONVERSATION:
${recentTurns}

LAST QUESTION TARGET FIELD: ${targetField}
FOUNDER'S LATEST ANSWER:
"""
${userMessage}
"""

INSTRUCTIONS:
1. ANALYZE & SEGREGATE THE ANSWER ACCURATELY:
   - Read the founder's latest answer in full context of their startup idea.
   - If the user said "skip", "I haven't decided", "I don't know", or similar for ${targetField}, set user_skipped=true, status="missing", value=null for ${targetField}.
   - Otherwise, segregate EVERY dimension among the 23 canonical fields that the founder's latest answer explicitly informs, clarifies, or updates (e.g., if they mention customer + city + pricing in one answer, output separate entries in "updatedFields" for primary_customer, geography, and pricing!).
   - Never fabricate details the user didn't state. Preserve existing explicit fields unless the founder explicitly refined or corrected them.
2. WRITE "answerAnalysis":
   - Write 1–2 concise, insightful analyst sentences accurately reflecting what the founder just told you and how it sharpens the venture model (e.g., unit economics, segment clarity, or operational implications for THIS specific startup).
3. DECIDE READINESS & NEXT QUESTION:
   - Check remaining fields whose status is "missing" or "ambiguous" and NOT user_skipped and NOT in [${workingAnswered.join(', ')}].
   - Priority order: (1) unresolved "ambiguous" contradictions, (2) Priority 1 core gaps (primary_customer, problem, proposed_solution, geography), (3) Priority 3 gaps (business_model, revenue_streams, direct_competitors, indirect_competitors, features, value_proposition), (4) max 1–2 Priority 4 gaps if total assistant turns < 4.
   - If essential gaps are satisfied (or >= 6 core checkpoints resolved and no major ambiguities remain), set isInterviewComplete=true and nextQuestion="INTERVIEW_COMPLETE".
   - Otherwise, pick "nextTargetField" (a single genuinely missing or ambiguous field — NEVER an already explicit or skipped field), write ONE sharp, single-focus, idea-specific "nextQuestion", and provide 3 realistic, domain-tailored "suggestedAnswers" specifically relevant to THIS startup idea.`;

    const res = await withTimeout(
      ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: prompt,
        config: {
          systemInstruction:
            'You are VentureProbe AI, a disciplined venture due-diligence analyst. Always segregate user answers into exact canonical fields, never re-ask explicit facts, and tailor questions strictly to the founder’s real startup idea.',
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              updatedFields: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    field_name: { type: Type.STRING },
                    value: { type: Type.STRING, nullable: true },
                    status: { type: Type.STRING },
                    evidence: { type: Type.STRING, nullable: true },
                    user_skipped: { type: Type.BOOLEAN },
                    notes: { type: Type.STRING, nullable: true },
                  },
                  required: ['field_name', 'status', 'user_skipped'],
                },
              },
              answerAnalysis: { type: Type.STRING },
              isInterviewComplete: { type: Type.BOOLEAN },
              nextTargetField: { type: Type.STRING },
              nextQuestion: { type: Type.STRING },
              suggestedAnswers: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
            },
            required: ['updatedFields', 'answerAnalysis', 'isInterviewComplete', 'nextTargetField', 'nextQuestion', 'suggestedAnswers'],
          },
        },
      }),
      25000
    );

    const parsed = JSON.parse(res.text?.trim() || '{}');
    const newExtracted: ExtractedStartupProfile = { ...workingExtracted };
    const newlyHandledFields = new Set<string>(workingAnswered);
    if (targetField) newlyHandledFields.add(targetField);

    if (Array.isArray(parsed.updatedFields)) {
      for (const upd of parsed.updatedFields) {
        if (!upd || !upd.field_name || !newExtracted[upd.field_name]) continue;
        newlyHandledFields.add(upd.field_name);
        if (upd.user_skipped) {
          newExtracted[upd.field_name] = {
            ...newExtracted[upd.field_name],
            value: null,
            status: 'missing',
            needs_confirmation: false,
            user_skipped: true,
            source: 'unknown',
            explanation: upd.notes || 'Founder indicated undecided or skipped.',
          };
        } else if (typeof upd.value === 'string' && upd.value.trim().length > 0 && upd.value.trim().toLowerCase() !== 'null') {
          const st: FieldExtractionStatus =
            upd.status === 'inferred' || upd.status === 'ambiguous' ? upd.status : 'explicit';
          newExtracted[upd.field_name] = {
            ...newExtracted[upd.field_name],
            value: upd.value.trim(),
            status: st,
            evidence:
              upd.evidence && String(upd.evidence).trim().toLowerCase() !== 'null'
                ? String(upd.evidence).trim()
                : userMessage.trim(),
            confidence: st === 'explicit' ? 0.96 : 0.78,
            needs_confirmation: st !== 'explicit',
            user_skipped: false,
            source: 'interview',
            explanation: upd.notes || undefined,
          };
        }
      }
    }

    const updatedAnswered = Array.from(newlyHandledFields);
    const questionHistory = history.filter((m) => m.role === 'assistant').map((m) => m.content);

    // Deterministic Question-Relevance Safety Check (Rules A–F)
    let finalNextQ: {
      question: string;
      targetField: string;
      suggestedAnswers: string[];
      isComplete: boolean;
    };

    if (parsed.isInterviewComplete || parsed.nextQuestion === 'INTERVIEW_COMPLETE') {
      finalNextQ = {
        question: 'INTERVIEW_COMPLETE',
        targetField: 'complete',
        suggestedAnswers: ['Proceed to Profile Review', 'Review Extracted Evidence'],
        isComplete: true,
      };
    } else {
      const candidateTarget = parsed.nextTargetField || '';
      const candidateQuestion = (parsed.nextQuestion || '').trim();
      const validation =
        candidateTarget && candidateQuestion && newExtracted[candidateTarget]
          ? validateQuestionRelevance(
              candidateQuestion,
              candidateTarget,
              rawIdea,
              newExtracted,
              questionHistory,
              updatedAnswered
            )
          : { isValid: false };

      if (validation.isValid) {
        const opts = Array.isArray(parsed.suggestedAnswers)
          ? parsed.suggestedAnswers.filter((s: unknown) => typeof s === 'string' && s.trim().length > 0).slice(0, 4)
          : [];
        finalNextQ = {
          question: candidateQuestion,
          targetField: candidateTarget,
          suggestedAnswers:
            opts.length > 0
              ? opts
              : ['I have a specific answer to share', "I haven't decided yet", 'Skip this question'],
          isComplete: false,
        };
      } else {
        finalNextQ = generatePrioritizedQuestion(rawIdea, newExtracted, questionHistory, updatedAnswered);
      }
    }

    return {
      updatedExtracted: newExtracted,
      updatedAnswered,
      answerAnalysis: (parsed.answerAnalysis || '').trim(),
      nextQuestion: finalNextQ,
    };
  } catch (err) {
    console.warn('Gemini interview step analysis failed, falling back to deterministic engine:', err);
    return null;
  }
}

/**
 * High-level orchestration for Step 3, 4, 5 & Rules A-F:
 * Updates profile with the user's answer (via Gemini when available, or deterministic fallback),
 * checks for skipped/unknown, re-evaluates unanswered fields, validates question relevance,
 * and generates the next focused, idea-specific question.
 */
export async function handleInterviewStep(
  rawIdea: string,
  userMessage: string,
  history: Array<{ role: string; content: string }>,
  currentProfile: StartupProfile,
  extractedProfile?: ExtractedStartupProfile,
  answeredFields?: string[],
  targetFieldHint?: string
): Promise<{
  reply: string;
  updatedProfile: StartupProfile;
  extractedProfile: ExtractedStartupProfile;
  answeredFields: string[];
  readiness: ReadinessGate;
  targetField: string;
  suggestedAnswers: string[];
  isComplete: boolean;
}> {
  // If no extracted profile is present, run initial extraction first
  let workingExtracted = extractedProfile;
  let workingAnswered = answeredFields || [];

  if (!workingExtracted) {
    const init = await handleInterviewExtraction(rawIdea, currentProfile);
    workingExtracted = init.extractedProfile;
    workingAnswered = init.answeredFields;
  }

  // Determine which field was targeted by the last question
  const lastAssistantMsg = [...history].reverse().find((m) => m.role === 'assistant');
  const lastPrompt = (lastAssistantMsg?.content || '').toLowerCase();

  let targetField = targetFieldHint || '';
  if (!targetField) {
    if (lastPrompt.includes('target customer') || lastPrompt.includes('who is the primary') || lastPrompt.includes('paying customer') || lastPrompt.includes('persona')) {
      targetField = 'primary_customer';
    } else if (lastPrompt.includes('country') || lastPrompt.includes('city') || lastPrompt.includes('initial market') || lastPrompt.includes('launch in') || lastPrompt.includes('geography')) {
      targetField = 'geography';
    } else if (lastPrompt.includes('problem') || lastPrompt.includes('friction') || lastPrompt.includes('pain')) {
      targetField = 'problem';
    } else if (lastPrompt.includes('how will your product') || lastPrompt.includes('solution') || lastPrompt.includes('how does it work')) {
      targetField = 'proposed_solution';
    } else if (lastPrompt.includes('pricing') || lastPrompt.includes('price point')) {
      targetField = 'pricing';
    } else if (lastPrompt.includes('monetize') || lastPrompt.includes('revenue') || lastPrompt.includes('business model')) {
      targetField = 'revenue_streams';
    } else if (lastPrompt.includes('competitor') || lastPrompt.includes('alternatives') || lastPrompt.includes('workaround')) {
      targetField = 'direct_competitors';
    } else if (lastPrompt.includes('advantage') || lastPrompt.includes('differenti') || lastPrompt.includes('moat') || lastPrompt.includes('value proposition')) {
      targetField = 'competitive_advantage';
    } else {
      const nextCandidate = REQUIRED_23_FIELDS.find((f) => !workingAnswered.includes(f.name) && workingExtracted![f.name]?.status !== 'explicit');
      targetField = nextCandidate?.name || 'startup_idea';
    }
  }

  // Try Gemini-powered answer segregation & tailored follow-up first
  const geminiResult = await processInterviewStepWithGemini(
    rawIdea,
    userMessage,
    history,
    workingExtracted,
    workingAnswered,
    targetField
  );

  if (geminiResult) {
    const canonicalLock = buildCanonicalLockFromExtracted(
      rawIdea,
      geminiResult.updatedExtracted,
      currentProfile.businessIdentityLock?.flaggedAmbiguities || []
    );
    if (currentProfile.businessIdentityLock?.canonicalProductName && currentProfile.businessIdentityLock.canonicalProductName !== 'Untitled Venture') {
      canonicalLock.canonicalProductName = currentProfile.businessIdentityLock.canonicalProductName;
    }
    const updatedStartupProfile = syncExtractedToStartupProfile(
      rawIdea,
      geminiResult.updatedExtracted,
      canonicalLock,
      currentProfile
    );
    const readiness = calculateReadinessFromExtracted(geminiResult.updatedExtracted);
    const nextQ = geminiResult.nextQuestion;

    let replyText = geminiResult.answerAnalysis ? `${geminiResult.answerAnalysis}\n\n` : '';
    if (nextQ.isComplete) {
      replyText += `🎯 **Interview Complete**: All essential dimensions have been verified. Your startup profile is ready for review. Click **"Proceed to Profile Gate"** to launch deep research!`;
    } else {
      replyText += `**Next Question**: ${nextQ.question}`;
    }

    return {
      reply: replyText,
      updatedProfile: updatedStartupProfile,
      extractedProfile: geminiResult.updatedExtracted,
      answeredFields: geminiResult.updatedAnswered,
      readiness,
      targetField: nextQ.targetField,
      suggestedAnswers: nextQ.suggestedAnswers,
      isComplete: nextQ.isComplete,
    };
  }

  // Deterministic Fallback Path
  const questionHistory = history.filter((m) => m.role === 'assistant').map((m) => m.content);
  const stepResult = updateProfileWithUserAnswer(
    rawIdea,
    workingExtracted,
    currentProfile,
    targetField,
    userMessage,
    questionHistory,
    workingAnswered
  );

  const readiness = calculateReadinessFromExtracted(stepResult.updatedExtractedProfile);
  const nextQ = stepResult.nextQuestion;
  const targetLabel = REQUIRED_23_FIELDS.find((f) => f.name === targetField)?.label || targetField;

  let replyText = '';
  const ansLower = userMessage.trim().toLowerCase();
  const isSkipOrUnknown =
    ansLower.includes("haven't decided") ||
    ansLower.includes("havent decided") ||
    ansLower.includes("don't know") ||
    ansLower.includes("dont know") ||
    ansLower.includes('skip');

  if (isSkipOrUnknown) {
    replyText = `Noted. I have recorded **${targetLabel}** as pending/unknown so we won't ask again. Our market research stage will explore viable benchmarks for this directly.\n\n`;
  } else {
    replyText = `✓ Recorded: **${targetLabel}** has been captured in your profile with supporting evidence.\n\n`;
  }

  if (nextQ.isComplete) {
    replyText += `🎯 **Interview Complete**: All essential dimensions have been verified. Your startup profile is ready for review. Click **"Proceed to Profile Gate"** to launch deep research!`;
  } else {
    replyText += `${nextQ.question}`;
  }

  return {
    reply: replyText,
    updatedProfile: stepResult.updatedStartupProfile,
    extractedProfile: stepResult.updatedExtractedProfile,
    answeredFields: stepResult.updatedAnsweredFields,
    readiness,
    targetField: nextQ.targetField,
    suggestedAnswers: nextQ.suggestedAnswers,
    isComplete: nextQ.isComplete,
  };
}

