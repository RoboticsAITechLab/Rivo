# Homework Tracking & Distribution (`/school/homework`)

## 1. Overview

The **Homework Module** (`/school/homework`) enables teaching faculty to assign daily coursework, project tasks, and reading exercises to specific class cohorts, track submission statuses, and provide instructions to parents and students.

---

## 2. Homework Directory & Statuses

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ Homework Assignments                              [Filter ▾] [+ New Homework]│
│ Active academic tasks distributed to classes.                                │
├──────────────────────────────────────────────────────────────────────────────┤
│ [ 🔎 Search tasks by title or subject...                                    ]│
├───────────────────┬──────────────┬──────────┬────────────┬─────────┬─────────┤
│ TITLE             │ SUBJECT      │ COHORT   │ DUE DATE   │ STATUS  │ ATTACH  │
├───────────────────┼──────────────┼──────────┼────────────┼─────────┼─────────┤
│ Ch 4 Trigonometry │ Mathematics  │ Class 10A│ 2026-09-23 │ ACTIVE  │ [PDF]   │
│ Chemical Equations│ Chemistry    │ Class 11B│ 2026-09-24 │ ACTIVE  │ -       │
│ Shakespeare Essay │ English Lit  │ Class 12A│ 2026-09-18 │ EXPIRED │ [DOCX]  │
└───────────────────┴──────────────┴──────────┴────────────┴─────────┴─────────┘
```

### Assignment Statuses
- **`DRAFT`**: Created by teacher but not yet published to student feeds.
- **`ACTIVE` / `PUBLISHED`**: Live assignment. Visible to students and parents; displays in the student homework queue.
- **`CLOSED` / `EXPIRED`**: Due date has elapsed. Archived from primary active views into historical records.

---

## 3. Creating Homework Assignments

Click **+ New Homework** to open the assignment sheet:
1. **Academic Target**:
   - **Class**: Select target grade (e.g. `Class 10`).
   - **Section**: Select specific section (`Section A`) or choose `All Sections`.
   - **Subject**: Dropdown filtered to subjects applicable to that class.
2. **Assignment Details**:
   - **Title**: Descriptive heading (e.g. `Exercise 5.2 - Quadratic Equations`).
   - **Description / Instructions**: Rich text formatting for homework instructions, textbook page numbers, and formatting rules.
3. **Timeline**:
   - **Assigned Date**: Defaults to current date.
   - **Due Date**: Calendar date selector with time deadline.
4. **Attachments**:
   - Upload worksheet PDFs, problem sheets, or reference reading documents.
   - Enforces maximum file size limit as set in **Homework Settings** (`/school/settings/homework`, default: 10MB).

---

## 4. Current Implementation Scope & Student Submission

> [!NOTE]
> **MVP Functional Scope**: The current Web Application release supports teacher assignment creation, cohort targeting, document attachment, and student status tracking (Pending, Submitted, Evaluated). Digital file upload by students via a web portal is scheduled for subsequent release phases.
