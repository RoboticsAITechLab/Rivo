# Frontend UI Design System & Motion

> **Last Verified:** November 11, 2026  
> **Source Target:** `apps/web/src/app/globals.css`, `postcss.config.mjs`, `apps/web/src/components/ui`

---

## 1. Styling Architecture: Tailwind CSS v4

The application uses **Tailwind CSS v4** configured with `@tailwindcss/postcss` (`^4`).
- **No `tailwind.config.ts`:** In Tailwind v4, configuration is consolidated in `apps/web/src/app/globals.css` using `@import "tailwindcss";` and `@theme` blocks.

### Design Tokens & CSS Variables
The design system is based on an institutional slate/blue palette defined via HSL CSS variables:

```css
:root {
  --background: 210 40% 98%;
  --foreground: 222 47% 11%;
  --card: 0 0% 100%;
  --card-foreground: 222 47% 11%;
  --primary: 221 83% 53%;        /* Institutional Royal Blue */
  --primary-foreground: 210 40% 98%;
  --secondary: 210 40% 96.1%;
  --secondary-foreground: 222 47% 11%;
  --muted: 210 40% 96.1%;
  --muted-foreground: 215.4 16.3% 46.9%;
  --destructive: 0 84.2% 60.2%;
  --destructive-foreground: 210 40% 98%;
  --border: 214.3 31.8% 91.4%;
  --input: 214.3 31.8% 91.4%;
  --ring: 221 83% 53%;
  --radius: 0.5rem;
}
```

---

## 2. Typography

- **Primary Sans Font:** `Geist Sans` (`--font-geist-sans`).
- **Monospace Font:** `Geist Mono` (`--font-geist-mono`) for codes, roll numbers, currency values, and hashes.
- Fonts are loaded in `apps/web/src/app/layout.tsx` via `next/font/local` or `next/font/google`.

---

## 3. Motion & Animation Guidelines

Animations use the modern `motion` package (`import { motion, AnimatePresence } from 'motion/react'`).

### Core Motion Patterns
1. **Multi-Step Wizard Transitions:**
   - Directional slide animations on step changes in the Admission Workspace:
     ```tsx
     <AnimatePresence mode="wait" initial={false}>
       <motion.div
         key={currentStep}
         initial={{ opacity: 0, x: direction > 0 ? 40 : -40 }}
         animate={{ opacity: 1, x: 0 }}
         exit={{ opacity: 0, x: direction > 0 ? -40 : 40 }}
         transition={{ duration: 0.25, ease: 'easeOut' }}
       >
         {stepContent}
       </motion.div>
     </AnimatePresence>
     ```
2. **Reduced Motion Accessibility:**
   - `apps/web/src/app/globals.css` declares an explicit override:
     ```css
     @media (prefers-reduced-motion: reduce) {
       *, ::before, ::after {
         animation-duration: 0.01ms !important;
         animation-iteration-count: 1 !important;
         transition-duration: 0.01ms !important;
         scroll-behavior: auto !important;
       }
     }
     ```
   - Complex motion components also leverage `useReducedMotion()` from `motion/react` to disable animations dynamically.

---

## 4. Toast Feedback System (Sonner)

- **Library:** `sonner` (`^2.0.8`).
- **Standard Invocations:**
  - Success: `toast.success('Fee payment recorded successfully.')`
  - Error: `toast.error('Failed to submit attendance. Cutoff time exceeded.')`
  - Warning: `toast.warning('Duplicate student warning detected.')`
- **Known Quality Item:** `<Toaster />` must be mounted in `apps/web/src/app/layout.tsx` to ensure toasts are visible across all admin and settings routes.

