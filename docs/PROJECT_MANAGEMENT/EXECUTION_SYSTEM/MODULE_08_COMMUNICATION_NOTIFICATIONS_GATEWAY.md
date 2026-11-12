# RIVO — Module 08: Communication & Notification Gateway

> **Document:** `MODULE_08_COMMUNICATION_NOTIFICATIONS_GATEWAY.md`  
> **System:** RIVO School Management SaaS Execution Management System  
> **Authority:** Systems Architect & Communication Lead | **Version:** 1.0.0-EXEC  

---

## 1. Module Objective
Orchestrate multi-channel school communication across notices, emergency bulletins, fee reminders, and attendance alerts using a cost-controlled 3-tier cascade: Tier 1 (Free In-App & Push) -> Tier 2 (Meta WhatsApp Cloud API) -> Tier 3 (Transactional SMS fallback).

---

## 2. Existing Implementation Status
- Notices and bulletin feeds implemented in `apps/web/src/app/api/notices`.
- Device token registration for push notifications exists in `/api/parent/device-token`.
- Gaps: Outbound Meta WhatsApp Cloud API integration is unbuilt; central 3-tier cascading router is unbuilt.

---

## 3. Required Final Functionality
- Central notification router dispatching messages across appropriate channels based on event priority.
- Meta WhatsApp Cloud API integration for urgent fee collection links, unexcused student absences, and emergency school closures.
- DLT-compliant Indian transactional SMS fallback (MSG91 / Twilio) reserved strictly for authentication OTPs and critical alerts.
- Institutional monthly communication budget caps preventing unexpected telecom billing.

---

## 4. Technical Requirements
- Firebase Cloud Messaging (FCM) SDK for mobile push delivery.
- Meta WhatsApp Business Cloud API (Graph API v19+) with pre-approved templates.
- Resend API (`resend 6.28.1`) for transactional email delivery.

---

## 5. Frontend Tasks
- School Admin Communication Center (`apps/web/(school)/school/communication`): Notice broadcast composer with audience filters (entire school, specific class, specific section, or individual parents).
- Mandatory read acknowledgment modal for emergency notices in Parent App.

---

## 6. Backend Tasks
- Build Central Notification Router in `apps/web/src/lib/notifications/router.ts`.
- Implement Meta WhatsApp Cloud API sender in `apps/web/src/lib/notifications/whatsapp-service.ts`.
- Implement webhook receiver for WhatsApp delivery receipts at `/api/webhooks/whatsapp`.

---

## 7. Database Tasks
- Deploy `CommunicationLog` model in `prisma/schema.prisma` tracking message ID, recipient phone/email, channel, delivery status (`QUEUED`, `SENT`, `DELIVERED`, `READ`, `FAILED`), and cost metrics.
- Track read receipts in `NoticeReadStatus`.

---

## 8. API Requirements
- `POST /api/notices`: Creates school notice, triggers cascading notification router.
- `GET /api/parent/notifications`: Returns categorized in-app notification feed.
- `POST /api/parent/device-token`: Registers/refreshes FCM token in `DeviceToken` table.

---

## 9. Security Requirements
- Webhooks from Meta WhatsApp strictly verified using app secret HMAC SHA-256 signatures.
- Parent and student phone numbers masked in logs; no PII exposed in unencrypted push payloads.

---

## 10. UI/UX Requirements
- Delivery status metrics displayed in School Admin communication dashboard:
  ```text
  Notice: "School Closed Due to Rain"
  Total Parents: 850 | Push Delivered: 780 | WhatsApp Delivered: 65 | SMS Fallback: 5
  ```

---

## 11. Integration Dependencies
- Consumes Meta WhatsApp Cloud API, Resend, Firebase FCM, and MSG91.
- Triggers from Fee Management (Module 05) and Attendance Management (Module 06).

---

## 12. Error and Edge-Case Handling
- If WhatsApp template delivery fails, fallback automatically attempts transactional SMS.
- If institutional SMS quota is exhausted, system logs warning and limits delivery to free push notifications.

---

## 13. Testing Strategy
- Unit test notification cascade router logic.
- Webhook signature test: Spoofed WhatsApp webhook payload rejected with `HTTP 401`.
- Budget cap test: School exceeding monthly SMS quota transitions to push-only delivery.

---

## 14. Acceptance Criteria
- [ ] Emergency notice triggers FCM push to parent devices in < 30 seconds.
- [ ] Absent student WhatsApp alert delivered with verified institutional sender ID.
- [ ] Delivery audit log accurately records delivery status and timestamps.

---

## 15. Deployment Considerations
- Environment variables required: `META_WHATSAPP_TOKEN`, `META_PHONE_NUMBER_ID`, `FIREBASE_PROJECT_ID`, `FIREBASE_SERVICE_ACCOUNT_KEY`.

---

## 16. Completion Checklist
- [ ] Multi-channel notification router implemented.
- [ ] WhatsApp Cloud API gateway verified.

---

## 17. Known Risks and Unresolved Decisions
- Meta template approval for new custom templates takes 24–48 hours; all standard educational templates must be pre-registered during Phase 3.

