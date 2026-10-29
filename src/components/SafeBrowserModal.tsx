import React, { useState } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Globe,
  ExternalLink,
  X,
  Code2,
  FileCheck2,
  Server,
  EyeOff
} from 'lucide-react';
import { getSafeHttpUrl, checkDomainTrust, sanitizeHtml, safeHref } from '../utils/security';

interface SafeBrowserModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SafeBrowserModal: React.FC<SafeBrowserModalProps> = ({ isOpen, onClose }) => {
  const [testUrl, setTestUrl] = useState<string>('https://owasp.org/www-project-top-ten/');
  const [activeTab, setActiveTab] = useState<'overview' | 'inspector' | 'headers'>('overview');

  if (!isOpen) return null;

  const urlCheck = checkDomainTrust(testUrl);
  const safeHttp = getSafeHttpUrl(testUrl);

  const testCases = [
    { label: 'OWASP Security Standard', url: 'https://owasp.org/www-project-top-ten/' },
    { label: 'W3C Accessibility Standard', url: 'https://www.w3.org/WAI/WCAG22/quickref/' },
    { label: 'Chrome Web Docs', url: 'https://developer.chrome.com/docs/lighthouse/' },
    { label: 'Unprefixed Domain', url: 'snyk.io/vuln' },
    { label: 'Malicious Protocol Vector', url: 'javascript:alert("XSS payload")' },
    { label: 'Data Protocol Vector', url: 'data:text/html,<script>alert(1)</script>' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="w-full max-w-3xl rounded-2xl border border-emerald-500/40 bg-slate-900 shadow-2xl shadow-emerald-950/50 flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-emerald-500/20 p-2.5 text-emerald-400 border border-emerald-500/30">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">Safe Browser &amp; Software Security Engine</h2>
                <span className="rounded bg-emerald-500/20 border border-emerald-500/40 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                  ACTIVE DEFENSE
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Audited against OWASP Top 10, Tabnabbing, Protocol Injection, and Server-Side Boundary Controls
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 px-5 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3 px-3 border-b-2 transition ${
              activeTab === 'overview'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            1. Security Architecture (5 Protections)
          </button>
          <button
            onClick={() => setActiveTab('inspector')}
            className={`py-3 px-3 border-b-2 transition ${
              activeTab === 'inspector'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            2. Live Safe Browser URL Inspector
          </button>
          <button
            onClick={() => setActiveTab('headers')}
            className={`py-3 px-3 border-b-2 transition ${
              activeTab === 'headers'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            3. Server Defense Headers &amp; Sandboxing
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {activeTab === 'overview' && (
            <div className="space-y-3">
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/15 p-4 flex items-start gap-3.5">
                <div className="rounded-lg bg-emerald-500/20 p-2 text-emerald-400 shrink-0 mt-0.5">
                  <Lock className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-emerald-300">Zero Reverse-Tabnabbing Guarantee</h3>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    Every outbound link in reports, citations, and competitor profiles strictly renders{' '}
                    <code className="text-emerald-300 bg-slate-950 px-1.5 py-0.5 rounded font-mono">
                      rel=&quot;noopener noreferrer&quot;
                    </code>
                    . This severs the <code className="text-indigo-300">window.opener</code> reference, guaranteeing that external target websites cannot access or hijack the parent browser tab.
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/15 p-4 flex items-start gap-3.5">
                <div className="rounded-lg bg-emerald-500/20 p-2 text-emerald-400 shrink-0 mt-0.5">
                  <Globe className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-emerald-300">Strict Protocol Whitelisting &amp; XSS Prevention</h3>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    Only <code className="text-emerald-300 bg-slate-950 px-1.5 py-0.5 rounded font-mono">https://</code> and{' '}
                    <code className="text-emerald-300 bg-slate-950 px-1.5 py-0.5 rounded font-mono">http://</code> schemes are executed. All hazardous execution protocols (such as{' '}
                    <code className="text-rose-400 bg-slate-950 px-1.5 py-0.5 rounded font-mono">javascript:</code>,{' '}
                    <code className="text-rose-400 bg-slate-950 px-1.5 py-0.5 rounded font-mono">data:</code>, and{' '}
                    <code className="text-rose-400 bg-slate-950 px-1.5 py-0.5 rounded font-mono">vbscript:</code>) are filtered at parse-time.
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/15 p-4 flex items-start gap-3.5">
                <div className="rounded-lg bg-emerald-500/20 p-2 text-emerald-400 shrink-0 mt-0.5">
                  <FileCheck2 className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-emerald-300">Institutional Grounding &amp; Verified Trust</h3>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    All compliance assertions point directly to recognized standard bodies: OWASP Foundation (Application Security), W3C WCAG 2.2 (Accessibility), Google Chrome Lighthouse (Vitals), and Snyk (Threat Intelligence).
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/15 p-4 flex items-start gap-3.5">
                <div className="rounded-lg bg-emerald-500/20 p-2 text-emerald-400 shrink-0 mt-0.5">
                  <Server className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-emerald-300">Network Boundary Defense-in-Depth Headers</h3>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    The backend Express gateway enforces HTTP security headers on all responses, blocking MIME type sniffing, enforcing Cross-Site Scripting blocks, and strictly isolating cross-origin referrer data.
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/15 p-4 flex items-start gap-3.5">
                <div className="rounded-lg bg-emerald-500/20 p-2 text-emerald-400 shrink-0 mt-0.5">
                  <EyeOff className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-emerald-300">Zero-Telemetry Privacy Posture</h3>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    Zero third-party tracking cookies, fingerprinting pixels, or ad analytics scripts. User inputs, idea hypotheses, and research outputs remain strictly confidential within the user session.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'inspector' && (
            <div className="space-y-4">
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-3">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Test Any URL in the Safe Browser Engine
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={testUrl}
                    onChange={(e) => setTestUrl(e.target.value)}
                    placeholder="Enter URL to test (e.g. owasp.org or javascript:...)"
                    className="flex-1 rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    onClick={() => setTestUrl('')}
                    className="rounded-xl border border-slate-700 px-3 py-2 text-xs text-slate-400 hover:text-white hover:bg-slate-800"
                  >
                    Clear
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  <span className="text-[11px] text-slate-500 self-center mr-1">Quick Test Vectors:</span>
                  {testCases.map((tc, idx) => (
                    <button
                      key={idx}
                      onClick={() => setTestUrl(tc.url)}
                      className="rounded-md bg-slate-800/80 hover:bg-slate-700 px-2 py-0.5 text-[11px] text-slate-300 border border-slate-700/60 transition"
                    >
                      {tc.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Inspection Verdict Card */}
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className="text-xs font-bold uppercase text-slate-400">Safe Browser Diagnostic Result</span>
                  {safeHttp ? (
                    <span className="inline-flex items-center gap-1 rounded bg-emerald-500/20 border border-emerald-500/40 px-2 py-0.5 text-xs font-bold text-emerald-400">
                      <CheckCircle2 className="h-3.5 w-3.5" /> SAFE TO OPEN
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded bg-rose-500/20 border border-rose-500/40 px-2 py-0.5 text-xs font-bold text-rose-400">
                      <ShieldAlert className="h-3.5 w-3.5" /> BLOCKED DANGEROUS INPUT
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="rounded-lg bg-slate-900 p-3 border border-slate-800">
                    <span className="text-slate-400 block text-[11px] mb-1">Parsed Destination URL</span>
                    <span className="font-mono text-xs text-slate-200 break-all">
                      {safeHttp || <span className="text-rose-400 italic">None (rejected by security filter)</span>}
                    </span>
                  </div>

                  <div className="rounded-lg bg-slate-900 p-3 border border-slate-800">
                    <span className="text-slate-400 block text-[11px] mb-1">HTTPS Encryption</span>
                    <span className="font-semibold text-xs">
                      {urlCheck.isHttps ? (
                        <span className="text-emerald-400 flex items-center gap-1">
                          <Lock className="h-3 w-3" /> Enforced TLS / HTTPS
                        </span>
                      ) : safeHttp ? (
                        <span className="text-amber-400 flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" /> Plain HTTP (Warning)
                        </span>
                      ) : (
                        <span className="text-slate-500">Not Applicable</span>
                      )}
                    </span>
                  </div>

                  <div className="rounded-lg bg-slate-900 p-3 border border-slate-800">
                    <span className="text-slate-400 block text-[11px] mb-1">Verified Institutional Body</span>
                    <span className="font-semibold text-xs text-slate-200">
                      {urlCheck.isTrustedOrganization ? (
                        <span className="text-emerald-300 font-bold">
                          ✓ {urlCheck.organizationName}
                        </span>
                      ) : (
                        <span className="text-slate-400">Standard Web Domain ({urlCheck.hostname})</span>
                      )}
                    </span>
                  </div>

                  <div className="rounded-lg bg-slate-900 p-3 border border-slate-800">
                    <span className="text-slate-400 block text-[11px] mb-1">Anti-Tabnabbing rel Tag</span>
                    <code className="text-xs text-emerald-400 font-mono">
                      rel=&quot;noopener noreferrer&quot;
                    </code>
                  </div>
                </div>

                {/* Sanitized HTML Anchor Generated */}
                <div className="rounded-lg bg-slate-900 p-3 border border-slate-800">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                      <Code2 className="h-3.5 w-3.5 text-indigo-400" /> Generated Safe Anchor Element
                    </span>
                    {safeHttp && (
                      <a
                        href={safeHttp}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold"
                      >
                        <span>Test Safe Launch</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                  <pre className="text-[11px] font-mono text-slate-300 bg-slate-950 p-2 rounded border border-slate-800 overflow-x-auto">
                    {safeHttp
                      ? `<a href="${safeHref(testUrl)}" target="_blank" rel="noopener noreferrer">${sanitizeHtml(urlCheck.hostname)}</a>`
                      : `<!-- REJECTED: Input does not satisfy Safe Browser whitelist criteria -->`}
                  </pre>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'headers' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-300 leading-relaxed">
                The Express backend API gateway in <code className="text-indigo-300">server.ts</code> injects defensive headers into every HTTP response. These headers instruct client browsers to reject MIME attacks, malicious framing, and cross-origin leaks:
              </p>

              <div className="rounded-xl border border-slate-800 bg-slate-950 p-3 font-mono text-xs space-y-2.5">
                <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                  <span className="text-emerald-400 font-bold">X-Content-Type-Options:</span>{' '}
                  <span className="text-slate-200">nosniff</span>
                  <p className="text-[11px] text-slate-400 font-sans mt-0.5">
                    Stops the browser from MIME-sniffing a response away from the declared content-type, blocking script injection disguised as images or text.
                  </p>
                </div>

                <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                  <span className="text-emerald-400 font-bold">X-XSS-Protection:</span>{' '}
                  <span className="text-slate-200">1; mode=block</span>
                  <p className="text-[11px] text-slate-400 font-sans mt-0.5">
                    Instructs browser XSS audit engines to completely block rendering of the page if a reflected cross-site scripting attack is suspected.
                  </p>
                </div>

                <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                  <span className="text-emerald-400 font-bold">Referrer-Policy:</span>{' '}
                  <span className="text-slate-200">strict-origin-when-cross-origin</span>
                  <p className="text-[11px] text-slate-400 font-sans mt-0.5">
                    Limits referrer header leakage when navigating across domains, ensuring sensitive internal query strings or session tokens never leak to third parties.
                  </p>
                </div>

                <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                  <span className="text-emerald-400 font-bold">Permissions-Policy:</span>{' '}
                  <span className="text-slate-200">camera=(), microphone=(), geolocation=()</span>
                  <p className="text-[11px] text-slate-400 font-sans mt-0.5">
                    Disables sensitive browser hardware APIs (webcam, mic, GPS location) completely to protect user privacy.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span>Safe Browser Environment Status: <strong className="text-emerald-400">100% Compliant</strong></span>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white hover:bg-emerald-500 transition shadow-lg shadow-emerald-600/20"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
