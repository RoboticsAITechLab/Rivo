export type StorageScope = 'public' | 'private';

export type MediaCategory =
  | 'teachers'
  | 'students'
  | 'parents'
  | 'staff'
  | 'branding'
  | 'documents';

export interface UploadOptions {
  fileBuffer: Buffer;
  fileName: string;
  mimeType: string;
  schoolId: string;
  category: MediaCategory;
  entityId: string;
  subCategory?: string; // e.g., 'profile', 'birth_certificate', etc.
  scope: StorageScope;
}

export interface UploadResult {
  storageKey: string;
  url: string; // Resolvable URL (signed or public)
  fileName: string;
  fileSize: number;
  mimeType: string;
  scope: StorageScope;
}

export interface SignedUrlOptions {
  storageKey: string;
  expiresInSeconds?: number; // Default: 900 (15 minutes)
}

export interface MediaStorageService {
  upload(options: UploadOptions): Promise<UploadResult>;
  getSignedUrl(storageKey: string, expiresInSeconds?: number): Promise<string>;
  delete(storageKey: string): Promise<boolean>;
  exists(storageKey: string): Promise<boolean>;
  isConfigured(): boolean;
}
