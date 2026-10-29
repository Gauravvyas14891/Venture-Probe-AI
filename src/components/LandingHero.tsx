import React, { useState } from 'react';
import { ArrowRight, Sparkles, ShieldAlert, Target, Search, FileSpreadsheet, CheckCircle2, Quote, ChevronLeft, ChevronRight, Lightbulb, Compass } from 'lucide-react';

interface LandingHeroProps {
  onStartInterview: (rawIdea: string) => void;
}

export const FOUNDER_QUOTES = [
  {
    quote: "In God we trust. All others must bring data.",
    author: "W. Edwards Deming",
    title: "Pioneer of Statistical Quality Control & Modern Systems",
    context: "The Empirical Grounding Principle",
    takeaway: "Unexamined founder optimism costs millions. Real validation demands empirical evidence over emotional conviction.",
    tag: "Data Over Intuition",
    color: "from-sky-500/20 to-indigo-500/20 border-sky-500/30 text-sky-300"
  },
  {
    quote: "No business plan survives first contact with customers.",
    author: "Steve Blank",
    title: "Father of Modern Customer Development & Lean Startup",
    context: "The Reality-Check Principle",
    takeaway: "The fastest route to venture failure is building inside a vacuum. True clarity comes from rigorous hypothesis testing.",
    tag: "Customer Discovery",
    color: "from-indigo-500/20 to-purple-500/20 border-indigo-500/30 text-indigo-300"
  },
  {
    quote: "The number one casualty in early-stage startups isn't technology—it's market reality.",
    author: "Marc Andreessen",
    title: "Co-founder, Netscape & Andreessen Horowitz (a16z)",
    context: "The Market Pull Principle",
    takeaway: "Brilliant engineering directed at a phantom need creates zero enterprise value. Validate burning hair pain first.",
    tag: "Product-Market Fit",
    color: "from-amber-500/20 to-rose-500/20 border-amber-500/30 text-amber-300"
  },
  {
    quote: "It's better to build something that 100 people love than something that 1,000 people just kind of like.",
    author: "Paul Graham",
    title: "Co-founder, Y Combinator",
    context: "The Acute Pain Principle",
    takeaway: "Start by finding a concentrated core of users desperate for your solution today. Broad appeal is earned later.",
    tag: "Focused Wedge",
    color: "from-emerald-500/20 to-teal-500/20 border-emerald-500/30 text-emerald-300"
  },
  {
    quote: "There is nothing so useless as doing efficiently that which should not be done at all.",
    author: "Peter F. Drucker",
    title: "Father of Modern Management Thinking",
    context: "The Falsification Principle",
    takeaway: "Before optimizing conversion funnels or writing code, falsify whether the underlying problem is genuinely fatal.",
    tag: "Falsification First",
    color: "from-purple-500/20 to-pink-500/20 border-purple-500/30 text-purple-300"
  }
];

export const LandingHero: React.FC<LandingHeroProps> = ({
  onStartInterview,
}) => {
  const [rawIdea, setRawIdea] = useState('');
  const [activeQuoteIndex, setActiveQuoteIndex] = useState(0);

  const words = rawIdea.trim() ? rawIdea.trim().split(/\s+/).filter(Boolean) : [];
  const wordCount = words.length;
  const isEligible = wordCount >= 2;

  const currentQuote = FOUNDER_QUOTES[activeQuoteIndex];

  const handleNextQuote = () => {
    setActiveQuoteIndex((prev) => (prev + 1) % FOUNDER_QUOTES.length);
  };

  const handlePrevQuote = () => {
    setActiveQuoteIndex((prev) => (prev - 1 + FOUNDER_QUOTES.length) % FOUNDER_QUOTES.length);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEligible) {
      onStartInterview(rawIdea.trim());
    }
  };

  return (
    <div className="relative overflow-hidden py-12 sm:py-16 lg:py-20">
      {/* Background radial glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center relative z-10">
        {/* Core Philosophy Badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3.5 py-1 text-xs font-semibold text-indigo-300 mb-6">
          <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
          <span>Core Due-Diligence Principle: Ideas are cheap. Evidence is valuable.</span>
        </div>

        {/* Headline */}
        <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl max-w-4xl mx-auto leading-tight">
          Validate your startup with{' '}
          <span className="bg-gradient-to-r from-indigo-400 via-sky-300 to-teal-300 bg-clip-text text-transparent">
            evidence, not optimism.
          </span>
        </h1>

        <p className="mt-5 text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
          An AI venture research analyst that interrogates your idea, audits customer complaints, studies failed competitors, stress-tests assumptions, and tries to kill your startup before you spend life savings.
        </p>

        {/* Input Form with Strict 100-Word Gate */}
        <form onSubmit={handleSubmit} className="mt-8 max-w-3xl mx-auto text-left">
          <div className="relative rounded-2xl border border-slate-700 bg-slate-900/90 p-4 shadow-2xl shadow-indigo-950/40 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 transition">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Step 1: Raw Startup Idea (Minimum 100 Words Required)
              </span>
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs font-bold px-2.5 py-0.5 rounded-full border transition-colors ${
                    wordCount >= 2
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  {wordCount} words {wordCount >= 2 ? '✓' : ''}
                </span>
              </div>
            </div>

            <textarea
              value={rawIdea}
              onChange={(e) => setRawIdea(e.target.value)}
              placeholder="Describe your startup idea (short or detailed)... e.g.:
• Short: 'I want to build an app for booking temporary drivers.'
• Detailed: Full description covering the customer problem, proposed solution, features, target country, revenue model, and competitors.

Our intelligent AI extractor analyzes your entire brief across 23 dimensions before asking any questions, never repeats what you already told us, and preserves all original evidence."
              rows={6}
              className="w-full resize-none bg-transparent px-2 py-2 text-sm sm:text-base text-slate-100 placeholder-slate-500 focus:outline-none"
            />

            {/* Context richness bar */}
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mb-3">
              <div
                className={`h-full transition-all duration-300 ${
                  wordCount >= 60 ? 'bg-emerald-500' : wordCount >= 15 ? 'bg-sky-500' : 'bg-indigo-500'
                }`}
                style={{ width: `${Math.min(100, Math.max(10, Math.round((wordCount / 80) * 100)))}%` }}
              />
            </div>

            {/* Helper tips and dynamic extraction guidance */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-t border-slate-800/80 pt-3">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                {wordCount < 2 ? (
                  <span>Enter your startup idea above (from a single sentence to a full multi-paragraph brief).</span>
                ) : wordCount < 30 ? (
                  <span className="text-sky-300 flex items-center gap-1">
                    <Sparkles className="h-3.5 w-3.5 text-sky-400" />
                    <strong>{wordCount} words:</strong> Concise idea. The AI will extract your core concept and ask focused questions.
                  </span>
                ) : (
                  <span className="text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {wordCount} words detected. The AI will auto-extract all explicit points across 23 dimensions with full evidence tracking!
                  </span>
                )}
              </div>

              <button
                type="submit"
                disabled={!isEligible}
                className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-xs sm:text-sm font-bold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <span>Analyze My Startup</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </form>

        {/* Founder Wisdom & Due Diligence Principles Showcase */}
        <div className="mt-12 text-left max-w-5xl mx-auto">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <Quote className="h-4 w-4 text-indigo-400" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Timeless Due-Diligence Wisdom
                </h2>
                <span className="rounded bg-indigo-500/10 border border-indigo-500/30 px-2 py-0.5 text-[10px] font-semibold text-indigo-300">
                  {currentQuote.tag}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                The battle-tested principles of empirical validation before building
              </p>
            </div>

            {/* Quote Selector Controls */}
            <div className="flex items-center gap-1.5 self-end sm:self-auto">
              <span className="text-[11px] text-slate-500 mr-1 font-mono">
                {activeQuoteIndex + 1} / {FOUNDER_QUOTES.length}
              </span>
              <button
                type="button"
                onClick={handlePrevQuote}
                className="rounded-lg border border-slate-800 bg-slate-900/80 p-1.5 text-slate-400 hover:border-slate-700 hover:text-white transition"
                title="Previous founder quote"
                aria-label="Previous quote"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={handleNextQuote}
                className="rounded-lg border border-slate-800 bg-slate-900/80 p-1.5 text-slate-400 hover:border-slate-700 hover:text-white transition"
                title="Next founder quote"
                aria-label="Next quote"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Featured Quote Card */}
          <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900/90 to-slate-950 p-6 sm:p-8 shadow-xl">
            {/* Watermark Quote Icon */}
            <Quote className="absolute -right-4 -bottom-4 h-36 w-36 text-slate-800/20 pointer-events-none rotate-12" />

            <div className="relative z-10 space-y-5">
              {/* Quote Navigation Tabs */}
              <div className="flex flex-wrap gap-1.5 pb-2 border-b border-slate-800/80">
                {FOUNDER_QUOTES.map((q, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveQuoteIndex(idx)}
                    className={`rounded-full px-3 py-1 text-[11px] font-medium transition ${
                      activeQuoteIndex === idx
                        ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                        : 'bg-slate-800/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                    }`}
                  >
                    {q.author}
                  </button>
                ))}
              </div>

              {/* Quote Statement */}
              <div>
                <blockquote className="text-lg sm:text-xl font-medium tracking-tight text-white leading-relaxed italic">
                  &ldquo;{currentQuote.quote}&rdquo;
                </blockquote>
              </div>

              {/* Author & Actionable Takeaway Grid */}
              <div className="pt-2 grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-sky-600 flex items-center justify-center font-bold text-xs text-white shadow-md shadow-indigo-950">
                    {currentQuote.author.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-100">
                      {currentQuote.author}
                    </h3>
                    <p className="text-xs text-slate-400">
                      {currentQuote.title}
                    </p>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-3 text-xs">
                  <div className="flex items-center gap-1.5 text-indigo-400 font-semibold mb-1">
                    <Compass className="h-3.5 w-3.5" />
                    <span>The Due-Diligence Takeaway:</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed text-[11px]">
                    {currentQuote.takeaway}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* What sets this platform apart */}
        <div className="mt-16 pt-12 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-6 text-left">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-indigo-400 font-semibold text-xs sm:text-sm">
              <Target className="h-4 w-4" />
              <span>Dynamic Interview</span>
            </div>
            <p className="text-xs text-slate-400">
              Doesn't use a rigid form. Adapts questions specifically to physical vs B2B SaaS vs consumer.
            </p>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-sky-400 font-semibold text-xs sm:text-sm">
              <Search className="h-4 w-4" />
              <span>Real Source Grounding</span>
            </div>
            <p className="text-xs text-slate-400">
              Tier 1-4 source hierarchy. Every finding is linked to real company filings, forums, and post-mortems.
            </p>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-rose-400 font-semibold text-xs sm:text-sm">
              <ShieldAlert className="h-4 w-4" />
              <span>Try To Kill My Startup</span>
            </div>
            <p className="text-xs text-slate-400">
              Contrarian investor stress-test exposing lethal assumptions and fatal thresholds.
            </p>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs sm:text-sm">
              <CheckCircle2 className="h-4 w-4" />
              <span>Actionable Experiments</span>
            </div>
            <p className="text-xs text-slate-400">
              Specific falsification experiments with costs, sample sizes, and pass/fail thresholds.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
