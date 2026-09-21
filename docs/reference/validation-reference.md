# Validation Engines & Business Constraints Reference

This document outlines the client-side validation engines, conflict detectors, and constraints operating within the Rivo Web Application.

---

## 1. Validation Engines Overview

| Validation Engine | Code Location | Primary Purpose | Key Evaluated Conditions |
| :--- | :--- | :--- | :--- |
| **Duplicate Detector** | `shared/validation/duplicate-detector.ts` | Prevents duplicate student admission | First Name + Last Name + Date of Birth + Primary Guardian Phone |
| **Timetable Conflict Detector**| `shared/validation/timetable-conflict.ts` | Prevents scheduling overlaps | Teacher collision, Room collision, Section period overlap |
| **Exam Conflict Detector** | `shared/validation/exam-conflict-detector.ts` | Prevents examination clashes | Candidate multiple papers per slot, Room capacity, Session limits |
| **Roll Allocation Engine** | `shared/validation/roll-allocation-engine.ts` | Automates deterministic roll numbering | Alphabetical ordering, Gender rules, Stream ordering, Non-recycling |

---

## 2. Duplicate Detection Rules

During Student Intake (`/school/students/admission`):
- High-Confidence Collision: `First Name + Last Name + DOB + Guardian Phone` exactly matches an existing enrolled scholar.
- Action: Renders `DuplicateDialog` with matched student's ID, class, and enrollment date, requiring explicit administrative confirmation before proceeding.

---

## 3. Timetable Conflict Engine

When creating or dragging a timetable slot (`/school/timetable`):
- **Teacher Availability**: Evaluates if `teacherId` is allocated to any other section during `dayOfWeek + periodId`.
- **Room Availability**: Evaluates if `roomId` is booked by another section during `dayOfWeek + periodId`.
- **Section Availability**: Verifies that the section does not already have an active period at that time.

---

## 4. Exam Schedule Conflict Rules

When placing an exam paper onto the calendar (`/school/exams/[id]`):
- **Candidate Collision**: No student can be scheduled for two concurrent exam papers simultaneously.
- **Max Papers Per Day**: If `multiplePapersPerDay` is false in Exam Rules, scheduling more than 1 paper on the same calendar date is blocked.
- **Venue Capacity**: The number of enrolled candidates allocated to a room cannot exceed `room.capacity`.

---

## 5. Form Validation Schemes (Zod & React Hook Form)

Every interactive form validates constraints before triggering store updates:
- **Email**: Strict RFC 5322 regex validation.
- **Phone**: E.164 or national 10-digit format.
- **Dates**: End dates must be strictly greater than or equal to Start dates.
- **Marks**: Numeric, `0 <= marksObtained <= paper.maxMarks`.
