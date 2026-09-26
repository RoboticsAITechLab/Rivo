import {
  BlobServiceClient,
  generateBlobSASQueryParameters,
  BlobSASPermissions,
  StorageSharedKeyCredential,
  ContainerClient,
} from '@azure/storage-blob';
import {
  MediaStorageService,
  UploadOptions,
  UploadResult,
  StorageScope,
} from './types';
import {
  validateFileSize,
  validateMimeType,
  validateMagicBytes,
  generateStorageKey,
} from './validation';
import { isProductionMode } from '../redis/client';

export class AzureBlobStorageService implements MediaStorageService {
  private blobServiceClient: BlobServiceClient | null = null;
  private sharedKeyCredential: StorageSharedKeyCredential | null = null;
  private accountName: string | null = null;
  private privateContainerName: string;
  private publicContainerName: string;

  // In-memory fallback store exclusively for local development when Azure credentials are not provided
  private static readonly localDevStore = new Map<
    string,
    { buffer: Buffer; mimeType: string; scope: StorageScope }
  >();

  constructor() {
    this.privateContainerName =
      process.env.AZURE_STORAGE_PRIVATE_CONTAINER || 'rivo-private';
    this.publicContainerName =
      process.env.AZURE_STORAGE_PUBLIC_CONTAINER || 'rivo-public';

    const connStr = process.env.AZURE_STORAGE_CONNECTION_STRING;
    if (connStr && connStr.trim() !== '') {
      try {
        this.blobServiceClient = BlobServiceClient.fromConnectionString(connStr);
        this.extractCredentials(connStr);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error('[STORAGE_INIT_ERROR] Failed to initialize Azure Blob Service Client:', msg);
        this.blobServiceClient = null;
      }
    }
  }

  private extractCredentials(connStr: string): void {
    const matchName = connStr.match(/AccountName=([^;]+)/i);
    const matchKey = connStr.match(/AccountKey=([^;]+)/i);

    if (matchName && matchKey) {
      this.accountName = matchName[1];
      this.sharedKeyCredential = new StorageSharedKeyCredential(
        this.accountName,
        matchKey[1]
      );
    }
  }

  public isConfigured(): boolean {
    return this.blobServiceClient !== null && this.sharedKeyCredential !== null;
  }

  private getContainerClient(scope: StorageScope): ContainerClient {
    if (!this.blobServiceClient) {
      throw new Error('[STORAGE_ERROR] Azure Blob Client is not configured');
    }
    const container =
      scope === 'public' ? this.publicContainerName : this.privateContainerName;
    return this.blobServiceClient.getContainerClient(container);
  }

  /**
   * Uploads an asset to Azure Blob Storage with full validation
   */
  public async upload(options: UploadOptions): Promise<UploadResult> {
    // 1. File size validation
    const sizeCheck = validateFileSize(options.fileBuffer, options.category);
    if (!sizeCheck.valid) {
      throw new Error(sizeCheck.error || 'File size exceeds allowed limit');
    }

    // 2. MIME type validation
    const mimeCheck = validateMimeType(options.mimeType, options.category);
    if (!mimeCheck.valid) {
      throw new Error(mimeCheck.error || 'Invalid file format');
    }

    // 3. Magic-byte authenticity inspection
    const magicCheck = validateMagicBytes(
      options.fileBuffer,
      options.mimeType,
      options.category
    );
    if (!magicCheck.valid) {
      throw new Error(magicCheck.error || 'Authenticity inspection failed');
    }

    const extension = magicCheck.sanitizedExtension || 'bin';

    // 4. Generate deterministic, tenant-isolated storage key
    const storageKey = generateStorageKey({
      schoolId: options.schoolId,
      category: options.category,
      entityId: options.entityId,
      subCategory: options.subCategory,
      extension,
    });

    // 5. Execution: Azure Storage vs Local Dev Mode
    if (this.isConfigured()) {
      try {
        const containerClient = this.getContainerClient(options.scope);
        const blockBlobClient = containerClient.getBlockBlobClient(storageKey);

        await blockBlobClient.uploadData(options.fileBuffer, {
          blobHTTPHeaders: {
            blobContentType: options.mimeType,
            blobCacheControl:
              options.scope === 'public'
                ? 'public, max-age=86400'
                : 'private, no-cache',
          },
        });

        const url =
          options.scope === 'public'
            ? blockBlobClient.url
            : await this.getSignedUrl(storageKey, 900);

        return {
          storageKey,
          url,
          fileName: options.fileName,
          fileSize: options.fileBuffer.length,
          mimeType: options.mimeType,
          scope: options.scope,
        };
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error('[STORAGE_UPLOAD_ERROR] Failed to upload blob to Azure:', msg);
        throw new Error('Storage upload failed. Please try again.');
      }
    }

    // Production mode without Azure Storage strictly fails
    if (isProductionMode()) {
      console.error('[STORAGE_SECURITY] Azure Storage is required in production but missing!');
      throw new Error('Production storage service is not configured');
    }

    // Local Development Fallback (in-memory store, zero local filesystem writes)
    AzureBlobStorageService.localDevStore.set(storageKey, {
      buffer: options.fileBuffer,
      mimeType: options.mimeType,
      scope: options.scope,
    });

    const devDataUrl = `data:${options.mimeType};base64,${options.fileBuffer.toString('base64')}`;

    return {
      storageKey,
      url: devDataUrl,
      fileName: options.fileName,
      fileSize: options.fileBuffer.length,
      mimeType: options.mimeType,
      scope: options.scope,
    };
  }

  /**
   * Generates a short-lived Pre-Signed SAS URL for private media access
   */
  public async getSignedUrl(
    storageKey: string,
    expiresInSeconds = 900
  ): Promise<string> {
    if (this.isConfigured() && this.sharedKeyCredential && this.accountName) {
      try {
        const containerName = this.privateContainerName;
        const now = new Date();
        const startTime = new Date(now.getTime() - 5 * 60 * 1000); // 5 min clock skew tolerance
        const expiryTime = new Date(now.getTime() + expiresInSeconds * 1000);

        const sasToken = generateBlobSASQueryParameters(
          {
            containerName,
            blobName: storageKey,
            permissions: BlobSASPermissions.parse('r'),
            startsOn: startTime,
            expiresOn: expiryTime,
          },
          this.sharedKeyCredential
        ).toString();

        return `https://${this.accountName}.blob.core.windows.net/${containerName}/${storageKey}?${sasToken}`;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error('[STORAGE_SIGNED_URL_ERROR] Failed generating SAS token:', msg);
        throw new Error('Failed to generate authorized access URL');
      }
    }

    if (isProductionMode()) {
      throw new Error('Production storage service is not configured');
    }

    // Local dev fallback
    const local = AzureBlobStorageService.localDevStore.get(storageKey);
    if (local) {
      return `data:${local.mimeType};base64,${local.buffer.toString('base64')}`;
    }

    return `/api/media/preview?key=${encodeURIComponent(storageKey)}`;
  }

  /**
   * Deletes an asset from Azure Blob Storage
   */
  public async delete(storageKey: string): Promise<boolean> {
    if (this.isConfigured()) {
      try {
        // Attempt private container first, then public container if not found
        const privateContainer = this.getContainerClient('private');
        const privateBlob = privateContainer.getBlockBlobClient(storageKey);
        const privateDeleted = await privateBlob.deleteIfExists();

        if (privateDeleted.succeeded) {
          return true;
        }

        const publicContainer = this.getContainerClient('public');
        const publicBlob = publicContainer.getBlockBlobClient(storageKey);
        const publicDeleted = await publicBlob.deleteIfExists();

        return publicDeleted.succeeded;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error('[STORAGE_DELETE_ERROR] Failed deleting blob from Azure:', msg);
        return false;
      }
    }

    if (isProductionMode()) {
      return false;
    }

    // Local dev store cleanup
    return AzureBlobStorageService.localDevStore.delete(storageKey);
  }

  /**
   * Checks if an asset exists in storage
   */
  public async exists(storageKey: string): Promise<boolean> {
    if (this.isConfigured()) {
      try {
        const privateBlob = this.getContainerClient('private').getBlockBlobClient(storageKey);
        if (await privateBlob.exists()) return true;

        const publicBlob = this.getContainerClient('public').getBlockBlobClient(storageKey);
        return await publicBlob.exists();
      } catch {
        return false;
      }
    }

    return AzureBlobStorageService.localDevStore.has(storageKey);
  }
}
