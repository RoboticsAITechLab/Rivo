---
name: performance-engineering
description: Full-stack performance optimization, Core Web Vitals, serverless execution budgets, database latency, and bundle size reduction
version: 1.0.0
technologies:
  - Next.js Turbopack / Webpack Analyzer
  - Core Web Vitals (LCP, INP, CLS)
  - Database Query Optimization
sources:
  - https://web.dev/explore/fast
  - https://nextjs.org/docs/app/building-your-application/optimizing/bundle-analyzer
verification_date: 2026-11-11
---

# Performance & Scalability Engineering Skill

## 1. Purpose & Scope
Techniques for maintaining sub-second user responsiveness across school admin cockpits, student roll lists, and fee ledgers as tenant database records scale from hundreds to hundreds of thousands.

## 2. Core Engineering Principles
1. **Core Web Vitals Thresholds**:
   - **Largest Contentful Paint (LCP)**: <= 2.5s
   - **Interaction to Next Paint (INP)**: <= 200ms
   - **Cumulative Layout Shift (CLS)**: <= 0.1
2. **Server-Side Data Prefetching**: Leverage React Server Components to fetch initial dashboard metrics directly on the server co-located with Neon database poolers, eliminating initial client fetch waterfalls.
3. **Virtualization for Massive Tables**: Rendering 2,000 students or 5,000 fee payment rows into the DOM simultaneously degrades browser responsiveness and spikes memory. Use table virtualization or server pagination (`LIMIT 50`).
4. **Bundle Size Caps**: Monitor client bundle chunks. Dynamically import heavy visualization libraries (e.g. Chart.js, PDF generation, rich text editors) using `next/dynamic` with `ssr: false`:
   ```typescript
   const Chart = dynamic(() => import('@/components/charts/FeeCollectionChart'), { ssr: false });
   ```
5. **Streaming with Suspense**: Wrap independent dashboard widgets in `<Suspense fallback={<WidgetSkeleton />}>` so slow database queries in one card do not block the entire page render.

## 3. Production Readiness Checklist
- [ ] No unvirtualized client-rendered tables displaying >100 rows.
- [ ] Heavy client libraries dynamically imported.
- [ ] Static assets and images optimized using Next.js `<Image />` component.
- [ ] API endpoints enforce maximum page size limit (`take: 100`).

