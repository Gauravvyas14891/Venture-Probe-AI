import React from 'react';
import { ShieldCheck, Compass, Sparkles, BookOpen, RotateCcw, AlertTriangle } from 'lucide-react';

interface NavbarProps {
  currentStep: 'landing' | 'interview' | 'review' | 'researching' | 'report';
  onReset: () => void;
  hasActiveReport: boolean;
  onViewReport?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentStep,
  onReset,
  hasActiveReport,
  onViewReport,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={onReset}>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 via-indigo-600 to-sky-600 shadow-md shadow-indigo-950/50">
            <Compass className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold tracking-tight text-white">VentureProbe</span>
              <span className="rounded bg-indigo-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-400 border border-indigo-500/30">
                INTELLIGENCE
              </span>
            </div>
            <p className="text-[11px] font-medium text-slate-400 hidden sm:block">
              Ideas are cheap. Evidence is valuable.
            </p>
          </div>
        </div>

        {/* Workflow breadcrumbs with strict completion status */}
        <div className="hidden md:flex items-center gap-1.5 text-xs">
          <span className={`px-2.5 py-1 rounded-full font-medium transition-colors ${
            currentStep === 'landing'
              ? 'bg-indigo-600 text-white font-bold'
              : 'bg-emerald-950/40 text-emerald-400 border border-emerald-500/30'
          }`}>
            1. Raw Idea {currentStep !== 'landing' ? '✓' : ''}
          </span>
          <span className="text-slate-600">→</span>

          <span className={`px-2.5 py-1 rounded-full font-medium transition-colors ${
            currentStep === 'interview'
              ? 'bg-indigo-600 text-white font-bold'
              : ['review', 'researching', 'report'].includes(currentStep)
              ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-500/30'
              : 'text-slate-500 bg-slate-900/40 border border-slate-800'
          }`}>
            2. Analyst Interview {['review', 'researching', 'report'].includes(currentStep) ? '✓' : currentStep === 'interview' ? '' : '🔒'}
          </span>
          <span className="text-slate-600">→</span>

          <span className={`px-2.5 py-1 rounded-full font-medium transition-colors ${
            currentStep === 'review'
              ? 'bg-indigo-600 text-white font-bold'
              : ['researching', 'report'].includes(currentStep)
              ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-500/30'
              : 'text-slate-500 bg-slate-900/40 border border-slate-800'
          }`}>
            3. Profile Gate {['researching', 'report'].includes(currentStep) ? '✓' : currentStep === 'review' ? '' : '🔒'}
          </span>
          <span className="text-slate-600">→</span>

          <span className={`px-2.5 py-1 rounded-full font-medium transition-colors ${
            currentStep === 'researching'
              ? 'bg-amber-600 text-white font-bold animate-pulse'
              : currentStep === 'report'
              ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-500/30'
              : 'text-slate-500 bg-slate-900/40 border border-slate-800'
          }`}>
            4. Deep Research {currentStep === 'report' ? '✓' : currentStep === 'researching' ? '⏳' : '🔒'}
          </span>
          <span className="text-slate-600">→</span>

          <span className={`px-2.5 py-1 rounded-full font-medium transition-colors ${
            currentStep === 'report'
              ? 'bg-emerald-600 text-white font-bold'
              : 'text-slate-500 bg-slate-900/40 border border-slate-800'
          }`}>
            5. Validation Report {currentStep === 'report' ? '✓' : '🔒'}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">


          {hasActiveReport && currentStep !== 'report' && onViewReport && (
            <button
              onClick={onViewReport}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-600/20 border border-emerald-500/40 px-3 py-1.5 text-xs font-medium text-emerald-300 hover:bg-emerald-600/30 transition"
            >
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              <span>View Report</span>
            </button>
          )}

          {currentStep !== 'landing' && (
            <button
              onClick={onReset}
              className="flex items-center gap-1 rounded-lg border border-slate-800 px-2.5 py-1.5 text-xs font-medium text-slate-400 hover:bg-slate-900 hover:text-slate-200 transition"
              title="Start with a fresh idea"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">New Idea</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
