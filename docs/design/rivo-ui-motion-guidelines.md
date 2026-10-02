# Rivo UI & Motion Design Guidelines

> Authoritative animation, micro-interaction, and layout motion standard for Rivo School ERP web applications.

---

## 1. Core Philosophy: Institutional Purpose & Restraint

Rivo is an enterprise school management platform utilized daily by school administrators, directors, principals, teachers, parents, and fee managers. 

### Principles:
1. **Purpose-Driven Motion**: Every animation must serve a clear functional purpose (reducing cognitive load, clarifying spatial transitions, providing feedback on state changes, or guiding user focus).
2. **Snappy & High-Performance**: Interactions must never feel sluggish or delay productivity. Target duration is **150ms – 250ms** for micro-interactions and **200ms – 350ms** for stepped views.
3. **Accessibility First (`prefers-reduced-motion`)**: Respect the operating system reduced-motion preference. When active, transition gracefully with zero spatial displacement (instant or simple opacity fades).
4. **Hardware-Accelerated Execution**: Animate only GPU-composited properties (`transform: translateX/Y/scale`, `opacity`). Never animate layout properties like `margin`, `padding`, `top`, `left`, `width`, or intensive `backdrop-filter: blur`.

---

## 2. Animation Token Standards

| Token | Duration | Easing Curve | Use Case |
|---|---|---|---|
| **Fast / Micro** | `150ms` | `cubic-bezier(0.2, 0, 0, 1)` | Button press, badge pulse, checkbox toggle, dropdown menu open |
| **Standard / Moderate** | `220ms` | `cubic-bezier(0.16, 1, 0.3, 1)` | Card expand/collapse, tab switch, step transition, tooltip |
| **Drawer / Sheet Entrance** | `280ms` | `cubic-bezier(0.32, 0.72, 0, 1)` | Side sheets, modals, admission workspace overlay |
| **Spring Snappy** | Spring (`stiffness: 350, damping: 30`) | Dynamic physics | Pill selector sliding indicator, checkmark success bounce |

---

## 3. Step Transition & Stepper Patterns

When transitioning between multi-step workflows (e.g. Admission Workspace, Teacher Onboarding, Fee Plan Creation):

```tsx
import { motion, AnimatePresence } from 'framer-motion';

const stepVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 20 : -20,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
    transition: {
      duration: 0.22,
      ease: [0.16, 1, 0.3, 1],
    },
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -20 : 20,
    opacity: 0,
    transition: {
      duration: 0.18,
      ease: [0.16, 1, 0.3, 1],
    },
  }),
};

export function StepContainer({ currentStep, direction, children }) {
  return (
    <AnimatePresence mode="wait" custom={direction}>
      <motion.div
        key={currentStep}
        custom={direction}
        variants={stepVariants}
        initial="enter"
        animate="center"
        exit="exit"
        className="w-full"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
```

---

## 4. Accordion & Dynamic Height Expansion

For collapsible form sections, custom field blocks, or document drawers:

```tsx
<motion.div
  initial={{ height: 0, opacity: 0 }}
  animate={{ height: 'auto', opacity: 1 }}
  exit={{ height: 0, opacity: 0 }}
  transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
  className="overflow-hidden"
>
  {children}
</motion.div>
```

---

## 5. Reduced-Motion Handling Standard

Always implement reduced-motion safety via `useReducedMotion()`:

```tsx
import { useReducedMotion, motion } from 'framer-motion';

export function AccessibleAnimatedCard({ children }) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: shouldReduceMotion ? 0.05 : 0.2 }}
    >
      {children}
    </motion.div>
  );
}
```

---

## 6. Document & Media Upload Feedback

When uploading documents or student profile photos:
- Show instant client-side thumbnail preview.
- Animate a linear progress bar from `0%` to `100%` with smooth easing.
- On completion, transition to a green badge with a subtle checkmark scale-in (`initial={{ scale: 0.8 }} animate={{ scale: 1 }}`).

---

## 7. Anti-Patterns & Prohibitions

1. **NO continuous background animations** (floating blobs, pulsating backgrounds).
2. **NO flashy 3D perspective transforms** or card flip gimmicks on data entry forms.
3. **NO bouncy elastic text** that delays readability.
4. **NO blocking animations**: Never disable form interaction while an exit animation is playing.
