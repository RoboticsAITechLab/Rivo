---
name: nextjs-production
description: Production-grade engineering, runtime constraints, security hardening, and deployment patterns for Next.js 16+ App Router
version: 1.0.0
technologies:
  - Next.js 16.3.5
  - Node.js 20+ LTS
  - Vercel Serverless & Edge Runtime
sources:
  - https://nextjs.org/docs
  - https://nextjs.org/docs/app/building-your-application/deploying/production-checklist
  - https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config
verification_date: 2026-11-11
---

# Next.js 16 Production Engineering Skill

## 1. Purpose & Scope
Authoritative operational and architectural standards for deploying enterprise-ready Next.js 16 (App Router) full-stack applications. Covers server/client component boundaries, route handlers, middleware isolation, security headers, serverless runtime constraints, and error boundaries.

## 2. Core Engineering Principles
1. **Never Disable Type/Build Checking in Production**: `next.config.ts` must never contain `typescript: { ignoreBuildErrors: true }` or `eslint: { ignoreDuringBuilds: true }`. Such flags allow silent fatal runtime bugs to enter production.
2. **Server/Client Boundary Hygiene**: Keep React Server Components (RSC) as the default data-fetching and presentation layer. Minimize `'use client'` to leaf interactive elements. Never import server-only secrets or database clients into client components.
3. **Robust Boundary Hierarchy**: Every route segment cluster must have its own `error.tsx` (with error logging and recovery reset button) and `not-found.tsx` to prevent blank screen crashes.
4. **Middleware Runtime Constraints**: Edge Middleware in Next.js runs on a lightweight V8 isolate without Node.js `fs`, raw TCP sockets, or native modules. Never import Prisma or heavy ORMs into `middleware.ts`. Use token verification, cookie presence, and stateless claims.
5. **Route Handler Method Safety**: Explicitly export only supported HTTP methods (`GET`, `POST`, `PATCH`, `DELETE`). Return strict JSON status codes (`200`, `201`, `400`, `401`, `403`, `404`, `429`, `500`) with consistent error envelopes.

## 3. Recommended Implementation Patterns

### Route Segment Configuration
```typescript
// Explicit server runtime execution
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic'; // For authenticated dynamic API routes
export const maxDuration = 30; // Max execution seconds on serverless
```

### Standardized API Error Envelope
```typescript
export interface ApiErrorResponse {
  success: false;
  code: string;
  message: string;
  details?: Record<string, unknown>;
  timestamp: string;
}
```

### Robust `error.tsx` Component
```tsx
'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Unhandled route exception:', error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center p-6 text-center">
      <h2 className="text-xl font-bold text-red-600">Something went wrong</h2>
      <p className="mt-2 text-sm text-gray-500">
        {error.digest ? `Reference ID: ${error.digest}` : 'An unexpected application error occurred.'}
      </p>
      <Button onClick={() => reset()} className="mt-4">Try Again</Button>
    </div>
  );
}
```

## 4. Security Requirements
- **Strict CSP and Security Headers**: Enforce `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, and `Permissions-Policy`.
- **Anti-CSRF & SameSite Cookies**: All session cookies must have `HttpOnly; Secure; SameSite=Lax` (or `Strict`), and origin headers must be verified on mutating endpoints (`POST`, `PATCH`, `DELETE`).
- **Body Size Caps**: Limit route handler JSON parsing payload size (e.g. 1MB max for standard endpoints) to prevent memory exhaustion DoS.

## 5. Production Readiness Checklist
- [ ] No `ignoreBuildErrors: true` in `next.config.ts`.
- [ ] Root layout mounts `<Toaster />` for notifications.
- [ ] `not-found.tsx` and `error.tsx` exist in root and major route groups (`/(school)`, `/(teacher)`).
- [ ] Sensitive API endpoints enforce `dynamic = 'force-dynamic'` to prevent CDN caching of private data.
- [ ] Environment variables verified at build/startup using strict schema validation.

