# Contributing & Engineering Standards

This document establishes the code standards, state policies, and quality benchmarks for contributing to the Rivo Web Application.

---

## 1. Core Architectural Mandates

### Non-Negotiable Zero Mock Data Rule
- **Never hardcode fake student records, fictitious teachers, or fake campuses into component files**.
- All entity structures must be instantiated dynamically via the centralized store or fetched from APIs.
- Components must gracefully render empty states when no records exist.

### Single Entity Principle
- Reusable entities (Teachers, Subjects, Classes, Campuses) must exist in exactly **one** place in the store.
- Never instantiate duplicate, local entity arrays inside module folders. Always leverage `UniversalSelector` and `useSchoolStore`.

---

## 2. Naming Conventions & Code Style

- **File Names**: Kebab-case (e.g., `admission-workspace.tsx`, `use-unsaved-changes.ts`, `route-map.md`).
- **Component Names**: PascalCase (e.g., `AdmissionWorkspace`, `TopNav`, `UniversalSelector`).
- **Hooks**: CamelCase with `use` prefix (e.g., `useUnsavedChanges`, `useSchoolStore`).
- **Constants & Enums**: UPPER_SNAKE_CASE (e.g., `PRESENT`, `ABSENT`, `FIRST_TIME`).

---

## 3. Pull Request & Verification Standards

Before committing changes:
1. Run `npx tsc --noEmit` and confirm **0 errors**.
2. Run `npm run lint` and resolve any warnings.
3. Test forms for unsaved changes protection.
4. Verify accessibility labels (`DialogTitle`, `aria-label` on icon-only buttons).
