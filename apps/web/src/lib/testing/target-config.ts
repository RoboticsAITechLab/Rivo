/**
 * Rivo Production Testing & Observability Center
 * Target Environment Configuration & Strict SSRF Guard
 */

export const DEFAULT_PRODUCTION_TARGET = 'https://rivo-web-sand.vercel.app';

// Approved Target Hosts for Testing
export const ALLOWED_TARGET_HOSTS = new Set([
  'rivo-web-sand.vercel.app',
  'rivo-kvcen28ku-ankit-kumars-projects-256d2abf.vercel.app',
  'localhost',
  '127.0.0.1',
]);

// IP ranges blocked to prevent SSRF
const BLOCKED_IP_PATTERNS = [
  /^127\./,
  /^10\./,
  /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
  /^192\.168\./,
  /^169\.254\./, // AWS/Cloud Instance Metadata
  /^0\./,
  /^::1$/,
  /^fc00:/i,
  /^fe80:/i,
];

export interface ValidatedTarget {
  url: string;
  host: string;
  isLocal: boolean;
  isProduction: boolean;
}

/**
 * Validates that a requested target URL is in the approved host allowlist
 * and strictly prevents Server-Side Request Forgery (SSRF).
 */
export function validateTargetUrl(rawUrl?: string | null): ValidatedTarget {
  const targetToValidate = (rawUrl?.trim() || DEFAULT_PRODUCTION_TARGET).trim();

  let parsed: URL;
  try {
    parsed = new URL(targetToValidate);
  } catch {
    throw new Error(`Invalid target URL structure: "${targetToValidate}"`);
  }

  const hostname = parsed.hostname.toLowerCase();
  const protocol = parsed.protocol.toLowerCase();

  // 1. Only HTTPS allowed for remote targets; HTTP allowed ONLY for local development
  const isLocalHost = hostname === 'localhost' || hostname === '127.0.0.1';
  if (!isLocalHost && protocol !== 'https:') {
    throw new Error('Only HTTPS protocol is permitted for remote testing targets.');
  }

  // 2. Strict Host Allowlist Check
  if (!ALLOWED_TARGET_HOSTS.has(hostname)) {
    throw new Error(
      `Security Violation: Target host "${hostname}" is not in the approved allowlist. Testing is restricted to approved Rivo deployment environments.`
    );
  }

  // 3. Block private IP / Metadata SSRF attempts unless explicitly running local tests
  if (!isLocalHost) {
    for (const pattern of BLOCKED_IP_PATTERNS) {
      if (pattern.test(hostname)) {
        throw new Error(`Security Violation: Private IP / Metadata addresses are strictly forbidden (${hostname}).`);
      }
    }
  }

  // Normalize URL without trailing slash
  const cleanUrl = `${parsed.protocol}//${parsed.host}`;

  return {
    url: cleanUrl,
    host: parsed.host,
    isLocal: isLocalHost,
    isProduction: hostname.includes('rivo-web-sand.vercel.app'),
  };
}
