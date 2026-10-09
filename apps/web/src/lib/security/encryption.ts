import crypto from 'crypto';

/**
 * RIVO FIELD-LEVEL ENCRYPTION ENGINE (AES-256-GCM)
 *
 * Implements authenticated encryption at rest for sensitive government
 * identity documents (Aadhaar, PAN, Passport, Voter ID) and sensitive KYC data.
 *
 * Format: enc:v1:<iv_hex>:<tag_hex>:<ciphertext_hex>
 */

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96 bits for GCM
const PREFIX = 'enc:v1:';

const REJECTED_KYC_KEY_PLACEHOLDERS = new Set([
  'replace-with-a-secure-random-32-byte-encryption-key',
  'dev_key',
  'secret',
  'changeme',
]);

export function getKycEncryptionKey(): Buffer {
  const isProd = process.env.NODE_ENV === 'production' || process.env.AUTH_INFRA_MODE === 'production';
  const secret = process.env.KYC_ENCRYPTION_KEY?.trim();

  if (!secret) {
    if (isProd) {
      throw new Error('[SECURITY FATAL] Dedicated KYC_ENCRYPTION_KEY must be configured in production.');
    }
    // Deterministic development fallback key (32 bytes)
    return crypto.createHash('sha256').update('rivo-dev-kyc-encryption-key-fallback-2026').digest();
  }

  if (REJECTED_KYC_KEY_PLACEHOLDERS.has(secret.toLowerCase())) {
    if (isProd) {
      throw new Error('[SECURITY FATAL] Insecure/compromised KYC_ENCRYPTION_KEY placeholder detected in production.');
    }
    return crypto.createHash('sha256').update('rivo-dev-kyc-encryption-key-fallback-2026').digest();
  }

  if (isProd && secret.length < 16) {
    throw new Error('[SECURITY FATAL] Production KYC_ENCRYPTION_KEY must be at least 16 characters long.');
  }

  // Derive exact 256-bit (32 bytes) key using SHA-256
  return crypto.createHash('sha256').update(secret).digest();
}

/**
 * Checks whether a given string is already encrypted with Rivo field encryption format.
 */
export function isEncrypted(value: string | null | undefined): boolean {
  if (!value) return false;
  return value.startsWith(PREFIX);
}

/**
 * Encrypts a sensitive string using AES-256-GCM.
 * If the string is already encrypted or null/empty, returns it as-is (prevents double-encryption).
 */
export function encryptSensitiveField(plainText: string | null | undefined): string | null {
  if (!plainText || plainText.trim() === '') {
    return null;
  }

  const trimmed = plainText.trim();
  if (isEncrypted(trimmed)) {
    return trimmed; // Already encrypted
  }

  const key = getKycEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let ciphertext = cipher.update(trimmed, 'utf8', 'hex');
  ciphertext += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  return `${PREFIX}${iv.toString('hex')}:${authTag.toString('hex')}:${ciphertext}`;
}

/**
 * Decrypts an AES-256-GCM encrypted string.
 * If the value is not encrypted (e.g. legacy plaintext prior to migration), returns it as-is for safe backward compatibility.
 */
export function decryptSensitiveField(encryptedValue: string | null | undefined): string | null {
  if (!encryptedValue) {
    return null;
  }

  if (!isEncrypted(encryptedValue)) {
    // Legacy plaintext support for zero-downtime transition
    return encryptedValue;
  }

  try {
    const parts = encryptedValue.slice(PREFIX.length).split(':');
    if (parts.length !== 3) {
      throw new Error('Malformed encrypted payload structure');
    }

    const [ivHex, tagHex, ciphertextHex] = parts;
    const key = getKycEncryptionKey();
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(tagHex, 'hex');

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(ciphertextHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error: any) {
    console.error('[SECURITY_DECRYPT_ERROR] Failed to decrypt sensitive field:', error.message);
    // Return null or masked fallback to avoid leaking corrupted data
    return null;
  }
}

export const getEncryptionKey = getKycEncryptionKey;

/**
 * Masks sensitive document numbers, showing only the last 4 characters.
 */
export function maskSensitiveDocumentNumber(rawOrDecrypted: string | null | undefined): string {
  if (!rawOrDecrypted) return '';
  const clean = rawOrDecrypted.trim();
  if (clean.length <= 4) return '••••';
  return '•'.repeat(clean.length - 4) + clean.slice(-4);
}
