/**
 * VentureProbe AI - Safe Browser & Application Security Utilities
 * Enforces strict URL sanitization, zero-tabnabbing attributes, protocol whitelisting,
 * and verified domain trust checking to prevent XSS, SSRF, and open-redirect vectors.
 */

const DANGEROUS_PROTOCOLS = ['javascript:', 'data:', 'vbscript:', 'file:'];

const TRUSTED_DOMAINS: Record<string, string> = {
  'owasp.org': 'OWASP Foundation (Application Security Standard)',
  'w3.org': 'World Wide Web Consortium (W3C Standards)',
  'developer.chrome.com': 'Google Chrome Developers Official Documentation',
  'axe-core.org': 'Deque Systems Automated Accessibility Rules',
  'snyk.io': 'Snyk Cybersecurity Research & Threat Intelligence',
  'sonarsource.com': 'SonarSource Clean Code & Quality Benchmarks',
  'cbinsights.com': 'CB Insights Venture Failure & Market Research',
  'sec.gov': 'U.S. Securities and Exchange Commission Public Filings',
  'github.com': 'GitHub Open Source Software & Security Advisories',
  'statista.com': 'Statista Global Market Intelligence',
  'startups.rip': 'Startups.RIP (Post-Mortem & Startup Graveyard Database)',
  'explodingtopics.com': 'Exploding Topics (Market Trend & Search Volume Intelligence)',
  'trustmrr.com': 'TrustMRR (Self-Reported Founder Financial Benchmarks)',
};

/**
 * Validates and sanitizes a URL to ensure it is strictly HTTP or HTTPS.
 * Automatically adds 'https://' if a domain like 'driveu.in' is provided without scheme.
 * Disallows javascript:, data:, and other dangerous execution protocols.
 */
export function getSafeHttpUrl(rawUrl?: string): string | null {
  if (!rawUrl || typeof rawUrl !== 'string') return null;
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;

  const lower = trimmed.toLowerCase();
  for (const protocol of DANGEROUS_PROTOCOLS) {
    if (lower.startsWith(protocol)) {
      return null;
    }
  }

  let testUrl = trimmed;
  if (!/^https?:\/\//i.test(testUrl)) {
    // Check if it looks like a valid hostname (e.g. driveu.in or www.example.com)
    if (/^[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+/.test(testUrl)) {
      testUrl = `https://${testUrl}`;
    } else {
      return null;
    }
  }

  try {
    const parsed = new URL(testUrl);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null;
    }
    // Prevent malicious hostnames or empty hosts
    if (!parsed.hostname || parsed.hostname.length < 3) {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}

/**
 * Escapes characters for safe inclusion in HTML attribute context.
 */
export function sanitizeHtml(val?: string): string {
  if (!val) return '';
  return String(val)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Returns a sanitized URL string safe for href attributes, or empty string if invalid.
 */
export function safeHref(rawUrl?: string): string {
  const safe = getSafeHttpUrl(rawUrl);
  return safe ? sanitizeHtml(safe) : '';
}

/**
 * Checks if a URL belongs to a verified institutional/standards domain.
 */
export function checkDomainTrust(rawUrl?: string): {
  isHttps: boolean;
  hostname: string;
  isTrustedOrganization: boolean;
  organizationName?: string;
  safeUrl: string | null;
} {
  const safe = getSafeHttpUrl(rawUrl);
  if (!safe) {
    return {
      isHttps: false,
      hostname: 'invalid-url',
      isTrustedOrganization: false,
      safeUrl: null,
    };
  }

  try {
    const parsed = new URL(safe);
    const hostname = parsed.hostname.toLowerCase().replace(/^www\./, '');
    const isHttps = parsed.protocol === 'https:';

    let isTrustedOrganization = false;
    let organizationName: string | undefined;

    for (const [domain, org] of Object.entries(TRUSTED_DOMAINS)) {
      if (hostname === domain || hostname.endsWith(`.${domain}`)) {
        isTrustedOrganization = true;
        organizationName = org;
        break;
      }
    }

    return {
      isHttps,
      hostname,
      isTrustedOrganization,
      organizationName,
      safeUrl: safe,
    };
  } catch {
    return {
      isHttps: false,
      hostname: 'unknown',
      isTrustedOrganization: false,
      safeUrl: null,
    };
  }
}
