# Vercel Deployment Architecture

Rivo is designed to run its web application and API route handlers (`apps/web`) seamlessly on the **Vercel Serverless Edge Platform**.

## Project Structure on Vercel

- **Root Directory:** `.` (Repository root) or `apps/web`
- **Framework Preset:** Next.js
- **Build Command:** `npm run build` (Executes `prisma generate && next build`)
- **Install Command:** `npm install` (Managed by npm workspace configuration)
- **Node.js Version:** 20.x

## Serverless Route Handlers

All API endpoints are located in `apps/web/src/app/api/` using standard Next.js App Router route handlers (`GET`, `POST`, `PATCH`, `DELETE`).
- Handlers run statelessly in isolated Vercel serverless functions.
- Database connections are managed by a pooled Prisma client instance (`src/lib/prisma.ts`) utilizing Neon's PgBouncer endpoint.
- Session validation relies on signed, HTTP-only cookies verified against PostgreSQL and cached in-memory/Redis.
