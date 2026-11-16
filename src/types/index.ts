export type ClarityStatus = 'COMPLETE' | 'PARTIAL' | 'MISSING';

export interface ReadinessGate {
  ideaClarity: ClarityStatus;
  customerClarity: ClarityStatus;
  problemClarity: ClarityStatus;
  geographyClarity: ClarityStatus;
  solutionClarity: ClarityStatus;
  businessModelClarity: ClarityStatus;
  competitionClarity: ClarityStatus;
  differentiationClarity: ClarityStatus;
  isReady: boolean;
  readinessScore: number; // 0 to 100
  missingSummary: string[];
  suggestedFocus?: string;
}

export interface StartupProfile {
  // A. Basic Idea
  startupName: string;
  oneLiner: string;
  detailedDescription: string;
  problemBeingSolved: string;
  proposedSolution: string;
  whyFounderBelievesProblemExists: string;

  // B. Customer
  primaryCustomer: string;
  secondaryCustomer: string;
  customerModel: 'B2C' | 'B2B' | 'B2B2C' | 'Marketplace' | 'D2C';
  customerDemographics: string;
  customerGeography: string;
  customerIndustry: string;
  customerSegment: string;
  buyerPersona: string;
  endUserPersona: string;
  decisionMaker: string;

  // C. Problem
  problemDescription: string;
  problemFrequency: string;
  problemSeverity: 'Critical & Urgent' | 'Frequent Friction' | 'Moderate Inconvenience' | 'Discretionary / Nice-to-have';
  currentWorkaround: string;
  existingAlternatives: string;
  costOfProblem: string;
  emotionalFriction: string;
  isUrgentOrOptional: 'Urgent' | 'Optional' | 'Context-dependent';

  // D. Solution
  productOrService: string;
  mainFeatures: string[];
  userJourneySummary: string;
  valueProposition: string;
  differentiation: string;
  whyUsersWouldSwitch: string;
  whyUsersMightNotSwitch: string;

  // E. Business Model
  revenueModel: string;
  pricingAssumption: string;
  pricingStructure: 'Subscription' | 'Transaction Fee' | 'Commission' | 'Enterprise License' | 'Usage-based' | 'Freemium' | 'Other';
  whoPays: string;
  paymentFrequency: string;
  estimatedCAC?: string;
  estimatedLTV?: string;

  // F. Market
  initialCountry: string;
  targetGeography: string;
  potentialInternationalMarkets: string[];
  industryCategory: string;
  marketSizeAssumptions: string;
  growthAssumptions: string;

  // G. Competition
  knownCompetitors: string[];
  indirectCompetitors: string[];
  currentAlternatives: string[];
  whyExistingInsufficient: string;

  // H. Distribution
  discoveryChannels: string[];
  salesModel: string;
  distributionPartnerships: string[];
  communityAcquisition: string;

  // I. Advantage / Moat
  moatType: string;
  technologyAdvantage: string;
  distributionAdvantage: string;
  dataAdvantage: string;
  networkEffects: string;
  costAdvantage: string;
  regulatoryAdvantage: string;
  founderAdvantage: string;

  // J. Operations
  humanInvolvementRequired: string;
  logisticsRequirements: string;
  verificationProcess: string;
  customerSupportNeeds: string;
  supplySideRequirements: string;
  operationalRisks: string[];

  // K. Legal & Regulatory
  regulatedAreas: string[];
  requiresProfessionalLegalCounsel: boolean;
  regulatoryNotes: string;
  regulatoryDisclaimer: string;

  // L. Founder Assumptions
  founderStatedAssumptions: string[];
  aiInferredAssumptions: string[];

  // M. Canonical Business Identity Lock
  businessIdentityLock?: BusinessIdentityLock;
}

export interface BusinessIdentityLock {
  isLocked: boolean;
  lockedAt: string;
  verbatimFounderIdea: string;
  canonicalProductName: string;
  productCategory: string;
  productType:
    | 'Peer-to-Peer Marketplace / Cost-Sharing'
    | 'Commercial Marketplace'
    | 'B2B SaaS / Workflow Software'
    | 'B2C Mobile App / Consumer Platform'
    | 'On-Demand Service / Dispatch'
    | 'Staffing / Agency Services'
    | 'Hardware / Physical Product'
    | 'E-Commerce / D2C'
    | 'Hybrid / Other';
  problemBeingSolved: string;
  primaryEndUser: string;
  primaryPayingCustomer: string;
  productOrServiceSold: string;
  howProductWorks: string;
  statedRevenueModel: string;
  statedPricingStructure: string;
  geographicMarket: string;
  mainValueProposition: string;
  keyUnverifiedAssumptions: string[];
  flaggedAmbiguities: string[];
  prohibitedSilentSubstitutions: string[];
  coherenceStatus: 'COHERENT' | 'NEEDS_CLARIFICATION' | 'AMBIGUOUS';
  coherenceRationale: string;
}

export interface OptionalPivotModel {
  pivotName: string;
  whySuggested: string;
  howItDiffersFromLockedModel: string;
  targetCustomerDiff: string;
  revenueModelDiff: string;
  tradeoffs: string[];
  marketOpportunity: string;
}

export interface InterviewMessage {
  id: string;
  role: 'assistant' | 'user' | 'system';
  content: string;
  timestamp: string;
  readinessSnapshot?: ReadinessGate;
  profileSnapshot?: Partial<StartupProfile>;
  suggestedAnswers?: string[];
  targetField?: string;
}

export type SourceTier =
  | 'TIER_1_PRIMARY'
  | 'TIER_2_SECONDARY'
  | 'TIER_3_COMMUNITY_SIGNALS'
  | 'TIER_4_LOW_CONFIDENCE';

export type SearchConnectionStatus = 'LIVE_SEARCH_CONNECTED' | 'MODEL_ESTIMATION_ONLY';

export type ResearchTaskCategory =
  | 'A. Customer Problem & Workarounds'
  | 'B. Customer Segments & Frequency'
  | 'C. Direct Competitors & Indirect Alternatives'
  | 'D. Competitor Products, Pricing & Coverage'
  | 'E. Market Size (Methodology & Identifiable Data)'
  | 'F. Legal, Regulatory, Privacy & Insurance'
  | 'G. Revenue Opportunities & Operating Costs'
  | 'H. Similar Businesses (Succeeded, Failed, Pivoted)'
  | 'I. Major Unvalidated Assumptions';

export interface StructuredResearchFinding {
  id: string;
  claim: string;
  category: ResearchTaskCategory | string;
  exactEvidenceExcerpt?: string;
  exactSupportingEvidence?: string;
  sourceTitle: string;
  publisher: string;
  sourceUrl?: string;
  publicationDate?: string;
  dateAccessed: string;
  evidenceQuality: string;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  confidenceReason: string;
}

export interface ConflictingFinding {
  id: string;
  pointOfConflict: string;
  claimA: string;
  sourceA: string;
  claimB: string;
  sourceB: string;
  strategicRisk: string;
}

export interface EstimateAndCalculation {
  metric: string;
  estimatedValue: string;
  transparentMethodology: string;
  underlyingAssumptions: string[];
  isEmpiricallyValidated: boolean;
}

export interface UnverifiedHypothesis {
  hypothesis: string;
  whyUnverified: string;
  dangerIfFalse: string;
  requiredTest: string;
}

export interface MissingEvidenceItem {
  topic: string;
  status: 'Not established from the available evidence.';
  impactOnDiligence: string;
  dataNeededToResolve: string;
}

export interface SourceRequiringVerification {
  sourceTitle: string;
  url?: string;
  whyRequiresCorroboration: string;
  riskOfRelyingOnThis: string;
}

export interface StructuredResearchDataset {
  searchConnectionStatus: SearchConnectionStatus;
  statusExplanation: string;
  supportedFindings: StructuredResearchFinding[];
  conflictingFindings: ConflictingFinding[];
  estimatesAndCalculations: EstimateAndCalculation[];
  unverifiedHypotheses: UnverifiedHypothesis[];
  missingEvidence: MissingEvidenceItem[];
  sourcesRequiringVerification: SourceRequiringVerification[];
}

// =========================================================================
// VENTUREPROBE QUALITY AUDITOR SAFEGUARD TYPES
// =========================================================================

export type QualityAuditSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export type QualityAuditCategory =
  | 'BUSINESS_MODEL_DRIFT'
  | 'UNSUPPORTED_CLAIMS'
  | 'SOURCE_INTEGRITY'
  | 'FALSE_PRECISION'
  | 'INTERNAL_CONTRADICTIONS'
  | 'IRRELEVANT_RECOMMENDATIONS'
  | 'LEGAL_FINANCIAL_OVERCONFIDENCE'
  | 'PLAIN_LANGUAGE'
  | 'EVIDENCE_BALANCE';

export interface QualityAuditFinding {
  id: string;
  category: QualityAuditCategory;
  categoryName: string;
  severity: QualityAuditSeverity;
  claimId?: string;
  affectedSection: string;
  issue: string;
  correctiveAction: string;
  status: 'PENDING_REVISION' | 'REVISED_RESOLVED' | 'UNRESOLVED_DISCLOSED';
}

export interface QualityAuditCheckResult {
  checkNumber: number; // 1-9
  checkName: string;
  category: QualityAuditCategory;
  passed: boolean;
  severity: QualityAuditSeverity | 'NONE';
  summary: string;
  findingCount: number;
}

export interface QualityAuditTrailEntry {
  attempt: number;
  timestamp: string;
  status: 'PASS' | 'FAIL';
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  revisionsApplied: string[];
}

export interface QualityAuditReport {
  auditId: string;
  auditedAt: string;
  status: 'PASS' | 'FAIL';
  publicationStatus: 'VERIFIED_PUBLISHED' | 'PRELIMINARY_UNVERIFIED_PUBLISHED' | 'BLOCKED_FROM_PUBLICATION';
  totalAttempts: number;
  maxAttempts: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  summary: string;
  criticalAndHighFindings: QualityAuditFinding[];
  allFindings: QualityAuditFinding[];
  claimIdsToCorrectOrRemove: string[];
  sectionsRequiringRevision: string[];
  exactCorrectiveActions: string[];
  checkResults: QualityAuditCheckResult[];
  auditTrail: QualityAuditTrailEntry[];
  auditorStatement: string;
}

export interface ResearchSource {
  id: string;
  title: string;
  url: string;
  publisher: string;
  publicationDate?: string;
  sourceType:
    | 'Government/Regulatory'
    | 'Official Company Site/Report'
    | 'SEC/Financial Filing'
    | 'Tier-1 News (Reuters/Bloomberg/WSJ/FT)'
    | 'Tech & Venture Media (TechCrunch/TheVerge)'
    | 'Community/Reddit/Forum'
    | 'Product Reviews/App Store'
    | 'Academic/Industry Whitepaper'
    | 'Market Intelligence';
  tier: SourceTier;
  relevantClaim: string;
  exactEvidenceExcerpt?: string;
  evidenceLimitations?: string;
  reliabilityLevel: 'High' | 'Moderate' | 'Needs Corroboration' | 'Anecdotal Only';
  confidence?: 'HIGH' | 'MEDIUM' | 'LOW';
  confidenceReason?: string;
  dateAccessed: string;
}

export interface EvidenceItem {
  id: string;
  claim: string;
  category:
    | 'Problem Severity & Frequency'
    | 'Willingness to Pay'
    | 'Incumbent Defensibility'
    | 'Operational Complexity'
    | 'Regulatory Friction'
    | 'Customer Churn / Retention'
    | 'Market Timing';
  stance: 'SUPPORTING' | 'CONTRADICTING' | 'NEUTRAL_OBSERVATION';
  confidence: 'HIGH' | 'MEDIUM' | 'LOW' | 'UNKNOWN';
  sourceIds: string[];
  evidenceText: string;
  interpretation: string;
  uncertaintyOrCaveat: string;
}

export interface CompetitorProfile {
  name: string;
  type: 'DIRECT' | 'INDIRECT' | 'SUBSTITUTE';
  website?: string;
  country: string;
  founded?: string;
  targetCustomer: string;
  productDescription: string;
  pricingModel: string;
  keyStrengths: string[];
  keyWeaknesses: string[];
  customerComplaints: string[];
  estimatedScaleOrFunding?: string;
  verifiedStatus: string;
}

export interface SuccessCaseStudy {
  companyName: string;
  whatTheyBuilt: string;
  targetCustomer: string;
  launchGeography: string;
  businessModel: string;
  keyStrategicMoves: string[];
  whyCustomersAdopted: string;
  competitiveAdvantage: string;
  lessonsForThisStartup: string[];
  currentScaleStatus: string;
}

export interface FailureCaseStudy {
  companyName: string;
  originalMission: string;
  targetCustomer: string;
  businessModel: string;
  geography: string;
  fate: 'Shutdown' | 'Distressed Sale' | 'Product Discontinued' | 'Pivot Away';
  yearOfOutcome: string;
  confirmedFacts: string[];
  reportedReasons: string[];
  aiInferredContributingFactors: string[];
  lessonsForThisStartup: string[];
}

export interface CorporateMovement {
  companyName: string;
  movementType: 'Product Launch' | 'Feature Expansion' | 'Acquisition' | 'Partnership' | 'Patent / Job Posting Signal';
  announcementSummary: string;
  dateOrTimeline: string;
  strategicImpact: string;
  sourceUrl?: string;
}

export interface GeographicAnalysis {
  bestInitialMarket: {
    country: string;
    rationale: string;
    keyAdvantages: string[];
  };
  secondBestMarket: {
    country: string;
    rationale: string;
  };
  marketsToAvoidInitially: {
    country: string;
    risksAndBarriers: string[];
  }[];
  globalScalingRoadblocks: string[];
}

export interface AssumptionItem {
  id: string;
  assumption: string;
  category:
    | 'Customer Need'
    | 'Willingness to Pay'
    | 'Acquisition / CAC'
    | 'Operations / Delivery'
    | 'Legal / Compliance'
    | 'Retention / Defensibility';
  status: 'VALIDATED' | 'PARTIALLY_VALIDATED' | 'UNVALIDATED' | 'CONTRADICTED';
  impactLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  uncertaintyLevel: 'EXTREME' | 'HIGH' | 'MODERATE' | 'LOW';
  priorityScore: number; // 1 to 10
  evidenceForIds: string[];
  evidenceAgainstIds: string[];
  suggestedExperimentId?: string;
}

export interface KillRiskItem {
  rank: number;
  title: string;
  hostileInvestorArgument: string;
  fatalScenario: string;
  disprovingEvidenceNeeded: string;
  killThreshold: string;
}

export interface ValidationExperiment {
  id: string;
  name: string;
  type:
    | 'Customer Discovery Interview'
    | 'Smoke-Screen Landing Page'
    | 'Pricing Inelasticity Test'
    | 'Concierge / Wizard of Oz MVP'
    | 'B2B Letter of Intent (LOI) Pre-order'
    | 'Core Workflow Prototype'
    | 'Competitor User Intercept';
  targetedAssumption: string;
  hypothesis: string;
  methodology: string;
  estimatedCost: string;
  estimatedDuration: string;
  sampleSize: string;
  successThreshold: string;
  failureThreshold: string;
  decisiveNextAction: string;
}

export interface StartupStrategy {
  recommendedCustomerSegment: string;
  recommendedInitialGeography: string;
  recommendedPositioning: string;
  recommendedMVPFeatures: string[];
  featuresToAvoidInitially: string[];
  recommendedRevenueModel: string;
  pricingHypothesisToTest: string;
  distributionStrategy: string[];
  competitiveStrategy: string;
  thirtyDayPlan: string[];
  sixtyDayPlan: string[];
  ninetyDayPlan: string[];
}

export interface PlainEnglishGuide {
  simpleSummary: string;
  simpleAnalogy: string;
  simpleVerdict: 'GO_AHEAD' | 'PROCEED_WITH_CAUTION' | 'STOP_AND_RETHINK';
  simpleVerdictReason: string;
  whoPaysInPlainEnglish: string;
  howYouMakeMoneySimply: string;
  theBiggestDangerSimply: string;
  simpleActionStepsThisWeek: string[];
}

export interface ExplodingTopicsData {
  primaryKeyword: string;
  growthRatePercent: number; // e.g., +340%
  growthPeriod: string; // e.g. "Last 24 months"
  status: 'EXPLODING' | 'REGULAR_GROWTH' | 'PEAKED' | 'FAD_RISK';
  estimatedMonthlySearches: string; // e.g. "49.5K/mo"
  projected12MonthTrajectory: string; // e.g. "+65% acceleration"
  emergingAdjacentQueries: string[];
  signalInterpretation: string;
  sourceUrl: string;
}

export interface TrustMrrData {
  category: string;
  verifiedMedianMrr: string; // e.g., "$8,400/mo"
  topDecileMrr: string; // e.g. "$42,000/mo"
  bottomQuartileMrr: string; // e.g. "$1,200/mo"
  verifiedArpuRange: string; // e.g. "$29 - $149/mo"
  verifiedStripeMonthlyChurn: string; // e.g. "3.8% monthly"
  typicalCustomerCountMedian: number; // e.g. 140
  revenueMultipleValuation: string; // e.g. "3.5x - 5.0x ARR"
  antiHypeRealityCheck: string;
  sourceUrl: string;
}

export interface StartupsRipData {
  deadPredecessors: {
    name: string;
    fateYear: string;
    capitalBurned: string;
    originalMission: string;
    autopsyCause: string;
    postMortemLessons: string[];
  }[];
  primaryEcosystemPitfall: string;
  rebuildPlaybookThesis: string;
  whatHasChangedToday: string;
  sourceUrl: string;
}

export interface ResearchReport {
  id: string;
  profile: StartupProfile;
  mode: 'QUICK_FEASIBILITY' | 'COMPLETE_DEEP_DIVE';
  viewMode: 'QUICK' | 'EXECUTIVE' | 'COMPLETE' | 'RAW' | 'INVESTOR' | 'FOUNDER' | 'DATASET' | 'AUDIT';
  generatedAt: string;
  reportDisclaimer: string;
  plainEnglishGuide?: PlainEnglishGuide;
  explodingTopics?: ExplodingTopicsData;
  trustMrrBenchmarks?: TrustMrrData;
  startupsRipGraveyard?: StartupsRipData;

  executiveSummary: {
    ideaSynthesis: string;
    targetCustomerSummary: string;
    coreProblemVerdict: string;
    marketOpportunity: string;
    predominantRisk: string;
    overallFeasibilityVerdict: 'STRONG_SIGNALS_PROCEED' | 'VALIDATION_PREREQUISITES_REQUIRED' | 'HIGH_RISK_PIVOT_RECOMMENDED' | 'INSUFFICIENT_EVIDENCE';
    executiveConclusion: string;
    keyNextAction: string;
  };

  customerVoice: {
    recurringThemes: string[];
    topPainPoints: string[];
    workaroundFrustrations: string[];
    willingnessToPaySignals: string[];
    desiredUnmetFeatures: string[];
  };

  marketIntelligence: {
    tamEstimateRange: string;
    samEstimateRange: string;
    somEstimateRange: string;
    growthRateCAGR: string;
    marketMaturity: 'Emerging / Unproven' | 'Rapid Expansion' | 'Consolidating' | 'Mature & Crowded';
    macroTailwinds: string[];
    macroHeadwinds: string[];
  };

  competitors: CompetitorProfile[];
  successCases: SuccessCaseStudy[];
  failureCases: FailureCaseStudy[];
  corporateMovements: CorporateMovement[];
  geographicIntelligence: GeographicAnalysis;

  technologyAndOperations: {
    techStackFeasibility: string;
    operationalHumanDependencies: string[];
    regulatoryHotspots: string[];
    legalDisclaimer: string;
  };

  evidenceFor: EvidenceItem[];
  evidenceAgainst: EvidenceItem[];

  tryToKillMyStartup: {
    hostileInvestorPerspective: string;
    rankedKillRisks: KillRiskItem[];
    abandonmentTriggers: string[];
  };

  assumptions: AssumptionItem[];
  validationExperiments: ValidationExperiment[];
  strategy: StartupStrategy;
  sources: ResearchSource[];
  businessIdentityLock?: BusinessIdentityLock;
  optionalPivots?: OptionalPivotModel[];
  searchConnectionStatus?: SearchConnectionStatus;
  researchDataset?: StructuredResearchDataset;
  qualityAudit?: QualityAuditReport;
}

export interface ResearchStageUpdate {
  stage:
    | 'PLANNING'
    | 'MARKET_RESEARCH'
    | 'CUSTOMER_SIGNALS'
    | 'COMPETITOR_INTELLIGENCE'
    | 'SUCCESS_FAILURE_STUDIES'
    | 'CORPORATE_MOVEMENTS'
    | 'GEOGRAPHY_REGULATORY'
    | 'CONTRARIAN_KILL_ANALYSIS'
    | 'ASSUMPTIONS_EXPERIMENTS'
    | 'STRATEGY_SYNTHESIS'
    | 'COMPLETE';
  label: string;
  detail: string;
  completedStages: string[];
}

export type FieldExtractionStatus = 'explicit' | 'inferred' | 'ambiguous' | 'missing' | 'unknown';

export type FieldSource = 'original_idea' | 'interview' | 'inferred' | 'unknown';

export interface ExtractedFieldItem {
  field_name: string;
  label: string;
  category:
    | 'core'
    | 'customer'
    | 'problem'
    | 'solution'
    | 'market'
    | 'business_model'
    | 'competition'
    | 'operations'
    | 'assumptions';
  value: string | string[] | null;
  status: FieldExtractionStatus;
  evidence: string | null;
  confidence: number; // 0 to 1
  needs_confirmation: boolean;
  source: FieldSource;
  explanation?: string;
  user_skipped?: boolean;
}

export type ExtractedStartupProfile = Record<string, ExtractedFieldItem>;

export interface QuestionValidationResult {
  isValid: boolean;
  targetField: string;
  rejectionReason?: string;
  isAlreadyExplicit: boolean;
  isGenuinelyMissing: boolean;
  isDuplicate: boolean;
  isMultiPart: boolean;
  isImportant: boolean;
  isInterviewComplete: boolean;
}

export interface StructuredInterviewState {
  originalIdea: string;
  startupProfile: StartupProfile;
  extractedProfile: ExtractedStartupProfile;
  answeredFields: string[];
  missingFields: string[];
  ambiguousFields: string[];
  questionHistory: string[];
  userResponses: Array<{ question: string; answer: string; timestamp: string }>;
  researchReadiness: {
    ready: boolean;
    blocking_fields: string[];
    reason: string;
    readinessScore: number;
  };
  interviewStatus: 'extracting' | 'interviewing' | 'ready_for_review' | 'confirmed' | 'researching';
}

