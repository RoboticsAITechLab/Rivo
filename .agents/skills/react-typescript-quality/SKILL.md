---
name: react-typescript-quality
description: Strict TypeScript typing, React 19 architecture, component state hygiene, memory leak prevention, and client state isolation
version: 1.0.0
technologies:
  - React 19.2.8
  - TypeScript 5.x
  - Tailwind CSS v4
sources:
  - https://react.dev
  - https://www.typescriptlang.org/docs/handbook/intro.html
  - https://react.dev/reference/react/useActionState
verification_date: 2026-11-11
---

# React 19 & TypeScript Quality Engineering Skill

## 1. Purpose & Scope
Guidelines and coding invariants for React 19 and strict TypeScript full-stack applications. Prevents state explosion, unhandled promises, memory leaks in client components, and monolithic client stores.

## 2. Core Engineering Principles
1. **Strict Type Safety**: Never use `any` or unsafely cast using `as unknown as Type`. Model all domain states with discriminated unions (`type AsyncState<T> = { status: 'idle' } | { status: 'loading' } | { status: 'success'; data: T } | { status: 'error'; error: string }`).
2. **Decompose Monolithic Global Stores**: Storing entire multi-module enterprise data (students, staff, timetable, fees, school settings) inside a single 1500+ line client store (e.g. `school-store.ts`) causes massive unnecessary re-renders, race conditions, stale cache bugs, and huge JS bundle sizes. Decompose into focused domain hooks and server state caches.
3. **React 19 Actions & Transitions**: Utilize React 19's native action paradigms, `useTransition`, and optimistic UI primitives rather than ad-hoc `useEffect` fetch waterfalls.
4. **Cleanup All Subscriptions & Timers**: Every `useEffect` that attaches DOM listeners, WebSockets, or polling intervals must return a synchronous cleanup function.
5. **No Props Drilling for Deeply Nested Tenants**: Tenant/school context should be validated at the layout or server-rendered layer and accessed via strict context providers or direct server component props.

## 3. Recommended Implementation Patterns

### Discriminated Union Async State Pattern
```typescript
export type AsyncResult<T> =
  | { status: 'idle'; data: null; error: null }
  | { status: 'loading'; data: null; error: null }
  | { status: 'success'; data: T; error: null }
  | { status: 'error'; data: null; error: Error };
```

### Domain-Scoped Hook Pattern
```typescript
export function useFeeCollection(schoolId: string, studentId?: string) {
  const [state, setState] = useState<AsyncResult<FeeOverview>>({ status: 'idle', data: null, error: null });

  const fetchFees = useCallback(async () => {
    setState({ status: 'loading', data: null, error: null });
    try {
      const res = await fetch(`/api/fees/students/${studentId}/obligations`);
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setState({ status: 'success', data, error: null });
    } catch (err: any) {
      setState({ status: 'error', data: null, error: err });
    }
  }, [studentId]);

  return { ...state, refetch: fetchFees };
}
```

## 4. Common Failure Patterns
- **Effect-Driven Fetch Loops**: Calling state updaters inside `useEffect` without proper dependency arrays triggering infinite re-render loops.
- **Uncontrolled-to-Controlled Input Warnings**: Initializing form inputs with `undefined` instead of `''` (empty string).
- **Zustand/Context God-Objects**: Putting unrelated application modules in a single store, preventing code splitting.

## 5. Production Readiness Checklist
- [ ] No `any` types in public API contracts or domain interfaces.
- [ ] Large client stores (>500 lines) decomposed into domain-specific modules.
- [ ] All forms use validated schemas (e.g. Zod or custom validator) with inline error states.
- [ ] Keyboard accessibility (`tabIndex`, aria labels, enter key submission) verified.

