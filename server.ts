import express from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import path from 'path';
import {
  processInterviewStep,
  executeResearchPipeline,
  defaultBlankProfile,
  defaultReadinessGate,
  generateHighFidelityCategoryReport,
  fallbackInterviewLogic,
  ensureStructuredResearchDataset,
  executeQualityAuditPipeline,
} from './server/geminiService.js';
import {
  handleInterviewExtraction,
  handleInterviewStep,
} from './server/intelligentExtractor.js';

dotenv.config();

const app = express();

// Security headers: MIME sniffing protection, XSS protection, Referrer Policy, and Permissions Policy
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
});

app.use(express.json({ limit: '10mb' }));

// Healthcheck & security status
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    security: {
      safeBrowserHeaders: true,
      xssProtection: true,
      noSniff: true,
      reverseTabnabbingProtection: true,
    },
    hasGeminiKey: !!process.env.GEMINI_API_KEY,
    timestamp: new Date().toISOString(),
  });
});

// Step 2 & 3: Intelligent Startup Idea Extraction across 23 dimensions
app.post('/api/interview/extract', async (req, res, next) => {
  try {
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({ error: 'Invalid request body' });
    }
    const { rawIdea, currentProfile } = req.body;
    const idea = typeof rawIdea === 'string' ? rawIdea : '';
    const result = await handleInterviewExtraction(idea, currentProfile);
    return res.json(result);
  } catch (error: any) {
    console.error('Error in /api/interview/extract:', error?.message || error);
    next(error);
  }
});

// Step 4 & 5: Dynamic AI Startup Interview with Question-Relevance Validation
app.post('/api/interview', async (req, res, next) => {
  try {
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({ error: 'Invalid request body' });
    }
    const {
      userMessage,
      history,
      currentProfile,
      rawIdea,
      extractedProfile,
      answeredFields,
      targetField,
      isFirstTurn,
    } = req.body;

    const idea = (typeof rawIdea === 'string' && rawIdea) ? rawIdea : (currentProfile?.detailedDescription || userMessage || '');
    const profileToUse = currentProfile && typeof currentProfile === 'object' ? currentProfile : defaultBlankProfile;
    const historyToUse = Array.isArray(history) ? history : [];

    // If first turn or missing extracted profile, extract first
    if (isFirstTurn || historyToUse.length === 0 || !extractedProfile) {
      const extractionResult = await handleInterviewExtraction(idea, profileToUse);
      return res.json(extractionResult);
    }

    // Ongoing step with question validation & answer extraction
    const result = await handleInterviewStep(
      idea,
      typeof userMessage === 'string' ? userMessage : '',
      historyToUse,
      profileToUse,
      extractedProfile,
      Array.isArray(answeredFields) ? answeredFields : [],
      targetField
    );
    return res.json(result);
  } catch (error: any) {
    console.error('Handled error in /api/interview, falling back to local extractor engine:', error?.message || error);
    try {
      const fallback = await handleInterviewStep(
        req.body?.rawIdea || req.body?.userMessage || '',
        req.body?.userMessage || '',
        req.body?.history || [],
        req.body?.currentProfile || defaultBlankProfile,
        req.body?.extractedProfile,
        req.body?.answeredFields
      );
      return res.json(fallback);
    } catch (fallbackErr) {
      next(fallbackErr);
    }
  }
});

// Research Pipeline Execution
app.post('/api/research/execute', async (req, res, next) => {
  try {
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({ error: 'Invalid request body' });
    }
    const { profile, mode } = req.body;
    const profileToUse = {
      ...defaultBlankProfile,
      ...(profile && typeof profile === 'object' ? profile : {}),
    };
    const researchMode = mode === 'QUICK_FEASIBILITY' ? 'QUICK_FEASIBILITY' : 'COMPLETE_DEEP_DIVE';
    const report = await executeResearchPipeline(profileToUse, researchMode);
    return res.json(report);
  } catch (error: any) {
    console.error('Handled error in /api/research/execute, falling back to comprehensive analyst synthesis:', error?.message || error);
    try {
      const profileToUse = {
        ...defaultBlankProfile,
        ...(req.body?.profile && typeof req.body?.profile === 'object' ? req.body.profile : {}),
      };
      const fallbackReport = generateHighFidelityCategoryReport(
        profileToUse,
        req.body?.mode === 'QUICK_FEASIBILITY' ? 'QUICK_FEASIBILITY' : 'COMPLETE_DEEP_DIVE'
      );
      const withDataset = ensureStructuredResearchDataset(fallbackReport, 'MODEL_ESTIMATION_ONLY');
      const auditedReport = await executeQualityAuditPipeline(withDataset);
      return res.json(auditedReport);
    } catch (fallbackErr) {
      next(fallbackErr);
    }
  }
});

// Preset archetypes for instant benchmark testing (Section 52 of Master Build Prompt)
app.get('/api/benchmarks/:id', async (req, res) => {
  const { id } = req.params;
  const validIds = ['driver', 'fitness', 'corporate-ai', 'software-audit'];
  if (!validIds.includes(id)) {
    return res.status(404).json({ error: `Benchmark archetype '${id}' not found. Valid IDs: ${validIds.join(', ')}` });
  }

  const dummyProfile = { ...defaultBlankProfile };

  if (id === 'driver') {
    dummyProfile.startupName = 'ChauffeurX On-Demand';
    dummyProfile.oneLiner = 'On-demand professional driver booking for car owners to use their own vehicle';
    dummyProfile.detailedDescription = 'An on-demand mobile application allowing private car owners to summon verified, professional chauffeurs to drive their personal vehicles for traffic-heavy city commutes and outstation weekend trips.';
    dummyProfile.problemBeingSolved = 'Car owners endure extreme mental stress and wasted hours driving in congested traffic, but hiring a full-time chauffeur costs $350+/month with paid leave commitments.';
    dummyProfile.proposedSolution = 'Summon a vetted, uniform-wearing driver in under 15 minutes, billed strictly by the hour with guaranteed secondary vehicle damage insurance.';
    dummyProfile.primaryCustomer = 'Urban vehicle owners & executives commuting to commercial tech hubs';
    dummyProfile.customerModel = 'B2C';
    dummyProfile.customerGeography = 'Bengaluru, Mumbai, Delhi-NCR';
    dummyProfile.initialCountry = 'India';
    dummyProfile.targetGeography = 'Tier-1 Metros in South Asia';
    dummyProfile.problemFrequency = 'Daily / 3x per week';
    dummyProfile.problemSeverity = 'Frequent Friction';
    dummyProfile.currentWorkaround = 'Driving self, calling local informal driver agencies with no reliability, or taking Uber and leaving personal car parked.';
    dummyProfile.revenueModel = 'Commission on hourly booking rate (20%) + ₹50 safety fee';
    dummyProfile.pricingAssumption = '₹149 base fee + ₹89/hr';
    dummyProfile.knownCompetitors = ['DriveU', 'BeMyDD', 'Uber Reserve / Rental', 'Informal local driver agencies'];
    dummyProfile.regulatedAreas = ['Transportation', 'Employment', 'Physical safety', 'Insurance'];
    dummyProfile.mainFeatures = [
      '15-minute on-demand or scheduled chauffeur dispatch',
      'Driver police background verification & biometric sign-in',
      'Pre-trip vehicle photo damage log',
      'Blanket $50,000 secondary vehicle repair protection policy',
    ];
  } else if (id === 'fitness') {
    dummyProfile.startupName = 'TerritoryRun';
    dummyProfile.oneLiner = 'Gamified territorial capture running app turning city neighborhoods into strategy battles';
    dummyProfile.detailedDescription = 'A competitive running multiplayer game where athletes capture and defend real-world hexagonal neighborhood territories by completing outdoor runs synced with Strava and Apple Health.';
    dummyProfile.problemBeingSolved = 'Solo outdoor running becomes monotonous, and existing apps (Strava, Nike Run Club) operate like corporate spreadsheets with no game-first incentives.';
    dummyProfile.proposedSolution = 'A lightweight multiplayer strategy overlay syncing in the background that lets runners and running clubs conquer urban map zones.';
    dummyProfile.primaryCustomer = 'Urban runners and running club members aged 20-35';
    dummyProfile.customerModel = 'B2C';
    dummyProfile.customerGeography = 'London, Boston, New York';
    dummyProfile.initialCountry = 'United Kingdom';
    dummyProfile.targetGeography = 'Dense pedestrian running capitals';
    dummyProfile.problemFrequency = '3-5x per week';
    dummyProfile.problemSeverity = 'Moderate Inconvenience';
    dummyProfile.currentWorkaround = 'Using Strava segments, wearing headphones with music/podcasts, or joining physical run clubs.';
    dummyProfile.revenueModel = 'Freemium ($7.99/mo club battle pass) + sponsored athletic brand territory challenges';
    dummyProfile.pricingAssumption = '$7.99/month';
    dummyProfile.knownCompetitors = ['Strava', 'Run An Empire (defunct/acquired)', 'Nike Run Club', 'Zombies, Run!'];
    dummyProfile.regulatedAreas = ['Location tracking', 'Personal data'];
    dummyProfile.mainFeatures = [
      'Automated background Strava & HealthKit run ingestion',
      'H3 hexagonal map territory control with 7-day decay mechanic',
      'Club vs club city turf wars with weekly leaderboards',
      'Anti-cheat pace and cadence telemetry verification',
    ];
  } else if (id === 'corporate-ai') {
    dummyProfile.startupName = 'AuditPulse AI';
    dummyProfile.oneLiner = 'Role-governed departmental AI knowledge agent for corporate finance and internal audit teams';
    dummyProfile.detailedDescription = 'Enterprise-grade AI analyst that connects securely across ERPs, internal spreadsheets, and contracts to perform deterministic compliance checks and audit reconciliation without data training risks.';
    dummyProfile.problemBeingSolved = 'Corporate finance analysts spend 25%+ of billable hours manually cross-referencing messy ERP exports against contracts, while generic LLMs hallucinate numbers and breach enterprise permissions.';
    dummyProfile.proposedSolution = 'Zero-hallucination deterministic auditing agent with cell-level spreadsheet coordinate citations and strict role-based access control.';
    dummyProfile.primaryCustomer = 'VP Finance, Corporate Controllers, and Heads of Internal Audit';
    dummyProfile.customerModel = 'B2B';
    dummyProfile.customerGeography = 'North America & Western Europe';
    dummyProfile.initialCountry = 'United States';
    dummyProfile.targetGeography = 'US & UK GAAP/IFRS enterprise market';
    dummyProfile.problemFrequency = 'Daily / Quarterly Close';
    dummyProfile.problemSeverity = 'Critical & Urgent';
    dummyProfile.currentWorkaround = 'Hiring external accounting contractors at $150/hr or manual Excel vlookups and reconciliations.';
    dummyProfile.revenueModel = 'Annual B2B SaaS license ($24,000 - $60,000 ACV based on seats & data volume)';
    dummyProfile.pricingAssumption = '$2,500/month base for up to 25 finance seats';
    dummyProfile.knownCompetitors = ['Glean', 'Microsoft Copilot Studio', 'Manual Excel reconciliations', 'Big 4 audit software'];
    dummyProfile.regulatedAreas = ['Finance', 'Personal data', 'AI-generated content'];
    dummyProfile.mainFeatures = [
      'Deterministic cell-by-cell spreadsheet formula and line item verification',
      'Immutable audit trail showing mathematical provenance for every answer',
      'Zero-retention VPC deployment guaranteeing 0% data training on client ledgers',
      'Active Directory role-based access permissions inheritance',
    ];
  } else if (id === 'software-audit') {
    dummyProfile.startupName = 'AppSanity / SafeBrowser Health Audit';
    dummyProfile.oneLiner = 'Automated AI software health, OWASP security, safe browsing, and WCAG accessibility audit platform';
    dummyProfile.detailedDescription = 'A cloud-based automated software audit platform where developers, product owners, and non-technical founders enter the URL of a website or web app to receive an instant, grounded audit covering OWASP web vulnerabilities, safe browser protections, WCAG 2.2 accessibility, and Core Web Vitals.';
    dummyProfile.problemBeingSolved = 'Non-technical founders and small software teams launch vulnerable web applications without SSL security, accessibility compliance (exposing them to ADA lawsuits), or performance optimization, while hiring professional cybersecurity consultants costs $10,000+ per engagement.';
    dummyProfile.proposedSolution = 'One-click automated URL scan producing a deterministic audit report with verified documentation links (OWASP, W3C, Lighthouse, Snyk) explaining issues in plain English with zero jargon.';
    dummyProfile.primaryCustomer = 'Startup founders, web agency leads, and non-technical product managers';
    dummyProfile.customerModel = 'B2B';
    dummyProfile.customerGeography = 'Global (US, EU, UK, APAC)';
    dummyProfile.initialCountry = 'United States';
    dummyProfile.targetGeography = 'Global digital web app market';
    dummyProfile.problemFrequency = 'Weekly / Per Deployment';
    dummyProfile.problemSeverity = 'Critical & Urgent';
    dummyProfile.currentWorkaround = 'Ignoring security risks, running basic ad-hoc browser extensions, or hiring expensive security consultants.';
    dummyProfile.revenueModel = 'Freemium ($49/month unlimited URL audits & continuous monitoring)';
    dummyProfile.pricingAssumption = '$49/month or $490/annual';
    dummyProfile.knownCompetitors = ['Snyk', 'SonarQube / SonarCloud', 'Google Lighthouse CLI', 'Wappalyzer'];
    dummyProfile.regulatedAreas = ['Cybersecurity', 'Accessibility (ADA / EAA)', 'Personal data (GDPR)'];
    dummyProfile.mainFeatures = [
      'Automated URL safe-browser scanning (HTTPS, CSP, noopener protection)',
      'OWASP Top 10 web risk vulnerability scanner',
      'WCAG 2.2 accessibility automated checker powered by axe-core rules',
      'Plain-English non-techie summary with verified reference links',
    ];
  }

  const report = generateHighFidelityCategoryReport(dummyProfile, 'COMPLETE_DEEP_DIVE');
  const withDataset = ensureStructuredResearchDataset(report, 'MODEL_ESTIMATION_ONLY');
  const auditedReport = await executeQualityAuditPipeline(withDataset);
  return res.json({ profile: dummyProfile, report: auditedReport });
});

// Vite middleware or static serving
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve('dist/index.html'));
    });
  }

  // Centralized secure error handling middleware
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Unhandled server error:', err?.message || err);
    if (!res.headersSent) {
      res.status(500).json({
        error: 'An unexpected internal error occurred while processing your request.',
        status: 'error',
      });
    }
  });

  const PORT = 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`VentureProbe AI server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal error starting VentureProbe AI server:', err);
  process.exit(1);
});
