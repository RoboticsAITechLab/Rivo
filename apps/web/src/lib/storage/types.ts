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

export interface DirectUploadSasOptions {
  schoolId: string;
  category: MediaCategory;
  entityId: string;
  subCategory?: string;
  mimeType: string;
  scope: StorageScope;
  expiresInSeconds?: number; // Default: 900 (15 minutes)
}

export interface DirectUploadSasResult {
  storageKey: string;
  uploadUrl: string; // Direct Azure Blob BlockBlob PUT URL with write-only SAS
  scope: StorageScope;
  expiresAt: string;
  maxSizeBytes: number;
}

export interface MediaStorageService {
  upload(options: UploadOptions): Promise<UploadResult>;
  generateDirectUploadSas(options: DirectUploadSasOptions): Promise<DirectUploadSasResult>;
  getSignedUrl(storageKey: string, expiresInSeconds?: number): Promise<string>;
  delete(storageKey: string): Promise<boolean>;
  exists(storageKey: string): Promise<boolean>;
  isConfigured(): boolean;
}

