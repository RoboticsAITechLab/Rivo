# Settings & Institutional Configuration

The Settings section (`/school/settings`) is the centralized configuration hub for the entire institution. It organizes all institutional parameters into eight primary operational categories.

---

## 1. Navigation & Layout

Settings is structured with an independent, dedicated sidebar navigation panel (`SettingsNav`) on the left and a responsive configuration workspace on the right:

- **Independent Scrolling**: The navigation panel maintains its own scroll container (`overscroll-contain`) and stays pinned while scrolling long form pages.
- **Unsaved Changes Guard**: Every settings form integrates with the `useUnsavedChanges` hook. If an administrator edits fields and attempts to navigate away, a confirmation dialog appears to prevent accidental data loss.
- **Save Bar**: Appears dynamically at the base of the form whenever dirty state is detected.

---

## 2. Settings Architecture Overview

```
Settings Hub (/school/settings)
├── 1. General (/school/settings/general/*)
│   ├── School Profile (/profile)
│   ├── Campuses (/campuses)
│   └── Branding & Assets (/branding)
├── 2. Academic (/school/settings/academic/*)
│   ├── Academic Sessions (/sessions)
│   ├── Classes & Sections (/classes)
│   ├── Subject Catalog (/subjects)
│   ├── Streams (/streams)
│   ├── Houses (/houses)
│   └── Roll Number Policy (/roll-numbers)
├── 3. Operations (/school/settings/operations/*)
│   ├── Attendance Rules (/attendance)
│   ├── Timetable Periods (/timetable)
│   ├── Homework Policies (/homework)
│   ├── Examination Types & Slots (/examinations)
│   └── Grading & Moderation (/results)
├── 4. People & Access (/school/settings/people/*)
│   ├── Users Directory (/users)
│   ├── Custom Roles (/roles)
│   ├── Permission Matrix (/permissions)
│   └── Invitations Hub (/invitations)
├── 5. Security Center (/school/settings/security/*)
│   ├── Authentication Providers (/auth)
│   ├── Password Policy (/password-policy)
│   ├── Active Sessions (/sessions)
│   ├── Multi-Factor Auth (MFA) (/mfa)
│   └── Account Recovery (/recovery)
├── 6. Communication (/school/settings/communication/*)
│   ├── Notice Settings (/notices)
│   └── Notification Channels (/notifications)
├── 7. Documents & Print (/school/settings/documents/*)
│   ├── Document Templates (/templates)
│   └── Print Headers & Layouts (/print)
└── 8. Data Management (/school/settings/data/*)
    ├── Data Import Hub (/import)
    └── Data Export & Backup (/export)
```

For comprehensive administrative procedures on each category, refer to the [Administration Manual](../administration/school-profile.md).
