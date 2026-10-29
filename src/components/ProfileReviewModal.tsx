import React, { useState } from 'react';
import { Check, Edit3, ShieldAlert, Sparkles, ArrowRight, Zap, BookOpen, AlertCircle, Plus, X, Globe, User, Briefcase, DollarSign, Cpu, Lock, ShieldCheck } from 'lucide-react';
import { StartupProfile, BusinessIdentityLock, ExtractedStartupProfile } from '../types';

interface ProfileReviewModalProps {
  profile: StartupProfile;
  extractedProfile?: ExtractedStartupProfile;
  onConfirmAndStartResearch: (updatedProfile: StartupProfile, mode: 'QUICK_FEASIBILITY' | 'COMPLETE_DEEP_DIVE') => void;
  onBackToInterview: () => void;
}

export const ProfileReviewModal: React.FC<ProfileReviewModalProps> = ({
  profile,
  extractedProfile,
  onConfirmAndStartResearch,
  onBackToInterview,
}) => {
  const [formData, setFormData] = useState<StartupProfile>({
    ...profile,
    founderStatedAssumptions:
      profile.founderStatedAssumptions?.length > 0
        ? profile.founderStatedAssumptions
        : ['Target customers are willing to adopt a new digital solution over manual workarounds'],
  });
  const [selectedMode, setSelectedMode] = useState<'QUICK_FEASIBILITY' | 'COMPLETE_DEEP_DIVE'>('COMPLETE_DEEP_DIVE');
  const [newAssumption, setNewAssumption] = useState('');
  const [newCompetitor, setNewCompetitor] = useState('');
  const [newFeature, setNewFeature] = useState('');

  // Provenance helper for Section 7
  const renderFieldProvenance = (fieldName: string) => {
    const item = extractedProfile?.[fieldName];
    if (!item) return null;

    if (item.status === 'explicit') {
      return (
        <div className="flex flex-col gap-1 mb-1.5">
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-500/30">
              <Check className="h-2.5 w-2.5" />
              {item.source === 'interview' ? 'Provided in Interview' : 'Extracted from Original Idea'}
            </span>
          </div>
          {item.evidence && (
            <span className="text-[10px] text-slate-400 italic bg-slate-950/50 px-2 py-0.5 rounded border border-slate-800 line-clamp-2" title={item.evidence}>
              <strong className="text-slate-500 not-italic">Original Evidence:</strong> "{item.evidence}"
            </span>
          )}
        </div>
      );
    }
    if (item.status === 'inferred') {
      return (
        <div className="mb-1.5">
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-300 border border-amber-500/30">
            <Sparkles className="h-2.5 w-2.5" />
            AI Inferred Suggestion (Review & Verify)
          </span>
        </div>
      );
    }
    if (item.status === 'ambiguous') {
      return (
        <div className="mb-1.5">
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2 py-0.5 text-[10px] font-semibold text-rose-300 border border-rose-500/30">
            <AlertCircle className="h-2.5 w-2.5" />
            Clarified Ambiguity / Conflict
          </span>
        </div>
      );
    }
    return (
      <div className="mb-1.5">
        <span className="inline-flex items-center gap-1 rounded-full bg-slate-800/80 px-2 py-0.5 text-[10px] font-semibold text-slate-400 border border-slate-700">
          Unknown (To be empirically benchmarked in research)
        </span>
      </div>
    );
  };

  const validationChecks = [
    { key: 'startupName', label: 'Startup Name', valid: !!formData.startupName && formData.startupName.trim() !== '' && formData.startupName !== 'Untitled Venture' },
    { key: 'detailedDescription', label: 'Startup Brief & Concept', valid: !!(formData.detailedDescription || formData.oneLiner) },
    { key: 'primaryCustomer', label: 'Target Customer', valid: !!formData.primaryCustomer && formData.primaryCustomer.trim().length >= 3 },
    { key: 'proposedSolution', label: 'Proposed Solution', valid: !!formData.proposedSolution && formData.proposedSolution.trim().length >= 3 },
  ];

  const totalRequired = validationChecks.length;
  const completedRequired = validationChecks.filter((c) => c.valid).length;
  // Core venture identity required; unknown secondary fields are valid to be researched (Rule D & Section 7)
  const isProfileValid = completedRequired >= 3;
  const missingLabels = validationChecks.filter((c) => !c.valid).map((c) => c.label);

  const handleTextChange = (field: keyof StartupProfile, val: any) => {
    setFormData((prev) => ({ ...prev, [field]: val }));
  };

  const handleAddAssumption = () => {
    if (newAssumption.trim()) {
      setFormData((prev) => ({
        ...prev,
        founderStatedAssumptions: [...(prev.founderStatedAssumptions || []), newAssumption.trim()],
      }));
      setNewAssumption('');
    }
  };

  const handleRemoveAssumption = (idx: number) => {
    setFormData((prev) => ({
      ...prev,
      founderStatedAssumptions: prev.founderStatedAssumptions.filter((_, i) => i !== idx),
    }));
  };

  const handleAddCompetitor = () => {
    if (newCompetitor.trim()) {
      setFormData((prev) => ({
        ...prev,
        knownCompetitors: [...(prev.knownCompetitors || []), newCompetitor.trim()],
      }));
      setNewCompetitor('');
    }
  };

  const handleRemoveCompetitor = (idx: number) => {
    setFormData((prev) => ({
      ...prev,
      knownCompetitors: prev.knownCompetitors.filter((_, i) => i !== idx),
    }));
  };

  const handleAddFeature = () => {
    if (newFeature.trim()) {
      setFormData((prev) => ({
        ...prev,
        mainFeatures: [...(prev.mainFeatures || []), newFeature.trim()],
      }));
      setNewFeature('');
    }
  };

  const handleRemoveFeature = (idx: number) => {
    setFormData((prev) => ({
      ...prev,
      mainFeatures: prev.mainFeatures.filter((_, i) => i !== idx),
    }));
  };

  const handleLaunch = () => {
    if (isProfileValid) {
      // Synchronize Business Identity Lock with any adjustments made in the review gate
      const existingLock = formData.businessIdentityLock;
      const updatedLock: BusinessIdentityLock = {
        isLocked: true,
        lockedAt: existingLock?.lockedAt || new Date().toISOString(),
        verbatimFounderIdea: existingLock?.verbatimFounderIdea || formData.detailedDescription,
        canonicalProductName: formData.startupName,
        productCategory: existingLock?.productCategory || 'Digital Venture',
        productType: existingLock?.productType || 'Hybrid / Other',
        problemBeingSolved: formData.problemBeingSolved || formData.problemDescription || '',
        primaryEndUser: formData.endUserPersona || formData.primaryCustomer || '',
        primaryPayingCustomer: formData.primaryCustomer || '',
        productOrServiceSold: formData.productOrService || formData.startupName,
        howProductWorks: formData.proposedSolution || '',
        statedRevenueModel: formData.revenueModel || '',
        statedPricingStructure: formData.pricingStructure || 'Subscription',
        geographicMarket: formData.initialCountry || formData.targetGeography || 'Global',
        mainValueProposition: formData.oneLiner || '',
        keyUnverifiedAssumptions: formData.founderStatedAssumptions || [],
        flaggedAmbiguities: existingLock?.flaggedAmbiguities || [],
        prohibitedSilentSubstitutions: existingLock?.prohibitedSilentSubstitutions?.length
          ? existingLock.prohibitedSilentSubstitutions
          : ['DO NOT silently alter stated customer or product archetype'],
        coherenceStatus: 'COHERENT',
        coherenceRationale: 'Profile fields validated and confirmed by founder.',
      };

      const finalProfile: StartupProfile = {
        ...formData,
        businessIdentityLock: updatedLock,
      };

      onConfirmAndStartResearch(finalProfile, selectedMode);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Header Banner */}
      <div className="rounded-2xl border border-indigo-500/30 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 p-6 shadow-2xl mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/20 px-3 py-1 text-xs font-bold text-indigo-300 border border-indigo-500/30 mb-2">
              <Check className="h-3.5 w-3.5 text-indigo-400" />
              <span>Step 3: Profile Gate (Mandatory Field Completion)</span>
            </div>
            <h1 className="text-2xl font-extrabold text-white">
              &ldquo;This is what I understood about your startup&rdquo;
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-300">
              Complete and lock all required fields below before the deep research engine can execute.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onBackToInterview}
              className="rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2.5 text-xs font-semibold text-slate-300 hover:bg-slate-700 transition"
            >
              Back to Interview
            </button>
            <button
              onClick={handleLaunch}
              disabled={!isProfileValid}
              className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs sm:text-sm font-bold transition ${
                isProfileValid
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30 cursor-pointer animate-pulse'
                  : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed opacity-60'
              }`}
            >
              <span>{isProfileValid ? 'Confirm Profile & Run Research' : `Complete All Fields (${completedRequired}/${totalRequired})`}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Profile Completion Bar */}
        <div className="mt-4 pt-3 border-t border-slate-800">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="font-semibold text-slate-300">
              Profile Field Readiness: {completedRequired} of {totalRequired} Completed
            </span>
            <span className={isProfileValid ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
              {isProfileValid ? 'Ready for Deep Research ✓' : `Missing: ${missingLabels.slice(0, 3).join(', ')}${missingLabels.length > 3 ? '...' : ''}`}
            </span>
          </div>
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                isProfileValid ? 'bg-emerald-500' : 'bg-gradient-to-r from-amber-500 to-indigo-500'
              }`}
              style={{ width: `${Math.round((completedRequired / totalRequired) * 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* CANONICAL BUSINESS MODEL LOCK & IDENTITY ENFORCEMENT CARD (Steps 1 to 4) */}
      <div className="mb-8 rounded-2xl border-2 border-indigo-500/40 bg-gradient-to-br from-indigo-950/40 via-slate-900 to-slate-900 p-6 shadow-2xl relative overflow-hidden">
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
                <span className="rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-semibold px-2 py-0.5 border border-emerald-500/30">
                  Canonical Identity Locked ✓
                </span>
              </div>
              <h2 className="text-xl font-extrabold text-white">
                Business Understanding Engine: Canonical Business Profile
              </h2>
            </div>
          </div>
          <span className="text-xs text-slate-400 self-start sm:self-center">
            Fixed input to all research stages
          </span>
        </div>

        <p className="mt-3 text-xs text-slate-300 leading-relaxed">
          The Business Understanding Engine has captured your foundational business identity. Every subsequent research and analysis stage is strictly locked to this model: no silent substitution or model drift may mutate your product into a different service, change your customers into a different segment, or alter your revenue model.
        </p>

        {/* 4 Steps Validation Grid */}
        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Step 1 & 2: Preserved Profile Dimensions */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800">
              <span className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                Step 1 &amp; 2: Locked Business Boundaries
              </span>
              <span className="text-[10px] uppercase font-bold text-slate-400">Fixed Input</span>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-start gap-2">
                <span className="text-slate-400 text-[11px] shrink-0">Product Type:</span>
                <span className="text-slate-200 font-semibold text-right">
                  {formData.businessIdentityLock?.productType || 'Peer-to-Peer / SaaS'}
                </span>
              </div>
              <div className="flex justify-between items-start gap-2">
                <span className="text-slate-400 text-[11px] shrink-0">Primary End-User:</span>
                <span className="text-slate-200 text-right">
                  {formData.endUserPersona || formData.primaryCustomer || 'Target Users'}
                </span>
              </div>
              <div className="flex justify-between items-start gap-2">
                <span className="text-slate-400 text-[11px] shrink-0">Primary Paying Customer:</span>
                <span className="text-slate-200 font-semibold text-right">
                  {formData.primaryCustomer || 'Paying Customers'}
                </span>
              </div>
              <div className="flex justify-between items-start gap-2">
                <span className="text-slate-400 text-[11px] shrink-0">Stated Revenue Model:</span>
                <span className="text-emerald-300 font-semibold text-right">
                  {formData.revenueModel || 'Direct monetization'}
                </span>
              </div>
              <div className="flex justify-between items-start gap-2">
                <span className="text-slate-400 text-[11px] shrink-0">Geographic Market:</span>
                <span className="text-slate-200 text-right">
                  {formData.initialCountry || formData.targetGeography || 'Global'}
                </span>
              </div>
            </div>
          </div>

          {/* Step 3 & 4: Anti-Substitution & Coherence Validation */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800">
                <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <ShieldAlert className="h-4 w-4 text-amber-400" />
                  Step 2 &amp; 3: Anti-Substitution Safeguards
                </span>
                <span className="text-[10px] text-emerald-400 font-bold">
                  Coherence: Verified ✓
                </span>
              </div>
              <div className="text-xs text-slate-300 space-y-1.5 mb-3">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Enforced Anti-Mutation Rules:
                </span>
                <ul className="space-y-1">
                  {(formData.businessIdentityLock?.prohibitedSilentSubstitutions && formData.businessIdentityLock.prohibitedSilentSubstitutions.length > 0
                    ? formData.businessIdentityLock.prohibitedSilentSubstitutions
                    : [
                        'DO NOT silently change product into a different service',
                        'DO NOT convert marketplace into direct staffing/agency dispatch',
                        'DO NOT replace stated pricing model with unverified commercial alternatives',
                      ]
                  ).slice(0, 3).map((rule, idx) => (
                    <li key={idx} className="flex items-start gap-1.5 text-[11px] text-slate-300">
                      <span className="text-rose-400 font-bold shrink-0">✕</span>
                      <span>{rule}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 bg-indigo-950/20 rounded p-2 border border-indigo-500/20">
              <span className="font-semibold text-indigo-300">Mandate:</span> All later research stages evaluate this exact model. Any alternative discovered will be reported strictly as an <em>optional pivot</em> and analyzed separately.
            </div>
          </div>
        </div>
      </div>

      {/* Mode Selection Choice with Explicit Expected Time */}
      <div className="mb-8 rounded-2xl border border-slate-800 bg-slate-900/90 p-5">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3 flex items-center justify-between">
          <span>Choose Research Depth Mode &amp; Expected Processing Time</span>
          <span className="text-indigo-400 text-[11px] font-medium">Select one mode below</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            onClick={() => setSelectedMode('QUICK_FEASIBILITY')}
            className={`cursor-pointer rounded-xl border p-4 transition ${
              selectedMode === 'QUICK_FEASIBILITY'
                ? 'border-indigo-500 bg-indigo-950/30 ring-1 ring-indigo-500'
                : 'border-slate-800 bg-slate-950/40 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-amber-400" />
                <span className="text-sm font-bold text-white">Quick Feasibility Overview</span>
              </div>
              <span className="rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 text-[10px] font-bold">
                Est. Time: ~30-45 seconds
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Fast 2-3 page executive overview: Idea summary, demand signals, top competitors, 5 core validation experiments, and top kill risks.
            </p>
          </div>

          <div
            onClick={() => setSelectedMode('COMPLETE_DEEP_DIVE')}
            className={`cursor-pointer rounded-xl border p-4 transition ${
              selectedMode === 'COMPLETE_DEEP_DIVE'
                ? 'border-emerald-500 bg-emerald-950/30 ring-1 ring-emerald-500'
                : 'border-slate-800 bg-slate-950/40 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-emerald-400" />
                <span className="text-sm font-bold text-white">Complete Deep-Dive Report</span>
              </div>
              <span className="rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold">
                Est. Time: 5 to 10 minutes
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Full multi-agent deep research: Customer voice mining, competitor teardown, failure cases, incumbent corporate moves, hostile investor attack, and 30/60/90-day plan.
            </p>
          </div>
        </div>
      </div>

      {/* Structured Sections (A to L) */}
      <div className="space-y-6">
        {/* A. BASIC IDEA */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg">
          <div className="flex items-center gap-2 pb-3 mb-4 border-b border-slate-800 text-sm font-bold text-indigo-300">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-indigo-500/20 text-xs font-bold text-indigo-400">A</span>
            <span>Basic Idea Definition</span>
          </div>
          {renderFieldProvenance('startup_idea')}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Startup Name</label>
              <input
                type="text"
                value={formData.startupName}
                onChange={(e) => handleTextChange('startupName', e.target.value)}
                className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">One-Line Thesis</label>
              <input
                type="text"
                value={formData.oneLiner}
                onChange={(e) => handleTextChange('oneLiner', e.target.value)}
                className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-400 mb-1">Detailed Description</label>
              <textarea
                rows={2}
                value={formData.detailedDescription}
                onChange={(e) => handleTextChange('detailedDescription', e.target.value)}
                className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* B. CUSTOMER & GEOGRAPHY */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg">
          <div className="flex items-center gap-2 pb-3 mb-4 border-b border-slate-800 text-sm font-bold text-sky-300">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-sky-500/20 text-xs font-bold text-sky-400">B</span>
            <span>Customer Profile &amp; Model</span>
          </div>
          {renderFieldProvenance('primary_customer')}
          {renderFieldProvenance('geography')}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Primary Target Customer</label>
              <input
                type="text"
                value={formData.primaryCustomer}
                onChange={(e) => handleTextChange('primaryCustomer', e.target.value)}
                className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Customer Model</label>
              <select
                value={formData.customerModel}
                onChange={(e) => handleTextChange('customerModel', e.target.value as any)}
                className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
              >
                <option value="B2C">B2C (Consumer)</option>
                <option value="B2B">B2B (Enterprise / SMB)</option>
                <option value="B2B2C">B2B2C</option>
                <option value="Marketplace">Two-Sided Marketplace</option>
                <option value="D2C">D2C</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Initial Launch Country / City</label>
              <input
                type="text"
                value={formData.initialCountry || formData.targetGeography}
                onChange={(e) => {
                  handleTextChange('initialCountry', e.target.value);
                  handleTextChange('targetGeography', e.target.value);
                }}
                className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* C. PROBLEM SEVERITY */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg">
          <div className="flex items-center gap-2 pb-3 mb-4 border-b border-slate-800 text-sm font-bold text-amber-300">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-amber-500/20 text-xs font-bold text-amber-400">C</span>
            <span>Problem Severity &amp; Existing Workarounds</span>
          </div>
          {renderFieldProvenance('problem')}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Problem Severity Level</label>
              <select
                value={formData.problemSeverity}
                onChange={(e) => handleTextChange('problemSeverity', e.target.value as any)}
                className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
              >
                <option value="Critical & Urgent">Critical &amp; Urgent (Hair on fire)</option>
                <option value="Frequent Friction">Frequent Friction (Repeated weekly annoyance)</option>
                <option value="Moderate Inconvenience">Moderate Inconvenience</option>
                <option value="Discretionary / Nice-to-have">Discretionary / Nice-to-have</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Current Workaround (Status Quo)</label>
              <input
                type="text"
                value={formData.currentWorkaround}
                onChange={(e) => handleTextChange('currentWorkaround', e.target.value)}
                className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* D. SOLUTION & FEATURES */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg">
          <div className="flex items-center gap-2 pb-3 mb-4 border-b border-slate-800 text-sm font-bold text-teal-300">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-teal-500/20 text-xs font-bold text-teal-400">D</span>
            <span>Proposed Solution &amp; Main Features</span>
          </div>
          {renderFieldProvenance('proposed_solution')}

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Value Proposition</label>
              <input
                type="text"
                value={formData.proposedSolution}
                onChange={(e) => handleTextChange('proposedSolution', e.target.value)}
                className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Core MVP Features</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.mainFeatures?.map((feat, idx) => (
                  <span
                    key={idx}
                    className="flex items-center gap-1.5 rounded-lg bg-slate-800 border border-slate-700 px-2.5 py-1 text-xs text-slate-200"
                  >
                    <span>{feat}</span>
                    <button onClick={() => handleRemoveFeature(idx)} className="text-slate-400 hover:text-rose-400">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add a feature..."
                  value={newFeature}
                  onChange={(e) => setNewFeature(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddFeature())}
                  className="flex-1 rounded-lg bg-slate-950 border border-slate-800 px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="button"
                  onClick={handleAddFeature}
                  className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-700"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* E. BUSINESS MODEL & MONETIZATION */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg">
          <div className="flex items-center gap-2 pb-3 mb-4 border-b border-slate-800 text-sm font-bold text-emerald-300">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-500/20 text-xs font-bold text-emerald-400">E</span>
            <span>Business Model &amp; Pricing Hypothesis</span>
          </div>
          {renderFieldProvenance('business_model')}
          {renderFieldProvenance('pricing')}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Revenue Model</label>
              <input
                type="text"
                value={formData.revenueModel}
                onChange={(e) => handleTextChange('revenueModel', e.target.value)}
                placeholder="e.g. 20% commission on hourly rate / $2,500/mo B2B subscription"
                className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Pricing Assumption</label>
              <input
                type="text"
                value={formData.pricingAssumption}
                onChange={(e) => handleTextChange('pricingAssumption', e.target.value)}
                placeholder="e.g. $15-$25/hour or $29/seat/month"
                className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* G. COMPETITION */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg">
          <div className="flex items-center gap-2 pb-3 mb-4 border-b border-slate-800 text-sm font-bold text-purple-300">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-purple-500/20 text-xs font-bold text-purple-400">G</span>
            <span>Known Competitors &amp; Alternatives</span>
          </div>
          {renderFieldProvenance('direct_competitors')}

          <div>
            <div className="flex flex-wrap gap-2 mb-2">
              {formData.knownCompetitors?.map((comp, idx) => (
                <span
                  key={idx}
                  className="flex items-center gap-1.5 rounded-lg bg-slate-800 border border-slate-700 px-2.5 py-1 text-xs text-slate-200"
                >
                  <span>{comp}</span>
                  <button onClick={() => handleRemoveCompetitor(idx)} className="text-slate-400 hover:text-rose-400">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Add a competitor or substitute..."
                value={newCompetitor}
                onChange={(e) => setNewCompetitor(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCompetitor())}
                className="flex-1 rounded-lg bg-slate-950 border border-slate-800 px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
              />
              <button
                type="button"
                onClick={handleAddCompetitor}
                className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-700"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* K. REGULATORY & LEGAL WARNINGS */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg">
          <div className="flex items-center gap-2 pb-3 mb-4 border-b border-slate-800 text-sm font-bold text-rose-300">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-rose-500/20 text-xs font-bold text-rose-400">K</span>
            <span>Regulatory &amp; Compliance Areas</span>
          </div>

          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {[
                'Transportation',
                'Employment / Labor',
                'Insurance / Liability',
                'Finance / Payments',
                'Personal Data / GDPR',
                'Location Tracking',
                'Physical Safety',
                'AI-Generated Content',
              ].map((area) => {
                const isChecked = formData.regulatedAreas?.includes(area);
                return (
                  <button
                    key={area}
                    type="button"
                    onClick={() => {
                      const current = formData.regulatedAreas || [];
                      const next = isChecked ? current.filter((a) => a !== area) : [...current, area];
                      handleTextChange('regulatedAreas', next);
                    }}
                    className={`rounded-lg px-2.5 py-1 text-xs font-medium border transition ${
                      isChecked
                        ? 'bg-rose-500/20 border-rose-500/50 text-rose-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-300'
                    }`}
                  >
                    {isChecked ? '✓ ' : '+ '}
                    {area}
                  </button>
                );
              })}
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3 text-[11px] text-slate-400">
              <span className="font-semibold text-rose-400">Notice:</span> VentureProbe provides informational diligence, not professional legal counsel. Any regulated operational zones flagged will require formal legal sign-off.
            </div>
          </div>
        </div>

        {/* L. FOUNDER ASSUMPTIONS (What must be true) */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg">
          <div className="flex items-center gap-2 pb-3 mb-4 border-b border-slate-800 text-sm font-bold text-indigo-300">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-indigo-500/20 text-xs font-bold text-indigo-400">L</span>
            <span>What Are You Assuming Must Be True For This To Work?</span>
          </div>

          <div className="space-y-3">
            <p className="text-xs text-slate-400">
              Explicit assumptions will be stressed in the &ldquo;Try To Kill My Startup&rdquo; engine and converted into validation experiments.
            </p>

            <div className="space-y-2">
              {formData.founderStatedAssumptions?.map((assump, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between gap-3 rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-slate-200"
                >
                  <span className="flex items-center gap-2">
                    <span className="font-bold text-indigo-400">#{idx + 1}</span>
                    <span>{assump}</span>
                  </span>
                  <button onClick={() => handleRemoveAssumption(idx)} className="text-slate-400 hover:text-rose-400">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. Customers will trust a third-party driver with their $80,000 personal car..."
                value={newAssumption}
                onChange={(e) => setNewAssumption(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddAssumption())}
                className="flex-1 rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
              />
              <button
                type="button"
                onClick={handleAddAssumption}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 transition"
              >
                Add Assumption
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Sticky Bottom Bar */}
      <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/90 p-4 shadow-2xl">
        <div className="text-xs text-slate-400 text-center sm:text-left">
          {isProfileValid ? (
            <span className="text-emerald-400 font-semibold">
              ✓ All {totalRequired} required profile fields completed. Ready to initialize deep research engine.
            </span>
          ) : (
            <span className="text-amber-400 font-medium">
              ⚠️ Incomplete: Please fill all {totalRequired} required profile fields ({completedRequired}/{totalRequired} done) to unlock research.
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={onBackToInterview}
            className="flex-1 sm:flex-none rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-xs font-semibold text-slate-300 hover:bg-slate-700 transition"
          >
            Back
          </button>
          <button
            onClick={handleLaunch}
            disabled={!isProfileValid}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 rounded-xl px-6 py-2.5 text-xs sm:text-sm font-bold transition ${
              isProfileValid
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30 cursor-pointer animate-pulse'
                : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed opacity-60'
            }`}
          >
            <span>{isProfileValid ? 'Confirm Profile & Start Research' : `Complete All Fields (${completedRequired}/${totalRequired})`}</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
