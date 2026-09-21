# Notifications & Alert Triggers

The Notifications module (`/school/notifications`) controls real-time event alerts, dispatch logs, and delivery channels across the Rivo ecosystem.

---

## 1. Notification Channels

Rivo supports multi-channel alert dispatch depending on school preference and recipient settings:

1. **In-App Bell Alerts**: Delivered directly within the top-nav bar (`TopNav`) for logged-in web application users.
2. **Email Notifications**: Outbound transactional emails (e.g., login alerts, invitations, exam marksheets).
3. **SMS Alerts**: Urgent transactional text messages (e.g., student absence, emergency school closure).
4. **Push Notifications**: Mobile notifications sent to the companion parent/student mobile application.

> [!NOTE]
> **MVP Architecture Boundary**: The Web Application provides full control surfaces, channel toggles, and notification history. Delivery through SMS/Email gateways requires backend API connection and operational credentials (e.g., Twilio / SendGrid) configured in environment variables.

---

## 2. Event Triggers & Routing

Notifications are dispatched based on discrete domain events:

| Event Name | Default Channels | Target Recipients |
| :--- | :--- | :--- |
| **Student Marked Absent** | SMS, In-App, Push | Enrolled Student's Guardians |
| **New Homework Assigned** | In-App, Push | Enrolled Class Cohort, Parents |
| **Exam Schedule Published** | Email, In-App, Push | Exam Candidates, Parents, Teachers |
| **Exam Results Published** | In-App, Push, Email | Exam Candidates, Parents |
| **School Fee Reminder** | SMS, Email | Guardians |
| **Security Alert / New Login** | Email, In-App | User Account Owner |
| **Invitation to Platform** | Email | Invited Faculty / Staff Member |

---

## 3. Notification Center UI

- **Unread Badge**: Reflects pending notifications awaiting review in the top navigation bar.
- **Filter Tabs**: All Alerts, Attendance, Academic, Security, System.
- **Action Links**: Clicking a notification navigates directly to the referenced entity (e.g., clicking "Results published for Grade 10" opens `/school/results?examId=...`).
- **Mark All Read**: Bulk dismisses unread alerts.
