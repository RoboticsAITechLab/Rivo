# RIVO — Module 09: Parent Ecosystem (Flutter Mobile App)

> **Document:** `MODULE_09_PARENT_ECOSYSTEM_FLUTTER.md`  
> **System:** RIVO School Management SaaS Execution Management System  
> **Authority:** Principal Mobile Architect | **Version:** 1.0.0-EXEC  

---

## 1. Module Objective
Deliver an enterprise-grade, accessible, and resilient native Flutter 3.x mobile application (`apps/parent`) for iOS and Android, enabling parents to track multiple children, view real-time attendance, review fee ledgers, execute online payments, download digital receipts, and acknowledge school notices.

---

## 2. Existing Implementation Status
- Flutter 3.x codebase initialized in `apps/parent`.
- Views exist for `home`, `login`, `mfa`, `notices`, `notifications`, `profile`, `results`.
- Riverpod state providers and Dio API client initialized.
- Active gaps: Missing multi-child switcher, fee ledger view, Razorpay payment checkout, and PDF receipt download (FEAT-04).

---

## 3. Required Final Functionality
- Phone number OTP login with biometric unlock (Fingerprint / Face ID via `local_auth`).
- Multi-child dropdown switcher in `AppBar` updating Riverpod state context across all tabs.
- Fee Ledger view displaying fee heads, installment schedule, and live pending balance.
- Razorpay/Cashfree mobile SDK checkout sheet triggering server-side webhook settlement.
- Vector A4 PDF receipt download via Dio, saving to local device and opening native share sheet.
- Monthly attendance heatmap calendar with medical slip upload to Azure Blob Storage.

---

## 4. Technical Requirements
- Flutter 3.x (Dart 3.x), `flutter_riverpod 2.5.1`, `dio 5.4.3`, `flutter_secure_storage 9.2.2`, `go_router 14.1.4`.
- Razorpay Flutter SDK (`razorpay_flutter`) or Cashfree SDK.
- Target platforms: Android (API 24+) and iOS (15.0+).

---

## 5. Frontend Tasks (Flutter)
- `RIVO-PAR-001`: Build `ChildSwitcher` dropdown in `apps/parent/lib/views/home_view.dart` wired to `selectedChildProvider`.
- `RIVO-PAR-002`: Build `FeeLedgerView` in `apps/parent/lib/views/fee_ledger_view.dart`.
- `RIVO-PAR-003`: Integrate native Razorpay checkout in `apps/parent/lib/core/payment_service.dart`.
- `RIVO-PAR-004`: Implement Dio receipt downloader in `apps/parent/lib/views/receipt_detail_view.dart`.
- `RIVO-PAR-005`: Build `AttendanceHeatmapView` in `apps/parent/lib/views/attendance_view.dart`.

---

## 6. Backend Tasks
- Wire `GET /api/parent/children`: Returns list of all linked children for the authenticated parent.
- Wire `GET /api/parent/children/[id]/fees`: Returns authoritative fee obligations and installment schedule.
- Implement `POST /api/parent/children/[id]/fees/pay-intent`: Generates gateway order ID.
- Wire `GET /api/parent/children/[id]/receipts/[receiptId]/pdf`: Streams receipt PDF buffer.

---

## 7. Database Tasks
- Verify `Parent`, `ParentStudent`, and `Student` relationships in `prisma/schema.prisma`.
- Ensure parent token queries enforce `where: { parentId: session.parentId }`.

---

## 8. API Requirements
- All parent mobile endpoints require `Authorization: Bearer <token>` header verified in Upstash Redis.
- Route handlers enforce strict parent-to-student relationship validation.

---

## 9. Security Requirements
- Auth tokens stored exclusively in `flutter_secure_storage` (EncryptedSharedPreferences / Keychain).
- Strict anti-tampering: App never computes fee balances locally; server is the sole financial authority.

---

## 10. UI/UX Requirements
- Clean bottom navigation: Home, Academics, Fees, Notices, Profile.
- Sub-200ms touch response; shimmer loading skeletons; zero layout shifts.
- Offline banner indicator when network is disconnected.

---

## 11. Integration Dependencies
- Consumes Next.js 16 REST API (`/api/parent/*`), Razorpay Mobile Gateway, and Firebase FCM.

---

## 12. Error and Edge-Case Handling
- Dio interceptor retries failed idempotent `GET` requests with exponential backoff (`1s -> 2s -> 4s`).
- Expired session (HTTP 401) clears secure storage and redirects to OTP login with user toast.

---

## 13. Testing Strategy
- Riverpod provider unit tests: Test child switching isolates downstream state queries.
- Widget test: Verify `FeeLedgerView` renders installment breakdown and "Pay Now" button.
- Device test: Run on physical low-end Android device (e.g. Redmi 9A / Samsung A12) to verify 60 FPS performance.

---

## 14. Acceptance Criteria
- [ ] Parent switches between 2 children without re-logging in; data strictly isolated.
- [ ] Completing test payment updates fee ledger status to `PAID`.
- [ ] Tapping "Download Receipt" opens native system share dialog with verified PDF.

---

## 15. Deployment Considerations
- Android keystore signing configured in `android/app/build.gradle`.
- Google Play Console Closed Testing track distribution.

---

## 16. Completion Checklist
- [ ] `RIVO-PAR-001` completed.
- [ ] `RIVO-PAR-002` completed.
- [ ] `RIVO-PAR-003` completed.
- [ ] `RIVO-PAR-004` completed.
- [ ] `RIVO-PAR-005` completed.

---

## 17. Known Risks and Unresolved Decisions
- Apple App Store Guideline 3.1.1 (In-App Purchase): School tuition fees are recognized as real-world physical educational services and are exempt from Apple 30% IAP commissions.
