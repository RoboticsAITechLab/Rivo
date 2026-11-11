---
name: azure-storage-security
description: Azure Blob Storage architecture, write-only SAS token generation, magic-byte MIME validation, and private document security
version: 1.0.0
technologies:
  - Azure Blob Storage (@azure/storage-blob 12.x)
  - Shared Access Signatures (SAS)
  - Magic-byte file validation
sources:
  - https://learn.microsoft.com/en-us/azure/storage/blobs/storage-blobs-introduction
  - https://learn.microsoft.com/en-us/azure/storage/common/storage-sas-overview
verification_date: 2026-11-11
---

# Azure Blob Storage & Cloud Media Security Skill

## 1. Purpose & Scope
Architecture and security patterns for handling school document uploads, student avatars, KYC papers, and report cards via Azure Blob Storage without routing heavy file bytes through serverless runtimes.

## 2. Core Engineering Principles
1. **Direct-to-Cloud Upload via SAS Tokens**: Routing multipart/form-data uploads through Next.js serverless functions exhausts memory, hits 4.5MB request body limits on Vercel, and inflates execution costs. Always issue a short-lived (15-minute) write-only Shared Access Signature (SAS) URL for direct browser-to-Azure uploads.
2. **Strict Container Separation**:
   - `rivo-public`: Public school branding, logos, and marketing images with public read permissions.
   - `rivo-private`: Student KYC, birth certificates, teacher tax documents, report cards with NO public access. Access only via ephemeral read SAS tokens (5-minute TTL).
3. **Magic-Byte MIME Verification**: Never rely solely on client-provided `Content-Type` headers or file extensions (e.g. `.png`). Validate initial bytes (magic numbers) of uploaded files to prevent disguised executable or malicious script uploads (e.g. SVG containing embedded JavaScript, HTML disguised as PDF).
4. **Tenant-Prefixed Blob Hierarchy**: Every blob key must follow strict hierarchical naming:
   ```text
   schools/{schoolId}/{category}/{entityId}/{uuid}.{ext}
   ```
5. **Least-Privilege SAS Permissions**: Upload SAS tokens must contain ONLY Create and Write (`cw`) permissions, NEVER Delete (`d`) or Read (`r`).

## 3. Recommended Implementation Patterns

### Upload SAS Generation
```typescript
import {
  BlobServiceClient,
  generateBlobSASQueryParameters,
  BlobSASPermissions,
  StorageSharedKeyCredential,
} from '@azure/storage-blob';

export function generateUploadSas(
  containerName: string,
  blobName: string,
  ttlMinutes = 15
): string {
  const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME!;
  const accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY!;
  const creds = new StorageSharedKeyCredential(accountName, accountKey);

  const expiresOn = new Date(Date.now() + ttlMinutes * 60 * 1000);
  const permissions = new BlobSASPermissions();
  permissions.create = true;
  permissions.write = true;

  const sasToken = generateBlobSASQueryParameters(
    {
      containerName,
      blobName,
      permissions,
      expiresOn,
    },
    creds
  ).toString();

  return `https://${accountName}.blob.core.windows.net/${containerName}/${blobName}?${sasToken}`;
}
```

## 4. Production Readiness Checklist
- [ ] Upload SAS tokens restricted to write-only permissions (`cw`) and 15-minute TTL.
- [ ] Read SAS tokens for KYC/private docs restricted to 5-minute TTL.
- [ ] Private documents container (`rivo-private`) has public access completely disabled.
- [ ] File size limits enforced at token generation (e.g. 2MB avatars, 10MB documents).

