# RIVO — Module 13: Public School Portal & Online Admission

> **Document:** `MODULE_13_PUBLIC_PORTAL_ONLINE_ADMISSION.md`  
> **System:** RIVO School Management SaaS Execution Management System  
> **Authority:** Product Lead & UX Architect | **Version:** 1.0.0-EXEC  

---

## 1. Module Objective
Deliver auto-generated, mobile-responsive public school landing pages (`/schools/[slug]`) and a streamlined 4-step online admission application funnel allowing prospective parents to submit inquiries and verification documents directly into the School Admin review queue.

---

## 2. Existing Implementation Status
- No public school route group exists in `apps/web/src/app`.
- No database model exists for prospective student inquiries in `prisma/schema.prisma`.

---

## 3. Required Final Functionality
- Headless school profile landing page at `/schools/[slug]` rendering school branding, notices, and curriculum info.
- 4-step online admission form (Student Info -> Parent Info -> Document Upload -> Review & Submit).
- Direct-to-cloud Azure Blob SAS upload for birth certificates and previous academic marks.
- School Admin admission review cockpit (`/school/admissions`) with 1-click "Admit & Enroll" button auto-generating `Student`, `ParentStudent`, and `FeeObligation` records.

---

## 4. Technical Requirements
- Next.js 16 App Router public routes with dynamic OpenGraph meta tags for social sharing.
- Azure Blob Storage private container with write-only SAS upload tokens.

---

## 5. Frontend Tasks
- `RIVO-PUB-002`: Build headless public school profile page at `apps/web/src/app/schools/[slug]/page.tsx`.
- `RIVO-PUB-003`: Build 4-step online admission form at `apps/web/src/app/schools/[slug]/apply/page.tsx`.
- `RIVO-PUB-004`: Build School Admin admission review cockpit at `apps/web/src/app/(school)/school/admissions/page.tsx`.

---

## 6. Backend Tasks
- Implement `POST /api/admissions/inquiry`: Creates `AdmissionInquiry` row, stores uploaded document keys, and dispatches SMS confirmation to prospective parent.
- Implement `POST /api/admissions/[id]/admit`: Converts inquiry into active student enrollment inside an atomic transaction.

---

## 7. Database Tasks
- `RIVO-PUB-001`: Deploy Prisma models:
  ```prisma
  model AdmissionInquiry {
    id              String           @id @default(uuid())
    schoolId        String
    inquiryNumber   String
    firstName       String
    lastName        String
    dateOfBirth     DateTime
    gender          Gender
    gradeApplyingFor String
    parentName      String
    parentPhone     String
    parentEmail     String?
    status          AdmissionStatus  @default(SUBMITTED)
    submittedAt     DateTime         @default(now())
    school          School           @relation(fields: [schoolId], references: [id], onDelete: Cascade)
    documents       AdmissionDocument[]
    @@unique([schoolId, inquiryNumber])
    @@index([schoolId, status])
  }

  model AdmissionDocument {
    id          String   @id @default(uuid())
    inquiryId   String
    documentType String
    fileKey     String
    fileName    String
    inquiry     AdmissionInquiry @relation(fields: [inquiryId], references: [id], onDelete: Cascade)
  }
  ```

---

## 8. API Requirements
- `GET /api/public/schools/[slug]`: Publicly accessible endpoint returning school metadata.
- `POST /api/admissions/inquiry`: Rate-limited public endpoint accepting admission form payload.
- `POST /api/admissions/[id]/admit`: Admin-authenticated endpoint executing student conversion.

---

## 9. Security Requirements
- Public inquiry endpoint rate-limited to 5 submissions per hour per IP to prevent spam attacks.
- Uploaded applicant documents stored in private Azure Blob container; accessible only by school admins via 5-minute SAS tokens.

---

## 10. UI/UX Requirements
- Stepper progress bar: `1. Student` -> `2. Guardians` -> `3. Documents` -> `4. Confirmation`.
- Instant application confirmation screen displaying reference ID: e.g. `ADM-2026-0042` with PDF summary download.

---

## 11. Integration Dependencies
- Consumes Azure Blob Storage and SMS Gateway for parent confirmation dispatch.
- Feeds active records into Student Management (Module 04) and Fee Management (Module 05).

---

## 12. Error and Edge-Case Handling
- Inquiring for a grade not offered by the school returns validation error: "Grade 11 is not offered by this campus."
- Duplicate application with identical phone and student name displays friendly notice: "An application is already active for this student."

---

## 13. Testing Strategy
- Unit test 4-step admission schema validation.
- End-to-end test: Submit application -> verify presence in admin cockpit -> click Admit -> verify `Student` row created.
- Rate limiting test: Verify 6th submission from same IP triggers `HTTP 429`.

---

## 14. Acceptance Criteria
- [ ] Parent completes online admission form in < 5 minutes on mobile phone.
- [ ] Uploaded birth certificate directly accessible in admin review cockpit.
- [ ] 1-click admission creates student enrollment and sends welcome SMS without duplicating parent user account.

---

## 15. Deployment Considerations
- Dynamic robots.txt and sitemap.xml generated for `/schools/[slug]` to support local school SEO.

---

## 16. Completion Checklist
- [ ] `RIVO-PUB-001` completed.
- [ ] `RIVO-PUB-002` completed.
- [ ] `RIVO-PUB-003` completed.
- [ ] `RIVO-PUB-004` completed.

---

## 17. Known Risks and Unresolved Decisions
- Online admission fee processing (e.g. ₹500 registration fee) is optional and configurable in school settings.

