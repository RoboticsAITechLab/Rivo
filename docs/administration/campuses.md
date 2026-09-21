# Campus Management

The Campuses module (`/school/settings/general/campuses`) configures physical campuses or branches operating under a single unified institutional entity.

---

## 1. Multi-Campus Architecture

Rivo implements a single-tenant, multi-campus hierarchy:

```
Institution (School Profile)
├── Campus Alpha (e.g., Primary / Junior Wing)
├── Campus Beta (e.g., Senior Secondary Wing)
└── Campus Gamma (e.g., Satellite Branch)
```

- Every campus belongs to the primary institution.
- Physical infrastructure (Rooms, Facilities) is campus-scoped.
- Academic grading schemes, examination boards, and student databases can operate centrally across all campuses or be segmented per campus.

---

## 2. Campus Entity Attributes

| Attribute | Description | Validation |
| :--- | :--- | :--- |
| **Campus Name** | Full descriptive branch name | Required, unique within school |
| **Campus Code** | Short alphanumeric identifier | Required, 2-10 characters |
| **Address** | Physical location of the branch | Street, City, State, PIN code |
| **Campus Head / Principal** | Designated administrator in charge | Optional reference to a User Account |
| **Status** | Operational lifecycle | `ACTIVE` or `INACTIVE` |

---

## 3. Operational Rules

1. **Active Campus Filtering**: Users can filter entity lists (Students, Faculty, Rooms) by selecting a specific campus in the top navigation bar or view aggregate statistics across "All Campuses".
2. **Deactivation Policy**:
   - A campus cannot be deleted if active student enrollments, ongoing examinations, or scheduled classes are associated with it.
   - Deactivating a campus sets its status to `INACTIVE`, hiding it from standard drop-downs while preserving audit history.
3. **Cross-Campus Roll Numbers**: Formal Examination Roll numbers can be configured to sequence continuously across all campuses or be prefixed per campus branch code.
