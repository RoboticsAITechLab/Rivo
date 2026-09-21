# Frontend Design & Component Patterns

This document details the recurring design patterns, UI standards, and coding conventions adopted across `apps/web`.

---

## 1. Design Token System & Aesthetics

Rivo adheres to a clean, institutional design aesthetic tailored for school administrators and educators:
- **Palette**: Slate/neutral backgrounds paired with deep emerald/teal accent colors for academic authority.
- **Typography**: Clear hierarchical sans-serif typography with strict tabular numbers (`font-mono` for roll numbers, timestamps, and percentages).
- **Cards & Containers**: Subtle border rings (`border-slate-200/80`), rounded containers (`rounded-xl`), and low-contrast surface elevation.

---

## 2. Component Patterns

### Modal & Dialog Composition
- All interactive modals utilize Radix `Dialog` primitives with explicit `DialogTitle` and `DialogDescription` for full accessibility compliance.
- Modals that modify entities support optimistic loading states and dismiss automatically on success.

### Table & Data Grids
- Tabular views (Students, Users, Results) incorporate sticky column headers, hover row highlighting, inline action menus (`DropdownMenu`), and pagination or virtualized rows for large rosters.

### Slide-Over Drawers (Sheet)
- Entity deep-inspection views (such as the **Student 360 Sheet**) utilize slide-over drawers from the right viewport edge. This preserves the user's filtered background context while examining detailed sub-tabs.

---

## 3. Empty State Standard

Never render raw blank white screens. Every listing view implements a standard empty state:
1. Contextual icon (e.g., Lucide `Calendar`, `GraduationCap`, `Users`).
2. Explanatory title (e.g., *"No examinations scheduled"*).
3. Plain English explanation of what is missing.
4. Primary call-to-action button (e.g., `+ Create Examination`) linking directly to the setup action.
