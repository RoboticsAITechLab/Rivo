# Roll Numbers Configuration

The Roll Numbers configuration (`/school/settings/academic/roll-numbers`) governs the dual numbering architecture of Rivo: **Class Roll Numbers** vs **Formal Examination Roll Numbers**.

---

## 1. Dual Numbering System Distinction

Rivo maintains a strict architectural boundary between classroom indexing and formal examination numbering:

| Dimension | Class Roll Number | Formal Exam Roll Number |
| :--- | :--- | :--- |
| **Operational Scope** | Classroom-internal identity | Institution-wide / external board examination identity |
| **Context** | Class + Section specific | Academic Session + Institution-wide |
| **Stability** | May adjust per semester or section transfer | **Permanently stable** once generated for an academic year |
| **Primary Use** | Daily attendance call, routine homework, seating | Exam admit cards, seating plans, board marksheets, publication |

---

## 2. Configuration Parameters

Located in `/school/settings/academic/roll-numbers`:

### Class Roll Number Policy
- **Sorting Criterion**: Alphabetical by First Name, Alphabetical by Last Name, or by Admission Date.
- **Gender Segregation**: Optional policy to index Boys first followed by Girls, or merged alphabetical sorting.
- **Starting Number**: Default base index (typically 1).

### Formal Exam Roll Number Policy
- **Centralized Sequence**: Generates unique numerical sequences across all participating campuses.
- **Prefix Format**: Optional prefix formula (e.g., `EX-{YEAR}-{CAMPUS}-{SEQ}`).
- **Sequence Padding**: Configurable zero-padding length (e.g., 4 digits: `0001`, `0002`).
- **Non-Recycling Rule**: If an enrolled student withdraws or transfers, their allocated Exam Roll Number is permanently retired; it is **never reallocated** to a new student admitted later in the term.
- **Stream-Aware Ordering**: For senior secondary grades, sort by Stream Code before alphabetical student sorting.

---

## 3. Allocation Engine Execution

When triggered by the administrator via **Generate Roll Numbers**:
1. The engine checks for duplicate student records.
2. Orders students strictly by the configured sorting formula.
3. Allocates sequential numbers without gaps.
4. Generates an immutable audit snapshot in `examRollAssignments`.
