/**
 * Rivo Production Testing & Observability Center
 * Secret Redaction and Evidence Sanitizer
 */

const SENSITIVE_KEY_PATTERNS = [
  /password/i,
  /secret/i,
  /token/i,
  /auth/i,
  /key/i,
  /credential/i,
  /cookie/i,
  /session/i,
  /bearer/i,
  /connection.*string/i,
  /otp/i,
  /mfa/i,
];

const SENSITIVE_VALUE_REGEXES = [
  // JWT
  /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9._-]{10,}\.[A-Za-z0-9._-]{10,}/g,
  // Azure Connection Strings
  /DefaultEndpointsProtocol=https;AccountName=[^;]+;AccountKey=[^;]+;EndpointSuffix=[^;\s]+/gi,
  // Base64 keys
  /[A-Za-z0-9+/]{40,}={0,2}/g,
  // Passwords / Bearer tokens
  /Bearer\s+[A-Za-z0-9._~+/-]+/gi,
];

/**
 * Sanitizes an object deeply by replacing sensitive keys and value patterns with [REDACTED]
 */
export function sanitizePayload<T>(input: T): T {
  if (input === null || input === undefined) return input;

  if (typeof input === 'string') {
    let sanitized = input as string;
    for (const regex of SENSITIVE_VALUE_REGEXES) {
      sanitized = sanitized.replace(regex, '[REDACTED_CREDENTIAL]');
    }
    return sanitized as unknown as T;
  }

  if (Array.isArray(input)) {
    return input.map((item) => sanitizePayload(item)) as any;
  }

  if (typeof input === 'object') {
    const copy: Record<string, any> = {};
    for (const [key, value] of Object.entries(input)) {
      const isSensitiveKey = SENSITIVE_KEY_PATTERNS.some((pat) => pat.test(key));
      if (isSensitiveKey) {
        copy[key] = '[REDACTED]';
      } else {
        copy[key] = sanitizePayload(value);
      }
    }
    return copy as any;
  }

  return input;
}

/**
 * Sanitizes HTTP Headers map
 */
export function sanitizeHeaders(headers: Record<string, string> | Headers): Record<string, string> {
  const result: Record<string, string> = {};
  if (headers instanceof Headers) {
    headers.forEach((value, key) => {
      const lower = key.toLowerCase();
      if (
        lower === 'authorization' ||
        lower === 'cookie' ||
        lower === 'set-cookie' ||
        lower.includes('secret') ||
        lower.includes('key')
      ) {
        result[key] = '[REDACTED]';
      } else {
        result[key] = value;
      }
    });
  } else {
    for (const [k, v] of Object.entries(headers)) {
      const lower = k.toLowerCase();
      if (
        lower === 'authorization' ||
        lower === 'cookie' ||
        lower === 'set-cookie' ||
        lower.includes('secret') ||
        lower.includes('key')
      ) {
        result[k] = '[REDACTED]';
      } else {
        result[k] = v;
      }
    }
  }
  return result;
}
