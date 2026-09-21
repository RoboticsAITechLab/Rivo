# Domain Entity Reference

This document catalogs the core domain entities used throughout the Rivo Web Application, their properties, relationships, and lifecycle states.

---

## 1. Institutional Entities

### `SchoolProfile`
- **Purpose**: Global institutional identity and metadata.
- **Key Fields**: `schoolName`, `shortName`, `schoolCode`, `affiliation`, `phone`, `email`, `address`, `city`, `state`, `pinCode`.
- **Relationships**: Parent of all Campuses, Academic Sessions, and Users.

### `Campus`
- **Purpose**: Physical branch or campus operating under the school.
- **Key Fields**: `id`, `name`, `code`, `address`, `status` (`ACTIVE` / `INACTIVE`).
- **Relationships**: Parent of Rooms, Class Sections, and Campus-Scoped Users.

### `AcademicSession`
- **Purpose**: Calendar school year context.
- **Key Fields**: `id`, `name`, `startDate`, `endDate`, `isCurrent`, `status` (`ACTIVE` / `UPCOMING` / `ARCHIVED`).
- **Relationships**: Parent of Class Enrollments, Formal Examinations, and Roll Allocations.

---

## 2. Academic Hierarchy Entities

### `Class`
- **Purpose**: Progressive grade level standard (e.g., Grade 10).
- **Key Fields**: `id`, `name`, `gradeOrder`, `streamEnabled`, `status`.
- **Relationships**: Contains multiple `Section` entities.

### `Section`
- **Purpose**: Classroom cohort division (e.g., Section A).
- **Key Fields**: `id`, `classId`, `campusId`, `name`, `roomNumber`, `capacity`, `classTeacherId`, `status`.
- **Relationships**: Belongs to `Class` and `Campus`; maps to `Teacher` (as Class Teacher).

### `Subject`
- **Purpose**: Canonical curriculum course offering.
- **Key Fields**: `id`, `name`, `code`, `type` (`THEORY` / `PRACTICAL` / `LAB` / `CO_CURRICULAR`), `weeklyPeriods`, `status`.
- **Relationships**: Reused across Timetable, Homework, Exam Papers, and Marks Ledgers.

### `Stream`
- **Purpose**: Senior secondary academic track specialization (e.g., Science, Commerce).
- **Key Fields**: `id`, `name`, `code`, `description`, `status`.
- **Relationships**: Bound to senior classes; required for Class 11/12 students.

### `House`
- **Purpose**: Optional pastoral and co-curricular house assignment.
- **Key Fields**: `id`, `name`, `code`, `colorHex`, `mentorTeacherId`, `status`.
- **Relationships**: Linked optionally to `Student` (`houseId` may be null).

---

## 3. People Entities

### `StudentDetail` / `Student`
- **Purpose**: Scholar profile, demographic record, and enrollment history.
- **Key Fields**: `id`, `admissionNumber`, `firstName`, `lastName`, `dateOfBirth`, `gender`, `status` (`ACTIVE` / `INACTIVE` / `TRANSFERRED` / `GRADUATED`), `classRollNumber`, `examRollNumber`, `guardians`.
- **Relationships**: Enrolled in `Class` and `Section`; child of `Guardian`.

### `Teacher`
- **Purpose**: Faculty member and academic staff profile.
- **Key Fields**: `id`, `name`, `email`, `phone`, `designation`, `campusId`, `qualifiedSubjectIds`, `status`.
- **Relationships**: Assigned to Sections, Timetable periods, and Exam invigilation.

### `UserAccount`
- **Purpose**: Authenticated system login identity.
- **Key Fields**: `id`, `name`, `email`, `role`, `campusId`, `status` (`ACTIVE` / `SUSPENDED` / `INVITED`), `mfaEnabled`.
- **Relationships**: Possesses an assigned `RoleDefinition`.

---

## 4. Operational & Examination Entities

### `AttendanceRegister`
- **Purpose**: Daily classroom attendance record.
- **Key Fields**: `id` (`${classId}:${sectionId}:${date}`), `classId`, `sectionId`, `date`, `records` (Array of Student ID + Status `PRESENT` / `ABSENT` / `LATE` / `EXCUSED`), `submittedBy`, `submittedAt`.

### `Homework`
- **Purpose**: Academic assignment dispatched to a cohort.
- **Key Fields**: `id`, `title`, `description`, `subjectId`, `classId`, `sectionId`, `dueDate`, `attachments`, `status` (`DRAFT` / `PUBLISHED` / `COMPLETED`).

### `Exam`
- **Purpose**: Formal institutional examination series (e.g., Annual Exam 2026).
- **Key Fields**: `id`, `name`, `examTypeId`, `academicSessionId`, `startDate`, `endDate`, `status` (`DRAFT` / `SCHEDULED` / `ONGOING` / `COMPLETED` / `PUBLISHED`).
- **Relationships**: Contains `ExamPaper` entities and `ExamSchedule` slots.

### `ExamPaper`
- **Purpose**: Individual subject assessment within an exam series.
- **Key Fields**: `id`, `examId`, `subjectId`, `paperType`, `maxMarks`, `passingMarks`.

### `ExamResult` / `ExamMarks`
- **Purpose**: Evaluated scores and grade outcomes for candidates.
- **Key Fields**: `id`, `examId`, `studentId`, `examPaperId`, `marksObtained`, `isAbsent`, `grade`, `status`.
