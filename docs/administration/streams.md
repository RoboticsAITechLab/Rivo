# Academic Streams Administration

The Streams module (`/school/settings/academic/streams`) allows secondary and senior secondary schools to configure academic specializations (e.g., Science, Commerce, Humanities/Arts, Vocational).

---

## 1. Configurable Stream Philosophy

Rivo does **not** hardcode fixed academic tracks. Every institution configures streams according to its educational board and curriculum offerings.

- Streams are typically bound to upper grade levels (Classes 11 and 12, or Senior High).
- If a school does not offer divided tracks (e.g., primary or middle schools), streams remain completely optional or unconfigured.

---

## 2. Stream Entity Attributes

| Field | Description | Validation |
| :--- | :--- | :--- |
| **Stream Name** | Full title of the academic track | Required, unique within school |
| **Stream Code** | Short alphanumeric identifier | Required (e.g., "SCI", "COMM", "ARTS") |
| **Description** | Overview of curriculum focus | Optional |
| **Status** | Operational lifecycle | `ACTIVE` or `INACTIVE` |

---

## 3. Downstream Impacts

1. **Student Enrollment**: When enrolling students into Classes where `streamEnabled = true`, selecting an academic stream is mandatory.
2. **Subject Mapping**: Elective courses can be restricted by stream (e.g., Accountancy mapped exclusively to Commerce).
3. **Formal Exam Roll Allocation**: Centralized roll number generation can be configured to sort and sequence examinees by stream before sorting alphabetically.
