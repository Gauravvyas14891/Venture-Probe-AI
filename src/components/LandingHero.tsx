import React, { useState, useRef } from 'react';
import { ArrowRight, Plus, Minus, Check, Compass } from 'lucide-react';

interface LandingHeroProps {
  onStartInterview: (rawIdea: string) => void;
  onLoadSampleReport?: () => void;
}

const SAMPLE_BRIEF =
  'We are building AuditPulse, a B2B SaaS platform for web development agencies in the United States and UK. Agencies currently waste 12+ hours before every client launch stitching together Google Lighthouse, axe-core accessibility audits, and OWASP security scans into spreadsheets. AuditPulse runs one automated pre-launch scan, assigns a 0–100 score with prioritized remediation fixes, and exports a white-label client compliance PDF. We charge $49/month for solo teams and $199/month for agencies managing up to 25 client sites.';

const LOGO_PARTNERS = [
  {
    name: 'Northstar Labs',
    mark: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <path d="M10 1.5L12.2 7.8L18.5 10L12.2 12.2L10 18.5L7.8 12.2L1.5 10L7.8 7.8L10 1.5Z" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    name: 'Cedar Ventures',
    mark: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <rect x="3" y="3" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
        <path d="M7 13L13 7" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    name: 'Beacon Guild',
    mark: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="10" cy="10" r="2.5" fill="currentColor" />
      </svg>
    ),
  },
  {
    name: 'Alder Foundry',
    mark: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <path d="M4 15L10 4L16 15H4Z" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    name: 'Harbor Seed',
    mark: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <path d="M3 10H17M10 3V17" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    name: 'Kestrel Capital',
    mark: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <path d="M3 6H17V14H3V6Z" stroke="currentColor" strokeWidth="1.5" />
        <path d="M10 6V14" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
  },
];

const FEATURE_ROWS = [
  {
    index: '01',
    title: '23-dimension brief parsing with verbatim evidence',
    description:
      'Submit a single sentence or a 500-word brief. VentureProbe maps every explicit fact across 23 diligence dimensions—problem, paying buyer, geography, pricing, and moat—before asking a single follow-up question. Unstated fields stay honestly unknown.',
    points: [
      'Preserves your complete original text without truncation',
      'Tags every extracted field with a verbatim quote from your brief',
      'Detects conflicting customer or pricing statements automatically',
    ],
    image: '/src/assets/images/feature_23_dimensions_1794835634704.jpg',
    imageAlt: 'Diagram showing a founder brief parsed into 23 structured evidence facets',
  },
  {
    index: '02',
    title: 'Triangulated market signals from real sources',
    description:
      'Every market verdict cross-examines search momentum, payment-verified revenue cohorts, and startup failure post-mortems. Claims link directly to primary regulatory filings, competitor pricing pages, and community threads.',
    points: [
      'Separates Tier-1 standards and filings from community anecdotes',
      'Benchmarks realistic monthly churn and ARPU bands by category',
      'Flags missing evidence rather than fabricating precision',
    ],
    image: '/src/assets/images/feature_market_evidence_1794835636144.jpg',
    imageAlt: 'Editorial diagram illustrating demand velocity, financial benchmarks, and historical startup autopsies',
  },
  {
    index: '03',
    title: 'Hostile investor stress-test & 9-point quality audit',
    description:
      'Before your report publishes, an independent skeptical auditor reviews the draft against your locked business profile to catch model drift, false precision, and unsupported claims—followed by ranked kill risks and 7-day falsification experiments.',
    points: [
      'Identifies the exact fatal thresholds that would break unit economics',
      'Prescribes low-cost concierge and LOI experiments before coding',
      'Exports directly to a single formatted executive PDF dossier',
    ],
    image: '/src/assets/images/feature_kill_audit_1794835635877.jpg',
    imageAlt: 'Balance scale and 9-point verification grid auditing startup assumptions against evidence',
  },
];

const PROCESS_STEPS = [
  {
    number: '01',
    title: 'Capture your raw startup brief',
    description:
      'Paste a quick one-liner or a detailed multi-paragraph memo. Our parser extracts everything you already know across 23 dimensions.',
  },
  {
    number: '02',
    title: 'Answer only targeted gaps',
    description:
      'The analyst interview skips topics you already answered, flags ambiguities, and lets you skip undecided pricing or channels without inventing guesses.',
  },
  {
    number: '03',
    title: 'Download your audited PDF dossier',
    description:
      'Receive a 9-point audited due-diligence report with competitor teardowns, kill risks, and 30/60/90-day validation experiments.',
  },
];

const SUPPORTING_TESTIMONIALS = [
  {
    initials: 'AR',
    name: 'Ananya Rao',
    role: 'Co-founder, LedgerLoop',
    quote:
      'We cut our pre-build discovery from six weeks to four days. The kill-risk audit caught a compliance bottleneck with EU payroll APIs before we hired a second engineer.',
    outcome: 'Saved ~$38k in premature build cost',
  },
  {
    initials: 'MK',
    name: 'Marcus Klein',
    role: 'Partner, Alder Foundry',
    quote:
      'Every founder in our cohort runs their brief through VentureProbe before Demo Day prep. Having verbatim evidence linked to each assumption keeps pitch reviews grounded.',
    outcome: 'Standardized diligence across 24 portfolio teams',
  },
];

const PRICING_PLANS = [
  {
    name: 'Explorer',
    price: '$0',
    cadence: 'per validation check',
    description: 'For founders testing an initial concept before committing engineering hours.',
    features: [
      '23-dimension brief extraction',
      'Adaptive analyst interview',
      'Quick feasibility verdict',
      'Exportable PDF summary',
    ],
    ctaLabel: 'Start Free Check',
    recommended: false,
  },
  {
    name: 'Founder Pro',
    price: '$29',
    cadence: 'per month',
    description: 'Complete due diligence, contrarian kill risks, and 9-point audited PDF reports.',
    features: [
      'Unlimited deep-dive dossiers',
      'Live source & competitor teardowns',
      '9-point quality auditor safeguard',
      '30/60/90-day experiment playbooks',
    ],
    ctaLabel: 'Analyze My Startup',
    recommended: true,
  },
  {
    name: 'Syndicate',
    price: '$99',
    cadence: 'per month',
    description: 'Built for angel groups, venture studios, and accelerator program directors.',
    features: [
      '15 full partner dossiers monthly',
      'Structured JSON dataset export',
      'Multi-model pivot comparisons',
      'Cohort audit trail & review tools',
    ],
    ctaLabel: 'Choose Syndicate',
    recommended: false,
  },
];

const FAQ_ITEMS = [
  {
    q: 'What if I only have a one-sentence idea right now?',
    a: 'That works cleanly. Submit even a short sentence—VentureProbe extracts what is present, marks unstated items as unknown rather than inventing assumptions, and asks focused questions one at a time.',
  },
  {
    q: 'Why does the interview skip questions I already answered?',
    a: 'Every turn runs a relevance validator against your 23-dimension extraction profile. If your initial brief already specifies your target customer, launch country, or pricing, VentureProbe attaches your verbatim quote and never asks again.',
  },
  {
    q: 'How does the 9-point quality audit protect my report?',
    a: 'Before finalizing, an independent auditor cross-checks the draft against your locked business model and research dataset for model drift, false precision, unsupported claims, and legal overconfidence.',
  },
  {
    q: 'What happens if I have not decided on pricing or channels yet?',
    a: 'You can click "I haven’t decided yet" or "Skip this question" at any prompt. VentureProbe marks the field as unknown for empirical benchmarking instead of guessing numbers.',
  },
  {
    q: 'Can I download the final due-diligence report as a PDF?',
    a: 'Yes. Clicking Print Report inside the report dashboard immediately generates and downloads a clean multi-page PDF document with zero extra format dialogs.',
  },
  {
    q: 'Is my startup brief kept private during extraction?',
    a: 'Your brief stays within your active session and server-side analysis request. We do not publish founder submissions or use private drafts as public sample reports.',
  },
];

export const LandingHero: React.FC<LandingHeroProps> = ({
  onStartInterview,
  onLoadSampleReport,
}) => {
  const [rawIdea, setRawIdea] = useState('');
  const [inputHint, setInputHint] = useState<string | null>(null);
  const [openFaqIndices, setOpenFaqIndices] = useState<Set<number>>(new Set([0]));
  const [heroImgFailed, setHeroImgFailed] = useState(false);
  const [failedFeatureImgs, setFailedFeatureImgs] = useState<Record<string, boolean>>({});
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const words = rawIdea.trim() ? rawIdea.trim().split(/\s+/).filter(Boolean) : [];
  const wordCount = words.length;

  const focusComposer = () => {
    const el = document.getElementById('idea-composer');
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 250);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (wordCount < 2) {
      setInputHint('Enter at least a short sentence describing your startup idea, or insert the example brief.');
      textareaRef.current?.focus();
      return;
    }
    setInputHint(null);
    onStartInterview(rawIdea.trim());
  };

  const toggleFaq = (idx: number) => {
    setOpenFaqIndices((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) {
        next.delete(idx);
      } else {
        next.add(idx);
      }
      return next;
    });
  };

  return (
    <div className="w-full bg-[#f1f3e6] text-[#000000]">
      {/* =========================================================================
          SECTION 2: HERO (Page Ground #f1f3e6)
         ========================================================================= */}
      <section className="mx-auto max-w-[1200px] px-6 pt-[85px] pb-[64px] lg:pt-[128px] lg:pb-[85px]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-12 items-start">
          {/* Left Column: Display Headline, Value Prop, Interactive Brief Composer, Two Actions, Trust & Key Numbers */}
          <div className="lg:col-span-6 space-y-6">
            <h1 className="text-[53px] lg:text-[70px] font-extrabold leading-[1.03] tracking-[-0.03em] text-[#000000] [text-wrap:balance]">
              Validate your startup with evidence, not optimism.
            </h1>

            <p className="text-[16px] leading-[1.6] text-[#333333] max-w-[54ch]">
              An independent research analyst that extracts 23 business dimensions from your brief, audits competitor failures, and stress-tests assumptions before you commit engineering time.
            </p>

            {/* Interactive Idea Composer */}
            <form id="idea-composer" onSubmit={handleSubmit} className="space-y-4 pt-1">
              <div className="rounded-[8px] border border-[#d3d4c8] bg-[#fcfcfd] p-4 focus-within:border-[#3f6212] transition-colors">
                <div className="flex items-center justify-between gap-4 pb-2.5 mb-2.5 border-b border-[#d3d4c8]">
                  <label htmlFor="startup-idea-input" className="text-xs font-semibold text-[#333333]">
                    Startup brief
                  </label>
                  <div className="flex items-center gap-3 text-xs text-[#4d4c4c] tabular-nums">
                    <button
                      type="button"
                      onClick={() => {
                        setRawIdea(SAMPLE_BRIEF);
                        setInputHint(null);
                      }}
                      className="font-semibold text-[#3f6212] hover:underline underline-offset-4 whitespace-nowrap"
                    >
                      Insert example brief
                    </button>
                    <span aria-hidden="true">·</span>
                    <span className="whitespace-nowrap">{wordCount} words</span>
                  </div>
                </div>

                <textarea
                  id="startup-idea-input"
                  ref={textareaRef}
                  value={rawIdea}
                  onChange={(e) => {
                    setRawIdea(e.target.value);
                    if (inputHint) setInputHint(null);
                  }}
                  rows={4}
                  placeholder="Describe your startup idea—from a single sentence to a multi-paragraph brief covering target customers, geography, pricing, and competitors."
                  className="w-full resize-y bg-transparent text-[15px] leading-[1.55] text-[#000000] placeholder-[#4d4c4c]/75 focus:outline-none"
                />

                {inputHint && (
                  <p role="alert" className="mt-2 text-xs font-medium text-[#3f6212]">
                    {inputHint}
                  </p>
                )}
              </div>

              {/* Two Actions */}
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="submit"
                  className="whitespace-nowrap shrink-0 inline-flex items-center justify-center gap-2 rounded-[8px] bg-[#3f6212] px-6 py-3 text-[15px] font-semibold text-[#fcfcfd] hover:bg-[#365314] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3f6212]"
                >
                  <span>Analyze My Startup</span>
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </button>

                {onLoadSampleReport && (
                  <button
                    type="button"
                    onClick={onLoadSampleReport}
                    className="whitespace-nowrap shrink-0 inline-flex items-center justify-center rounded-[8px] border border-[#d3d4c8] bg-transparent px-6 py-3 text-[15px] font-semibold text-[#000000] hover:bg-[#e9eade] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3f6212]"
                  >
                    View Sample Report
                  </button>
                )}
              </div>
            </form>

            {/* Trust Caption */}
            <p className="text-[13px] text-[#4d4c4c]">
              Built for pre-seed founders, accelerator cohorts, and angel syndicates · Ideas are cheap. Evidence is valuable.
            </p>

            {/* Key Numbers below text */}
            <div className="grid grid-cols-3 gap-6 pt-6 border-t border-[#d3d4c8] tabular-nums">
              <div>
                <div className="text-[28px] lg:text-[32px] font-bold leading-tight text-[#000000]">
                  23
                </div>
                <div className="text-xs text-[#4d4c4c] mt-1">
                  Dimensions parsed
                </div>
              </div>
              <div className="border-l border-[#d3d4c8] pl-5">
                <div className="text-[28px] lg:text-[32px] font-bold leading-tight text-[#000000]">
                  9-Point
                </div>
                <div className="text-xs text-[#4d4c4c] mt-1">
                  Quality audit
                </div>
              </div>
              <div className="border-l border-[#d3d4c8] pl-5">
                <div className="text-[28px] lg:text-[32px] font-bold leading-tight text-[#000000]">
                  &lt; 4 min
                </div>
                <div className="text-xs text-[#4d4c4c] mt-1">
                  Full PDF dossier
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Large Screenshot in Browser Frame */}
          <div className="lg:col-span-6">
            <div className="rounded-[8px] border border-[#d3d4c8] bg-[#fcfcfd] overflow-hidden">
              {/* Minimal Browser Frame Chrome */}
              <div className="flex items-center justify-between gap-4 border-b border-[#d3d4c8] bg-[#e9eade] px-4 py-2.5">
                <div className="flex items-center gap-1.5" aria-hidden="true">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#4d4c4c]/40" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#4d4c4c]/40" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#4d4c4c]/40" />
                </div>
                <div className="rounded-[6px] border border-[#d3d4c8] bg-[#f1f3e6] px-3 py-0.5 text-[11px] font-mono text-[#4d4c4c] truncate max-w-[240px]">
                  ventureprobe.ai/report/auditpulse
                </div>
                <span className="text-[11px] font-medium text-[#3f6212] whitespace-nowrap">
                  Audited
                </span>
              </div>

              {/* Product Screenshot */}
              <div className="bg-[#f1f3e6] aspect-[4/3] w-full overflow-hidden">
                {!heroImgFailed ? (
                  <img
                    src="/src/assets/images/hero_dashboard_screen_1794835635149.jpg"
                    alt="VentureProbe due-diligence dashboard displaying feasibility verdict, 23-dimension extraction progress, competitor matrix, and ranked kill risks"
                    referrerPolicy="no-referrer"
                    onError={() => setHeroImgFailed(true)}
                    className="h-full w-full object-cover object-top"
                  />
                ) : (
                  <div className="h-full w-full flex flex-col items-center justify-center p-8 text-center bg-[#e9eade]">
                    <Compass className="h-8 w-8 text-[#3f6212] mb-3" />
                    <p className="text-sm font-semibold text-[#000000]">
                      AuditPulse — Due-Diligence Dashboard Preview
                    </p>
                    <p className="text-xs text-[#4d4c4c] mt-1 max-w-sm">
                      23-dimension extraction, competitor pricing teardown, and ranked kill risks.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 3: LOGO CLOUD (Alternate Ground #e9eade — Paired with Section 4)
         ========================================================================= */}
      <section className="bg-[#e9eade] py-16">
        <div className="mx-auto max-w-[1200px] px-6">
          <p className="text-center text-sm font-medium text-[#4d4c4c] mb-8">
            Used across early-stage venture studios, founder fellowships, and diligence teams
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-8 items-center justify-items-center">
            {LOGO_PARTNERS.map((partner) => (
              <div
                key={partner.name}
                className="flex items-center gap-2 text-[#333333] whitespace-nowrap"
              >
                <span className="text-[#3f6212]">{partner.mark}</span>
                <span className="text-[15px] font-semibold tracking-tight">{partner.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 4: FEATURES — 3 Alternating Rows (Alternate Ground #e9eade)
         ========================================================================= */}
      <section id="features" className="bg-[#e9eade] pt-12 pb-[64px] lg:pt-16 lg:pb-[85px]">
        <div className="mx-auto max-w-[1200px] px-6 space-y-20 lg:space-y-24">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold text-[#3f6212] mb-3">
              Platform Capabilities
            </p>
            <h2 className="text-[36px] lg:text-[46px] font-bold leading-[1.1] tracking-[-0.025em] text-[#000000] [text-wrap:balance]">
              Built to challenge assumptions, not flatter your pitch.
            </h2>
          </div>

          <div className="space-y-20 lg:space-y-24">
            {FEATURE_ROWS.map((row, idx) => {
              const imageFirst = idx % 2 === 1;
              return (
                <div
                  key={row.index}
                  className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center"
                >
                  {/* Text Block */}
                  <div className={`lg:col-span-6 space-y-5 ${imageFirst ? 'lg:order-2' : 'lg:order-1'}`}>
                    <span className="text-sm font-mono font-medium text-[#3f6212] block tabular-nums">
                      {row.index}
                    </span>
                    <h3 className="text-[28px] lg:text-[34px] font-bold leading-[1.15] tracking-[-0.02em] text-[#000000] [text-wrap:balance]">
                      {row.title}
                    </h3>
                    <p className="text-[16px] leading-[1.6] text-[#333333]">
                      {row.description}
                    </p>
                    <ul className="space-y-2.5 pt-1 text-[15px] text-[#333333]">
                      {row.points.map((pt) => (
                        <li key={pt} className="flex items-start gap-2.5">
                          <Check className="h-4 w-4 text-[#3f6212] shrink-0 mt-1" aria-hidden="true" />
                          <span>{pt}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Framed Editorial Illustration */}
                  <div className={`lg:col-span-6 ${imageFirst ? 'lg:order-1' : 'lg:order-2'}`}>
                    <div className="rounded-[8px] border border-[#d3d4c8] bg-[#f1f3e6] p-3">
                      <div className="aspect-[4/3] w-full overflow-hidden rounded-[6px] bg-[#f1f3e6]">
                        {!failedFeatureImgs[row.index] ? (
                          <img
                            src={row.image}
                            alt={row.imageAlt}
                            referrerPolicy="no-referrer"
                            onError={() =>
                              setFailedFeatureImgs((prev) => ({ ...prev, [row.index]: true }))
                            }
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full flex flex-col items-center justify-center p-6 text-center bg-[#f1f3e6]">
                            <span className="text-sm font-semibold text-[#3f6212] mb-1">
                              {row.index}
                            </span>
                            <p className="text-sm font-medium text-[#000000]">{row.title}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 5: PROCESS — 3 Connected Steps (Page Ground #f1f3e6)
         ========================================================================= */}
      <section id="process" className="bg-[#f1f3e6] pt-[85px] pb-12 lg:pt-[128px] lg:pb-16">
        <div className="mx-auto max-w-[1200px] px-6 space-y-12">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold text-[#3f6212] mb-3">
              Workflow
            </p>
            <h2 className="text-[36px] lg:text-[46px] font-bold leading-[1.1] tracking-[-0.025em] text-[#000000] [text-wrap:balance]">
              From raw idea brief to audited PDF in three steps.
            </h2>
          </div>

          <div className="relative grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-10">
            {/* Horizontal connecting line on desktop */}
            <div
              aria-hidden="true"
              className="hidden md:block absolute top-5 left-6 right-6 h-px bg-[#d3d4c8]"
            />

            {PROCESS_STEPS.map((step) => (
              <div key={step.number} className="relative space-y-4">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-[8px] border border-[#3f6212] bg-[#f1f3e6] text-sm font-bold text-[#3f6212] tabular-nums relative z-10">
                  {step.number}
                </div>
                <h3 className="text-[20px] font-bold leading-snug text-[#000000]">
                  {step.title}
                </h3>
                <p className="text-[15px] leading-[1.6] text-[#333333]">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 6: TESTIMONIALS — 1 Prominent + 2 Supporting (Page Ground #f1f3e6)
         ========================================================================= */}
      <section className="bg-[#f1f3e6] pt-12 pb-[64px] lg:pt-16 lg:pb-[85px]">
        <div className="mx-auto max-w-[1200px] px-6 space-y-10">
          {/* Prominent Featured Quote */}
          <div className="rounded-[8px] border border-[#d3d4c8] bg-[#e9eade] p-8 lg:p-12 space-y-6">
            <blockquote className="text-[24px] lg:text-[32px] font-medium leading-[1.32] tracking-[-0.015em] text-[#000000] max-w-4xl">
              &ldquo;I wrote a 400-word draft about our clinical scheduling tool. VentureProbe pulled out every customer segment and pricing assumption immediately, asked three sharp questions about clinic procurement, and flagged an incumbent lock-in risk we hadn&rsquo;t modeled.&rdquo;
            </blockquote>

            <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-[#d3d4c8]">
              <div className="flex items-center gap-3.5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[8px] bg-[#3f6212] text-sm font-bold text-[#fcfcfd]">
                  DL
                </div>
                <div>
                  <div className="text-[15px] font-bold text-[#000000]">David Lin</div>
                  <div className="text-[13px] text-[#4d4c4c]">Founder, CareGrid Systems</div>
                </div>
              </div>
              <span className="text-sm font-semibold text-[#3f6212]">
                Signed 4 paid clinic pilots before MVP launch
              </span>
            </div>
          </div>

          {/* Supporting Quotes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {SUPPORTING_TESTIMONIALS.map((item) => (
              <div
                key={item.name}
                className="rounded-[8px] border border-[#d3d4c8] bg-[#e9eade] p-6 lg:p-8 flex flex-col justify-between gap-6"
              >
                <blockquote className="text-[16px] leading-[1.6] text-[#333333]">
                  &ldquo;{item.quote}&rdquo;
                </blockquote>

                <div className="flex items-center justify-between gap-4 pt-4 border-t border-[#d3d4c8]">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[8px] border border-[#d3d4c8] bg-[#f1f3e6] text-xs font-bold text-[#000000]">
                      {item.initials}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-[#000000]">{item.name}</div>
                      <div className="text-xs text-[#4d4c4c]">{item.role}</div>
                    </div>
                  </div>
                  <span className="text-xs font-medium text-[#3f6212] text-right">
                    {item.outcome}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 7: PRICING — 3 Plans Side by Side (Alternate Ground #e9eade)
         ========================================================================= */}
      <section id="pricing" className="bg-[#e9eade] pt-[85px] pb-12 lg:pt-[128px] lg:pb-16">
        <div className="mx-auto max-w-[1200px] px-6 space-y-12">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold text-[#3f6212] mb-3">
              Pricing
            </p>
            <h2 className="text-[36px] lg:text-[46px] font-bold leading-[1.1] tracking-[-0.025em] text-[#000000] [text-wrap:balance]">
              Simple plans matched to how often you test ideas.
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
            {PRICING_PLANS.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-[8px] p-7 lg:p-8 flex flex-col justify-between gap-8 ${
                  plan.recommended
                    ? 'border-2 border-[#3f6212] bg-[#f1f3e6]'
                    : 'border border-[#d3d4c8] bg-[#f1f3e6]/70'
                }`}
              >
                <div className="space-y-5">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-[20px] font-bold text-[#000000]">{plan.name}</h3>
                    {plan.recommended && (
                      <span className="text-xs font-bold text-[#3f6212]">
                        Recommended
                      </span>
                    )}
                  </div>

                  <div className="flex items-baseline gap-2 tabular-nums">
                    <span className="text-[40px] font-extrabold tracking-tight text-[#000000]">
                      {plan.price}
                    </span>
                    <span className="text-sm text-[#4d4c4c]">{plan.cadence}</span>
                  </div>

                  <p className="text-[15px] leading-[1.55] text-[#333333]">
                    {plan.description}
                  </p>

                  <ul className="space-y-3 pt-4 border-t border-[#d3d4c8] text-[15px] text-[#333333]">
                    {plan.features.map((feat) => (
                      <li key={feat} className="flex items-start gap-2.5">
                        <Check className="h-4 w-4 text-[#3f6212] shrink-0 mt-1" aria-hidden="true" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={focusComposer}
                  className={`w-full whitespace-nowrap rounded-[8px] px-5 py-3 text-[15px] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3f6212] ${
                    plan.recommended
                      ? 'bg-[#3f6212] text-[#fcfcfd] hover:bg-[#365314]'
                      : 'border border-[#d3d4c8] bg-transparent text-[#000000] hover:bg-[#e9eade]'
                  }`}
                >
                  {plan.ctaLabel}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 8: FAQ — 6 Expandable Questions (Alternate Ground #e9eade)
         ========================================================================= */}
      <section id="faq" className="bg-[#e9eade] pt-12 pb-[64px] lg:pt-16 lg:pb-[85px]">
        <div className="mx-auto max-w-[1200px] px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12">
            <div className="lg:col-span-4 space-y-3">
              <p className="text-sm font-semibold text-[#3f6212]">
                Questions
              </p>
              <h2 className="text-[34px] lg:text-[42px] font-bold leading-[1.1] tracking-[-0.02em] text-[#000000] [text-wrap:balance]">
                Frequently asked questions.
              </h2>
              <p className="text-[15px] leading-[1.6] text-[#4d4c4c]">
                Open any question below—or several at once—to see how VentureProbe evaluates startup evidence.
              </p>
            </div>

            <div className="lg:col-span-8 divide-y divide-[#d3d4c8] border-y border-[#d3d4c8]">
              {FAQ_ITEMS.map((item, idx) => {
                const isOpen = openFaqIndices.has(idx);
                return (
                  <div key={item.q} className="py-5">
                    <button
                      type="button"
                      onClick={() => toggleFaq(idx)}
                      aria-expanded={isOpen}
                      className="w-full flex items-center justify-between gap-6 text-left focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#3f6212] rounded"
                    >
                      <span className="text-[17px] font-semibold text-[#000000]">
                        {item.q}
                      </span>
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] border border-[#d3d4c8] text-[#000000]">
                        {isOpen ? (
                          <Minus className="h-4 w-4" aria-hidden="true" />
                        ) : (
                          <Plus className="h-4 w-4" aria-hidden="true" />
                        )}
                      </span>
                    </button>

                    {isOpen && (
                      <p className="mt-3 pr-10 text-[15px] leading-[1.65] text-[#333333]">
                        {item.a}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 9: CLOSING — Inverted Full-Width Banner (#141314)
         ========================================================================= */}
      <section className="bg-[#141314] text-[#fcfcfd] py-[64px] lg:py-[96px]">
        <div className="mx-auto max-w-[1200px] px-6 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="max-w-2xl space-y-3">
            <h2 className="text-[36px] lg:text-[48px] font-bold leading-[1.08] tracking-[-0.025em] text-[#fcfcfd] [text-wrap:balance]">
              Know what could break your startup before you build it.
            </h2>
            <p className="text-[16px] leading-[1.6] text-[#fcfcfd]/75">
              Run a structured 23-dimension intake, stress-test assumptions, and export an audited due-diligence PDF.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={focusComposer}
              className="whitespace-nowrap shrink-0 inline-flex items-center gap-2 rounded-[8px] bg-[#3f6212] px-6 py-3.5 text-[15px] font-semibold text-[#fcfcfd] hover:bg-[#365314] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#fcfcfd]"
            >
              <span>Analyze My Startup</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>

            {onLoadSampleReport && (
              <button
                type="button"
                onClick={onLoadSampleReport}
                className="whitespace-nowrap shrink-0 rounded-[8px] border border-[#fcfcfd]/30 bg-transparent px-6 py-3.5 text-[15px] font-semibold text-[#fcfcfd] hover:bg-[#fcfcfd]/10 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#fcfcfd]"
              >
                View Sample Report
              </button>
            )}
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 10: FOOTER (Page Ground #f1f3e6)
         ========================================================================= */}
      <footer className="bg-[#f1f3e6] border-t border-[#d3d4c8] py-16">
        <div className="mx-auto max-w-[1200px] px-6 space-y-12">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
            {/* Company Details */}
            <div className="md:col-span-5 space-y-4">
              <div className="flex items-center gap-2.5">
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                  className="text-[#3f6212]"
                >
                  <path d="M12 2L21 7.2V16.8L12 22L3 16.8V7.2L12 2Z" fill="currentColor" fillOpacity="0.16" stroke="currentColor" strokeWidth="1.75" />
                  <path d="M12 6.5L16.5 14.5H7.5L12 6.5Z" fill="currentColor" />
                </svg>
                <span className="text-[18px] font-extrabold tracking-tight text-[#000000]">
                  VentureProbe
                </span>
              </div>
              <p className="text-sm leading-[1.6] text-[#333333] max-w-sm">
                Evidence-first startup validation and contrarian due-diligence software for early-stage founders and venture studios.
              </p>
              <div className="flex items-center gap-5 pt-1 text-sm font-medium text-[#333333]">
                <a href="https://x.com" target="_blank" rel="noopener noreferrer" className="hover:text-[#3f6212] transition-colors">
                  X (Twitter)
                </a>
                <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="hover:text-[#3f6212] transition-colors">
                  LinkedIn
                </a>
                <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="hover:text-[#3f6212] transition-colors">
                  GitHub
                </a>
              </div>
            </div>

            {/* 3 Link Columns */}
            <div className="md:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-8 text-sm">
              <div className="space-y-3">
                <h4 className="font-bold text-[#000000]">Product</h4>
                <ul className="space-y-2.5 text-[#4d4c4c]">
                  <li>
                    <a href="#features" className="hover:text-[#000000] transition-colors">23-Dimension Intake</a>
                  </li>
                  <li>
                    <a href="#process" className="hover:text-[#000000] transition-colors">Analyst Interview</a>
                  </li>
                  <li>
                    <a href="#pricing" className="hover:text-[#000000] transition-colors">Plans &amp; Pricing</a>
                  </li>
                  {onLoadSampleReport && (
                    <li>
                      <button
                        type="button"
                        onClick={onLoadSampleReport}
                        className="hover:text-[#000000] transition-colors text-left"
                      >
                        Sample PDF Dossier
                      </button>
                    </li>
                  )}
                </ul>
              </div>

              <div className="space-y-3">
                <h4 className="font-bold text-[#000000]">Methodology</h4>
                <ul className="space-y-2.5 text-[#4d4c4c]">
                  <li>
                    <a href="#features" className="hover:text-[#000000] transition-colors">Source Hierarchy</a>
                  </li>
                  <li>
                    <a href="#features" className="hover:text-[#000000] transition-colors">Kill-Risk Framework</a>
                  </li>
                  <li>
                    <a href="#features" className="hover:text-[#000000] transition-colors">9-Point Quality Audit</a>
                  </li>
                  <li>
                    <a href="#faq" className="hover:text-[#000000] transition-colors">Evidence Standard</a>
                  </li>
                </ul>
              </div>

              <div className="space-y-3">
                <h4 className="font-bold text-[#000000]">Company</h4>
                <ul className="space-y-2.5 text-[#4d4c4c]">
                  <li>
                    <a href="#process" className="hover:text-[#000000] transition-colors">About VentureProbe</a>
                  </li>
                  <li>
                    <a href="#faq" className="hover:text-[#000000] transition-colors">Data Privacy</a>
                  </li>
                  <li>
                    <a href="#faq" className="hover:text-[#000000] transition-colors">FAQ</a>
                  </li>
                  <li>
                    <button
                      type="button"
                      onClick={focusComposer}
                      className="hover:text-[#000000] transition-colors text-left"
                    >
                      Start Analysis
                    </button>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-[#d3d4c8] flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-[#4d4c4c]">
            <span>© 2026 VentureProbe. All rights reserved.</span>
            <span>
              Validation reports organize public evidence and stress-test assumptions; they do not replace legal or financial counsel.
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};
