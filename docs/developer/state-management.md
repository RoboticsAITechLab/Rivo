# State Management & Store Architecture

This document explains the centralized state store architecture implemented in `apps/web/src/shared/mock-store/school-store.ts`.

---

## 1. Single Store Architecture

Rivo consolidates all institutional state into a unified Zustand store (`useSchoolStore`). This architecture guarantees that data mutations propagate across all dependent views immediately without stale caching.

```
                     ┌────────────────────────┐
                     │     useSchoolStore     │
                     └───────────┬────────────┘
                                 │
         ┌───────────────┬───────┴───────┬───────────────┐
         ▼               ▼               ▼               ▼
   [Academic Data] [Operational]     [People]      [Configuration]
   - Sessions      - Timetable       - Students    - Profile
   - Classes       - Attendance      - Teachers    - Branding
   - Sections      - Homework        - Users       - Rules
   - Subjects      - Exams           - Roles       - Permissions
   - Streams       - Results         - Invites     - Security
```

---

## 2. Store Access Patterns

### Selector Subscriptions
Components must subscribe only to the specific slices of state they consume to avoid unnecessary re-renders:

```typescript
// Correct: Granular selector subscription
const teachers = useSchoolStore((state) => state.teachers);
const addTeacher = useSchoolStore((state) => state.addTeacher);

// Avoid: Subscribing to the entire state object
// const store = useSchoolStore();
```

### Contextual Mutations
Mutations are dispatched via dedicated action creators exposed by the store:
- `addStudent(student)`
- `updateStudent(id, partial)`
- `addTeacher(teacher)`
- `addClass(newClass)`
- `updateAttendanceRegister(register)`
- `updateSettings(category, partial)`

---

## 3. Propagation & Multi-Module Reactivity

When an entity is added or updated (for example, creating a new Subject inside the `+ Add New Subject` modal while drafting an exam paper):
1. The modal calls `store.addSubject(newSubject)`.
2. The central `subjects` array appends the new entity.
3. Every active selector component on the screen reactively discovers the new subject.
4. The calling form auto-selects the newly created subject's ID.
5. Zero page reloads or manual fetches are needed.
