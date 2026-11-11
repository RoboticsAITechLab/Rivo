# RIVO — Frontend Architecture (`apps/web`)

> **Last Verified:** November 11, 2026  
> **Framework:** Next.js 16.3.5, React 19.2.8, Tailwind CSS v4, Motion 14, Lucide React, Sonner  
> **Audience:** Frontend Engineers & UI Developers

---

## 1. Overview

The Rivo frontend is an enterprise web application housed inside `apps/web`. It is built on the **Next.js 16 App Router** leveraging React 19 Client and Server Components.

The interface is organized into dedicated route groups serving distinct institutional roles:
- **School Admin OS (`/(school)`):** Complete control center for principals, directors, and administrators.
- **Teacher Workspace (`/(teacher)`):** Streamlined portal for daily attendance, class timetables, and KYC compliance.
- **Parent Portal (`/(parent)`):** Family self-service portal with multi-child switching, fee obligation reviews, verified PDF receipts, and school circulars.
- **Testing & Diagnostics (`/testing-center`):** Platform engineering workbench for regression test execution and live health telemetry.
- **Authentication Gateway (`/(auth)`):** Multi-step login with TOTP MFA, emergency recovery fallback, and self-service password reset.

---

## 2. Technology Stack & Key Libraries

| Technology | Version | Purpose |
| :--- | :--- | :--- |
| **Next.js** | 16.3.5 | App Router, Server Components, Route Handlers, Edge Middleware |
| **React** | 19.2.8 | Core component model, hooks, and context |
| **Tailwind CSS** | v4.0.0 | PostCSS v4 engine, CSS variable tokens, responsive layout |
| **Motion** | 14.0.0 | High-performance animation physics and page transitions |
| **Lucide React** | 1.47.0 | Clean, accessible vector iconography |
| **Sonner** | 2.0.8 | Lightweight, stacked toast notifications |
| **PDF-Lib** | 1.17.1 | In-browser and server-side PDF manipulation |

---

## 3. Frontend Documentation Map

- [APPLICATION_STRUCTURE.md](file:///d:/Rivo/docs/FRONTEND/APPLICATION_STRUCTURE.md) — Directory layout of `apps/web/src` and module boundaries.
- [ROUTES_AND_PAGES.md](file:///d:/Rivo/docs/FRONTEND/ROUTES_AND_PAGES.md) — Exhaustive inventory of all 67 App Router pages and layouts.
- [COMPONENTS.md](file:///d:/Rivo/docs/FRONTEND/COMPONENTS.md) — Headless UI primitives, layouts, forms, and dialog sheets.
- [STATE_MANAGEMENT.md](file:///d:/Rivo/docs/FRONTEND/STATE_MANAGEMENT.md) — Contexts, stores, hooks, URL state, and cache invalidation.
- [UI_DESIGN_SYSTEM.md](file:///d:/Rivo/docs/FRONTEND/UI_DESIGN_SYSTEM.md) — Design tokens, Tailwind v4 theme, Lucide icons, and Motion guidelines.

