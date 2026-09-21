# Notices & School Circulars

The Notices module (`/school/notices`) manages official institutional communications, circulars, announcements, and administrative alerts issued by the school administration and faculty.

---

## 1. Notice Lifecycle

A notice progresses through the following operational phases:

```
[Draft Notice] ──> [Schedule / Publish] ──> [Active Broadcast] ──> [Archived / Expired]
```

1. **Draft**: Notice is being drafted by an administrator or teacher. Visible only to author and admins.
2. **Scheduled**: Notice has a future publication timestamp; automatically becomes active once the time arrives.
3. **Published**: Actively visible to the target recipient cohorts across web and portal dashboards.
4. **Expired / Archived**: Surpassed the validity end-date; moved to archival storage for historical audit.

---

## 2. Notice Composition

When creating a new notice (`/school/notices/new` or quick-action modal):

### Content Parameters
- **Title**: Clear, concise subject line of the circular.
- **Category / Priority**: General, Academic, Urgent Alert, Holiday, Examination, Fee Reminder.
- **Rich Content**: Detailed text body with formatting support.
- **Attachments**: PDF documents, circular copies, or event schedules (subject to file size policy in settings).
- **Publish Date & Time**: Timestamp at which the notice becomes visible.
- **Expiry Date**: Automatic decommission date after which the circular is archived.

### Audience Scopes

Notices can be precision-targeted based on role and academic cohort:

| Audience Scope | Target Cohort |
| :--- | :--- |
| **All School** | Universal broadcast to all staff, students, and parents across all campuses. |
| **Faculty Only** | All teachers and administrative staff members. |
| **Specific Campus** | Confined to students and staff of a specific branch. |
| **Specific Class & Section** | Targeted strictly to enrolled students and parents of that classroom. |
| **Parents Only** | Institutional circulars requiring guardian acknowledgment. |

---

## 3. Empty & Error States

- **No Active Notices**: When no circulars match the active filter or date range, an empty state instructs administrators: *"No notices published for this cohort. Click 'Create Notice' to broadcast a new announcement."*
- **Attachment Size Exceeded**: Displays validation alert if uploaded file exceeds the configured limit (default: 10MB).
- **Missing Required Fields**: Highlighted inline on Title, Audience Scope, and Content.
