# Cloud Object Storage & Media Infrastructure

Rivo utilizes **Azure Blob Storage** as its authoritative, cloud-native object store for all media, branding assets, and sensitive institutional documents, eliminating all serverless filesystem dependencies.

---

## 1. Storage Architecture

```
[ Client / Browser / Mobile App ]
                 │
                 ▼
         [ Vercel CDN & API ]
        (Next.js App Router)
                 │
        ┌────────┴────────────────────────┐
        │                                 │
        ▼                                 ▼
[ "rivo-public" Container ]    [ "rivo-private" Container ]
 - Institutional Branding       - Teacher Profile Avatars
 - School Crests & Logos        - Student Profile Avatars
 - Public Assets                - Parent & Staff Avatars
                                - Student Identity Documents
                                - Mark Sheets & Certificates
```

### Deterministic Object Key Hierarchy

All storage keys are strictly tenant-isolated and follow a deterministic format:

```text
schools/{schoolId}/{category}/{entityId}/{subCategory}/{randomAssetToken}.{extension}
```

- **School Isolation:** Derived directly from the verified server-side session (`auth.schoolId`), never from client input.
- **Cryptographic Asset Token:** 16-byte random hex string preventing enumeration, predictable URLs, and file overwrites.
- **Path Sanitization:** All path components are strictly sanitized to prevent path traversal attacks.

---

## 2. Container Policies & Security

| Container | Access Level | Contents | Delivery Model |
| :--- | :--- | :--- | :--- |
| `rivo-public` | Anonymous Public Read | School logos, authorized branding graphics | Direct Azure CDN / Blob URL |
| `rivo-private` | Private / No Anonymous Access | Teacher/Student photos, Birth Certificates, Mark Sheets | Short-Lived Pre-Signed SAS URLs (15 min TTL) |

### Private SAS Security
- Private documents and user photos are **never** served via static public URLs.
- Access requires an authenticated user with institutional membership and appropriate RBAC permissions (`teachers.edit`, `students.edit`, etc.).
- When requested, the server issues a time-bound Shared Access Signature (SAS) valid for 15 minutes (900 seconds) with clock-skew tolerance.
- Permanent database records store the canonical storage key (e.g. `schools/...`), never expiring SAS tokens.

---

## 3. Upload Validation & Security Controls

Every upload passes through three layers of validation:

1. **Size Enforcement:**
   - Profile Avatars (Teacher/Student/Staff): Max **2 MB**
   - School Branding / Logos: Max **3 MB**
   - Institutional Documents (PDF/Images): Max **10 MB**
2. **MIME Validation:**
   - Avatars & Logos: `image/jpeg`, `image/png`, `image/webp`
   - Documents: `application/pdf`, `image/jpeg`, `image/png`, `image/webp`
   - SVG is strictly blocked for user avatars to eliminate stored XSS risks.
3. **Magic-Byte Inspection:**
   - Raw buffer headers are inspected for authentic binary signatures (JPEG: `0xFFD8FF`, PNG: `0x89504E47`, WebP: `RIFF/WEBP`, PDF: `%PDF-`).
   - Mismatched or spoofed extensions are rejected with HTTP 422.

---

## 4. Dual-Mode Environment Operation

| Mode | Environment | Storage Engine | Filesystem Impact |
| :--- | :--- | :--- | :--- |
| **Local Mode** (`AUTH_INFRA_MODE="local"`) | Development & Testing | Azure Blob (if configured) OR In-Memory Blob Store | **Zero filesystem writes.** Safe for local development without Azure credentials. |
| **Production Mode** (`AUTH_INFRA_MODE="production"`) | Live Vercel Production | Azure Blob Storage (MANDATORY) | **Zero filesystem writes.** Fails if Azure connection string is missing. |

---

## 5. Environment Variables

| Variable | Scope | Production Status | Description |
| :--- | :--- | :--- | :--- |
| `AZURE_STORAGE_CONNECTION_STRING` | Server-Only | **REQUIRED** | Azure Storage Account connection string. |
| `AZURE_STORAGE_PRIVATE_CONTAINER` | Server-Only | **REQUIRED** | Name of the private container (default: `rivo-private`). |
| `AZURE_STORAGE_PUBLIC_CONTAINER` | Server-Only | **REQUIRED** | Name of the public container (default: `rivo-public`). |
| `AUTH_INFRA_MODE` | Server-Only | **REQUIRED** | Set to `production` in live environments. |
