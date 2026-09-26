import crypto from 'crypto';
import { MediaCategory } from './types';

export const MAX_AVATAR_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB
export const MAX_BRANDING_SIZE_BYTES = 3 * 1024 * 1024; // 3 MB
export const MAX_DOCUMENT_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export const ALLOWED_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
];

export const ALLOWED_DOCUMENT_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
];

export interface ValidationResult {
  valid: boolean;
  error?: string;
  sanitizedExtension?: string;
}

/**
 * Validates file size against category threshold
 */
export function validateFileSize(buffer: Buffer, category: MediaCategory): ValidationResult {
  const maxBytes =
    category === 'documents'
      ? MAX_DOCUMENT_SIZE_BYTES
      : category === 'branding'
      ? MAX_BRANDING_SIZE_BYTES
      : MAX_AVATAR_SIZE_BYTES;

  if (buffer.length > maxBytes) {
    const maxMb = Math.round(maxBytes / (1024 * 1024));
    return {
      valid: false,
      error: `File size exceeds maximum allowed limit of ${maxMb}MB`,
    };
  }
  return { valid: true };
}

/**
 * Validates image or document magic bytes for authenticity
 */
export function validateMagicBytes(buffer: Buffer, mimeType: string, category: MediaCategory): ValidationResult {
  if (buffer.length < 4) {
    return { valid: false, error: 'Corrupt or unreadable file buffer' };
  }

  // Magic bytes checks
  const isJpeg = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  const isPng = buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47;
  const isWebp =
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buffer.subarray(8, 12).toString('ascii') === 'WEBP';
  const isPdf =
    buffer.length >= 5 &&
    buffer.subarray(0, 5).toString('ascii') === '%PDF-';

  if (category === 'documents') {
    if (mimeType === 'application/pdf') {
      if (!isPdf) return { valid: false, error: 'File contents do not match authentic PDF signature.' };
      return { valid: true, sanitizedExtension: 'pdf' };
    }
  }

  if (isJpeg) return { valid: true, sanitizedExtension: 'jpg' };
  if (isPng) return { valid: true, sanitizedExtension: 'png' };
  if (isWebp) return { valid: true, sanitizedExtension: 'webp' };

  return {
    valid: false,
    error: 'File contents do not match authentic image/document signatures.',
  };
}

/**
 * Validates MIME type declared by client
 */
export function validateMimeType(mimeType: string, category: MediaCategory): ValidationResult {
  const allowed = category === 'documents' ? ALLOWED_DOCUMENT_MIME_TYPES : ALLOWED_IMAGE_MIME_TYPES;
  if (!allowed.includes(mimeType.toLowerCase())) {
    return {
      valid: false,
      error: `Invalid file format. Allowed formats: ${allowed.join(', ')}`,
    };
  }
  return { valid: true };
}

/**
 * Generates a deterministic, tenant-isolated storage key
 * Format: schools/{schoolId}/{category}/{entityId}/{subCategory}/{randomToken}.{ext}
 */
export function generateStorageKey(params: {
  schoolId: string;
  category: MediaCategory;
  entityId: string;
  subCategory?: string;
  extension: string;
}): string {
  // Sanitize path components to prevent path traversal
  const cleanSchoolId = params.schoolId.replace(/[^a-zA-Z0-9_-]/g, '');
  const cleanCategory = params.category.replace(/[^a-zA-Z0-9_-]/g, '');
  const cleanEntityId = params.entityId.replace(/[^a-zA-Z0-9_-]/g, '');
  const cleanSub = (params.subCategory || 'default').replace(/[^a-zA-Z0-9_-]/g, '');
  const cleanExt = params.extension.replace(/[^a-zA-Z0-9]/g, '');

  const assetToken = crypto.randomBytes(16).toString('hex');
  return `schools/${cleanSchoolId}/${cleanCategory}/${cleanEntityId}/${cleanSub}/${assetToken}.${cleanExt}`;
}
