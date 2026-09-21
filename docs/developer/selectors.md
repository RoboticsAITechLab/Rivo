# Reusable Entity Selectors System

This document outlines the architecture of Rivo's reusable `UniversalSelector` components and contextual entity creation patterns (`apps/web/src/shared/entities/`).

---

## 1. The `UniversalSelector` Paradigm

Every entity selector in Rivo follows a consistent interaction contract:

```
[Click Dropdown] ──> [Filter / Search Items] ──> [Select Existing Item]
        │
        └──> [Click "+ Add New Entity"] ──> [Contextual Modal Opens]
                                                     │
                                                     ▼
                                            [Submit Form & Save]
                                                     │
                                                     ▼
                                     [Auto-Select Newly Created Item]
```

---

## 2. Available Selectors Catalog

Located in `apps/web/src/shared/entities/`:

| Selector Component | Target Entity | Contextual Modal Triggered |
| :--- | :--- | :--- |
| `AcademicSessionSelect` | `AcademicSession` | `AddAcademicSessionModal` |
| `CampusSelect` | `Campus` | `AddCampusModal` |
| `ClassSelect` | `Class` | `AddClassModal` |
| `SectionSelect` | `Section` | `AddSectionModal` (Cascades by selected Class) |
| `SubjectSelect` | `Subject` | `AddSubjectModal` |
| `TeacherSelect` | `Teacher` | `AddTeacherModal` |
| `RoomSelect` | `Room` | `AddRoomModal` |
| `StreamSelect` | `Stream` | `AddStreamModal` |
| `HouseSelect` | `House` | `AddHouseModal` |
| `ExamSelect` | `Exam` | `NewExamModal` |

---

## 3. Cascading Selectors Implementation

Cascading selectors dynamically restrict downstream options based on upstream choices:

```typescript
// When selectedClassId changes, sectionOptions automatically re-filters:
const sectionOptions = useMemo(() => {
  if (!selectedClassId) return [];
  return allSections.filter((s) => s.classId === selectedClassId);
}, [selectedClassId, allSections]);
```

If an administrator changes the selected Class, any previously selected Section that does not belong to the newly chosen Class is cleared immediately.
