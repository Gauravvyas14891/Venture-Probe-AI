import React, { useEffect, useState } from 'react';
import { Loader2, CheckCircle2, Search, Users, ShieldAlert, TrendingUp, Globe, Building, Target, Sparkles, BookOpen } from 'lucide-react';
import { StartupProfile } from '../types';

interface ResearchProgressViewProps {
  profile: StartupProfile;
  mode: 'QUICK_FEASIBILITY' | 'COMPLETE_DEEP_DIVE';
}

interface StepItem {
  id: number;
  label: string;
  detail: string;
  icon: any;
}

export const ResearchProgressView: React.FC<ResearchProgressViewProps> = ({ profile, mode }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [secondsElapsed, setSecondsElapsed] = useState(0);

  const isDeepDive = mode === 'COMPLETE_DEEP_DIVE';
  const expectedDurationLabel = isDeepDive ? '5 to 10 Minutes' : '~30 to 45 Seconds';

  const steps: StepItem[] = [
    {
      id: 1,
      label: 'Grounded Query Generation',
      detail: `Synthesizing search queries for ${profile.startupName} across market size, competitors, and customer complaints`,
      icon: Search,
    },
    {
      id: 2,
      label: 'Market & Geographic Intelligence',
      detail: `Auditing TAM, CAGR, and initial market suitability in ${profile.initialCountry || 'target geographies'}`,
      icon: Globe,
    },
    {
      id: 3,
      label: 'Customer Voice & Forum Mining',
      detail: 'Scanning Reddit, community forums, and reviews for repeated friction and willingness-to-pay signals',
      icon: Users,
    },
    {
      id: 4,
      label: 'Competitor & Substitute Teardown',
      detail: 'Classifying direct rivals, indirect solutions, and status quo workarounds',
      icon: Target,
    },
    {
      id: 5,
      label: 'Success Benchmarks & Failure Graveyard',
      detail: 'Investigating comparable winners and post-mortems of startups that shut down or pivoted',
      icon: BookOpen,
    },
    {
      id: 6,
      label: 'Corporate & Incumbent Movement',
      detail: 'Checking if tech giants or category incumbents are expanding into this domain',
      icon: Building,
    },
    {
      id: 7,
      label: 'Anti-Confirmation Bias & "Try To Kill My Startup"',
      detail: 'Hunting for disproving evidence, operational landmines, and hostile investor attack vectors',
      icon: ShieldAlert,
    },
    {
      id: 8,
      label: 'Assumption Falsification & Strategy Synthesis',
      detail: 'Ranking assumptions by Impact × Uncertainty and architecting 30/60/90-day validation experiments',
      icon: TrendingUp,
    },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const stepInterval = isDeepDive ? 2200 : 1400;
    const interval = setInterval(() => {
      setCurrentStepIndex((prev) => {
        if (prev < steps.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, stepInterval);

    return () => clearInterval(interval);
  }, [steps.length, isDeepDive]);

  const formatTimer = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:py-16 text-center">
      {/* Central radar / pulse icon */}
      <div className="relative mx-auto mb-6 flex h-20 w-20 items-center justify-center">
        <div className="absolute inset-0 animate-ping rounded-full bg-indigo-500/20" />
        <div className="absolute inset-2 animate-pulse rounded-full bg-indigo-500/30" />
        <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-xl shadow-indigo-600/40">
          <Loader2 className="h-7 w-7 animate-spin" />
        </div>
      </div>

      <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-1 text-xs font-bold text-indigo-300 mb-4">
        <span>Step 4: Deep Research Pipeline Active</span>
        <span className="text-slate-500">•</span>
        <span className="text-amber-400 font-semibold">Expected Time: {expectedDurationLabel}</span>
      </div>

      <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
        {isDeepDive ? 'Autonomous Multi-Agent Due Diligence' : 'Quick Feasibility Overview Scan'}
      </h2>
      <p className="mt-2 text-sm text-slate-300 max-w-xl mx-auto">
        Deeply researching <span className="font-semibold text-indigo-400">{profile.startupName}</span> across markets, Reddit discussions, failed companies, and hostile attack vectors.
      </p>

      {/* Live timer badge */}
      <div className="mt-4 flex items-center justify-center gap-4 text-xs">
        <span className="rounded-lg bg-slate-900 border border-slate-800 px-3 py-1 text-slate-300">
          Elapsed Time: <strong className="text-white font-mono">{formatTimer(secondsElapsed)}</strong>
        </span>
        <span className="rounded-lg bg-slate-900 border border-slate-800 px-3 py-1 text-slate-300">
          Estimated Duration: <strong className="text-indigo-400 font-mono">{expectedDurationLabel}</strong>
        </span>
      </div>

      {/* Progress tracker list */}
      <div className="mt-8 max-w-2xl mx-auto rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-2xl text-left">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800 text-xs">
          <span className="font-bold uppercase tracking-wider text-slate-400">
            Pipeline Agents (Stage {currentStepIndex + 1} of {steps.length})
          </span>
          <span className="rounded bg-indigo-500/20 px-2 py-0.5 text-indigo-300 font-semibold">
            {Math.round(((currentStepIndex + 1) / steps.length) * 100)}% Complete
          </span>
        </div>

        <div className="space-y-3">
          {steps.map((step, idx) => {
            const isCompleted = idx < currentStepIndex;
            const isCurrent = idx === currentStepIndex;

            return (
              <div
                key={step.id}
                className={`flex items-start gap-3 rounded-xl p-3 transition-all ${
                  isCurrent
                    ? 'bg-indigo-950/40 border border-indigo-500/40 shadow-md'
                    : isCompleted
                    ? 'bg-slate-950/40 border border-slate-800/80 opacity-80'
                    : 'opacity-40 border border-transparent'
                }`}
              >
                <div className="mt-0.5 shrink-0">
                  {isCompleted ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                  ) : isCurrent ? (
                    <Loader2 className="h-5 w-5 text-indigo-400 animate-spin" />
                  ) : (
                    <div className="h-5 w-5 rounded-full border border-slate-700 flex items-center justify-center text-[10px] text-slate-500">
                      {step.id}
                    </div>
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3
                      className={`text-xs font-bold ${
                        isCurrent
                          ? 'text-indigo-300'
                          : isCompleted
                          ? 'text-slate-200'
                          : 'text-slate-400'
                      }`}
                    >
                      {step.label}
                    </h3>
                    {isCurrent && (
                      <span className="animate-pulse rounded bg-indigo-500/30 px-1.5 py-0.2 text-[9px] font-semibold text-indigo-300">
                        IN PROGRESS
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-[11px] text-slate-400 leading-relaxed">
                    {step.detail}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <p className="mt-6 text-xs text-slate-400">
        Anti-Confirmation Bias rule: We are actively interrogating negative customer reviews, competitor strengths, and regulatory blockers.
      </p>
    </div>
  );
};
