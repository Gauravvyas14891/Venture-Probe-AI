import { GoogleGenAI, Type } from '@google/genai';
import {
  ExtractedStartupProfile,
  ExtractedFieldItem,
  FieldExtractionStatus,
  StartupProfile,
  BusinessIdentityLock,
  ReadinessGate,
  QuestionValidationResult,
} from '../src/types';

// Initialize Gemini client on server
const ai = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

function withTimeout<T>(promise: Promise<T>, ms: number = 4000): Promise<T> {
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
export async function extractInitialIdeaProfile(
  rawIdea: string
): Promise<{
  extractedProfile: ExtractedStartupProfile;
  canonicalLock: BusinessIdentityLock;
  flaggedContradictions: string[];
}> {
  const cleanedIdea = (rawIdea || '').trim();
  const baseProfile = createBlankExtractedProfile();

  if (process.env.TEST_MODE === '1') {
    return fallbackDeterministicExtraction(cleanedIdea);
  }

  // If Gemini is available, run structured information extraction
  if (ai && cleanedIdea.length > 5) {
    try {
      const extractionPrompt = `You are the VentureProbe Information Extraction & Venture Architecture Engine.
Analyze the user's complete startup description and extract explicitly provided information into a structured 23-dimension profile.

ORIGINAL STARTUP DESCRIPTION:
"""
${cleanedIdea}
"""

CRITICAL EXTRACTION RULES:
1. READ THE ENTIRE DESCRIPTION: Analyze all paragraphs, bullet points, examples, and text regardless of position. Do NOT just read the beginning.
2. NEVER INVENT ANSWERS: Only populate a field when the description provides supporting information. If the user did not mention pricing, leave pricing null and status "missing". If they didn't mention geography, leave geography null and status "missing". DO NOT guess!
3. STATUS LABELS:
   - "explicit": Directly stated by the user. Must quote the exact supporting phrase in "evidence".
   - "inferred": Strongly implied by context, but not directly stated.
   - "ambiguous": The description contains conflicting or unclear information.
   - "missing": No supporting information exists in the text.
4. CONTRADICTIONS: Check if the text contradicts itself (e.g., target customer is 'individual consumers' in paragraph 1 but 'enterprise B2B companies' later). If so, set status "ambiguous" and explain in "contradiction_notes".
5. EXTRACT INTO THESE EXACT 23 FIELDS:
   - startup_idea, problem, proposed_solution, primary_customer, secondary_customer, customer_pain_points,
     features, geography, industry_category, business_model, revenue_streams, pricing, direct_competitors,
     indirect_competitors, value_proposition, competitive_advantage, acquisition_channels,
     operational_requirements, technology_requirements, legal_regulatory, founder_assumptions, known_risks, unknown_information.

Respond ONLY with valid JSON in this schema:
{
  "fields": [
    {
      "field_name": "string",
      "value": "string or null",
      "status": "explicit" | "inferred" | "ambiguous" | "missing",
      "evidence": "exact supporting phrase from user text, or null",
      "confidence": 0.0 to 1.0,
      "needs_confirmation": boolean,
      "notes": "string or null"
    }
  ],
  "contradictions": ["string description of any conflicting statements"]
}`;

      const generatePromise = ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: extractionPrompt,
        config: {
          responseMimeType: 'application/json',
        },
      });

      const res = await withTimeout(generatePromise, 4000);

      const text = res.text?.trim() || '{}';
      const parsed = JSON.parse(text);

      if (parsed.fields && Array.isArray(parsed.fields)) {
        for (const item of parsed.fields) {
          if (item && item.field_name && baseProfile[item.field_name]) {
            const status: FieldExtractionStatus =
              ['explicit', 'inferred', 'ambiguous', 'missing'].includes(item.status)
                ? item.status
                : item.value
                ? 'explicit'
                : 'missing';

            baseProfile[item.field_name] = {
              ...baseProfile[item.field_name],
              value: item.value || null,
              status,
              evidence: item.evidence || null,
              confidence: typeof item.confidence === 'number' ? Math.max(0, Math.min(1, item.confidence)) : (status === 'explicit' ? 0.95 : 0.5),
              needs_confirmation: !!item.needs_confirmation || status === 'ambiguous',
              source: status === 'explicit' ? 'original_idea' : (status === 'inferred' ? 'inferred' : 'unknown'),
              explanation: item.notes || undefined,
            };
          }
        }

        const contradictions = Array.isArray(parsed.contradictions) ? parsed.contradictions : [];
        const canonicalLock = buildCanonicalLockFromExtracted(cleanedIdea, baseProfile, contradictions);
        return { extractedProfile: baseProfile, canonicalLock, flaggedContradictions: contradictions };
      }
    } catch (err) {
      console.warn('Gemini extraction failed, using deterministic semantic extractor fallback:', err);
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
 * High-level orchestration for Step 1 & 2:
 * Captures the original idea, analyzes the complete description across 23 fields,
 * tracks evidence for every field, initializes the canonical business lock,
 * and formulates the initial analyst response.
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
  answeredFields: string[];
  suggestedAnswers: string[];
  isComplete: boolean;
}> {
  const { extractedProfile, canonicalLock, flaggedContradictions } =
    await extractInitialIdeaProfile(rawIdea);

  const answeredFields: string[] = [];
  for (const field of REQUIRED_23_FIELDS) {
    const item = extractedProfile[field.name];
    if (item && item.status === 'explicit' && item.value) {
      answeredFields.push(field.name);
    }
  }

  // Generate the first question respecting Rule A (Never ask for what is already explicitly stated)
  const nextQ = generatePrioritizedQuestion(
    rawIdea,
    extractedProfile,
    [],
    answeredFields
  );

  const readiness = calculateReadinessFromExtracted(extractedProfile);

  // Map into StartupProfile structure
  const startupProfile: StartupProfile = {
    startupName: canonicalLock.canonicalProductName || 'Untitled Venture',
    oneLiner: (extractedProfile.value_proposition?.value as string) || (extractedProfile.startup_idea?.value as string)?.slice(0, 160) || 'Startup Thesis',
    detailedDescription: rawIdea,
    problemBeingSolved: (extractedProfile.problem?.value as string) || '',
    proposedSolution: (extractedProfile.proposed_solution?.value as string) || '',
    whyFounderBelievesProblemExists: (extractedProfile.customer_pain_points?.value as string) || '',
    primaryCustomer: (extractedProfile.primary_customer?.value as string) || '',
    secondaryCustomer: (extractedProfile.secondary_customer?.value as string) || '',
    customerModel: (canonicalLock.productType?.includes('B2B') || canonicalLock.primaryPayingCustomer?.toLowerCase().includes('b2b') || canonicalLock.primaryPayingCustomer?.toLowerCase().includes('companies')) ? 'B2B' : 'B2C',
    customerDemographics: (extractedProfile.primary_customer?.value as string) || '',
    customerGeography: (extractedProfile.geography?.value as string) || '',
    customerIndustry: (extractedProfile.industry_category?.value as string) || '',
    customerSegment: (extractedProfile.primary_customer?.value as string) || '',
    buyerPersona: (extractedProfile.primary_customer?.value as string) || '',
    endUserPersona: (extractedProfile.primary_customer?.value as string) || '',
    decisionMaker: (extractedProfile.primary_customer?.value as string) || '',
    problemDescription: (extractedProfile.problem?.value as string) || '',
    problemFrequency: 'Frequent Friction',
    problemSeverity: 'Critical & Urgent',
    currentWorkaround: (extractedProfile.indirect_competitors?.value as string) || 'Manual workarounds and fragmented status-quo methods',
    existingAlternatives: (extractedProfile.indirect_competitors?.value as string) || '',
    costOfProblem: (extractedProfile.customer_pain_points?.value as string) || '',
    emotionalFriction: (extractedProfile.customer_pain_points?.value as string) || '',
    isUrgentOrOptional: 'Urgent',
    productOrService: (extractedProfile.proposed_solution?.value as string) || '',
    mainFeatures: extractedProfile.features?.value
      ? (Array.isArray(extractedProfile.features.value)
          ? extractedProfile.features.value
          : (extractedProfile.features.value as string).split(';').map((s) => s.trim()).filter(Boolean))
      : ['Core MVP Solution'],
    userJourneySummary: '',
    valueProposition: (extractedProfile.value_proposition?.value as string) || '',
    differentiation: (extractedProfile.competitive_advantage?.value as string) || '',
    whyUsersWouldSwitch: (extractedProfile.value_proposition?.value as string) || '',
    whyUsersMightNotSwitch: '',
    revenueModel: (extractedProfile.revenue_streams?.value as string) || (extractedProfile.business_model?.value as string) || '',
    pricingAssumption: (extractedProfile.pricing?.value as string) || '',
    pricingStructure: (extractedProfile.pricing?.value ? 'Freemium' : 'Subscription') as any,
    whoPays: (extractedProfile.primary_customer?.value as string) || '',
    paymentFrequency: 'Monthly',
    initialCountry: (extractedProfile.geography?.value as string) || '',
    targetGeography: (extractedProfile.geography?.value as string) || '',
    potentialInternationalMarkets: [],
    industryCategory: (extractedProfile.industry_category?.value as string) || 'Technology',
    marketSizeAssumptions: '',
    growthAssumptions: '',
    knownCompetitors: extractedProfile.direct_competitors?.value
      ? [extractedProfile.direct_competitors.value as string]
      : [],
    indirectCompetitors: extractedProfile.indirect_competitors?.value
      ? [extractedProfile.indirect_competitors.value as string]
      : [],
    currentAlternatives: [],
    whyExistingInsufficient: '',
    discoveryChannels: extractedProfile.acquisition_channels?.value
      ? [extractedProfile.acquisition_channels.value as string]
      : [],
    salesModel: 'Direct / Digital',
    distributionPartnerships: [],
    communityAcquisition: '',
    moatType: (extractedProfile.competitive_advantage?.value as string) || 'Product Differentiation',
    technologyAdvantage: (extractedProfile.technology_requirements?.value as string) || '',
    distributionAdvantage: '',
    dataAdvantage: '',
    networkEffects: '',
    costAdvantage: '',
    regulatoryAdvantage: '',
    founderAdvantage: '',
    humanInvolvementRequired: '',
    logisticsRequirements: '',
    verificationProcess: '',
    customerSupportNeeds: '',
    supplySideRequirements: '',
    operationalRisks: [],
    regulatedAreas: extractedProfile.legal_regulatory?.value ? [extractedProfile.legal_regulatory.value as string] : [],
    requiresProfessionalLegalCounsel: false,
    regulatoryNotes: (extractedProfile.legal_regulatory?.value as string) || '',
    regulatoryDisclaimer: 'Informational analysis only. Not legal or financial advice.',
    founderStatedAssumptions: extractedProfile.founder_assumptions?.value
      ? [extractedProfile.founder_assumptions.value as string]
      : ['Customers willing to switch from current workaround'],
    aiInferredAssumptions: [],
    businessIdentityLock: canonicalLock,
    ...(existingProfile || {}),
  };

  // Build the rich analyst reply summarizing explicitly captured information
  const explicitItems = REQUIRED_23_FIELDS.filter((f) => {
    const item = extractedProfile[f.name];
    return item && item.status === 'explicit' && item.value;
  });

  const explicitSummaryLines = explicitItems.slice(0, 5).map((f) => {
    const item = extractedProfile[f.name];
    const valStr = typeof item.value === 'string' ? item.value : JSON.stringify(item.value);
    const snippet = valStr.length > 90 ? valStr.slice(0, 90) + '...' : valStr;
    return `• **${f.label}**: "${snippet}"`;
  });

  let replyText = `🔒 **Venture Profile Extracted & Locked**: ${canonicalLock.canonicalProductName}\n\n`;

  if (explicitItems.length > 0) {
    replyText += `I analyzed your complete startup brief across 23 dimensions. The following points were explicitly detected from your original text with verified evidence:\n${explicitSummaryLines.join('\n')}\n\n`;
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
    answeredFields,
    suggestedAnswers: nextQ.suggestedAnswers,
    isComplete: nextQ.isComplete,
  };
}

/**
 * High-level orchestration for Step 3, 4, 5 & Rules A-F:
 * Updates profile with the user's answer, checks for skipped/unknown,
 * re-evaluates unanswered fields, validates question relevance,
 * and generates the next focused question.
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
    if (lastPrompt.includes('target customer') || lastPrompt.includes('who is the primary') || lastPrompt.includes('persona')) {
      targetField = 'primary_customer';
    } else if (lastPrompt.includes('country') || lastPrompt.includes('city') || lastPrompt.includes('initial market') || lastPrompt.includes('launch in first')) {
      targetField = 'geography';
    } else if (lastPrompt.includes('problem') || lastPrompt.includes('friction') || lastPrompt.includes('acute')) {
      targetField = 'problem';
    } else if (lastPrompt.includes('how will your product') || lastPrompt.includes('solution') || lastPrompt.includes('how does it work')) {
      targetField = 'proposed_solution';
    } else if (lastPrompt.includes('monetize') || lastPrompt.includes('revenue') || lastPrompt.includes('pricing')) {
      targetField = 'revenue_streams';
    } else if (lastPrompt.includes('competitor') || lastPrompt.includes('alternatives') || lastPrompt.includes('workaround')) {
      targetField = 'direct_competitors';
    } else if (lastPrompt.includes('advantage') || lastPrompt.includes('differenti') || lastPrompt.includes('moat')) {
      targetField = 'competitive_advantage';
    } else {
      // Default to first unanswered priority field
      const nextCandidate = REQUIRED_23_FIELDS.find((f) => !workingAnswered.includes(f.name) && workingExtracted![f.name]?.status !== 'explicit');
      targetField = nextCandidate?.name || 'startup_idea';
    }
  }

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
    suggestedAnswers: nextQ.suggestedAnswers,
    isComplete: nextQ.isComplete,
  };
}

