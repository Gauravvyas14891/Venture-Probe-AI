process.env.TEST_MODE = '1';
import dotenv from 'dotenv';
dotenv.config();

import {
  extractInitialIdeaProfile,
  generatePrioritizedQuestion,
  updateProfileWithUserAnswer,
  validateQuestionRelevance,
  REQUIRED_23_FIELDS,
} from './intelligentExtractor.js';
import { StartupProfile, ExtractedStartupProfile } from '../src/types/index.js';

interface TestResult {
  name: string;
  passed: boolean;
  details: string[];
}

export async function runAcceptanceTests(): Promise<TestResult[]> {
  const results: TestResult[] = [];

  console.log('====================================================');
  console.log('RUNNING ACCEPTANCE TEST SUITE (Section 8: Tests A-F)');
  console.log('====================================================\n');

  // --------------------------------------------------------------------------
  // TEST A: Detailed idea
  // --------------------------------------------------------------------------
  try {
    const detailedIdea = `
Problem: Early-stage engineering teams waste over 15 hours per week manually auditing their web applications for security vulnerabilities, SEO regressions, accessibility compliance, and performance bottlenecks across fragmented single-purpose scanners.
Proposed Solution: We are building AuditPulse, an automated unified software health platform that consolidates Lighthouse, OWASP ZAP, and axe into a single continuous health score with prioritized remediation action plans.
Target Customer: Our primary paying customers are B2B software engineering teams, CTOs, and technical leads at web development agencies building client applications.
Launch Geography: We plan to launch initially in the United States, targeting high-density tech metros in California and New York.
Revenue Model: We will monetize via recurring monthly B2B SaaS subscription tiers starting at $49/month for small teams and $199/month for agencies.
Features: Core automated audit scanner, unified software health score algorithm (0-100), GitHub CI/CD continuous regression monitoring alerts, and client-ready executive PDF white-label reports.
    `.trim();

    const extraction = await extractInitialIdeaProfile(detailedIdea);
    const p = extraction.extractedProfile;
    const details: string[] = [];

    // Check all 5 categories
    const problemExtracted = p.problem.status === 'explicit' && !!p.problem.value && !!p.problem.evidence;
    const customerExtracted = p.primary_customer.status === 'explicit' && !!p.primary_customer.value && !!p.primary_customer.evidence;
    const featuresExtracted = p.features.status === 'explicit' && !!p.features.value && !!p.features.evidence;
    const geoExtracted = p.geography.status === 'explicit' && !!p.geography.value && !!p.geography.evidence;
    const revenueExtracted = (p.revenue_streams.status === 'explicit' || p.business_model.status === 'explicit') && !!p.revenue_streams.evidence;

    details.push(`Problem extracted: ${problemExtracted} ("${p.problem.evidence?.slice(0, 50)}...")`);
    details.push(`Customer extracted: ${customerExtracted} ("${p.primary_customer.evidence?.slice(0, 50)}...")`);
    details.push(`Features extracted: ${featuresExtracted} ("${p.features.evidence?.slice(0, 50)}...")`);
    details.push(`Geography extracted: ${geoExtracted} ("${p.geography.evidence?.slice(0, 50)}...")`);
    details.push(`Revenue model extracted: ${revenueExtracted} ("${p.revenue_streams.evidence?.slice(0, 50)}...")`);

    // Next question generation must NOT ask about those 5 categories
    const answered = Object.keys(p).filter((k) => p[k].status === 'explicit');
    const nextQ = generatePrioritizedQuestion(detailedIdea, p, [], answered);

    const questionLower = nextQ.question.toLowerCase();
    const doesNotAskCustomer = !questionLower.includes('who is your target customer') && !questionLower.includes('who is the customer');
    const doesNotAskGeo = !questionLower.includes('which country') && !questionLower.includes('which city') && !questionLower.includes('launch in');
    const doesNotAskRevenue = !questionLower.includes('how will you monetize') && !questionLower.includes('revenue model');
    const doesNotAskProblem = !questionLower.includes('what problem are you solving');

    details.push(`Next question generated: "${nextQ.question}"`);
    details.push(`Does NOT ask for already explicit fields: ${doesNotAskCustomer && doesNotAskGeo && doesNotAskRevenue && doesNotAskProblem}`);

    const passed =
      problemExtracted &&
      customerExtracted &&
      featuresExtracted &&
      geoExtracted &&
      revenueExtracted &&
      doesNotAskCustomer &&
      doesNotAskGeo &&
      doesNotAskRevenue &&
      doesNotAskProblem;

    results.push({ name: 'Test A: Detailed idea', passed, details });
  } catch (err: any) {
    results.push({ name: 'Test A: Detailed idea', passed: false, details: [err.message] });
  }

  // --------------------------------------------------------------------------
  // TEST B: Short idea
  // --------------------------------------------------------------------------
  try {
    const shortIdea = 'I want to build an app for booking temporary drivers.';
    const extraction = await extractInitialIdeaProfile(shortIdea);
    const p = extraction.extractedProfile;
    const details: string[] = [];

    // Basic idea extracted
    const ideaExtracted = p.startup_idea.status === 'explicit' && !!p.startup_idea.value;
    details.push(`Basic idea extracted: ${ideaExtracted} ("${p.startup_idea.value}")`);

    // Customer segment, geography, pricing should be missing / unknown (NOT invented!)
    const customerMissing = p.primary_customer.status === 'missing' || p.primary_customer.value === null;
    const geoMissing = p.geography.status === 'missing' || p.geography.value === null;
    const pricingMissing = p.pricing.status === 'missing' || p.pricing.value === null;

    details.push(`Customer segment missing (not invented): ${customerMissing}`);
    details.push(`Geography missing (not invented): ${geoMissing}`);
    details.push(`Pricing missing (not invented): ${pricingMissing}`);

    // Must generate a relevant prioritized follow-up question
    const nextQ = generatePrioritizedQuestion(shortIdea, p, [], ['startup_idea']);
    const hasFollowUp = !nextQ.isComplete && nextQ.question.length > 10;
    details.push(`Relevant prioritized question asked: "${nextQ.question}" (target: ${nextQ.targetField})`);

    const passed = ideaExtracted && customerMissing && geoMissing && pricingMissing && hasFollowUp;
    results.push({ name: 'Test B: Short idea', passed, details });
  } catch (err: any) {
    results.push({ name: 'Test B: Short idea', passed: false, details: [err.message] });
  }

  // --------------------------------------------------------------------------
  // TEST C: Partially specified idea
  // --------------------------------------------------------------------------
  try {
    const partialIdea =
      'We are creating a mobile app that allows collegiate runners in the United States to track their outdoor trail workouts and compete for digital territory.';
    const extraction = await extractInitialIdeaProfile(partialIdea);
    const p = extraction.extractedProfile;
    const details: string[] = [];

    const productKnown = p.startup_idea.status === 'explicit' && !!p.startup_idea.value;
    const customerKnown = p.primary_customer.status === 'explicit' && !!p.primary_customer.value;
    const geoKnown = p.geography.status === 'explicit' && p.geography.value?.toString().toLowerCase().includes('united states');

    // Pricing and acquisition/distribution strategy must NOT be invented!
    const pricingNotInvented = p.pricing.status === 'missing' && p.pricing.value === null;
    const distNotInvented = p.acquisition_channels.status === 'missing' && p.acquisition_channels.value === null;

    details.push(`Product known: ${productKnown}`);
    details.push(`Customer known: ${customerKnown} ("${p.primary_customer.value}")`);
    details.push(`Geography known: ${geoKnown} ("${p.geography.value}")`);
    details.push(`Pricing not invented: ${pricingNotInvented}`);
    details.push(`Distribution not invented: ${distNotInvented}`);

    const answered = ['startup_idea', 'primary_customer', 'geography', 'proposed_solution'];
    const nextQ = generatePrioritizedQuestion(partialIdea, p, [], answered);
    details.push(`Next question asked: "${nextQ.question}" (target: ${nextQ.targetField})`);

    const passed = Boolean(productKnown && customerKnown && geoKnown && pricingNotInvented && distNotInvented);
    results.push({ name: 'Test C: Partially specified idea', passed, details });
  } catch (err: any) {
    results.push({ name: 'Test C: Partially specified idea', passed: false, details: [err.message] });
  }

  // --------------------------------------------------------------------------
  // TEST D: Information embedded in long text
  // --------------------------------------------------------------------------
  try {
    const embeddedLongText = `
Our startup is specifically built for college students who are preparing for their first summer software internships. We know how stressful recruiting season is.

In the current market, students apply to hundreds of job boards without knowing if their resume matches what engineering hiring managers look for. Most candidates never receive any response.

We are launching initially in the United Kingdom, partnering with university computer science societies across London, Cambridge, and Oxford.

Our technical platform parses student GitHub repositories and code commits, generating an objective candidate proof-of-work portfolio that hiring managers can verify in 60 seconds.

We monetize through a 15% placement fee paid by hiring tech companies upon successful offer acceptance, with zero cost to students.
    `.trim();

    const extraction = await extractInitialIdeaProfile(embeddedLongText);
    const p = extraction.extractedProfile;
    const details: string[] = [];

    // Target customer in para 1
    const customerFound = p.primary_customer.status === 'explicit' && p.primary_customer.value?.toString().toLowerCase().includes('student');
    // Geography in para 3
    const geoFound = p.geography.status === 'explicit' && (p.geography.value?.toString().toLowerCase().includes('united kingdom') || p.geography.evidence?.toLowerCase().includes('united kingdom'));
    // Revenue model in last para
    const revFound = (p.revenue_streams.status === 'explicit' || p.business_model.status === 'explicit') &&
      (p.revenue_streams.evidence?.includes('15% placement fee') || p.revenue_streams.value?.toString().includes('15%') || p.business_model.evidence?.includes('fee'));

    details.push(`Customer in Para 1 extracted: ${customerFound} ("${p.primary_customer.evidence}")`);
    details.push(`Geography in Para 3 extracted: ${geoFound} ("${p.geography.evidence}")`);
    details.push(`Revenue model in Para 5 extracted: ${revFound} ("${p.revenue_streams.evidence || p.business_model.evidence}")`);

    const passed = Boolean(customerFound && geoFound && revFound);
    results.push({ name: 'Test D: Information embedded in long text', passed, details });
  } catch (err: any) {
    results.push({ name: 'Test D: Information embedded in long text', passed: false, details: [err.message] });
  }

  // --------------------------------------------------------------------------
  // TEST E: Contradictory details
  // --------------------------------------------------------------------------
  try {
    const contradictoryIdea = `
We are launching a mobile food ordering tool for individual consumers and busy parents who want home-cooked meal deliveries on demand.

The app lets users browse local home chefs and order dinner with 1-click checkout.

However, our target customer is actually enterprise corporate offices and B2B companies who want to cater weekly team lunches and corporate events on monthly corporate billing accounts.
    `.trim();

    const extraction = await extractInitialIdeaProfile(contradictoryIdea);
    const p = extraction.extractedProfile;
    const details: string[] = [];

    const contradictionFlagged = extraction.flaggedContradictions.length > 0 || p.primary_customer.status === 'ambiguous';
    details.push(`Contradiction detected & flagged: ${contradictionFlagged}`);
    if (extraction.flaggedContradictions.length > 0) {
      details.push(`Flagged message: "${extraction.flaggedContradictions[0]}"`);
    }

    // Question generation must ask to clarify the conflict rather than arbitrarily choosing one
    const nextQ = generatePrioritizedQuestion(contradictoryIdea, p, [], ['startup_idea']);
    const asksToClarify =
      nextQ.targetField === 'primary_customer' &&
      (nextQ.question.toLowerCase().includes('multiple') ||
        nextQ.question.toLowerCase().includes('consumer') ||
        nextQ.question.toLowerCase().includes('customer') ||
        nextQ.question.toLowerCase().includes('which'));

    details.push(`Asks to clarify conflict: ${asksToClarify} ("${nextQ.question}")`);

    const passed = contradictionFlagged && asksToClarify;
    results.push({ name: 'Test E: Contradictory details', passed, details });
  } catch (err: any) {
    results.push({ name: 'Test E: Contradictory details', passed: false, details: [err.message] });
  }

  // --------------------------------------------------------------------------
  // TEST F: Previously answered question
  // --------------------------------------------------------------------------
  try {
    const initialIdea =
      'I want to build an on-demand driver dispatch app for car owners in San Francisco.';
    const extraction = await extractInitialIdeaProfile(initialIdea);
    const p = extraction.extractedProfile;
    const details: string[] = [];

    // Initially pricing is missing
    const initialPricingMissing = p.pricing.status === 'missing';
    details.push(`Initially pricing is missing: ${initialPricingMissing}`);

    // Founder answers pricing question during interview
    const mockProfile: StartupProfile = {
      startupName: 'DriverX',
      oneLiner: initialIdea,
      detailedDescription: initialIdea,
      problemBeingSolved: 'Need a driver',
      proposedSolution: 'Driver booking',
      whyFounderBelievesProblemExists: '',
      primaryCustomer: 'Car owners',
      secondaryCustomer: '',
      customerModel: 'B2C',
      customerDemographics: '',
      customerGeography: 'San Francisco',
      customerIndustry: '',
      customerSegment: '',
      buyerPersona: '',
      endUserPersona: '',
      decisionMaker: '',
      problemDescription: '',
      problemFrequency: '',
      problemSeverity: 'Critical & Urgent',
      currentWorkaround: '',
      existingAlternatives: '',
      costOfProblem: '',
      emotionalFriction: '',
      isUrgentOrOptional: 'Urgent',
      productOrService: '',
      mainFeatures: [],
      userJourneySummary: '',
      valueProposition: '',
      differentiation: '',
      whyUsersWouldSwitch: '',
      whyUsersMightNotSwitch: '',
      revenueModel: '',
      pricingAssumption: '',
      pricingStructure: 'Commission',
      whoPays: '',
      paymentFrequency: '',
      initialCountry: 'United States',
      targetGeography: 'San Francisco',
      potentialInternationalMarkets: [],
      industryCategory: 'Mobility',
      marketSizeAssumptions: '',
      growthAssumptions: '',
      knownCompetitors: [],
      indirectCompetitors: [],
      currentAlternatives: [],
      whyExistingInsufficient: '',
      discoveryChannels: [],
      salesModel: '',
      distributionPartnerships: [],
      communityAcquisition: '',
      moatType: '',
      technologyAdvantage: '',
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
      regulatedAreas: [],
      requiresProfessionalLegalCounsel: false,
      regulatoryNotes: '',
      regulatoryDisclaimer: '',
      founderStatedAssumptions: [],
      aiInferredAssumptions: [],
    };

    const update = updateProfileWithUserAnswer(
      initialIdea,
      p,
      mockProfile,
      'pricing',
      'We charge a 20% platform commission on every trip, with drivers earning an average of $35 per hour.',
      ['What is your pricing or commission model?'],
      ['startup_idea', 'primary_customer', 'geography']
    );

    const pricingNowExplicit = update.updatedExtractedProfile.pricing.status === 'explicit';
    const evidenceRecorded = !!update.updatedExtractedProfile.pricing.evidence;
    const answeredFieldsIncludesPricing = update.updatedAnsweredFields.includes('pricing');

    details.push(`Pricing now marked explicit: ${pricingNowExplicit} ("${update.updatedExtractedProfile.pricing.value}")`);
    details.push(`Evidence recorded: ${evidenceRecorded} ("${update.updatedExtractedProfile.pricing.evidence}")`);
    details.push(`Answered fields includes pricing: ${answeredFieldsIncludesPricing}`);

    // Relevance validator check: proposing a pricing question MUST now be rejected
    const validationCheck = validateQuestionRelevance(
      'What is your pricing model?',
      'pricing',
      initialIdea,
      update.updatedExtractedProfile,
      ['What is your pricing or commission model?'],
      update.updatedAnsweredFields
    );

    const pricingQuestionRejected = !validationCheck.isValid;
    details.push(`Subsequent pricing question rejected by relevance validator: ${pricingQuestionRejected} (reason: ${validationCheck.rejectionReason})`);

    const passed = pricingNowExplicit && evidenceRecorded && answeredFieldsIncludesPricing && pricingQuestionRejected;
    results.push({ name: 'Test F: Previously answered question', passed, details });
  } catch (err: any) {
    results.push({ name: 'Test F: Previously answered question', passed: false, details: [err.message] });
  }

  // Print Summary
  console.log('----------------------------------------------------');
  for (const res of results) {
    console.log(`${res.passed ? '✅ PASS' : '❌ FAIL'}: ${res.name}`);
    for (const d of res.details) {
      console.log(`   - ${d}`);
    }
  }
  console.log('----------------------------------------------------');

  const allPassed = results.every((r) => r.passed);
  console.log(`OVERALL RESULT: ${allPassed ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'}`);
  return results;
}

// Auto-run when executed
runAcceptanceTests()
  .then((res) => {
    const failed = res.filter((r) => !r.passed);
    if (failed.length > 0) {
      process.exit(1);
    }
    process.exit(0);
  })
  .catch((err) => {
    console.error('Test suite runner crashed:', err);
    process.exit(1);
  });
