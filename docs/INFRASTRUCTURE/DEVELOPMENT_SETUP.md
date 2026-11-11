# Local Development Environment Setup Guide

> **Last Verified:** November 11, 2026  
> **Status:** Code-Verified Setup Instructions

---

## 1. Prerequisites

Before installing Rivo, ensure your workstation has:
- **Node.js:** `v20.x` LTS (or `v22.x`)
- **Package Manager:** `npm` v10+ (configured for workspaces)
- **Database:** PostgreSQL v15+ (local instance or free cloud Neon developer branch)
- **Git:** Modern git client

---

## 2. Step-by-Step Installation Runbook

### Step 1: Clone Repository
```bash
git clone <repository_url>
cd rivo
```

### Step 2: Install Workspace Dependencies
```bash
# Uses package-lock.json v3 to install dependencies across root, apps/web, and apps/api
npm ci
```

### Step 3: Configure Local Environment
```bash
# Copy template files
cp .env.example .env.local
cp apps/web/.env.example apps/web/.env.local
```

In `apps/web/.env.local`, configure minimal local values:
```env
# Database connection
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/rivo_dev?sslmode=disable"
DIRECT_URL="postgresql://postgres:postgres@localhost:5432/rivo_dev?sslmode=disable"

# Security keys (must be 32+ characters)
JWT_SECRET="local-development-jwt-secret-key-must-be-32-chars-long"
KYC_ENCRYPTION_KEY="local-development-kyc-key-must-be-32-chars-long"
MFA_ENCRYPTION_KEY="local-development-mfa-key-must-be-32-chars-long"

# Infrastructure mode (enables graceful local in-memory fallbacks)
AUTH_INFRA_MODE="local"

# Public URL
APP_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_APP_NAME="Rivo School Management"
```

### Step 4: Database Setup & Seed
```bash
# 1. Validate Prisma schema
npm run prisma:validate

# 2. Generate Prisma Client
npm run prisma:generate

# 3. Apply schema migrations
npm run prisma:migrate:deploy

# 4. Seed initial institutional demo tenant
npm run db:seed
```

#### Default Seed Credentials (`prisma/seed.ts`):
- **Platform Owner:** `owner@rivo.local` / `Password@123`
- **School Administrator:** `admin@greenwood.edu` / `Password@123`
- **Subject Teacher:** `teacher@greenwood.edu` / `Password@123`
- **Tenant School:** Greenwood International School (`greenwood-academy`)

### Step 5: Start the Development Server
```bash
npm run dev
# The application will boot at http://localhost:3000
```

### Step 6: Verify Build & Tests
```bash
# Run unit and integration tests (requires active database)
npm run test:id
npm run test:remediation
```

