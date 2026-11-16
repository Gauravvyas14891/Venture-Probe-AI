import { jsPDF } from 'jspdf';
import { ResearchReport } from '../types';

export function downloadReportAsPdf(report: ResearchReport): void {
  const {
    profile,
    executiveSummary,
    marketIntelligence,
    competitors,
    tryToKillMyStartup,
    validationExperiments,
    strategy,
    sources,
    qualityAudit,
  } = report;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 16;
  const maxLineWidth = pageWidth - margin * 2;
  let y = 18;

  const ensureSpace = (neededHeight: number) => {
    if (y + neededHeight > pageHeight - 16) {
      doc.addPage();
      y = 18;
    }
  };

  const addHeading = (text: string) => {
    ensureSpace(14);
    y += 4;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(63, 98, 18); // #3f6212
    doc.text(text, margin, y);
    y += 2;
    doc.setDrawColor(211, 212, 200);
    doc.line(margin, y, pageWidth - margin, y);
    y += 6;
  };

  const addSubheading = (text: string) => {
    ensureSpace(8);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(20, 19, 20);
    const lines = doc.splitTextToSize(text, maxLineWidth);
    doc.text(lines, margin, y);
    y += lines.length * 4.8 + 1;
  };

  const addParagraph = (text: string, color: [number, number, number] = [51, 51, 51]) => {
    if (!text) return;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(color[0], color[1], color[2]);
    const lines = doc.splitTextToSize(text, maxLineWidth);
    ensureSpace(lines.length * 4.4 + 3);
    doc.text(lines, margin, y);
    y += lines.length * 4.4 + 2.5;
  };

  const addBullet = (text: string) => {
    if (!text) return;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.2);
    doc.setTextColor(51, 51, 51);
    const lines = doc.splitTextToSize(`• ${text}`, maxLineWidth - 3);
    ensureSpace(lines.length * 4.3 + 2);
    doc.text(lines, margin + 2, y);
    y += lines.length * 4.3 + 1.5;
  };

  // Document Header
  doc.setFillColor(241, 243, 230); // #f1f3e6
  doc.rect(0, 0, pageWidth, 34, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(63, 98, 18);
  doc.text('VENTUREPROBE DUE-DILIGENCE REPORT', margin, 11);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(19);
  doc.setTextColor(0, 0, 0);
  const titleLines = doc.splitTextToSize(profile.startupName || 'Startup Validation Report', maxLineWidth);
  doc.text(titleLines, margin, 19);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(77, 76, 76);
  const generatedDate = new Date(report.generatedAt || Date.now()).toLocaleDateString();
  const auditLabel = qualityAudit?.status === 'PASS' ? 'Quality Audit: PASS' : 'Quality Audit: Preliminary';
  doc.text(`Generated ${generatedDate}  |  ${profile.customerModel || 'Startup'}  |  ${auditLabel}`, margin, 29);

  y = 42;

  // 1. Executive Summary
  addHeading('1. Executive Summary & Feasibility Verdict');
  const verdictMap: Record<string, string> = {
    STRONG_SIGNALS_PROCEED: 'Strong Signals — Proceed to Seed Validation',
    VALIDATION_PREREQUISITES_REQUIRED: 'Validation Prerequisites Required Before Code',
    HIGH_RISK_PIVOT_RECOMMENDED: 'High Risk — Strategic Pivot Recommended',
    INSUFFICIENT_EVIDENCE: 'Insufficient Evidence — Primary Research Needed',
  };
  addSubheading(`Verdict: ${verdictMap[executiveSummary.overallFeasibilityVerdict] || executiveSummary.overallFeasibilityVerdict}`);
  addParagraph(executiveSummary.ideaSynthesis);
  addSubheading('Target Customer & Core Problem');
  addParagraph(`${executiveSummary.targetCustomerSummary} ${executiveSummary.coreProblemVerdict}`);
  addSubheading('Predominant Risk & Key Next Action');
  addParagraph(`Primary Risk: ${executiveSummary.predominantRisk}`);
  addParagraph(`Next Action: ${executiveSummary.keyNextAction}`);
  addParagraph(executiveSummary.executiveConclusion);

  // 2. Market Intelligence
  addHeading('2. Market Intelligence');
  addBullet(`TAM: ${marketIntelligence.tamEstimateRange}`);
  addBullet(`SAM: ${marketIntelligence.samEstimateRange}`);
  addBullet(`SOM: ${marketIntelligence.somEstimateRange}`);
  addBullet(`Growth Rate (CAGR): ${marketIntelligence.growthRateCAGR} | Maturity: ${marketIntelligence.marketMaturity}`);

  // 3. Competitor Landscape
  if (competitors && competitors.length > 0) {
    addHeading('3. Competitor Teardown');
    competitors.slice(0, 6).forEach((comp) => {
      addSubheading(`${comp.name} (${comp.type} · ${comp.country})`);
      addParagraph(`${comp.productDescription} Pricing: ${comp.pricingModel || 'Unverified'}.`);
      if (comp.keyWeaknesses && comp.keyWeaknesses.length > 0) {
        addBullet(`Key Gaps: ${comp.keyWeaknesses.slice(0, 3).join('; ')}`);
      }
    });
  }

  // 4. Contrarian Audit ("Try To Kill My Startup")
  addHeading('4. Contrarian Audit — Ranked Kill Risks');
  addParagraph(tryToKillMyStartup.hostileInvestorPerspective);
  tryToKillMyStartup.rankedKillRisks.forEach((risk) => {
    addSubheading(`#${risk.rank}. ${risk.title}`);
    addParagraph(risk.hostileInvestorArgument);
    addBullet(`Fatal Threshold: ${risk.killThreshold}`);
  });

  // 5. Validation Experiments
  if (validationExperiments && validationExperiments.length > 0) {
    addHeading('5. Falsification Experiments Before Building');
    validationExperiments.forEach((exp) => {
      addSubheading(`${exp.name} (${exp.type})`);
      addParagraph(`Hypothesis: ${exp.hypothesis}`);
      addBullet(`Budget & Timeline: ${exp.estimatedCost} · ${exp.estimatedDuration} · Sample: ${exp.sampleSize}`);
      addBullet(`Pass Threshold: ${exp.successThreshold}`);
      addBullet(`Fail Threshold: ${exp.failureThreshold}`);
    });
  }

  // 6. 30 / 60 / 90-Day Strategy
  addHeading('6. 30 / 60 / 90-Day Execution Roadmap');
  addSubheading('Days 1–30: Validation & Discovery');
  strategy.thirtyDayPlan?.forEach((p) => addBullet(p));
  addSubheading('Days 31–60: Lightweight Prototype');
  strategy.sixtyDayPlan?.forEach((p) => addBullet(p));
  addSubheading('Days 61–90: Monetization & Retention');
  strategy.ninetyDayPlan?.forEach((p) => addBullet(p));

  // 7. Verified Sources
  if (sources && sources.length > 0) {
    addHeading('7. Referenced Research Sources');
    sources.slice(0, 12).forEach((src, i) => {
      addBullet(`[${i + 1}] ${src.title} — ${src.publisher}${src.url ? ` (${src.url})` : ''}`);
    });
  }

  // Footer Disclaimer on last page
  ensureSpace(16);
  y += 4;
  doc.setDrawColor(211, 212, 200);
  doc.line(margin, y, pageWidth - margin, y);
  y += 5;
  addParagraph(report.reportDisclaimer || 'Generated by VentureProbe. Evidence-first startup due diligence.', [77, 76, 76]);

  const safeFilename = (profile.startupName || 'ventureprobe-report')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  doc.save(`${safeFilename}-validation-report.pdf`);
}
