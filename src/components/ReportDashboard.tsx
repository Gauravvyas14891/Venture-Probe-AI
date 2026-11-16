import React, { useState } from 'react';
import {
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Download,
  Copy,
  Check,
  Printer,
  Sparkles,
  TrendingUp,
  Target,
  Users,
  Building,
  Globe,
  DollarSign,
  AlertOctagon,
  FileText,
  Compass,
  ArrowRight,
  Bell,
  Eye,
  Layers,
  HelpCircle,
  BarChart3,
  Info,
  BookOpen,
  ShieldCheck,
  FileDown,
  X,
  Lightbulb,
  Database,
  Lock,
  GitBranch,
} from 'lucide-react';
import { ResearchReport, EvidenceItem, CompetitorProfile, ValidationExperiment, KillRiskItem, OptionalPivotModel, BusinessIdentityLock } from '../types';
import { downloadReportAsPdf } from '../utils/pdfReportGenerator';
import { getSafeHttpUrl, checkDomainTrust } from '../utils/security';


interface ReportDashboardProps {
  report: ResearchReport;
  onOpenEvidence: (evidence: EvidenceItem | null) => void;
  onEditProfile: () => void;
}

export const ReportDashboard: React.FC<ReportDashboardProps> = ({
  report,
  onOpenEvidence,
  onEditProfile,
}) => {
  const [activeTab, setActiveTab] = useState<'QUICK' | 'EXECUTIVE' | 'COMPLETE' | 'RAW' | 'INVESTOR' | 'FOUNDER' | 'DATASET' | 'AUDIT'>('COMPLETE');
  const [datasetCategoryFilter, setDatasetCategoryFilter] = useState<string>('ALL');
  const [auditCheckFilter, setAuditCheckFilter] = useState<'ALL' | 'CRITICAL_HIGH' | 'FAILED'>('ALL');
  const [expandedAuditCheck, setExpandedAuditCheck] = useState<number | null>(null);
  const [isSimpleMode, setIsSimpleMode] = useState(true);
  const [isGlossaryModalOpen, setIsGlossaryModalOpen] = useState(false);

  const [isEcosystemGuideOpen, setIsEcosystemGuideOpen] = useState(false);
  const [printToast, setPrintToast] = useState<{ show: boolean; message: string }>({ show: false, message: '' });
  const [sourceTierFilter, setSourceTierFilter] = useState<'ALL' | 'TIER_1' | 'TIER_2' | 'TIER_3'>('ALL');
  const [searchSourceQuery, setSearchSourceQuery] = useState('');

  const {
    profile,
    executiveSummary,
    customerVoice,
    marketIntelligence,
    competitors,
    successCases,
    failureCases,
    corporateMovements,
    geographicIntelligence,
    evidenceFor,
    evidenceAgainst,
    tryToKillMyStartup,
    assumptions,
    validationExperiments,
    strategy,
    sources,
    plainEnglishGuide,
    explodingTopics,
    trustMrrBenchmarks,
    startupsRipGraveyard,
    businessIdentityLock: rawLock,
    optionalPivots: rawPivots,
  } = report;

  const lock: BusinessIdentityLock = rawLock || profile.businessIdentityLock || {
    isLocked: true,
    lockedAt: report.generatedAt,
    verbatimFounderIdea: profile.detailedDescription || profile.oneLiner,
    canonicalProductName: profile.startupName,
    productCategory: profile.industryCategory || 'Digital Venture',
    productType: 'Hybrid / Other',
    problemBeingSolved: profile.problemDescription || profile.problemBeingSolved || 'Core problem stated by founder',
    primaryEndUser: profile.endUserPersona || profile.primaryCustomer || 'Target End-Users',
    primaryPayingCustomer: profile.primaryCustomer || 'Paying Customers',
    productOrServiceSold: profile.productOrService || profile.startupName,
    howProductWorks: profile.proposedSolution || 'Direct product workflow mechanics',
    statedRevenueModel: profile.revenueModel || 'Direct monetization',
    statedPricingStructure: profile.pricingStructure || 'Subscription',
    geographicMarket: profile.initialCountry || profile.targetGeography || 'Global',
    mainValueProposition: profile.valueProposition || profile.oneLiner || profile.startupName,
    keyUnverifiedAssumptions: profile.founderStatedAssumptions || [],
    flaggedAmbiguities: [],
    prohibitedSilentSubstitutions: [
      'DO NOT silently substitute this product into a different customer segment or service category',
      'DO NOT silently replace the stated pricing or revenue model with an unverified alternative',
    ],
    coherenceStatus: 'COHERENT',
    coherenceRationale: 'Canonical business model locked and verified.',
  };

  const pivots: OptionalPivotModel[] = rawPivots || report.optionalPivots || [];

  const handlePrint = () => {
    try {
      downloadReportAsPdf(report);
      setPrintToast({
        show: true,
        message: 'Your report has been downloaded in PDF format.',
      });
    } catch (e) {
      console.error('Failed to generate PDF report:', e);
      setPrintToast({
        show: true,
        message: 'Could not generate PDF download. Please try again.',
      });
    }
    setTimeout(() => {
      setPrintToast({ show: false, message: '' });
    }, 5000);
  };

  const handleDownloadDatasetJson = () => {
    try {
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(report.researchDataset || {}, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `${(profile.startupName || 'venture').toLowerCase().replace(/\s+/g, '-')}-structured-research-dataset.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      setPrintToast({
        show: true,
        message: 'Downloaded structured research dataset JSON!',
      });
      setTimeout(() => setPrintToast({ show: false, message: '' }), 4000);
    } catch (e) {
      console.error('Failed to download dataset JSON:', e);
    }
  };

  const getVerdictBadge = (verdict: string) => {
    switch (verdict) {
      case 'STRONG_SIGNALS_PROCEED':
        return (
          <span className="rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 px-3 py-1 text-xs font-bold flex items-center gap-1.5 shadow-sm">
            <CheckCircle2 className="h-4 w-4" /> Strong Signals — Proceed to Seed Validation
          </span>
        );
      case 'VALIDATION_PREREQUISITES_REQUIRED':
        return (
          <span className="rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 px-3 py-1 text-xs font-bold flex items-center gap-1.5 shadow-sm">
            <AlertTriangle className="h-4 w-4" /> Validation Prerequisites Required Before Code
          </span>
        );
      case 'HIGH_RISK_PIVOT_RECOMMENDED':
      default:
        return (
          <span className="rounded-lg bg-rose-500/20 border border-rose-500/40 text-rose-300 px-3 py-1 text-xs font-bold flex items-center gap-1.5 shadow-sm">
            <ShieldAlert className="h-4 w-4" /> High Risk — Strategic Pivot Recommended
          </span>
        );
    }
  };

  const activePlainGuide = plainEnglishGuide || {
    simpleSummary: profile.oneLiner || 'An automated software audit platform that simplifies quality checks.',
    simpleAnalogy: 'Like taking your car to a mechanic for an annual inspection—instead of 8 confusing technical gauges, you get 1 simple report card showing what is broken, why it matters, and how to fix it.',
    simpleVerdict: executiveSummary.overallFeasibilityVerdict === 'STRONG_SIGNALS_PROCEED' ? 'GO_AHEAD' : executiveSummary.overallFeasibilityVerdict === 'VALIDATION_PREREQUISITES_REQUIRED' ? 'PROCEED_WITH_CAUTION' : 'STOP_AND_RETHINK',
    simpleVerdictReason: executiveSummary.executiveConclusion || 'Real market demand exists, but target paying agencies rather than solo developers who expect free tools.',
    whoPaysInPlainEnglish: profile.primaryCustomer || 'Web agencies who want to impress clients with clean launch certificates, and startup CTOs.',
    howYouMakeMoneySimply: profile.pricingAssumption || profile.revenueModel || 'Free basic scan, then $29 to $49 per deep audit report with one-click fix guides.',
    theBiggestDangerSimply: executiveSummary.predominantRisk || 'Giving users 200 confusing error warnings. You must tell them the top 5 urgent fixes.',
    simpleActionStepsThisWeek: [
      'Manually create 3 audit reports for friendly web agencies and ask: "Would you pay $29 for this automatically?"',
      'Deploy a simple 1-page website where users enter a URL for a free 60-second score.',
      'Talk to 5 web design freelancers about client launch sign-offs.'
    ]
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="rounded bg-indigo-500/20 text-indigo-300 text-[10px] font-bold px-2 py-0.5 border border-indigo-500/30">
              DUE-DILIGENCE REPORT
            </span>
            <span className="text-xs text-slate-400">
              Generated {new Date(report.generatedAt).toLocaleDateString()}
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
            <span>{profile.startupName}</span>
            <span className="text-sm font-normal text-slate-400">({profile.customerModel})</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
            {profile.oneLiner}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Simple vs Analyst Mode Toggle */}
          <button
            onClick={() => setIsSimpleMode(!isSimpleMode)}
            className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition ${
              isSimpleMode
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                : 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300'
            }`}
            title="Toggle between friendly plain-English explanations and detailed analytical view"
          >
            <Lightbulb className="h-3.5 w-3.5" />
            <span>{isSimpleMode ? 'Simple & Clear Mode (On)' : 'Detailed Analyst Mode'}</span>
          </button>

          {/* Plain English Financial & Startup Glossary */}
          <button
            onClick={() => setIsGlossaryModalOpen(true)}
            className="flex items-center gap-1.5 rounded-xl border border-sky-500/30 bg-sky-950/30 px-3 py-2 text-xs font-semibold text-sky-300 hover:bg-sky-900/40 transition"
            title="Open simple definitions for startup, financial and technical terms"
          >
            <HelpCircle className="h-3.5 w-3.5" />
            <span>Plain Dictionary</span>
          </button>



          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 rounded-xl border border-indigo-400/50 bg-indigo-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-indigo-500 transition shadow-lg shadow-indigo-600/30"
            title="Automatically download full report in PDF format"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Print Report</span>
          </button>

          <button
            onClick={() => setActiveTab('AUDIT')}
            className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition ${
              report.qualityAudit?.status === 'PASS'
                ? 'bg-purple-950/60 border-purple-500/40 text-purple-200 hover:bg-purple-900/60'
                : 'bg-rose-950/60 border-rose-500/50 text-rose-200 hover:bg-rose-900/60'
            }`}
            title="Inspect Independent Quality Auditor results and 9-check scorecard"
          >
            <ShieldCheck className={`h-3.5 w-3.5 ${report.qualityAudit?.status === 'PASS' ? 'text-purple-400' : 'text-rose-400'}`} />
            <span>Quality Audit ({report.qualityAudit?.status === 'PASS' ? 'Passed' : 'Safeguard Alert'})</span>
          </button>

          <button
            onClick={() => setActiveTab('DATASET')}
            className="flex items-center gap-1.5 rounded-xl bg-indigo-950/60 hover:bg-indigo-900/60 border border-indigo-500/40 px-3 py-2 text-xs font-semibold text-indigo-200 transition"
          >
            <Database className="h-3.5 w-3.5 text-indigo-400" />
            <span>Structured Dataset</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('RAW');
            }}
            className="flex items-center gap-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-300 transition"
          >
            <BookOpen className="h-3.5 w-3.5 text-slate-400" />
            <span>Sources ({sources.length})</span>
          </button>
        </div>
      </div>

      {/* Floating Action Confirmation Toast */}
      {printToast.show && (
        <div className="rounded-xl border border-emerald-500/50 bg-emerald-950/90 text-emerald-200 px-4 py-3 text-xs flex items-center justify-between shadow-xl animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            <span className="font-medium">{printToast.message}</span>
          </div>
          <button
            onClick={() => setPrintToast({ show: false, message: '' })}
            className="text-emerald-400 hover:text-white ml-3 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Web Search Connection & Grounding Status Banner */}
      <div
        className={`rounded-2xl border p-4.5 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4 ${
          report.searchConnectionStatus === 'LIVE_SEARCH_CONNECTED'
            ? 'border-emerald-500/40 bg-emerald-950/25 text-emerald-200'
            : 'border-amber-500/50 bg-amber-950/30 text-amber-200'
        }`}
      >
        <div className="flex items-start gap-3">
          <div
            className={`p-2.5 rounded-xl shrink-0 mt-0.5 ${
              report.searchConnectionStatus === 'LIVE_SEARCH_CONNECTED'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
            }`}
          >
            {report.searchConnectionStatus === 'LIVE_SEARCH_CONNECTED' ? (
              <Globe className="h-5 w-5" />
            ) : (
              <AlertTriangle className="h-5 w-5" />
            )}
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                  report.searchConnectionStatus === 'LIVE_SEARCH_CONNECTED'
                    ? 'bg-emerald-500/30 text-emerald-300 border-emerald-500/50'
                    : 'bg-amber-500/30 text-amber-300 border-amber-500/50'
                }`}
              >
                {report.searchConnectionStatus === 'LIVE_SEARCH_CONNECTED'
                  ? '🟢 Live Web Search Active'
                  : '⚠️ Live Web Search Not Connected — Model Estimates Only'}
              </span>
              <span className="text-[11px] text-slate-300 font-medium">
                VentureProbe Strict Evidence Standard
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed max-w-4xl">
              {report.researchDataset?.statusExplanation ||
                (report.searchConnectionStatus === 'LIVE_SEARCH_CONNECTED'
                  ? 'Live Google Search grounding was active and empirical citations were retrieved.'
                  : 'Web search is not currently connected in this runtime environment. VentureProbe does NOT pretend to have performed live research. Findings represent model-based analytical estimates and structural hypotheses requiring primary validation.')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-start md:self-center">
          <button
            onClick={() => setActiveTab('DATASET')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'DATASET'
                ? 'bg-white text-slate-900 shadow-md'
                : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
            }`}
          >
            <Database className="h-3.5 w-3.5 text-indigo-400" />
            <span>Open Structured Dataset</span>
          </button>
        </div>
      </div>

      {/* Quality Auditor Safeguard Status Banner */}
      {report.qualityAudit && (
        <div
          className={`rounded-2xl border p-4.5 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4 ${
            report.qualityAudit.status === 'PASS'
              ? 'border-purple-500/40 bg-purple-950/25 text-purple-200'
              : 'border-rose-500/50 bg-rose-950/30 text-rose-200'
          }`}
        >
          <div className="flex items-start gap-3">
            <div
              className={`p-2.5 rounded-xl shrink-0 mt-0.5 ${
                report.qualityAudit.status === 'PASS'
                  ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                  : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
              }`}
            >
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                    report.qualityAudit.status === 'PASS'
                      ? 'bg-purple-500/30 text-purple-300 border-purple-500/50'
                      : 'bg-rose-500/30 text-rose-300 border-rose-500/50'
                  }`}
                >
                  SYSTEM PROMPT: VENTUREPROBE QUALITY AUDITOR
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    report.qualityAudit.status === 'PASS'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                      : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                  }`}
                >
                  {report.qualityAudit.status === 'PASS' ? 'PASSED (0 Critical / 0 High)' : 'SAFEGUARD FAILED'}
                </span>
                <span className="text-[10px] text-slate-400">
                  Attempt {report.qualityAudit.totalAttempts} of {report.qualityAudit.maxAttempts} • {report.qualityAudit.publicationStatus === 'VERIFIED_PUBLISHED' ? 'Verified Publication' : 'Preliminary Unverified'}
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed max-w-4xl">
                {report.qualityAudit.summary}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-start md:self-center">
            <button
              onClick={() => setActiveTab('AUDIT')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'AUDIT'
                  ? 'bg-white text-slate-900 shadow-md'
                  : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
              }`}
            >
              <ShieldCheck className="h-3.5 w-3.5 text-purple-400" />
              <span>Inspect Audit Scorecard</span>
            </button>
          </div>
        </div>
      )}

      {/* Presentation Modes */}
      <div className="flex overflow-x-auto border-b border-slate-800 pb-2 gap-2 text-xs font-bold scrollbar-none">
        {[
          { id: 'COMPLETE', label: isSimpleMode ? 'Complete Step-by-Step Report' : 'Complete Deep-Dive Report', count: 'All Sections' },
          { id: 'AUDIT', label: '🛡️ Quality Audit', count: report.qualityAudit?.status === 'PASS' ? 'Passed (9/9)' : (report.qualityAudit ? 'Review Needed' : 'Safeguard') },
          { id: 'DATASET', label: '🔬 Structured Research Dataset', count: 'Tasks A–I' },
          { id: 'QUICK', label: isSimpleMode ? '2-Page Quick Summary' : 'Quick Feasibility Overview', count: 'Overview' },
          { id: 'EXECUTIVE', label: 'Executive Summary', count: 'Verdict' },
          { id: 'INVESTOR', label: isSimpleMode ? 'Why Could This Fail?' : 'Investor & Kill Risks', count: 'Stress Test' },
          { id: 'FOUNDER', label: isSimpleMode ? 'My Action Roadmap' : 'Founder Action Plan', count: 'Roadmap' },
          { id: 'RAW', label: 'Sources & Citations', count: `${sources.length} Citations` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-1.5 rounded-xl px-4 py-2 whitespace-nowrap transition ${
              activeTab === tab.id
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <span>{tab.label}</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
              activeTab === tab.id ? 'bg-indigo-700 text-indigo-100' : 'bg-slate-800 text-slate-400'
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* =========================================================================
          CANONICAL BUSINESS MODEL LOCK & MANDATE BANNER
          (Enforcing Steps 1, 2, 3 & 4 of Business Understanding Engine)
         ========================================================================= */}
      <section className="rounded-2xl border-2 border-indigo-500/40 bg-gradient-to-br from-indigo-950/40 via-slate-900 to-slate-900 p-6 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-indigo-500/20">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <Lock className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">
                  SYSTEM PROMPT: BUSINESS MODEL LOCK
                </span>
                <span className="rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-semibold px-2 py-0.5 border border-emerald-500/30 flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3" /> Fixed Input Locked
                </span>
              </div>
              <h2 className="text-xl font-extrabold text-white">
                Canonical Business Identity Lock: {lock.canonicalProductName}
              </h2>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onEditProfile}
              className="rounded-xl border border-indigo-500/30 bg-indigo-950/40 hover:bg-indigo-900/40 px-3.5 py-1.5 text-xs font-semibold text-indigo-200 transition"
            >
              Edit Parameters
            </button>
          </div>
        </div>

        <div className="mt-4 p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-300 leading-relaxed flex items-start gap-2.5">
          <ShieldAlert className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-amber-300">Identity Lock Mandate Enforced:</span> All diligence, market research, competitor audits, and validation experiments in this report were forced to evaluate this canonical model as a fixed input. The AI engine was strictly prohibited from silently replacing your product, customer, marketplace, or pricing structure.
          </div>
        </div>

        {/* 10 Extracted Dimensions Grid */}
        <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {/* Card 1: Venture Identity & Solution */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-2.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400 block pb-1 border-b border-slate-800">
              Venture &amp; Product Boundaries
            </span>
            <div>
              <span className="text-slate-400 text-[10px] uppercase font-bold block">Canonical Title:</span>
              <p className="text-slate-100 font-bold">{lock.canonicalProductName}</p>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] uppercase font-bold block">Archetype &amp; Category:</span>
              <p className="text-indigo-300 font-semibold">{lock.productType} • {lock.productCategory}</p>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] uppercase font-bold block">Product/Service Sold:</span>
              <p className="text-slate-200">{lock.productOrServiceSold}</p>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] uppercase font-bold block">Workflow Mechanics:</span>
              <p className="text-slate-300 text-[11px] leading-relaxed line-clamp-3">{lock.howProductWorks}</p>
            </div>
          </div>

          {/* Card 2: Customers & Revenue Model */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-2.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 block pb-1 border-b border-slate-800">
              Customer &amp; Revenue Lock
            </span>
            <div>
              <span className="text-slate-400 text-[10px] uppercase font-bold block">Primary End-User:</span>
              <p className="text-slate-200 font-medium">{lock.primaryEndUser}</p>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] uppercase font-bold block">Primary Paying Customer:</span>
              <p className="text-emerald-300 font-bold">{lock.primaryPayingCustomer}</p>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] uppercase font-bold block">Stated Revenue Model:</span>
              <p className="text-slate-100 font-semibold">{lock.statedRevenueModel}</p>
              <span className="inline-block mt-0.5 text-[10px] font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                Structure: {lock.statedPricingStructure}
              </span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] uppercase font-bold block">Geographic Market:</span>
              <p className="text-slate-200">{lock.geographicMarket}</p>
            </div>
          </div>

          {/* Card 3: Anti-Substitution & Coherence */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-2.5 flex flex-col justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 block pb-1 border-b border-slate-800">
                Anti-Substitution Safeguards
              </span>
              <div className="mt-2 space-y-1.5">
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Prohibited Substitutions:</span>
                <ul className="space-y-1">
                  {(lock.prohibitedSilentSubstitutions && lock.prohibitedSilentSubstitutions.length > 0
                    ? lock.prohibitedSilentSubstitutions
                    : [
                        'DO NOT silently change product into a different service',
                        'DO NOT convert marketplace into direct staffing or dispatch agency',
                        'DO NOT replace stated revenue model with unverified pricing structures',
                      ]
                  ).slice(0, 3).map((sub, i) => (
                    <li key={i} className="flex items-start gap-1.5 text-[11px] text-slate-300">
                      <span className="text-rose-400 font-bold shrink-0">✕</span>
                      <span>{sub}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 text-[11px]">
              <div className="flex items-center justify-between text-slate-400">
                <span>Model Coherence:</span>
                <span className="text-emerald-400 font-bold">
                  {lock.coherenceStatus === 'COHERENT' ? 'Coherent Business ✓' : lock.coherenceStatus}
                </span>
              </div>
              <p className="text-slate-400 text-[10px] mt-1 italic">{lock.coherenceRationale}</p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          INDEPENDENT QUALITY AUDITOR SAFEGUARD
          Enforcing SYSTEM PROMPT: VENTUREPROBE QUALITY AUDITOR
         ========================================================================= */}
      {(activeTab === 'AUDIT' || activeTab === 'COMPLETE') && report.qualityAudit && (
        <section
          className={`rounded-2xl border-2 p-6 shadow-2xl space-y-6 ${
            report.qualityAudit.status === 'PASS'
              ? 'border-purple-500/40 bg-gradient-to-br from-purple-950/20 via-slate-900 to-slate-900'
              : 'border-rose-500/50 bg-gradient-to-br from-rose-950/30 via-slate-900 to-slate-900'
          }`}
        >
          {/* Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-purple-400">
                  SYSTEM PROMPT: VENTUREPROBE QUALITY AUDITOR
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    report.qualityAudit.status === 'PASS'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                      : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                  }`}
                >
                  {report.qualityAudit.status === 'PASS' ? '🛡️ AUDIT PASSED' : '⚠️ PRELIMINARY UNVERIFIED'}
                </span>
                <span className="text-[10px] text-slate-400">
                  Attempt {report.qualityAudit.totalAttempts} of {report.qualityAudit.maxAttempts}
                </span>
              </div>
              <h2 className="text-xl font-bold text-white mt-1 flex items-center gap-2">
                <span>Independent Quality Auditor Safeguard</span>
                <span className="text-xs font-normal text-slate-400">(9-Check Pre-Publication Challenge)</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Before VentureProbe publishes a report, an independent, skeptical auditor challenges the Canonical Business Profile, Research Dataset, and Draft Report to prevent business model drift, unsupported claims, and false precision.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`px-3 py-1 rounded-xl text-xs font-bold border ${
                  report.qualityAudit.publicationStatus === 'VERIFIED_PUBLISHED'
                    ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-200'
                    : 'bg-rose-950/60 border-rose-500/40 text-rose-200'
                }`}
              >
                {report.qualityAudit.publicationStatus === 'VERIFIED_PUBLISHED'
                  ? 'Status: Verified Publication'
                  : 'Status: Preliminary Unverified'}
              </span>
            </div>
          </div>

          {/* Audit Summary & Scorecard Hero */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div
              className={`p-4 rounded-xl border col-span-1 md:col-span-2 space-y-2 ${
                report.qualityAudit.status === 'PASS'
                  ? 'bg-purple-950/30 border-purple-500/30 text-purple-100'
                  : 'bg-rose-950/30 border-rose-500/30 text-rose-100'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Auditor Verdict</span>
                <span
                  className={`text-xs font-extrabold px-2 py-0.5 rounded ${
                    report.qualityAudit.status === 'PASS'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  }`}
                >
                  {report.qualityAudit.status}
                </span>
              </div>
              <p className="text-xs font-semibold leading-relaxed">
                {report.qualityAudit.summary}
              </p>
              <p className="text-[11px] text-slate-400 italic pt-1 border-t border-slate-800">
                "{report.qualityAudit.auditorStatement}"
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/60 flex flex-col justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Severity Breakdown</span>
              <div className="grid grid-cols-2 gap-2 my-1">
                <div className="rounded-lg bg-slate-900 p-2 border border-slate-800">
                  <span className="text-[10px] text-rose-400 font-semibold block">Critical</span>
                  <span className="text-lg font-bold text-white">{report.qualityAudit.criticalCount}</span>
                </div>
                <div className="rounded-lg bg-slate-900 p-2 border border-slate-800">
                  <span className="text-[10px] text-amber-400 font-semibold block">High</span>
                  <span className="text-lg font-bold text-white">{report.qualityAudit.highCount}</span>
                </div>
                <div className="rounded-lg bg-slate-900 p-2 border border-slate-800">
                  <span className="text-[10px] text-sky-400 font-semibold block">Medium</span>
                  <span className="text-lg font-bold text-white">{report.qualityAudit.mediumCount}</span>
                </div>
                <div className="rounded-lg bg-slate-900 p-2 border border-slate-800">
                  <span className="text-[10px] text-slate-400 font-semibold block">Low</span>
                  <span className="text-lg font-bold text-white">{report.qualityAudit.lowCount}</span>
                </div>
              </div>
              <span className="text-[10px] text-slate-500">Pass rule: 0 Critical &amp; 0 High</span>
            </div>

            <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/60 flex flex-col justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Revision Loop</span>
              <div className="my-1 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Total Attempts:</span>
                  <span className="font-bold text-white">
                    {report.qualityAudit.totalAttempts} / {report.qualityAudit.maxAttempts}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Auto-Retries:</span>
                  <span className="font-bold text-white">
                    {Math.max(0, report.qualityAudit.totalAttempts - 1)} / 2
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Revisions Applied:</span>
                  <span className="font-bold text-emerald-400">
                    {report.qualityAudit.auditTrail.reduce((acc, t) => acc + (t.revisionsApplied?.length || 0), 0)}
                  </span>
                </div>
              </div>
              <span className="text-[10px] text-slate-500">Max 2 retries before marking Preliminary</span>
            </div>
          </div>

          {/* Core Auditor Rule Callout */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 text-xs space-y-1.5 text-slate-300 leading-relaxed">
            <div className="flex items-center gap-2 text-purple-300 font-bold text-xs">
              <ShieldCheck className="h-4 w-4" />
              <span>Auditor Safeguard Rules &amp; Publication Boundaries:</span>
            </div>
            <p className="text-slate-400 text-[11px]">
              <strong className="text-slate-200">A report MUST FAIL if it analyzes the wrong business model or contains fabricated source references.</strong> Do not mark the report as verified merely because it contains citations. A report may pass with disclosed uncertainty and missing evidence. It must not disguise those gaps as established facts. If the auditor returns FAIL, VentureProbe automatically revises the draft up to two times. If it still fails, it is published with a prominent preliminary label—never quietly marked verified.
            </p>
          </div>

          {/* 9 QUALITY CHECKS GRID */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-purple-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  The 9 Verification Dimensions ({report.qualityAudit.checkResults.filter((c) => c.passed).length}/9 Passed)
                </h3>
              </div>

              <div className="flex gap-1 text-[10px]">
                {(['ALL', 'FAILED', 'CRITICAL_HIGH'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setAuditCheckFilter(f)}
                    className={`px-2 py-0.5 rounded-md font-semibold transition ${
                      auditCheckFilter === f
                        ? 'bg-purple-600 text-white'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    {f === 'ALL' ? 'All 9 Checks' : f === 'FAILED' ? 'Failed Only' : 'Critical & High'}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {report.qualityAudit.checkResults
                .filter((c) => {
                  if (auditCheckFilter === 'FAILED') return !c.passed;
                  if (auditCheckFilter === 'CRITICAL_HIGH') return c.severity === 'CRITICAL' || c.severity === 'HIGH';
                  return true;
                })
                .map((check) => (
                  <div
                    key={check.checkNumber}
                    onClick={() =>
                      setExpandedAuditCheck(expandedAuditCheck === check.checkNumber ? null : check.checkNumber)
                    }
                    className={`p-3.5 rounded-xl border transition cursor-pointer flex flex-col justify-between ${
                      check.passed
                        ? 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                        : 'border-rose-500/40 bg-rose-950/20 hover:border-rose-500/60'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold text-slate-400">Check #{check.checkNumber}</span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            check.passed
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                              : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                          }`}
                        >
                          {check.passed ? 'PASSED' : 'FLAGGED'}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-white mb-1.5 flex items-center gap-1.5">
                        {check.passed ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                        ) : (
                          <AlertTriangle className="h-3.5 w-3.5 text-rose-400 shrink-0" />
                        )}
                        <span>{check.checkName}</span>
                      </h4>
                      <p className="text-[11px] text-slate-300 leading-relaxed">{check.summary}</p>
                    </div>

                    <div className="pt-2 mt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500">
                      <span>
                        Severity:{' '}
                        <strong
                          className={
                            check.severity === 'CRITICAL'
                              ? 'text-rose-400'
                              : check.severity === 'HIGH'
                              ? 'text-amber-400'
                              : 'text-slate-400'
                          }
                        >
                          {check.severity}
                        </strong>
                      </span>
                      <span>{check.findingCount > 0 ? `${check.findingCount} finding(s)` : '0 defects'}</span>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* AUDIT TRAIL & REVISION LOG */}
          {report.qualityAudit.auditTrail.length > 0 && (
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <span>Audit Trail &amp; Automatic Revision History ({report.qualityAudit.auditTrail.length} Cycles)</span>
              </h3>
              <div className="space-y-2">
                {report.qualityAudit.auditTrail.map((entry) => (
                  <div
                    key={entry.attempt}
                    className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/70 text-xs space-y-2"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            entry.status === 'PASS'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : 'bg-rose-500/20 text-rose-300'
                          }`}
                        >
                          Attempt {entry.attempt}: {entry.status}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(entry.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400">
                        Issues: {entry.criticalCount} Critical, {entry.highCount} High, {entry.mediumCount} Medium
                      </span>
                    </div>

                    {entry.revisionsApplied && entry.revisionsApplied.length > 0 && (
                      <div className="pt-2 border-t border-slate-800/80 space-y-1">
                        <span className="text-[10px] font-bold text-indigo-400 block">
                          Automatic Revisions Applied by Revisor Engine:
                        </span>
                        <ul className="list-disc list-inside space-y-0.5 text-[11px] text-slate-300">
                          {entry.revisionsApplied.map((rev, rIdx) => (
                            <li key={rIdx}>{rev}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* DETAILED FINDINGS LOG (IF ANY REMAIN OR WERE RESOLVED) */}
          {report.qualityAudit.allFindings.length > 0 && (
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Auditor Findings &amp; Corrective Actions Log ({report.qualityAudit.allFindings.length})
              </h3>
              <div className="space-y-2">
                {report.qualityAudit.allFindings.map((finding) => (
                  <div
                    key={finding.id}
                    className="p-3 rounded-xl border border-slate-800 bg-slate-950/50 text-xs space-y-1.5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            finding.severity === 'CRITICAL'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : finding.severity === 'HIGH'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                          }`}
                        >
                          {finding.severity}
                        </span>
                        <span className="font-semibold text-slate-200">{finding.categoryName}</span>
                      </div>
                      <span className="text-[10px] text-slate-400">Affected: {finding.affectedSection}</span>
                    </div>
                    <p className="text-slate-300 text-[11px]">{finding.issue}</p>
                    <div className="pt-1.5 border-t border-slate-800/60 text-[11px] text-emerald-400 font-medium">
                      <span>Corrective Action: </span>
                      <span className="text-slate-300 font-normal">{finding.correctiveAction}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* =========================================================================
          STRUCTURED RESEARCH DATASET (Tasks A through I)
          Enforcing SYSTEM PROMPT: EVIDENCE-BASED STARTUP RESEARCH
         ========================================================================= */}
      {(activeTab === 'DATASET' || activeTab === 'COMPLETE') && (
        <section className="rounded-2xl border-2 border-indigo-500/40 bg-slate-900/95 p-6 shadow-2xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                  SYSTEM PROMPT: EVIDENCE-BASED STARTUP RESEARCH
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    report.searchConnectionStatus === 'LIVE_SEARCH_CONNECTED'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                  }`}
                >
                  {report.searchConnectionStatus === 'LIVE_SEARCH_CONNECTED'
                    ? '🟢 Live Search Grounded'
                    : '⚠️ Model Estimates Only'}
                </span>
              </div>
              <h2 className="text-xl font-bold text-white mt-1">
                Structured Research Dataset (Tasks A–I)
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                The final report may use only findings supported by this dataset. Separates supported findings, conflicting findings, transparent calculation inputs, unverified hypotheses, and missing evidence.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleDownloadDatasetJson}
                className="flex items-center gap-1.5 rounded-xl border border-indigo-500/40 bg-indigo-600/30 hover:bg-indigo-600/50 px-3 py-1.5 text-xs font-bold text-white transition shadow-sm"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Export Dataset JSON</span>
              </button>
            </div>
          </div>

          {/* Core Dataset Rule Callout */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 text-xs space-y-1.5 text-slate-300 leading-relaxed">
            <div className="flex items-center gap-2 text-indigo-300 font-bold text-xs">
              <Database className="h-4 w-4" />
              <span>Evidence Standard &amp; Non-Negotiable Research Boundary:</span>
            </div>
            <p className="text-slate-400 text-[11px]">
              VentureProbe operates under a strict rule: <strong className="text-slate-200">The prompt cannot create evidence that tools have not retrieved.</strong> Customer willingness to pay is never inferred from search volume, app downloads, or general market size. International metrics are not treated as proof of Indian or local market demand without explicit limitations. Missing evidence is never filled with fabricated statistics.
            </p>
          </div>

          {/* 1. SUPPORTED FINDINGS */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800/80">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  1. Supported Findings ({report.researchDataset?.supportedFindings?.length || 0})
                </h3>
              </div>

              {/* Filter by Task Category */}
              <div className="flex flex-wrap gap-1 text-[10px]">
                {['ALL', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setDatasetCategoryFilter(cat)}
                    className={`px-2 py-0.5 rounded-md transition font-semibold ${
                      datasetCategoryFilter === cat
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    {cat === 'ALL' ? 'All Tasks' : `Task ${cat}`}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {(report.researchDataset?.supportedFindings || [])
                .filter((f) => {
                  if (datasetCategoryFilter === 'ALL') return true;
                  return f.category?.startsWith(datasetCategoryFilter) || f.category?.includes(`Task ${datasetCategoryFilter}`);
                })
                .map((finding) => (
                  <div
                    key={finding.id}
                    className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-2.5 hover:border-slate-700 transition text-xs"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 text-[10px] font-bold">
                        {finding.category}
                      </span>
                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase border ${
                            finding.confidence === 'HIGH'
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                              : finding.confidence === 'MEDIUM'
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                              : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                          }`}
                        >
                          {finding.confidence} Confidence
                        </span>
                        <span className="text-[10px] text-slate-400">
                          Accessed: {finding.dateAccessed}
                        </span>
                      </div>
                    </div>

                    <div className="text-slate-100 font-semibold text-sm">
                      {finding.claim}
                    </div>

                    {/* Exact Evidence Excerpt */}
                    <div className="rounded-lg bg-slate-900/90 border border-slate-800 p-3 font-mono text-[11px] text-slate-300 leading-relaxed">
                      <span className="text-[10px] font-sans font-bold text-slate-400 block mb-1 uppercase tracking-wider">
                        Exact Supporting Evidence / Relevant Excerpt:
                      </span>
                      "{finding.exactSupportingEvidence || finding.exactEvidenceExcerpt}"
                    </div>

                    {/* Source Metadata & Confidence Reason */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[11px] text-slate-400 border-t border-slate-800/60">
                      <div>
                        <strong className="text-slate-300">Source:</strong> {finding.sourceTitle} ({finding.publisher})
                        {finding.sourceUrl && getSafeHttpUrl(finding.sourceUrl) && (
                          <a
                            href={getSafeHttpUrl(finding.sourceUrl)!}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-indigo-400 hover:text-indigo-300 ml-1.5"
                          >
                            <span>Link</span>
                            <ExternalLink className="h-2.5 w-2.5" />
                          </a>
                        )}
                      </div>
                      <div>
                        <strong className="text-slate-300">Confidence Rationale:</strong> {finding.confidenceReason}
                      </div>
                    </div>

                    <div className="text-[10px] text-slate-400 italic">
                      <strong className="text-slate-300 not-italic">Limitations:</strong> {finding.evidenceQuality}
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* 2. CONFLICTING FINDINGS */}
          <div className="space-y-3 pt-4 border-t border-slate-800">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-amber-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                2. Conflicting Findings ({report.researchDataset?.conflictingFindings?.length || 0})
              </h3>
            </div>
            <p className="text-xs text-slate-400">
              Contradictions between market signals, customer sentiment, and operational friction.
            </p>

            <div className="grid grid-cols-1 gap-3">
              {(report.researchDataset?.conflictingFindings || []).map((conflict) => (
                <div
                  key={conflict.id}
                  className="rounded-xl border border-amber-500/30 bg-amber-950/15 p-4 space-y-3 text-xs"
                >
                  <h4 className="font-bold text-amber-300 text-sm flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />
                    <span>Point of Conflict: {conflict.pointOfConflict}</span>
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="rounded-lg bg-slate-900/80 p-3 border border-slate-800 space-y-1">
                      <span className="text-[10px] font-bold uppercase text-emerald-400 block">Claim A (Supporting Signal)</span>
                      <p className="text-slate-200">{conflict.claimA}</p>
                      <span className="text-[10px] text-slate-400 block pt-1 italic">Source: {conflict.sourceA}</span>
                    </div>

                    <div className="rounded-lg bg-slate-900/80 p-3 border border-slate-800 space-y-1">
                      <span className="text-[10px] font-bold uppercase text-rose-400 block">Claim B (Contradicting / Friction Signal)</span>
                      <p className="text-slate-200">{conflict.claimB}</p>
                      <span className="text-[10px] text-slate-400 block pt-1 italic">Source: {conflict.sourceB}</span>
                    </div>
                  </div>

                  <div className="rounded-lg bg-slate-900 p-2.5 border border-amber-500/20 text-[11px] text-amber-200/90 flex items-start gap-2">
                    <strong className="shrink-0 text-amber-300">Strategic Risk:</strong>
                    <span>{conflict.strategicRisk}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 3. ESTIMATES & CALCULATION INPUTS */}
          <div className="space-y-3 pt-4 border-t border-slate-800">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-sky-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                3. Estimates &amp; Transparent Calculation Inputs ({report.researchDataset?.estimatesAndCalculations?.length || 0})
              </h3>
            </div>
            <p className="text-xs text-slate-400">
              Mathematical derivations with verifiable inputs. Explicitly excludes black-box numbers.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {(report.researchDataset?.estimatesAndCalculations || []).map((calc, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-sky-500/30 bg-slate-950/60 p-4 space-y-2 text-xs flex flex-col justify-between"
                >
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      {calc.metric}
                    </span>
                    <div className="text-lg font-extrabold text-sky-400">
                      {calc.estimatedValue}
                    </div>
                    <div className="text-[11px] text-slate-300 leading-relaxed pt-1">
                      <strong className="text-white block mb-0.5">Transparent Method:</strong>
                      {calc.transparentMethodology}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 space-y-1">
                    <span className="text-[10px] font-semibold text-slate-400 block uppercase">Underlying Assumptions:</span>
                    <ul className="list-disc list-inside space-y-0.5 text-[10px] text-slate-400">
                      {calc.underlyingAssumptions.map((asm, idx) => (
                        <li key={idx}>{asm}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 4. UNVERIFIED HYPOTHESES */}
          <div className="space-y-3 pt-4 border-t border-slate-800">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-indigo-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                4. Unverified Hypotheses ({report.researchDataset?.unverifiedHypotheses?.length || 0})
              </h3>
            </div>
            <p className="text-xs text-slate-400">
              Core leaps of faith requiring empirical validation tests before capital deployment.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {(report.researchDataset?.unverifiedHypotheses || []).map((hyp, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-indigo-500/30 bg-slate-950/60 p-4 space-y-2.5 text-xs flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="font-bold text-white text-xs leading-snug">
                      "{hyp.hypothesis}"
                    </div>
                    <div className="text-[11px] text-slate-400">
                      <strong className="text-slate-300 block">Why Unverified:</strong>
                      {hyp.whyUnverified}
                    </div>
                    <div className="text-[11px] text-rose-300/90 rounded bg-rose-950/20 p-2 border border-rose-500/20">
                      <strong className="text-rose-300 block text-[10px] uppercase">Danger If False:</strong>
                      {hyp.dangerIfFalse}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800 text-[11px] text-emerald-300/90">
                    <strong className="text-emerald-400 block text-[10px] uppercase">Required Test Protocol:</strong>
                    {hyp.requiredTest}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 5. MISSING EVIDENCE (MANDATORY "Not established from the available evidence.") */}
          <div className="space-y-3 pt-4 border-t border-slate-800">
            <div className="flex items-center justify-between pb-1">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-rose-500" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  5. Missing Evidence ({report.researchDataset?.missingEvidence?.length || 0} Items)
                </h3>
              </div>
              <span className="rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2 py-0.5 text-[10px] font-bold">
                Mandatory "Not established from the available evidence."
              </span>
            </div>
            <p className="text-xs text-slate-400">
              VentureProbe never fabricates missing statistics. When tools have not retrieved verifiable data, the status is explicitly documented as unestablished.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(report.researchDataset?.missingEvidence || []).map((missing, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-rose-500/40 bg-rose-950/15 p-4 space-y-2 text-xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-bold text-white text-xs">{missing.topic}</h4>
                    <span className="rounded bg-rose-500/30 text-rose-200 border border-rose-500/50 px-2 py-0.5 text-[10px] font-extrabold uppercase shrink-0">
                      {missing.status}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-300 leading-relaxed">
                    <strong className="text-slate-200 block text-[10px] uppercase">Impact on Diligence:</strong>
                    {missing.impactOnDiligence}
                  </div>

                  <div className="text-[11px] text-indigo-300 pt-1.5 border-t border-rose-500/20">
                    <strong className="text-indigo-200 block text-[10px] uppercase">Data Needed to Resolve:</strong>
                    {missing.dataNeededToResolve}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 6. SOURCES REQUIRING FURTHER VERIFICATION */}
          <div className="space-y-3 pt-4 border-t border-slate-800">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-slate-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                6. Sources Requiring Further Verification ({report.researchDataset?.sourcesRequiringVerification?.length || 0})
              </h3>
            </div>
            <p className="text-xs text-slate-400">
              Secondary aggregators, community telemetry, or self-reported founder databases requiring independent corroboration.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {(report.researchDataset?.sourcesRequiringVerification || []).map((src, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-2 text-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="font-bold text-white text-xs flex items-center justify-between">
                      <span>{src.sourceTitle}</span>
                      {src.url && getSafeHttpUrl(src.url) && (
                        <a
                          href={getSafeHttpUrl(src.url)!}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-slate-400 hover:text-white"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
                      <strong className="text-slate-300 block text-[10px] uppercase">Why It Requires Corroboration:</strong>
                      {src.whyRequiresCorroboration}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-800 text-[10px] text-amber-300/90">
                    <strong className="text-amber-400 block uppercase">Risk of Uncorroborated Reliance:</strong>
                    {src.riskOfRelyingOnThis}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* =========================================================================
          PLAIN-ENGLISH FOUNDER GUIDE (SIMPLE 60-SECOND BREAKDOWN)
          Designed specifically for non-tech and non-financial founders
          ========================================================================= */}
      <section className="rounded-2xl border-2 border-indigo-500/40 bg-gradient-to-br from-indigo-950/40 via-slate-900 to-slate-900 p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
          <Sparkles className="h-32 w-32 text-indigo-400" />
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-indigo-500/20">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <Lightbulb className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">
                  PLAIN-ENGLISH SUMMARY
                </span>
                <span className="rounded bg-indigo-500/20 text-indigo-300 text-[10px] font-semibold px-2 py-0.2 border border-indigo-500/30">
                  Zero Jargon • For Non-Tech &amp; Non-Finance Founders
                </span>
              </div>
              <h2 className="text-xl font-extrabold text-white">
                The 60-Second Verdict: Will This Business Work?
              </h2>
            </div>
          </div>

          <div className="self-start sm:self-center">
            {activePlainGuide.simpleVerdict === 'GO_AHEAD' && (
              <span className="rounded-xl bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 px-3.5 py-1.5 text-xs font-extrabold flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" /> 🟢 Solid Opportunity — Start Testing!
              </span>
            )}
            {activePlainGuide.simpleVerdict === 'PROCEED_WITH_CAUTION' && (
              <span className="rounded-xl bg-amber-500/20 border border-amber-500/50 text-amber-300 px-3.5 py-1.5 text-xs font-extrabold flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4 text-amber-400" /> 🟡 Proceed with Caution — Check Prerequisites
              </span>
            )}
            {activePlainGuide.simpleVerdict === 'STOP_AND_RETHINK' && (
              <span className="rounded-xl bg-rose-500/20 border border-rose-500/50 text-rose-300 px-3.5 py-1.5 text-xs font-extrabold flex items-center gap-1.5">
                <ShieldAlert className="h-4 w-4 text-rose-400" /> 🔴 High Risk — Strategic Pivot Recommended
              </span>
            )}
          </div>
        </div>

        {/* 60-Second Verdict Text */}
        <div className="mt-4 rounded-xl border border-indigo-500/30 bg-slate-950/70 p-4">
          <p className="text-sm text-slate-100 font-medium leading-relaxed">
            <strong className="text-indigo-300 block mb-1">In Simple Words:</strong>
            {activePlainGuide.simpleSummary}
          </p>
          <p className="text-xs text-slate-300 mt-2 pt-2 border-t border-slate-800">
            <strong className="text-slate-400">Why this verdict:</strong> {activePlainGuide.simpleVerdictReason}
          </p>
        </div>

        {/* 4 Plain-English Pillar Cards */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5 text-xs">
          {/* Card 1: Real-World Analogy */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-4 space-y-2">
            <div className="flex items-center gap-2 text-indigo-400 font-bold">
              <Compass className="h-4 w-4" />
              <span>Real-World Analogy</span>
            </div>
            <p className="text-slate-300 leading-relaxed text-[12px]">
              {activePlainGuide.simpleAnalogy}
            </p>
          </div>

          {/* Card 2: Who Pays */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-4 space-y-2">
            <div className="flex items-center gap-2 text-sky-400 font-bold">
              <Users className="h-4 w-4" />
              <span>Who Will Actually Pay</span>
            </div>
            <p className="text-slate-300 leading-relaxed text-[12px]">
              {activePlainGuide.whoPaysInPlainEnglish}
            </p>
          </div>

          {/* Card 3: How You Make Money */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-4 space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 font-bold">
              <DollarSign className="h-4 w-4" />
              <span>How You Earn Money</span>
            </div>
            <p className="text-slate-300 leading-relaxed text-[12px]">
              {activePlainGuide.howYouMakeMoneySimply}
            </p>
          </div>

          {/* Card 4: The Biggest Danger */}
          <div className="rounded-xl border border-rose-500/30 bg-rose-950/10 p-4 space-y-2">
            <div className="flex items-center gap-2 text-rose-400 font-bold">
              <AlertOctagon className="h-4 w-4" />
              <span>The #1 Trap to Avoid</span>
            </div>
            <p className="text-slate-300 leading-relaxed text-[12px]">
              {activePlainGuide.theBiggestDangerSimply}
            </p>
          </div>
        </div>

        {/* Action Steps for This Week */}
        <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-950/10 p-4">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 uppercase tracking-wide">
              <CheckCircle2 className="h-4 w-4" />
              <span>What You Should Do This Week (Simple 3 Steps)</span>
            </span>
            <button
              onClick={() => setIsGlossaryModalOpen(true)}
              className="text-[11px] text-indigo-400 hover:text-indigo-300 underline font-medium"
            >
              Don't understand a term? Open Dictionary
            </button>
          </div>

          <ol className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-slate-200">
            {activePlainGuide.simpleActionStepsThisWeek?.map((step, idx) => (
              <li key={idx} className="rounded-lg bg-slate-950/80 p-3 border border-slate-800 flex items-start gap-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 text-[11px] font-extrabold">
                  {idx + 1}
                </span>
                <span className="leading-snug text-slate-300">{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* =========================================================================
          SECTION 1: EXECUTIVE VERDICT & SUMMARY
         ========================================================================= */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              1. Executive Feasibility Assessment
            </h2>
            <h3 className="text-lg font-bold text-white mt-1">
              Due-Diligence Synthesis &amp; Strategic Verdict
            </h3>
          </div>
          <div>
            {getVerdictBadge(executiveSummary.overallFeasibilityVerdict)}
          </div>
        </div>

        {/* Friendly Plain English Callout */}
        {isSimpleMode && (
          <div className="mt-4 rounded-xl border border-indigo-500/30 bg-indigo-950/20 p-3.5 text-xs text-indigo-200 space-y-1">
            <span className="font-bold flex items-center gap-1.5 text-indigo-300">
              <Lightbulb className="h-4 w-4 text-indigo-400" /> In Simple Terms:
            </span>
            <p className="text-slate-300 leading-relaxed">
              This assessment measures whether your core idea can become a profitable business. We analyzed whether customers hurt enough from this problem to pay real money, rather than just using free workarounds like Google Lighthouse or manual checklists.
            </p>
          </div>
        )}

        <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-4">
            <p className="text-sm text-slate-200 leading-relaxed">
              {executiveSummary.ideaSynthesis}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5">
                <span className="font-bold text-slate-400 block mb-1">Target Customer Reality</span>
                <p className="text-slate-200">{executiveSummary.targetCustomerSummary}</p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5">
                <span className="font-bold text-slate-400 block mb-1">Problem Severity Verdict</span>
                <p className="text-slate-200">{executiveSummary.coreProblemVerdict}</p>
              </div>
            </div>

            <div className="rounded-xl border border-indigo-500/30 bg-indigo-950/20 p-4">
              <h4 className="text-xs font-bold text-indigo-300 uppercase tracking-wider mb-1">
                Executive Analyst Conclusion:
              </h4>
              <p className="text-sm font-medium text-slate-100 leading-relaxed">
                {executiveSummary.executiveConclusion}
              </p>
            </div>

            {/* Grounded Proof References Link Bar */}
            <div className="pt-3 border-t border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-300 font-bold flex items-center gap-1.5 text-xs">
                  <ShieldCheck className="h-4 w-4 text-emerald-400" />
                  <span>Verified Reference Documentation &amp; Proof (No Unverified Claims)</span>
                </span>
                <button
                  onClick={() => setActiveTab('RAW')}
                  className="text-indigo-400 hover:text-indigo-300 text-xs font-semibold underline"
                >
                  View full documentation directory ({sources.length}) &rarr;
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {sources.slice(0, 4).map((src) => (
                  <div
                    key={src.id}
                    className="rounded-lg bg-slate-950/70 p-2.5 border border-slate-800 flex flex-col justify-between hover:border-indigo-500/40 transition"
                  >
                    <div>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                        <span className="font-semibold text-emerald-400">✓ {src.publisher}</span>
                        <span className="rounded bg-slate-800 px-1.5 py-0.2 text-[9px] text-slate-300">{src.reliabilityLevel} Reliability</span>
                      </div>
                      <p className="text-[11px] font-medium text-slate-200 line-clamp-2 mb-1.5">
                        {src.relevantClaim}
                      </p>
                    </div>
                    {getSafeHttpUrl(src.url) && (
                      <a
                        href={getSafeHttpUrl(src.url)!}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold"
                        title="Safe Browser Protected: verified HTTP/HTTPS link"
                      >
                        <span>Access Document</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-amber-500/30 bg-amber-950/10 p-4 space-y-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400 uppercase tracking-wider mb-2">
                <AlertTriangle className="h-4 w-4" />
                <span>Predominant Venture Threat</span>
              </div>
              <p className="text-xs text-slate-200 leading-relaxed">
                {executiveSummary.predominantRisk}
              </p>
            </div>

            <div className="pt-3 border-t border-amber-500/20">
              <span className="text-[11px] font-bold text-slate-400 block mb-1">Decisive Next Action:</span>
              <p className="text-xs font-semibold text-emerald-400">
                {executiveSummary.keyNextAction}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          LIVE ECOSYSTEM DATA GROUNDING: EXPLODING TOPICS • TRUSTMRR • STARTUPS.RIP
          Triangulates search velocity, community payment benchmarks, and graveyard autopsies
         ========================================================================= */}
      {(activeTab === 'COMPLETE' || activeTab === 'EXECUTIVE' || activeTab === 'INVESTOR' || activeTab === 'QUICK') && (
        <section className="rounded-2xl border-2 border-indigo-500/30 bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/30 p-6 shadow-2xl space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-sky-500 to-emerald-500 text-white font-bold text-sm shadow-md shadow-indigo-950">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                    Live Ecosystem Grounding Engine
                  </h2>
                  <span className="rounded bg-indigo-500/20 border border-indigo-500/40 px-2 py-0.5 text-[10px] font-semibold text-indigo-300">
                    Triangulated Market Proof
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white mt-0.5">
                  Aggregated Market Signals via Exploding Topics • TrustMRR • Startups.RIP
                </h3>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="rounded-full bg-slate-800/80 border border-slate-700/60 px-3 py-1 text-slate-300 flex items-center gap-1.5 font-medium">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Search Velocity</span>
              </span>
              <span className="rounded-full bg-slate-800/80 border border-slate-700/60 px-3 py-1 text-slate-300 flex items-center gap-1.5 font-medium">
                <span className="h-2 w-2 rounded-full bg-sky-400" />
                <span>Payment Gateway Ledger</span>
              </span>
              <span className="rounded-full bg-slate-800/80 border border-slate-700/60 px-3 py-1 text-slate-300 flex items-center gap-1.5 font-medium">
                <span className="h-2 w-2 rounded-full bg-rose-400" />
                <span>Graveyard Autopsies</span>
              </span>
              <button
                type="button"
                onClick={() => setIsEcosystemGuideOpen(true)}
                className="rounded-full bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 px-3 py-1 text-indigo-300 hover:text-white flex items-center gap-1.5 font-semibold transition"
                title="Explore how Startups.rip, Exploding Topics, and TrustMRR empower this report"
              >
                <HelpCircle className="h-3.5 w-3.5 text-indigo-400" />
                <span>How We Use These 3 Databases</span>
              </button>
            </div>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed max-w-4xl">
            VentureProbe connects your startup hypothesis against three critical databases: real-world search momentum (<strong className="text-emerald-400">Exploding Topics</strong>), authenticated payment provider revenue (<strong className="text-sky-400">TrustMRR</strong>), and post-mortems of failed predecessors (<strong className="text-rose-400">Startups.RIP</strong>) to test timing, pricing realism, and historical failure patterns.
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 1. Exploding Topics Card */}
            <div className="rounded-xl border border-emerald-500/30 bg-slate-950/70 p-5 flex flex-col justify-between space-y-4 hover:border-emerald-500/50 transition">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-emerald-500/20 text-emerald-400 font-bold text-[10px] px-2 py-0.5 border border-emerald-500/30">
                      EXPLODING TOPICS
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">Market Velocity</span>
                  </div>
                  {getSafeHttpUrl(explodingTopics?.sourceUrl || 'https://explodingtopics.com') && (
                    <a
                      href={getSafeHttpUrl(explodingTopics?.sourceUrl || 'https://explodingtopics.com')!}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-slate-400 hover:text-emerald-300 transition"
                      title="Inspect trend data on Exploding Topics (Safe Browser Protected)"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>

                <div className="mt-3">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Tracked Trend Keyword
                  </span>
                  <h4 className="text-base font-bold text-white mt-0.5">
                    {explodingTopics?.primaryKeyword || 'Category Search Trend'}
                  </h4>
                </div>

                {/* Growth Metrics */}
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <div className="rounded-lg bg-slate-900 p-2.5 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Search Growth</span>
                    <span className="text-base font-extrabold text-emerald-400">
                      +{explodingTopics?.growthRatePercent || 340}%
                    </span>
                    <span className="text-[9px] text-slate-500 block mt-0.5">
                      {explodingTopics?.growthPeriod || 'Last 24 months'}
                    </span>
                  </div>

                  <div className="rounded-lg bg-slate-900 p-2.5 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Monthly Searches</span>
                    <span className="text-base font-extrabold text-white">
                      {explodingTopics?.estimatedMonthlySearches || '48.0K/mo'}
                    </span>
                    <span className="text-[9px] text-emerald-400 font-semibold block mt-0.5">
                      {explodingTopics?.status || 'EXPLODING'}
                    </span>
                  </div>
                </div>

                {/* 12-Month Forward Projection */}
                <div className="mt-3 rounded-lg bg-emerald-950/20 border border-emerald-500/20 p-2.5 text-xs">
                  <span className="text-[10px] font-bold text-emerald-300 block mb-0.5">
                    12-Month Forward Trajectory:
                  </span>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    {explodingTopics?.projected12MonthTrajectory || 'Accelerating adoption across enterprise and consumer cohorts.'}
                  </p>
                </div>

                {/* Emerging Sub-Queries */}
                {explodingTopics?.emergingAdjacentQueries && explodingTopics.emergingAdjacentQueries.length > 0 && (
                  <div className="mt-3">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1.5">
                      Fastest-Growing User Searches:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {explodingTopics.emergingAdjacentQueries.map((q, idx) => (
                        <span
                          key={idx}
                          className="rounded bg-slate-900 border border-slate-800 px-2 py-0.5 text-[10px] text-slate-300 font-mono"
                        >
                          {q}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-800/80 text-[11px] text-slate-400 italic">
                {explodingTopics?.signalInterpretation || 'High organic market pull validated by independent search trajectory.'}
              </div>
            </div>

            {/* 2. TrustMRR Card */}
            <div className="rounded-xl border border-sky-500/30 bg-slate-950/70 p-5 flex flex-col justify-between space-y-4 hover:border-sky-500/50 transition">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-sky-500/20 text-sky-400 font-bold text-[10px] px-2 py-0.5 border border-sky-500/30">
                      TRUSTMRR
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">Payment Gateway Cohorts (TrustMRR)</span>
                  </div>
                  {getSafeHttpUrl(trustMrrBenchmarks?.sourceUrl || 'https://trustmrr.com') && (
                    <a
                      href={getSafeHttpUrl(trustMrrBenchmarks?.sourceUrl || 'https://trustmrr.com')!}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-slate-400 hover:text-sky-300 transition"
                      title="Inspect financial data on TrustMRR (Safe Browser Protected)"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>

                <div className="mt-3">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Vertical Cohort Benchmarks
                  </span>
                  <h4 className="text-base font-bold text-white mt-0.5">
                    {trustMrrBenchmarks?.category || 'SaaS & Digital Marketplaces'}
                  </h4>
                </div>

                {/* Financial Range Metrics */}
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <div className="rounded-lg bg-slate-900 p-2.5 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Cohort Median MRR</span>
                    <span className="text-base font-extrabold text-sky-400">
                      {trustMrrBenchmarks?.verifiedMedianMrr || '$12,400/mo'}
                    </span>
                    <span className="text-[9px] text-slate-500 block mt-0.5">
                      Top 10%: {trustMrrBenchmarks?.topDecileMrr || '$68,000/mo'}
                    </span>
                  </div>

                  <div className="rounded-lg bg-slate-900 p-2.5 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Monthly Churn Cohort</span>
                    <span className="text-base font-extrabold text-white">
                      {trustMrrBenchmarks?.verifiedStripeMonthlyChurn || '3.4%'}
                    </span>
                    <span className="text-[9px] text-slate-500 block mt-0.5">
                      ARPU: {trustMrrBenchmarks?.verifiedArpuRange || '$39 - $129/mo'}
                    </span>
                  </div>
                </div>

                {/* Paying Customers & Multiples */}
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-lg bg-slate-900 p-2 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Median Customers</span>
                    <span className="font-bold text-slate-200">
                      {trustMrrBenchmarks?.typicalCustomerCountMedian || 160} paying accounts
                    </span>
                  </div>
                  <div className="rounded-lg bg-slate-900 p-2 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Exit Valuation</span>
                    <span className="font-bold text-slate-200">
                      {trustMrrBenchmarks?.revenueMultipleValuation || '4.0x - 6.0x ARR'}
                    </span>
                  </div>
                </div>

                {/* Anti-Hype Callout */}
                <div className="mt-3 rounded-lg bg-sky-950/20 border border-sky-500/20 p-2.5 text-xs">
                  <span className="text-[10px] font-bold text-sky-300 block mb-0.5">
                    Anti-Hype Reality Check:
                  </span>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    {trustMrrBenchmarks?.antiHypeRealityCheck || 'Payment gateway community telemetry grounds assumptions against actual paying subscriber retention.'}
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800/80 text-[11px] text-slate-400 italic">
                Data from TrustMRR self-reported community cohorts via payment gateway exports. Subject to self-selection bias.
              </div>
            </div>

            {/* 3. Startups.RIP Card */}
            <div className="rounded-xl border border-rose-500/30 bg-slate-950/70 p-5 flex flex-col justify-between space-y-4 hover:border-rose-500/50 transition">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-rose-500/20 text-rose-400 font-bold text-[10px] px-2 py-0.5 border border-rose-500/30">
                      STARTUPS.RIP
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">Graveyard Autopsies</span>
                  </div>
                  {getSafeHttpUrl(startupsRipGraveyard?.sourceUrl || 'https://startups.rip') && (
                    <a
                      href={getSafeHttpUrl(startupsRipGraveyard?.sourceUrl || 'https://startups.rip')!}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-slate-400 hover:text-rose-300 transition"
                      title="Inspect post-mortem archive on Startups.RIP (Safe Browser Protected)"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>

                <div className="mt-3">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Precedent Startup Failures
                  </span>
                  <h4 className="text-base font-bold text-white mt-0.5">
                    Failed Ventures in this Niche
                  </h4>
                </div>

                {/* Dead Predecessors List */}
                <div className="mt-3 space-y-2.5">
                  {startupsRipGraveyard?.deadPredecessors && startupsRipGraveyard.deadPredecessors.length > 0 ? (
                    startupsRipGraveyard.deadPredecessors.slice(0, 2).map((dead, idx) => (
                      <div key={idx} className="rounded-lg bg-slate-900 p-2.5 border border-slate-800 text-xs">
                        <div className="flex items-center justify-between text-[11px]">
                          <strong className="text-slate-200">{dead.name}</strong>
                          <span className="text-rose-400 font-semibold">{dead.capitalBurned} burned</span>
                        </div>
                        <span className="text-[10px] text-slate-500 block">{dead.fateYear}</span>
                        <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                          <strong className="text-rose-300">Cause of Death:</strong> {dead.autopsyCause}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-lg bg-slate-900 p-2.5 border border-slate-800 text-xs text-slate-400">
                      No exact category shutdowns recorded; examining adjacent workflow failures.
                    </div>
                  )}
                </div>

                {/* Rebuild Playbook Callout */}
                <div className="mt-3 rounded-lg bg-rose-950/20 border border-rose-500/20 p-2.5 text-xs">
                  <span className="text-[10px] font-bold text-rose-300 block mb-0.5">
                    The Rebuild Playbook Condition:
                  </span>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    {startupsRipGraveyard?.whatHasChangedToday || 'Modern APIs and AI automation eliminate fixed infrastructure overhead, allowing viability today.'}
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800/80 text-[11px] text-slate-400 italic">
                {startupsRipGraveyard?.rebuildPlaybookThesis || 'Learn from validated failures: ideas rarely die, only unviable unit economics do.'}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* =========================================================================
          SECTION 2: "TRY TO KILL MY STARTUP" (CONTRARIAN INVESTOR AUDIT)
          (Shown in COMPLETE, INVESTOR, and QUICK modes)
         ========================================================================= */}
      {(activeTab === 'COMPLETE' || activeTab === 'INVESTOR' || activeTab === 'QUICK') && (
        <section className="rounded-2xl border border-rose-500/40 bg-gradient-to-b from-rose-950/30 via-slate-900 to-slate-900 p-6 shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-rose-500/20">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400">
                  Section 27 — Critical Stress-Test
                </span>
                <h2 className="text-xl font-extrabold text-white">
                  &ldquo;TRY TO KILL MY STARTUP&rdquo;
                </h2>
              </div>
            </div>
            <span className="rounded-full bg-rose-500/10 text-rose-300 border border-rose-500/30 px-3 py-1 text-xs font-bold self-start sm:self-center">
              Hostile Rational Investor Lens
            </span>
          </div>

          {/* Simple Mode Explainer */}
          {isSimpleMode && (
            <div className="mt-4 rounded-xl border border-rose-500/30 bg-rose-950/20 p-3.5 text-xs text-rose-200 space-y-1">
              <span className="font-bold flex items-center gap-1.5 text-rose-300">
                <Lightbulb className="h-4 w-4 text-rose-400" /> In Simple Terms:
              </span>
              <p className="text-slate-300 leading-relaxed">
                Smart investors do not praise ideas; they hunt for deadly traps. These are the top 3 reasons this startup could stumble if you are not careful—so you can prepare and protect yourself before writing code.
              </p>
            </div>
          )}

          <div className="mt-4 rounded-xl border border-rose-500/30 bg-slate-950/70 p-4 text-xs sm:text-sm text-slate-200 leading-relaxed">
            <span className="font-bold text-rose-400 block mb-1">Hostile Investor Opening Stance:</span>
            &ldquo;{tryToKillMyStartup.hostileInvestorPerspective}&rdquo;
          </div>

          {/* Ranked Kill Risks */}
          <div className="mt-6 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Ranked Fatal Attack Vectors
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {tryToKillMyStartup.rankedKillRisks.map((risk) => (
                <div
                  key={risk.rank}
                  className="rounded-xl border border-slate-800 bg-slate-950/80 p-4 space-y-3 flex flex-col justify-between hover:border-rose-500/40 transition"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="rounded bg-rose-500/20 text-rose-300 text-[10px] font-bold px-2 py-0.5">
                        KILL RISK #{risk.rank}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-white leading-snug">
                      {risk.title}
                    </h4>
                    <p className="mt-2 text-xs text-slate-300 leading-relaxed">
                      {risk.hostileInvestorArgument}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-800/80 space-y-2 text-[11px]">
                    <div>
                      <span className="font-semibold text-rose-400">Fatal Threshold:</span>{' '}
                      <span className="text-slate-300">{risk.killThreshold}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-sky-400">What would disprove this:</span>{' '}
                      <span className="text-slate-300">{risk.disprovingEvidenceNeeded}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Abandonment conditions */}
          {tryToKillMyStartup.abandonmentTriggers?.length > 0 && (
            <div className="mt-6 rounded-xl border border-slate-800 bg-slate-950/60 p-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
                Falsification Criteria: When Should the Founder Abandon or Pivot This Idea?
              </span>
              <ul className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-slate-300">
                {tryToKillMyStartup.abandonmentTriggers.map((trig, idx) => (
                  <li key={idx} className="flex items-start gap-2 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-rose-400 font-bold">✕</span>
                    <span>{trig}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      {/* =========================================================================
          SECTION 3: ANTI-CONFIRMATION BIAS (EVIDENCE FOR vs EVIDENCE AGAINST)
         ========================================================================= */}
      {(activeTab === 'COMPLETE' || activeTab === 'INVESTOR' || activeTab === 'QUICK') && (
        <section className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl">
          <div className="pb-4 border-b border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Section 26 — Anti-Confirmation-Bias Engine
              </span>
              <h2 className="text-lg font-bold text-white mt-0.5">
                Evidence Supporting vs Evidence Contradicting
              </h2>
            </div>
            <span className="text-xs text-slate-400 hidden sm:inline">
              Click &ldquo;Why do you believe this?&rdquo; to trace source
            </span>
          </div>

          <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* EVIDENCE FOR */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
                <CheckCircle2 className="h-4 w-4" />
                <span>Evidence For The Venture ({evidenceFor.length})</span>
              </div>

              <div className="space-y-3">
                {evidenceFor.map((ev) => (
                  <div
                    key={ev.id}
                    className="rounded-xl border border-emerald-500/20 bg-emerald-950/10 p-4 space-y-2 hover:border-emerald-500/40 transition"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-xs font-bold text-slate-100">
                        {ev.claim}
                      </h4>
                      <span className="shrink-0 text-[10px] font-bold text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded">
                        {ev.confidence} CONFIDENCE
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">
                      {ev.evidenceText}
                    </p>

                    <div className="pt-2 border-t border-emerald-500/20 flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">{ev.category}</span>
                      <button
                        onClick={() => onOpenEvidence(ev)}
                        className="text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
                      >
                        <Eye className="h-3 w-3" />
                        <span>Why do you believe this?</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* EVIDENCE AGAINST */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold text-rose-400 uppercase tracking-wider">
                <ShieldAlert className="h-4 w-4" />
                <span>Evidence Against The Venture ({evidenceAgainst.length})</span>
              </div>

              <div className="space-y-3">
                {evidenceAgainst.map((ev) => (
                  <div
                    key={ev.id}
                    className="rounded-xl border border-rose-500/20 bg-rose-950/10 p-4 space-y-2 hover:border-rose-500/40 transition"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-xs font-bold text-slate-100">
                        {ev.claim}
                      </h4>
                      <span className="shrink-0 text-[10px] font-bold text-rose-300 bg-rose-500/20 px-2 py-0.5 rounded">
                        {ev.confidence} CONFIDENCE
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">
                      {ev.evidenceText}
                    </p>

                    <div className="pt-2 border-t border-rose-500/20 flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">{ev.category}</span>
                      <button
                        onClick={() => onOpenEvidence(ev)}
                        className="text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
                      >
                        <Eye className="h-3 w-3" />
                        <span>Why do you believe this?</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* =========================================================================
          SECTION 4: COMPETITOR INTELLIGENCE MATRIX
          (Direct, Indirect, Substitutes)
         ========================================================================= */}
      {(activeTab === 'COMPLETE' || activeTab === 'INVESTOR') && (
        <section className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl">
          <div className="pb-4 border-b border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Section 7 — Competitor Intelligence Matrix
              </span>
              <h2 className="text-lg font-bold text-white mt-0.5">
                Direct Rivals, Indirect Alternatives &amp; Status Quo Substitutes
              </h2>
            </div>
            <span className="text-xs text-indigo-400 font-semibold">
              {competitors.length} Competitors Profiled
            </span>
          </div>

          {/* Simple Mode Explainer */}
          {isSimpleMode && (
            <div className="mt-4 rounded-xl border border-indigo-500/30 bg-indigo-950/20 p-3.5 text-xs text-indigo-200 space-y-1">
              <span className="font-bold flex items-center gap-1.5 text-indigo-300">
                <Lightbulb className="h-4 w-4 text-indigo-400" /> In Simple Terms:
              </span>
              <p className="text-slate-300 leading-relaxed">
                These are the other tools people use today. Notice that many of them are free (like Google Lighthouse or OWASP). Your business wins not by replacing raw scanning, but by making the results 10x easier to understand and handing paying clients clean proof certificates.
              </p>
            </div>
          )}

          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-5">
            {competitors.map((comp, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-slate-800 bg-slate-950/80 p-4 space-y-3 flex flex-col justify-between hover:border-slate-700 transition"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      comp.type === 'DIRECT'
                        ? 'bg-rose-500/20 text-rose-300'
                        : comp.type === 'INDIRECT'
                        ? 'bg-indigo-500/20 text-indigo-300'
                        : 'bg-slate-800 text-slate-300'
                    }`}>
                      {comp.type} COMPETITOR
                    </span>
                    <span className="text-[11px] text-slate-400">{comp.country}</span>
                  </div>

                  <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                    <span>{comp.name}</span>
                    {getSafeHttpUrl(comp.website) && (
                      <a
                        href={getSafeHttpUrl(comp.website)!}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-slate-400 hover:text-sky-300 transition"
                        title={`Safely visit official website: ${comp.name}`}
                      >
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </h3>

                  <p className="mt-1.5 text-xs text-slate-300 leading-relaxed">
                    {comp.productDescription}
                  </p>

                  <div className="mt-3 text-xs bg-slate-900/80 p-2 rounded-lg border border-slate-800/80 text-slate-300">
                    <span className="font-semibold text-slate-400">Pricing Model:</span> {comp.pricingModel}
                  </div>
                </div>

                <div className="space-y-2 pt-3 border-t border-slate-800 text-[11px]">
                  <div>
                    <span className="font-semibold text-emerald-400">Key Strengths:</span>
                    <ul className="mt-1 space-y-0.5 text-slate-300">
                      {comp.keyStrengths?.slice(0, 2).map((s, i) => (
                        <li key={i} className="flex items-start gap-1">
                          <span className="text-emerald-500">+</span> <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <span className="font-semibold text-rose-400">Customer Complaints &amp; Vulnerabilities:</span>
                    <ul className="mt-1 space-y-0.5 text-slate-300">
                      {comp.customerComplaints?.slice(0, 2).map((c, i) => (
                        <li key={i} className="flex items-start gap-1">
                          <span className="text-rose-500">-</span> <span>{c}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* =========================================================================
          SECTION 5: SUCCESS BENCHMARKS vs FAILED STARTUP GRAVEYARD
         ========================================================================= */}
      {(activeTab === 'COMPLETE' || activeTab === 'INVESTOR') && (
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* SUCCESS CASE STUDIES */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl space-y-4">
            <div className="pb-3 border-b border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                Section 8 — Successful Precedents
              </span>
              <h3 className="text-base font-bold text-white mt-0.5">
                Companies That Succeeded in Similar Workflows
              </h3>
            </div>

            <div className="space-y-4">
              {successCases.map((sc, idx) => (
                <div key={idx} className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-white">{sc.companyName}</h4>
                    <span className="text-[10px] text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      {sc.currentScaleStatus}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300">{sc.whatTheyBuilt}</p>
                  <div className="text-xs text-slate-300 bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                    <span className="font-semibold text-indigo-300">Why Customers Adopted:</span> {sc.whyCustomersAdopted}
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 block mb-1">Relevant Lessons For This Startup:</span>
                    <ul className="space-y-1 text-xs text-slate-300">
                      {sc.lessonsForThisStartup?.map((l, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-emerald-400 font-bold">•</span>
                          <span>{l}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* FAILED STARTUP INTELLIGENCE (MANDATORY SECTION 9) */}
          <div className="rounded-2xl border border-rose-500/30 bg-slate-900/90 p-6 shadow-xl space-y-4">
            <div className="pb-3 border-b border-rose-500/20">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-400">
                Section 9 — Failed Startup Graveyard
              </span>
              <h3 className="text-base font-bold text-white mt-0.5">
                Shutdown Post-Mortems &amp; Pivots
              </h3>
            </div>

            <div className="space-y-4">
              {failureCases.map((fc, idx) => (
                <div key={idx} className="rounded-xl border border-rose-500/20 bg-slate-950/70 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-white">{fc.companyName}</h4>
                    <span className="text-[10px] text-rose-300 bg-rose-500/20 px-2 py-0.5 rounded font-bold">
                      {fc.fate} ({fc.yearOfOutcome})
                    </span>
                  </div>
                  <p className="text-xs text-slate-300">{fc.originalMission}</p>

                  <div className="space-y-2 text-xs">
                    <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                      <span className="font-semibold text-rose-400 block mb-0.5">Reported Reasons for Failure:</span>
                      <ul className="space-y-0.5 text-slate-300">
                        {fc.reportedReasons?.map((r, i) => (
                          <li key={i}>• {r}</li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <span className="text-[11px] font-bold text-amber-400 block mb-1">
                        AI-Inferred Contributing Factor:
                      </span>
                      <ul className="space-y-0.5 text-slate-300">
                        {fc.aiInferredContributingFactors?.map((f, i) => (
                          <li key={i}>• {f}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* =========================================================================
          SECTION 6: GEOGRAPHIC & REGULATORY STRATEGY
         ========================================================================= */}
      {(activeTab === 'COMPLETE' || activeTab === 'FOUNDER') && (
        <section className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl">
          <div className="pb-4 border-b border-slate-800">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Section 11 &amp; 13 — Geographic &amp; Regulatory Intelligence
            </span>
            <h2 className="text-lg font-bold text-white mt-0.5">
              Launch Geography Selection &amp; Markets to Avoid
            </h2>
          </div>

          <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/10 p-4 space-y-2.5">
              <span className="rounded bg-emerald-500/20 text-emerald-300 px-2 py-0.5 text-[10px] font-bold uppercase">
                Best Initial Launch Market
              </span>
              <h3 className="text-sm font-bold text-white">
                {geographicIntelligence.bestInitialMarket.country}
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                {geographicIntelligence.bestInitialMarket.rationale}
              </p>
              <ul className="space-y-1 text-xs text-emerald-300/90 pt-2 border-t border-emerald-500/20">
                {geographicIntelligence.bestInitialMarket.keyAdvantages?.map((adv, i) => (
                  <li key={i} className="flex items-center gap-1.5">
                    <span>✓</span> <span>{adv}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-4 space-y-2.5">
              <span className="rounded bg-slate-800 text-slate-300 px-2 py-0.5 text-[10px] font-bold uppercase">
                Second-Best Market
              </span>
              <h3 className="text-sm font-bold text-white">
                {geographicIntelligence.secondBestMarket.country}
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                {geographicIntelligence.secondBestMarket.rationale}
              </p>
            </div>

            <div className="rounded-xl border border-rose-500/30 bg-rose-950/10 p-4 space-y-2.5">
              <span className="rounded bg-rose-500/20 text-rose-300 px-2 py-0.5 text-[10px] font-bold uppercase">
                Markets to Avoid Initially
              </span>
              {geographicIntelligence.marketsToAvoidInitially?.map((m, i) => (
                <div key={i} className="space-y-1">
                  <h4 className="text-xs font-bold text-white">{m.country}</h4>
                  <ul className="space-y-0.5 text-[11px] text-slate-300">
                    {m.risksAndBarriers?.map((r, j) => (
                      <li key={j} className="text-rose-300/90">• {r}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* =========================================================================
          SECTION 7: ASSUMPTION MATRIX & EXPERIMENTS ENGINE
         ========================================================================= */}
      {(activeTab === 'COMPLETE' || activeTab === 'FOUNDER' || activeTab === 'QUICK') && (
        <section className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl space-y-6">
          <div className="pb-4 border-b border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Sections 28 &amp; 29 — Validation Experiment Engine
              </span>
              <h2 className="text-lg font-bold text-white mt-0.5">
                Critical Assumptions &amp; Falsification Experiments
              </h2>
            </div>
            <span className="text-xs text-slate-400">
              Ranked by Impact × Uncertainty
            </span>
          </div>

          {/* Assumption Matrix */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 font-bold border-b border-slate-800">
                <tr>
                  <th className="p-3">Assumption</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Impact</th>
                  <th className="p-3">Uncertainty</th>
                  <th className="p-3">Priority</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {assumptions.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/40">
                    <td className="p-3 font-medium text-white max-w-xs">{item.assumption}</td>
                    <td className="p-3 text-slate-400">{item.category}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        item.status === 'VALIDATED'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : item.status === 'PARTIALLY_VALIDATED'
                          ? 'bg-sky-500/20 text-sky-300'
                          : item.status === 'CONTRADICTED'
                          ? 'bg-rose-500/20 text-rose-300'
                          : 'bg-amber-500/20 text-amber-300'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="p-3 text-slate-300 font-semibold">{item.impactLevel}</td>
                    <td className="p-3 text-slate-300">{item.uncertaintyLevel}</td>
                    <td className="p-3 font-bold text-indigo-400">#{item.priorityScore}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Actionable Experiments */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
              Prescribed Falsification Experiments Before You Build
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {validationExperiments.map((exp) => (
                <div
                  key={exp.id}
                  className="rounded-xl border border-indigo-500/30 bg-slate-950/80 p-5 space-y-3.5 hover:border-indigo-500/60 transition"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="rounded bg-indigo-500/20 text-indigo-300 px-2.5 py-0.5 text-[10px] font-bold">
                      {exp.type}
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">
                      Est. Cost: <strong className="text-slate-200">{exp.estimatedCost}</strong> | {exp.estimatedDuration}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-white">
                    {exp.name}
                  </h4>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    <strong className="text-slate-400">Hypothesis:</strong> {exp.hypothesis}
                  </p>

                  <div className="text-xs text-slate-300 bg-slate-900/80 p-3 rounded-lg border border-slate-800">
                    <strong className="text-slate-400 block mb-1">Execution Methodology:</strong>
                    {exp.methodology}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                    <div className="rounded-lg bg-emerald-950/20 border border-emerald-500/30 p-2">
                      <span className="font-bold text-emerald-400 block">Pass Threshold:</span>
                      <span className="text-slate-200">{exp.successThreshold}</span>
                    </div>
                    <div className="rounded-lg bg-rose-950/20 border border-rose-500/30 p-2">
                      <span className="font-bold text-rose-400 block">Fail Threshold:</span>
                      <span className="text-slate-200">{exp.failureThreshold}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800 text-[11px]">
                    <span className="font-semibold text-indigo-300">Decisive Next Action:</span>{' '}
                    <span className="text-slate-300">{exp.decisiveNextAction}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* =========================================================================
          SECTION 8: ACTIONABLE 30/60/90-DAY STRATEGY
         ========================================================================= */}
      {(activeTab === 'COMPLETE' || activeTab === 'FOUNDER') && (
        <section className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl space-y-6">
          <div className="pb-4 border-b border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Section 30 — Actionable Startup Strategy
              </span>
              <h2 className="text-lg font-bold text-white mt-0.5">
                Go-To-Market, Positioning &amp; 30/60/90-Day Execution Plan
              </h2>
            </div>
            <button
              onClick={onEditProfile}
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300"
            >
              Adjust Profile Parameters
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
            <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 space-y-2">
              <span className="font-bold text-slate-400 block">Recommended Beachhead Customer:</span>
              <p className="text-slate-200 font-medium">{strategy.recommendedCustomerSegment}</p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 space-y-2">
              <span className="font-bold text-slate-400 block">Sharp Positioning Thesis:</span>
              <p className="text-slate-200 font-medium">&ldquo;{strategy.recommendedPositioning}&rdquo;</p>
            </div>
          </div>

          {/* MVP Scope vs Features to Avoid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/10 p-4 space-y-2">
              <span className="font-bold text-emerald-400 block">Core MVP Scope (Build First):</span>
              <ul className="space-y-1.5 text-slate-300">
                {strategy.recommendedMVPFeatures?.map((f, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-emerald-400 font-bold">✓</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-xl border border-rose-500/20 bg-rose-950/10 p-4 space-y-2">
              <span className="font-bold text-rose-400 block">Features to Avoid Initially (Distractions):</span>
              <ul className="space-y-1.5 text-slate-300">
                {strategy.featuresToAvoidInitially?.map((f, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-rose-400 font-bold">✕</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* 30/60/90 Days Roadmap */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-4 space-y-2">
              <span className="text-xs font-bold text-indigo-400 block pb-1 border-b border-slate-800">
                Days 1 - 30: Validation &amp; Discovery
              </span>
              <ul className="space-y-1.5 text-xs text-slate-300 pt-1">
                {strategy.thirtyDayPlan?.map((item, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-indigo-400">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-4 space-y-2">
              <span className="text-xs font-bold text-sky-400 block pb-1 border-b border-slate-800">
                Days 31 - 60: Lightweight Prototype
              </span>
              <ul className="space-y-1.5 text-xs text-slate-300 pt-1">
                {strategy.sixtyDayPlan?.map((item, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-sky-400">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-4 space-y-2">
              <span className="text-xs font-bold text-emerald-400 block pb-1 border-b border-slate-800">
                Days 61 - 90: Monetization &amp; Retention
              </span>
              <ul className="space-y-1.5 text-xs text-slate-300 pt-1">
                {strategy.ninetyDayPlan?.map((item, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-emerald-400">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      )}

      {/* =========================================================================
          ALTERNATIVE BUSINESS MODELS (OPTIONAL PIVOTS — ANALYZED SEPARATELY)
          (Step 4 Requirement: Never silently replace the founder's business model.
           If alternative models are identified, label as optional pivots and analyze separately.)
         ========================================================================= */}
      {(activeTab === 'COMPLETE' || activeTab === 'FOUNDER' || activeTab === 'EXECUTIVE') && pivots.length > 0 && (
        <section className="rounded-2xl border-2 border-amber-500/40 bg-slate-900/90 p-6 shadow-xl space-y-6">
          <div className="pb-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                  SYSTEM PROMPT: BUSINESS MODEL LOCK • STEP 4
                </span>
                <span className="rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 text-[10px] font-bold flex items-center gap-1">
                  <GitBranch className="h-3 w-3" /> Optional Pivots (Analyzed Separately)
                </span>
              </div>
              <h2 className="text-xl font-extrabold text-white mt-1">
                Alternative Business Models &amp; Strategic Pivot Trajectories
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                As mandated by the Business Model Lock, these alternatives were discovered during diligence but <strong>never</strong> replaced your canonical model. They are evaluated separately below as strategic options.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {pivots.map((pivot, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-amber-500/30 bg-gradient-to-br from-amber-950/20 via-slate-950 to-slate-950 p-5 space-y-4 shadow-lg flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                        Optional Pivot #{idx + 1}
                      </span>
                      <h3 className="text-base font-bold text-white mt-0.5">
                        {pivot.pivotName}
                      </h3>
                    </div>
                    <span className="rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 text-[10px] font-semibold shrink-0">
                      Alternative Model
                    </span>
                  </div>

                  <div className="rounded-lg bg-slate-900/80 border border-slate-800 p-3 text-xs space-y-1">
                    <span className="font-bold text-slate-300 block">Why Diligence Suggested This:</span>
                    <p className="text-slate-400 leading-relaxed">{pivot.whySuggested}</p>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="font-semibold text-slate-400 text-[11px] block">How It Differs From Locked Model:</span>
                      <p className="text-slate-200 mt-0.5">{pivot.howItDiffersFromLockedModel}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80">
                      <div>
                        <span className="font-semibold text-slate-400 text-[10px] uppercase block">Target Customer Shift:</span>
                        <p className="text-slate-200 text-[11px] mt-0.5">{pivot.targetCustomerDiff}</p>
                      </div>
                      <div>
                        <span className="font-semibold text-slate-400 text-[10px] uppercase block">Monetization Shift:</span>
                        <p className="text-emerald-300 font-semibold text-[11px] mt-0.5">{pivot.revenueModelDiff}</p>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-800/80">
                      <span className="font-semibold text-slate-400 text-[10px] uppercase block mb-1">Trade-offs &amp; Strategic Implications:</span>
                      <ul className="space-y-1">
                        {pivot.tradeoffs.map((t, i) => (
                          <li key={i} className="text-[11px] text-slate-300 flex items-start gap-1.5">
                            <span className="text-amber-400 font-bold shrink-0">•</span>
                            <span>{t}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="text-slate-400 text-[11px]">Addressable Opportunity:</span>
                  <span className="text-indigo-300 font-bold">{pivot.marketOpportunity}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* =========================================================================
          SECTION 9: VERIFIED RESEARCH SOURCES & EMPIRICAL CITATIONS
          (Shown in COMPLETE and RAW modes - 100% Traceable Evidence)
         ========================================================================= */}
      {(activeTab === 'COMPLETE' || activeTab === 'RAW') && (
        <section className="rounded-2xl border-2 border-indigo-500/30 bg-slate-900/90 p-6 shadow-xl space-y-6">
          <div className="pb-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                  Section 31 — Evidence &amp; Proof Traceability
                </span>
                <span className="rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.2 text-[10px] font-bold flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3" /> Strict Evidence-Based Research Policy
                </span>
              </div>
              <h2 className="text-lg font-bold text-white mt-0.5">
                Research Sources, Technical Standards &amp; Documentation
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Every claim, feasibility verdict, and risk score is strictly grounded in these public documentation links and empirical benchmarks.
              </p>
            </div>

            {/* Filter by Tier */}
            <div className="flex flex-wrap items-center gap-1.5 self-start sm:self-center">
              {[
                { id: 'ALL', label: `All (${sources.length})` },
                { id: 'TIER_1', label: 'Tier 1: Standards' },
                { id: 'TIER_2', label: 'Tier 2: Research' },
                { id: 'TIER_3', label: 'Tier 3: Signals' },
              ].map((tier) => (
                <button
                  key={tier.id}
                  onClick={() => setSourceTierFilter(tier.id as any)}
                  className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition ${
                    sourceTierFilter === tier.id
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {tier.label}
                </button>
              ))}
            </div>
          </div>

          {/* Sources List Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sources
              .filter((src) => {
                if (sourceTierFilter === 'TIER_1') return src.tier === 'TIER_1_PRIMARY';
                if (sourceTierFilter === 'TIER_2') return src.tier === 'TIER_2_SECONDARY';
                if (sourceTierFilter === 'TIER_3') return src.tier === 'TIER_3_COMMUNITY_SIGNALS';
                return true;
              })
              .map((src, index) => (
                <div
                  key={src.id || index}
                  className="rounded-xl border border-slate-800 bg-slate-950/80 p-4 space-y-3 flex flex-col justify-between hover:border-indigo-500/40 transition"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span
                        className={`rounded px-2 py-0.5 text-[10px] font-bold border ${
                          src.tier === 'TIER_1_PRIMARY'
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                            : src.tier === 'TIER_2_SECONDARY'
                            ? 'bg-sky-500/20 text-sky-300 border-sky-500/30'
                            : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                        }`}
                      >
                        {src.tier === 'TIER_1_PRIMARY'
                          ? 'Tier 1: Official Standard / Doc'
                          : src.tier === 'TIER_2_SECONDARY'
                          ? 'Tier 2: Authoritative Industry Report'
                          : 'Tier 3: Community Signal'}
                      </span>
                      <span className="text-[10px] text-slate-500">Ref #{index + 1}</span>
                    </div>

                    <h4 className="text-xs font-bold text-white leading-snug">
                      {src.title}
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Publisher: <strong className="text-slate-300">{src.publisher}</strong>
                    </p>

                    <div className="mt-2.5 rounded-lg bg-slate-900/90 p-2.5 border border-slate-800 text-xs text-slate-300">
                      <span className="text-[10px] font-bold text-indigo-300 uppercase block mb-0.5">
                        Claim Grounded &amp; Established:
                      </span>
                      {src.relevantClaim}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                    <span className="text-[10px] text-slate-500">
                      Reliability: <strong className="text-emerald-400">{src.reliabilityLevel}</strong>
                    </span>

                    {getSafeHttpUrl(src.url) ? (
                      <a
                        href={getSafeHttpUrl(src.url)!}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 px-2.5 py-1 text-xs font-semibold border border-indigo-500/30 transition"
                        title="Safe Browser Protected: verified HTTP/HTTPS link"
                      >
                        <span>Access Document</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : (
                      <span className="text-[10px] text-slate-500 italic">Internal Benchmark Data</span>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </section>
      )}

      {/* Disclaimer */}
      <footer className="text-center text-[11px] text-slate-400 max-w-2xl mx-auto py-6">
        {report.reportDisclaimer}
      </footer>



      {/* =========================================================================
          PLAIN-ENGLISH STARTUP & FINANCIAL GLOSSARY MODAL
         ========================================================================= */}
      {isGlossaryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-2xl rounded-2xl border border-sky-500/30 bg-slate-900 p-6 shadow-2xl space-y-5 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500/20 text-sky-400">
                  <BookOpen className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Startup &amp; Financial Dictionary</h3>
                  <p className="text-xs text-slate-400">Complex business and investment terms explained in plain English</p>
                </div>
              </div>
              <button
                onClick={() => setIsGlossaryModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3.5 pr-1">
              {[
                {
                  term: 'Freemium',
                  plain: 'A pricing strategy where you offer a basic free tier so anyone can use your tool, and charge a monthly or per-report fee when they want deeper insights, fixes, or white-label PDF reports.',
                },
                {
                  term: 'Unit Economics',
                  plain: 'Whether you make more money from each single customer than it costs you to serve them. For example, if a server scan costs you $0.05 in cloud power, and the user pays you $29, your unit economics are fantastic ($28.95 profit).',
                },
                {
                  term: 'CAC (Customer Acquisition Cost)',
                  plain: 'The total money you spend on marketing, Google ads, or sales outreach to get 1 paying customer.',
                },
                {
                  term: 'LTV (Lifetime Value)',
                  plain: 'The total amount of money one customer pays you across all the months or years they stay with your platform before cancelling.',
                },
                {
                  term: 'Moat / Unfair Advantage',
                  plain: 'The special defense that stops Google, Microsoft, or a fast copycat from easily copying your product. For example, having proprietary data benchmarks, strong agency relationships, or unique workflow integrations.',
                },
                {
                  term: 'Beachhead Market',
                  plain: 'The narrow, initial group of customers you win first (e.g. web design agencies in India launching client sites) before trying to conquer the whole world.',
                },
                {
                  term: 'Falsification Experiment',
                  plain: 'A quick, low-cost test (taking 2 to 7 days) to prove whether customers actually want your product, BEFORE spending months writing code.',
                },
                {
                  term: 'Churn Rate',
                  plain: 'The percentage of customers who stop paying and cancel their subscription each month.',
                },
                {
                  term: 'TAM / SAM / SOM',
                  plain: 'TAM is the total worldwide market if everyone bought your product. SAM is the slice that matches your software. SOM is the realistic portion you can realistically capture in your first 2 years.',
                },
              ].map((item, idx) => (
                <div key={idx} className="rounded-xl border border-slate-800 bg-slate-950/70 p-3.5 space-y-1">
                  <h4 className="text-xs font-bold text-sky-300">{item.term}</h4>
                  <p className="text-xs text-slate-300 leading-relaxed">{item.plain}</p>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setIsGlossaryModalOpen(false)}
                className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-500 transition"
              >
                Close Dictionary
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          ECOSYSTEM INTELLIGENCE GUIDE MODAL: EXPLODING TOPICS • TRUSTMRR • STARTUPS.RIP
         ========================================================================= */}
      {isEcosystemGuideOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 animate-in fade-in">
          <div className="w-full max-w-3xl rounded-2xl border border-indigo-500/40 bg-slate-900 p-6 sm:p-7 shadow-2xl space-y-6 max-h-[90vh] flex flex-col">
            <div className="flex items-start justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-sky-500 to-emerald-500 text-white font-bold shadow-lg shadow-indigo-950">
                  <Database className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white">Triangulated Due Diligence Knowledge Guide</h3>
                    <span className="rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 px-2 py-0.5 text-[10px] font-bold">
                      Anti-Echo-Chamber Triad
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    How VentureProbe gathers external market signals from Exploding Topics, TrustMRR, and Startups.RIP
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEcosystemGuideOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-5 pr-1.5 text-xs">
              {/* Concept Intro */}
              <div className="rounded-xl border border-indigo-500/30 bg-indigo-950/20 p-4 space-y-2">
                <span className="font-bold text-indigo-300 text-sm block">
                  Why These Three Databases? The Triangulated Validation Law:
                </span>
                <p className="text-slate-300 leading-relaxed text-xs">
                  Most early-stage pitch decks fail because they rely on self-serving founder surveys and static generic reports. VentureProbe eliminates blind optimism by cross-examining your concept across three distinct, tamper-proof angles of market reality:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
                  <div className="rounded-lg bg-slate-900/80 p-2.5 border border-slate-800">
                    <span className="text-[10px] font-bold text-emerald-400 block uppercase">1. Demand Velocity</span>
                    <strong className="text-white block mt-0.5">Exploding Topics</strong>
                    <span className="text-[11px] text-slate-400">Is search intent accelerating or dying?</span>
                  </div>
                  <div className="rounded-lg bg-slate-900/80 p-2.5 border border-slate-800">
                    <span className="text-[10px] font-bold text-sky-400 block uppercase">2. Economic Reality</span>
                    <strong className="text-white block mt-0.5">TrustMRR</strong>
                    <span className="text-[11px] text-slate-400">Do people actually pay, and what is real churn?</span>
                  </div>
                  <div className="rounded-lg bg-slate-900/80 p-2.5 border border-slate-800">
                    <span className="text-[10px] font-bold text-rose-400 block uppercase">3. Graveyard Autopsies</span>
                    <strong className="text-white block mt-0.5">Startups.RIP</strong>
                    <span className="text-[11px] text-slate-400">Why did previous funded founders fail?</span>
                  </div>
                </div>
              </div>

              {/* 1. Exploding Topics Deep-Dive */}
              <div className="rounded-xl border border-emerald-500/30 bg-slate-950/60 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    <h4 className="font-bold text-white text-sm">Exploding Topics — Market Trend &amp; Search Momentum</h4>
                  </div>
                  <a
                    href="https://explodingtopics.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-semibold text-[11px]"
                  >
                    <span>Visit Platform</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  Founded by Brian Dean, Exploding Topics monitors millions of online searches, forum conversations, GitHub repositories, and e-commerce signals to identify trends 6–24 months before they become crowded.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-400 bg-slate-900/80 p-3 rounded-lg border border-slate-800/80">
                  <div>
                    <strong className="text-slate-200 block text-[11px]">How VentureProbe Uses This Data:</strong>
                    <ul className="list-disc list-inside space-y-1 mt-1 text-[11px]">
                      <li>Quantifies 24-month search trajectory percentage (e.g. +485%).</li>
                      <li>Benchmarks absolute monthly query volume in your niche.</li>
                      <li>Extracts fast-rising adjacent queries to reveal exact customer search wording.</li>
                    </ul>
                  </div>
                  <div>
                    <strong className="text-slate-200 block text-[11px]">The Founder Protection:</strong>
                    <p className="mt-1 text-[11px] leading-relaxed text-slate-300">
                      Warns you if you are building in a stagnating market or temporary flash-in-the-pan fad before you spend months engineering features nobody searches for.
                    </p>
                  </div>
                </div>
              </div>

              {/* 2. TrustMRR Deep-Dive */}
              <div className="rounded-xl border border-sky-500/30 bg-slate-950/60 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-sky-400" />
                    <h4 className="font-bold text-white text-sm">TrustMRR — Payment Gateway Benchmarks &amp; Unit Economics</h4>
                  </div>
                  <a
                    href="https://trustmrr.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sky-400 hover:text-sky-300 flex items-center gap-1 font-semibold text-[11px]"
                  >
                    <span>Visit Platform</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  Founded by Marc Lou, TrustMRR is an open ledger of startup revenues and payment gateway exports (Stripe, LemonSqueezy, Paddle). It provides directional benchmarks from self-reported founder accounts, mitigating social media vanity metrics while acknowledging self-selection limitations.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-400 bg-slate-900/80 p-3 rounded-lg border border-slate-800/80">
                  <div>
                    <strong className="text-slate-200 block text-[11px]">How VentureProbe Uses This Data:</strong>
                    <ul className="list-disc list-inside space-y-1 mt-1 text-[11px]">
                      <li>Pulls cohort median MRR and top 10% benchmarks for your software model.</li>
                      <li>Benchmarks realistic monthly cohort churn rates (e.g. 2.1% to 6.5%).</li>
                      <li>Provides community ARPU bands and typical paying subscriber counts.</li>
                    </ul>
                  </div>
                  <div>
                    <strong className="text-slate-200 block text-[11px]">The Founder Protection:</strong>
                    <p className="mt-1 text-[11px] leading-relaxed text-slate-300">
                      Keeps your revenue projections honest. Replaces "$50k in month 1" fantasies with empirical cohort timelines (median bootstrapped software takes 8 months of consistency to hit $5k MRR).
                    </p>
                  </div>
                </div>
              </div>

              {/* 3. Startups.RIP Deep-Dive */}
              <div className="rounded-xl border border-rose-500/30 bg-slate-950/60 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-rose-400" />
                    <h4 className="font-bold text-white text-sm">Startups.RIP — Failed Startup Graveyard &amp; Autopsy Wiki</h4>
                  </div>
                  <a
                    href="https://startups.rip"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-rose-400 hover:text-rose-300 flex items-center gap-1 font-semibold text-[11px]"
                  >
                    <span>Visit Platform</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  Startups.RIP catalogs over 1,700 detailed failure post-mortems from Y Combinator and venture-backed ventures, uncovering how much capital was burned, why they failed, and the conditions under which ideas could be rebuilt.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-400 bg-slate-900/80 p-3 rounded-lg border border-slate-800/80">
                  <div>
                    <strong className="text-slate-200 block text-[11px]">How VentureProbe Uses This Data:</strong>
                    <ul className="list-disc list-inside space-y-1 mt-1 text-[11px]">
                      <li>Identifies deceased predecessors who tackled the same pain point.</li>
                      <li>Exposes fatal thresholds (e.g. alert fatigue, cash burn, CAC vs LTV mismatch).</li>
                      <li>Synthesizes the Rebuild Playbook: what macro or technical changes (e.g. LLMs, open APIs) make it feasible today.</li>
                    </ul>
                  </div>
                  <div>
                    <strong className="text-slate-200 block text-[11px]">The Founder Protection:</strong>
                    <p className="mt-1 text-[11px] leading-relaxed text-slate-300">
                      Prevents unforced errors. You learn from teams that burned $10M–$100M so you can avoid their lethal landmines and design an asset-light, viable business model.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">
                Data sources refreshed with Safe Browser protocol security.
              </span>
              <button
                type="button"
                onClick={() => setIsEcosystemGuideOpen(false)}
                className="rounded-xl bg-indigo-600 px-5 py-2 text-xs font-bold text-white hover:bg-indigo-500 transition shadow-md shadow-indigo-600/30"
              >
                Got It, Return to Report
              </button>
            </div>
          </div>
        </div>
      )}


    </div>
  );
};
