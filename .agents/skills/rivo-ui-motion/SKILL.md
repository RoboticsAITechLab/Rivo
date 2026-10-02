---
name: rivo-ui-motion
description: Authoritative animation, micro-interaction, form stepper, and layout motion guidelines for Rivo School ERP components. Use when designing or upgrading interactive workspaces, multi-step wizards, file uploaders, dialogs, and responsive dashboards.
---

# Rivo UI & Motion Skill

This skill documents production-tested motion patterns, easing tokens, stepper variants, and accessibility constraints for building enterprise ERP interfaces in Rivo.

## When to Use Motion
- **Multi-step Form Workspaces (Admission, Onboarding, Fee Wizard)**: Direction-aware horizontal slide + fade.
- **Collapsible Data Panels & Accordions**: Height expansion with opacity fade.
- **Upload States**: Progress bar easing and badge status transitions.
- **Success Confirmations**: Subtle checkmark scale-in (`0.8 -> 1.0`).
- **Sidebar Summary Badges**: Smooth count changes and state updates.

## Motion Standards

### Easing Tokens
- **Standard Layout**: `[0.16, 1, 0.3, 1]` (cubic-bezier ease-out quint)
- **Modal / Sheet In**: `[0.32, 0.72, 0, 1]`
- **Micro Press**: `[0.2, 0, 0, 1]`
- **Spring Snappy**: `{ stiffness: 350, damping: 30 }`

### Timing Limits
- Micro-interactions: `120ms – 180ms`
- Card/Tab switches: `200ms – 240ms`
- Form Stepper Transitions: `220ms – 280ms`
- Full-screen Sheets/Dialogs: `260ms – 320ms`

### Stepper Slide Implementation Pattern
```tsx
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';

export const stepVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 20 : -20,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
    transition: { duration: 0.22, ease: [0.16, 1, 0.3, 1] },
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -20 : 20,
    opacity: 0,
    transition: { duration: 0.18, ease: [0.16, 1, 0.3, 1] },
  }),
};
```

### Accessibility Rule
Always wrap motion components or check `useReducedMotion()`. When `true`, fallback to zero spatial displacement (`x: 0, y: 0`) and instant visibility transitions.
