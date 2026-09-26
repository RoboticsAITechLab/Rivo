import { AzureBlobStorageService } from './azure-blob';
import { MediaStorageService } from './types';

let storageInstance: MediaStorageService | null = null;

export function getMediaStorageService(): MediaStorageService {
  if (!storageInstance) {
    storageInstance = new AzureBlobStorageService();
  }
  return storageInstance;
}

export * from './types';
export * from './validation';
export * from './azure-blob';
