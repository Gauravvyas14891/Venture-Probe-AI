import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  Layers,
  FileText,
  Loader2,
  Lock,
  ShieldCheck,
  Check,
  ChevronDown,
  ChevronUp,
  Search,
  Quote,
} from 'lucide-react';
import {
  InterviewMessage,
  ReadinessGate,
  StartupProfile,
  ClarityStatus,
  ExtractedStartupProfile,
} from '../types';

interface InterviewViewProps {
  messages: InterviewMessage[];
  readiness: ReadinessGate;
  currentProfile: StartupProfile;
  extractedProfile?: ExtractedStartupProfile;
  originalIdea?: string;
  interviewStatus?: 'extracting' | 'interviewing' | 'ready_for_review' | 'confirmed' | 'researching';
  isLoading: boolean;
  onSendMessage: (msg: string) => void;
  onProceedToReview: () => void;
}

export const InterviewView: React.FC<InterviewViewProps> = ({
  messages,
  readiness,
  currentProfile,
  extractedProfile,
  originalIdea,
  interviewStatus = 'interviewing',
  isLoading,
  onSendMessage,
  onProceedToReview,
}) => {
  const [inputText, setInputText] = useState('');
  const [sidebarTab, setSidebarTab] = useState<'EXTRACTED_23' | 'LOCK_AND_GATES'>('EXTRACTED_23');
  const [expandedField, setExpandedField] = useState<string | null>(null);
  const [fieldSearch, setFieldSearch] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim() && !isLoading) {
      onSendMessage(inputText.trim());
      setInputText('');
    }
  };

  const getClarityBadge = (status: ClarityStatus) => {
    switch (status) {
      case 'COMPLETE':
        return (
          <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
            <CheckCircle2 className="h-3 w-3" /> Complete
          </span>
        );
      case 'PARTIAL':
        return (
          <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
            <AlertCircle className="h-3 w-3" /> Partial
          </span>
        );
      case 'MISSING':
      default:
        return (
          <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
            <HelpCircle className="h-3 w-3" /> Missing / Unknown
          </span>
        );
    }
  };

  const checkpoints = [
    { key: 'ideaClarity', label: 'Idea Concept', status: readiness.ideaClarity },
    { key: 'customerClarity', label: 'Target Customer', status: readiness.customerClarity },
    { key: 'problemClarity', label: 'Problem Severity', status: readiness.problemClarity },
    { key: 'geographyClarity', label: 'Launch Geography', status: readiness.geographyClarity },
    { key: 'solutionClarity', label: 'Solution Features', status: readiness.solutionClarity },
    { key: 'businessModelClarity', label: 'Business Model', status: readiness.businessModelClarity },
    { key: 'competitionClarity', label: 'Competitors', status: readiness.competitionClarity },
    { key: 'differentiationClarity', label: 'Differentiation / Moat', status: readiness.differentiationClarity },
  ];

  const completedCount = checkpoints.filter((c) => c.status === 'COMPLETE').length;
  // Per Rule F: Stop when the idea is sufficiently understood (or ready for review)
  const isSufficientlyUnderstood = readiness.isReady || completedCount >= 5 || interviewStatus === 'ready_for_review';

  const latestMessage = messages[messages.length - 1];
  const dynamicSuggested = latestMessage?.suggestedAnswers || [];

  // Standard skip/undecided options (Rule D)
  const standardOptions = [
    "I haven't decided yet",
    "I don't know",
    "Skip this question",
  ];

  // Combined options without duplicates
  const allSuggestedOptions = Array.from(new Set([...dynamicSuggested, ...standardOptions])).slice(0, 6);

  // Extracted fields array
  const extractedList = extractedProfile ? Object.values(extractedProfile) : [];
  const explicitCount = extractedList.filter((f) => f.status === 'explicit').length;

  const filteredExtractedList = extractedList.filter((f) => {
    if (!fieldSearch) return true;
    const q = fieldSearch.toLowerCase();
    return (
      f.label.toLowerCase().includes(q) ||
      (typeof f.value === 'string' && f.value.toLowerCase().includes(q)) ||
      (f.evidence && f.evidence.toLowerCase().includes(q))
    );
  });

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
      {/* Top Banner explaining Stage & Extraction State */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-xl border border-slate-800 bg-slate-900/60 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 font-bold text-sm">
            02
          </div>
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              AI Startup Due-Diligence Analyst
              <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] text-emerald-300 font-medium border border-emerald-500/30">
                {explicitCount}/23 Dimensions Extracted
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              The AI automatically extracts all explicit information from your original idea before asking questions. It never asks for what is already stated.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end md:self-center">
          <button
            onClick={() => onProceedToReview()}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition ${
              isSufficientlyUnderstood
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 hover:bg-emerald-500 cursor-pointer animate-pulse'
                : 'bg-indigo-600/80 text-white hover:bg-indigo-600 cursor-pointer'
            }`}
            title="Review verified parameters and launch deep research"
          >
            <FileText className="h-3.5 w-3.5" />
            <span>
              {isSufficientlyUnderstood
                ? 'Proceed to Profile Gate (Ready ✓)'
                : 'Proceed to Profile Review'}
            </span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Extraction Active Notice if in extracting state */}
      {interviewStatus === 'extracting' && (
        <div className="mb-6 rounded-xl border border-indigo-500/40 bg-indigo-950/40 p-4 animate-pulse flex items-center gap-3">
          <Loader2 className="h-5 w-5 text-indigo-400 animate-spin" />
          <div className="text-xs">
            <span className="font-bold text-indigo-300 block">Intelligent Information Extraction in Progress</span>
            <span className="text-slate-300">Analyzing complete startup description across 23 dimensions, extracting evidence, and evaluating question relevance...</span>
          </div>
        </div>
      )}

      {/* 8 Checkpoints Visual Mini-Tracker */}
      <div className="mb-6 rounded-xl border border-slate-800 bg-slate-950/60 p-3">
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="font-bold text-slate-300 uppercase tracking-wider text-[11px]">
            Validation Checkpoints Status ({completedCount} of 8 Complete)
          </span>
          <span className={`font-bold ${completedCount >= 5 ? 'text-emerald-400' : 'text-amber-400'}`}>
            {completedCount >= 6 ? 'Sufficiently Understood ✓' : `${8 - completedCount} Checkpoint(s) Pending`}
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
          {checkpoints.map((cp, idx) => (
            <div
              key={cp.key}
              className={`rounded-lg p-2 text-center border transition-all ${
                cp.status === 'COMPLETE'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : cp.status === 'PARTIAL'
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                  : 'bg-slate-900 border-slate-800 text-slate-400'
              }`}
            >
              <div className="text-[10px] font-bold text-slate-400">#{idx + 1}</div>
              <div className="text-[11px] font-semibold truncate">{cp.label}</div>
              <div className="text-[9px] mt-0.5 font-bold">
                {cp.status === 'COMPLETE' ? '✓ Done' : cp.status === 'PARTIAL' ? '⏳ Partial' : '🔒 Pending'}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Chat Stream (7 cols) */}
        <div className="lg:col-span-7 flex flex-col h-[700px] rounded-2xl border border-slate-800 bg-slate-900/80 shadow-xl overflow-hidden">
          {/* Header */}
          <div className="border-b border-slate-800 px-5 py-3.5 flex items-center justify-between bg-slate-950/40">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-semibold text-slate-200">Senior Venture Analyst</span>
            </div>
            <div className="text-[11px] text-slate-400">
              Venture: <span className="text-indigo-300 font-medium">{currentProfile.startupName}</span>
            </div>
          </div>

          {/* Messages list */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="h-8 w-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center shrink-0 text-indigo-400 text-xs font-bold">
                    VP
                  </div>
                )}
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-indigo-600 text-white rounded-tr-none'
                      : 'bg-slate-800/90 text-slate-200 border border-slate-700/60 rounded-tl-none whitespace-pre-line'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-3 items-center text-slate-400 text-xs py-2">
                <div className="h-8 w-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center shrink-0 text-indigo-400">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
                <div className="rounded-2xl px-4 py-2.5 bg-slate-800/60 border border-slate-700/50 flex items-center gap-2">
                  <span className="animate-pulse">Validating question relevance against extracted evidence...</span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Quick response buttons: contextual + standard (Rule D) */}
          {allSuggestedOptions.length > 0 && !isLoading && (
            <div className="px-5 py-2.5 bg-slate-950/70 border-t border-slate-800/80 flex flex-wrap gap-1.5 items-center">
              <span className="text-[10px] font-semibold text-slate-400 flex items-center gap-1 mr-1">
                <Sparkles className="h-3 w-3 text-indigo-400" /> Quick replies:
              </span>
              {allSuggestedOptions.map((opt, i) => {
                const isSkip = opt.includes("haven't decided") || opt.includes("don't know") || opt.includes("Skip");
                return (
                  <button
                    key={i}
                    onClick={() => onSendMessage(opt)}
                    className={`rounded-lg px-2.5 py-1 text-xs text-left transition ${
                      isSkip
                        ? 'bg-slate-800/60 text-slate-400 border border-slate-700 hover:bg-slate-700 hover:text-slate-200'
                        : 'bg-indigo-950/40 text-indigo-200 border border-indigo-500/30 hover:bg-indigo-900/50 hover:border-indigo-500/50'
                    }`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          )}

          {/* Chat input */}
          <form onSubmit={handleSend} className="p-3.5 bg-slate-950/80 border-t border-slate-800 flex items-center gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={isLoading}
              placeholder="Answer the question, provide new facts, or type 'I don't know'..."
              className="flex-1 rounded-xl bg-slate-900 border border-slate-700 px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || isLoading}
              className="flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>

        {/* Sidebar: 23-Dimension Extracted Intelligence Feed (5 cols) */}
        <div className="lg:col-span-5 flex flex-col h-[700px] rounded-2xl border border-slate-800 bg-slate-900/90 shadow-xl overflow-hidden">
          {/* Tab Selector */}
          <div className="grid grid-cols-2 border-b border-slate-800 bg-slate-950/60 text-xs font-semibold">
            <button
              onClick={() => setSidebarTab('EXTRACTED_23')}
              className={`py-3 px-3 flex items-center justify-center gap-1.5 transition ${
                sidebarTab === 'EXTRACTED_23'
                  ? 'border-b-2 border-indigo-500 text-indigo-300 bg-slate-900/40 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              <span>23-Dimension Profile</span>
            </button>
            <button
              onClick={() => setSidebarTab('LOCK_AND_GATES')}
              className={`py-3 px-3 flex items-center justify-center gap-1.5 transition ${
                sidebarTab === 'LOCK_AND_GATES'
                  ? 'border-b-2 border-indigo-500 text-indigo-300 bg-slate-900/40 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Lock className="h-3.5 w-3.5 text-indigo-400" />
              <span>Identity Lock</span>
            </button>
          </div>

          {/* Tab 1: 23-Dimension Extracted Intelligence Feed */}
          {sidebarTab === 'EXTRACTED_23' && (
            <div className="flex-1 flex flex-col overflow-hidden p-4">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-xs">
                <span className="font-bold text-slate-300">
                  Extracted Intelligence ({explicitCount}/23 Explicit)
                </span>
                <span className="text-[10px] text-emerald-400 font-semibold">
                  Rule A Enforced: No Repetitive Questions
                </span>
              </div>

              {/* Search filter */}
              <div className="relative mb-3">
                <Search className="h-3.5 w-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter 23 dimensions..."
                  value={fieldSearch}
                  onChange={(e) => setFieldSearch(e.target.value)}
                  className="w-full rounded-lg bg-slate-950 border border-slate-800 pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Scrollable list of 23 dimensions */}
              <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                {filteredExtractedList.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-6">No matching dimensions found.</p>
                ) : (
                  filteredExtractedList.map((f) => {
                    const isExpanded = expandedField === f.field_name;
                    return (
                      <div
                        key={f.field_name}
                        className={`rounded-xl border p-2.5 text-xs transition ${
                          f.status === 'explicit'
                            ? 'bg-slate-950/70 border-emerald-500/30'
                            : f.status === 'inferred'
                            ? 'bg-slate-950/60 border-amber-500/30'
                            : f.status === 'ambiguous'
                            ? 'bg-slate-950/60 border-rose-500/30'
                            : 'bg-slate-950/40 border-slate-800 text-slate-400'
                        }`}
                      >
                        <div
                          className="flex items-center justify-between cursor-pointer"
                          onClick={() => setExpandedField(isExpanded ? null : f.field_name)}
                        >
                          <div className="flex items-center gap-1.5 truncate">
                            <span className="font-semibold text-slate-200 truncate">{f.label}</span>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {f.status === 'explicit' && (
                              <span className="rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.2 text-[9px] font-bold">
                                ✓ Explicit
                              </span>
                            )}
                            {f.status === 'inferred' && (
                              <span className="rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.2 text-[9px] font-bold">
                                ~ Inferred
                              </span>
                            )}
                            {f.status === 'ambiguous' && (
                              <span className="rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 px-1.5 py-0.2 text-[9px] font-bold">
                                ⚠ Conflict
                              </span>
                            )}
                            {f.status === 'missing' && (
                              <span className="rounded-full bg-slate-800 text-slate-400 px-1.5 py-0.2 text-[9px] font-semibold">
                                {f.user_skipped ? 'Skipped' : 'Missing'}
                              </span>
                            )}
                            {isExpanded ? (
                              <ChevronUp className="h-3 w-3 text-slate-500" />
                            ) : (
                              <ChevronDown className="h-3 w-3 text-slate-500" />
                            )}
                          </div>
                        </div>

                        {f.value && (
                          <p className="mt-1 text-slate-300 text-[11px] line-clamp-2">
                            {typeof f.value === 'string' ? f.value : JSON.stringify(f.value)}
                          </p>
                        )}

                        {isExpanded && (
                          <div className="mt-2 pt-2 border-t border-slate-800/80 space-y-1.5 text-[10px]">
                            {f.evidence ? (
                              <div className="bg-slate-900 p-2 rounded border border-slate-800 text-slate-300">
                                <span className="font-bold text-slate-400 block mb-0.5">Supporting Quote:</span>
                                <Quote className="h-3 w-3 text-indigo-400 inline mr-1" />
                                <em>"{f.evidence}"</em>
                              </div>
                            ) : (
                              <p className="text-slate-500">No explicit quote was detected in the submitted idea.</p>
                            )}

                            {f.explanation && (
                              <p className="text-amber-300">
                                <strong>Note:</strong> {f.explanation}
                              </p>
                            )}
                            <div className="flex justify-between text-slate-500 pt-1">
                              <span>Source: {f.source}</span>
                              <span>Confidence: {Math.round(f.confidence * 100)}%</span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* Tab 2: Canonical Identity Lock & Research Readiness Gate */}
          {sidebarTab === 'LOCK_AND_GATES' && (
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {currentProfile.businessIdentityLock && (
                <div className="rounded-xl border border-indigo-500/30 bg-slate-950/60 p-4">
                  <div className="flex items-center justify-between pb-2 border-b border-indigo-500/20 text-xs font-bold text-indigo-300">
                    <span>Canonical Identity Lock</span>
                    <span className="text-[10px] text-emerald-400">Locked ✓</span>
                  </div>
                  <div className="mt-2.5 space-y-2 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">Venture Name:</span>
                      <p className="text-slate-200 font-semibold">{currentProfile.businessIdentityLock.canonicalProductName}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">Target Customer:</span>
                      <p className="text-slate-200">{currentProfile.businessIdentityLock.primaryPayingCustomer}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">Revenue Model:</span>
                      <p className="text-slate-200">{currentProfile.businessIdentityLock.statedRevenueModel}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs font-bold text-slate-200">
                  <span>Readiness Gate</span>
                  <span className="text-emerald-400">{readiness.readinessScore}%</span>
                </div>
                <div className="mt-3 w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-300"
                    style={{ width: `${Math.max(readiness.readinessScore, 10)}%` }}
                  />
                </div>
                <div className="mt-3 space-y-1.5">
                  {checkpoints.map((cp) => (
                    <div key={cp.key} className="flex items-center justify-between text-[11px] py-1 border-b border-slate-800/60">
                      <span className="text-slate-300">{cp.label}</span>
                      {getClarityBadge(cp.status)}
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => onProceedToReview()}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg transition"
              >
                Proceed to Profile Review
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
