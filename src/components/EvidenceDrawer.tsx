import React from 'react';
import { X, ExternalLink, ShieldCheck, AlertTriangle, Layers, BookOpen, CheckCircle2 } from 'lucide-react';
import { ResearchSource, EvidenceItem, SourceTier } from '../types';
import { getSafeHttpUrl } from '../utils/security';

interface EvidenceDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedEvidence?: EvidenceItem | null;
  sources: ResearchSource[];
  allEvidence?: EvidenceItem[];
}

export const EvidenceDrawer: React.FC<EvidenceDrawerProps> = ({
  isOpen,
  onClose,
  selectedEvidence,
  sources,
}) => {
  if (!isOpen) return null;

  const relevantSources = selectedEvidence
    ? sources.filter((s) => selectedEvidence.sourceIds?.includes(s.id))
    : sources;

  const getTierBadge = (tier: SourceTier) => {
    switch (tier) {
      case 'TIER_1_PRIMARY':
        return (
          <span className="rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold">
            Tier 1: Primary Official
          </span>
        );
      case 'TIER_2_SECONDARY':
        return (
          <span className="rounded bg-sky-500/20 text-sky-400 border border-sky-500/30 px-2 py-0.5 text-[10px] font-bold">
            Tier 2: High-Trust Media
          </span>
        );
      case 'TIER_3_COMMUNITY_SIGNALS':
        return (
          <span className="rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 text-[10px] font-bold">
            Tier 3: Community Signals
          </span>
        );
      case 'TIER_4_LOW_CONFIDENCE':
      default:
        return (
          <span className="rounded bg-slate-800 text-slate-400 border border-slate-700 px-2 py-0.5 text-[10px] font-medium">
            Tier 4: Low Confidence
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/70 backdrop-blur-sm transition-opacity">
      <div className="relative w-full max-w-2xl bg-slate-900 border-l border-slate-800 h-full flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-400">
              <BookOpen className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">
                {selectedEvidence ? 'Evidence & Source Traceability' : 'All Verified Research Sources'}
              </h2>
              <p className="text-[11px] text-slate-400">
                Source hierarchy, confidence levels, and empirical backing
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* If specific evidence item selected */}
          {selectedEvidence && (
            <div className="rounded-xl border border-indigo-500/30 bg-indigo-950/20 p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">
                  Claim Under Review
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                  selectedEvidence.stance === 'SUPPORTING'
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : selectedEvidence.stance === 'CONTRADICTING'
                    ? 'bg-rose-500/20 text-rose-300'
                    : 'bg-slate-800 text-slate-300'
                }`}>
                  {selectedEvidence.stance}
                </span>
              </div>
              <h3 className="text-sm font-bold text-white leading-snug">
                &ldquo;{selectedEvidence.claim}&rdquo;
              </h3>

              <div className="text-xs text-slate-300 space-y-1.5 pt-2 border-t border-slate-800">
                <div>
                  <span className="font-semibold text-slate-400">Evidence Record:</span>{' '}
                  {selectedEvidence.evidenceText}
                </div>
                <div>
                  <span className="font-semibold text-indigo-300">Analyst Interpretation:</span>{' '}
                  {selectedEvidence.interpretation}
                </div>
                {selectedEvidence.uncertaintyOrCaveat && (
                  <div className="text-amber-300/90 text-[11px]">
                    <span className="font-semibold">Caveat / Uncertainty:</span>{' '}
                    {selectedEvidence.uncertaintyOrCaveat}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Source Hierarchy Legend */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-3 text-xs text-slate-300 space-y-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Section 15: Source Hierarchy System
            </span>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <span className="font-bold text-emerald-400">Tier 1:</span> Primary (SEC, Gov, Official filings)
              </div>
              <div>
                <span className="font-bold text-sky-400">Tier 2:</span> Secondary (Reuters, Bloomberg, FT, TechCrunch)
              </div>
              <div>
                <span className="font-bold text-amber-400">Tier 3:</span> Community Signals (Reddit, Product Reviews)
              </div>
              <div>
                <span className="font-bold text-slate-400">Tier 4:</span> Low Confidence (SEO blogs, unverified)
              </div>
            </div>
          </div>

          {/* Sources List */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              Supporting Sources ({relevantSources.length})
            </h3>

            {relevantSources.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-800 p-6 text-center text-xs text-slate-400">
                No external links recorded for this specific assertion; derived from model synthesis.
              </div>
            ) : (
              <div className="space-y-3">
                {relevantSources.map((src) => (
                  <div
                    key={src.id}
                    className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-2.5 hover:border-slate-700 transition"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {getTierBadge(src.tier)}
                          <span className="text-[11px] text-slate-400">{src.publisher}</span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-200 hover:text-indigo-300">
                          {src.title}
                        </h4>
                      </div>

                      {getSafeHttpUrl(src.url) && (
                        <a
                          href={getSafeHttpUrl(src.url)!}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="shrink-0 rounded-lg bg-slate-800 p-1.5 text-slate-400 hover:bg-slate-700 hover:text-white transition"
                          title="Open external verified source (Safe Browser Protected)"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      )}
                    </div>

                    <div className="text-[11px] text-slate-400 bg-slate-900/80 rounded-lg p-2.5 border border-slate-800/80">
                      <span className="font-semibold text-slate-300">Claim Grounded:</span>{' '}
                      {src.relevantClaim}
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
                      <span>Reliability: <strong className="text-slate-400">{src.reliabilityLevel}</strong></span>
                      <span>Accessed: {src.dateAccessed}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
