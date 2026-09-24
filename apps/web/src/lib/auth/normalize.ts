/**
 * Phone and Email Normalization Utilities for Rivo
 * Ensures consistent canonical formatting across registration, lookup, and authentication.
 */

export interface PhoneNormalizationOptions {
  defaultCountryCode?: string; // Default '91' for India
}

/**
 * Normalizes phone numbers to standard E.164 format.
 * Examples for defaultCountryCode = '91':
 * - "9876543210" -> "+919876543210"
 * - "+91 98765 43210" -> "+919876543210"
 * - "+919876543210" -> "+919876543210"
 * - "09876543210" -> "+919876543210"
 */
export function normalizePhone(
  rawPhone: string | null | undefined,
  options: PhoneNormalizationOptions = {}
): string | null {
  if (!rawPhone || typeof rawPhone !== 'string') {
    return null;
  }

  // Remove whitespace, dashes, dots, parentheses
  const cleaned = rawPhone.replace(/[\s\-\.\(\)]/g, '').trim();
  if (!cleaned) return null;

  const defaultCode = options.defaultCountryCode || '91';

  // If already starts with '+'
  if (cleaned.startsWith('+')) {
    const digitsOnly = cleaned.slice(1);
    if (!/^\d{7,15}$/.test(digitsOnly)) {
      return null;
    }
    return `+${digitsOnly}`;
  }

  // If starts with 00 (international prefix)
  if (cleaned.startsWith('00')) {
    const digitsOnly = cleaned.slice(2);
    if (!/^\d{7,15}$/.test(digitsOnly)) {
      return null;
    }
    return `+${digitsOnly}`;
  }

  // If standard Indian 10-digit mobile starting with 6-9
  if (/^[6-9]\d{9}$/.test(cleaned)) {
    return `+${defaultCode}${cleaned}`;
  }

  // If 11 digits starting with 0 (e.g. 09876543210)
  if (/^0[6-9]\d{9}$/.test(cleaned)) {
    return `+${defaultCode}${cleaned.slice(1)}`;
  }

  // If 12 digits starting with 91 (e.g. 919876543210)
  if (/^91[6-9]\d{9}$/.test(cleaned)) {
    return `+${cleaned}`;
  }

  // Other numeric sequence between 8 and 15 digits
  if (/^\d{8,15}$/.test(cleaned)) {
    if (cleaned.length === 10) {
      return `+${defaultCode}${cleaned}`;
    }
    return `+${cleaned}`;
  }

  return null;
}

/**
 * Normalizes email address to trimmed lowercase.
 */
export function normalizeEmail(rawEmail: string | null | undefined): string | null {
  if (!rawEmail || typeof rawEmail !== 'string') {
    return null;
  }

  const trimmed = rawEmail.trim().toLowerCase();
  // Standard RFC-compliant email regex
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(trimmed)) {
    return null;
  }

  return trimmed;
}

/**
 * Masks a phone number for user-facing security feedback.
 * e.g. "+919876543210" -> "+91 ••••• •3210"
 */
export function maskPhone(phone: string): string {
  const norm = normalizePhone(phone) || phone;
  if (norm.length >= 10) {
    const prefix = norm.slice(0, 3);
    const suffix = norm.slice(-4);
    return `${prefix} ••••• •${suffix}`;
  }
  return '••••••••••';
}

/**
 * Masks an email for user-facing security feedback.
 * e.g. "parent.test@example.com" -> "p•••••t@example.com"
 */
export function maskEmail(email: string): string {
  const norm = normalizeEmail(email) || email;
  const parts = norm.split('@');
  if (parts.length === 2) {
    const user = parts[0];
    const domain = parts[1];
    if (user.length <= 2) {
      return `${user[0]}*@${domain}`;
    }
    return `${user[0]}••••${user[user.length - 1]}@${domain}`;
  }
  return '••••@••••.com';
}
