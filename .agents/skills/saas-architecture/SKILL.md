---
name: saas-architecture
description: Enterprise SaaS domain modeling, tenant lifecycle, tiered institutional licensing, WhatsApp/SMS communication orchestration, and Indian data protection compliance (DPDP 2023)
version: 1.0.0
technologies:
  - SaaS Architecture Patterns
  - WhatsApp Business API & Resend Email
  - Indian Digital Personal Data Protection (DPDP) Act 2023
sources:
  - https://www.meity.gov.in/content/digital-personal-data-protection-act-2023
  - https://developers.facebook.com/docs/whatsapp/cloud-api/
verification_date: 2026-11-11
---

# Enterprise SaaS Architecture & Regulatory Skill

## 1. Purpose & Scope
High-level strategic architecture for enterprise multi-tenant education SaaS, communication gateway cost management, tenant onboarding/offboarding, and compliance with Indian data protection laws.

## 2. Core Engineering Principles
1. **Three-Tier Communication Strategy**:
   - **Tier 1 (In-App & Push Notifications)**: Free, default channel for general notices, homework, daily timetable updates.
   - **Tier 2 (WhatsApp Business Cloud API)**: Paid, high-engagement channel for urgent notices, fee payment links, student absence alerts. Requires template pre-approval by Meta and rate budgeting.
   - **Tier 3 (SMS Gateway)**: Costly fallback channel reserved exclusively for critical transactional OTPs and severe institutional emergencies.
2. **Indian Digital Personal Data Protection (DPDP) Act 2023 Compliance**:
   - **Data Principal Rights**: Schools, parents, and teachers must be able to view and request correction of their personal data.
   - **Children's Personal Data**: Children's data (students under 18) requires verifiable parental consent before processing. Tracking, behavioral monitoring, and targeted advertising directed at children are strictly prohibited.
   - **Data Minimization & Retention**: Collect only data strictly necessary for educational operations. Student KYC and identity records must have defined archival and deletion schedules upon student graduation or transfer.
   - **Breach Notification**: Under CERT-In and DPDP guidelines, cybersecurity incidents impacting personal data must be documented and reported within mandated timelines.
3. **Tenant Lifecycle & Offboarding**:
   - **Onboarding**: Atomic institution creation (`School` -> `Campus` -> default `AcademicSession` -> default admin user).
   - **Offboarding / Export**: Schools must be able to export their complete institutional dataset (students, teachers, fee ledgers, exam records) in standard formats (CSV / JSON) upon contract termination.
4. **Pragmatic Monolith vs Microservices**: Avoid premature microservice extraction. A well-modularized Next.js full-stack monolith co-located with PostgreSQL provides superior latency, atomic transactions, lower operational overhead, and simplified deployments for MVP and growth to 500+ schools.

## 3. Production Readiness Checklist
- [ ] Tiered communication fallback logic implemented (Push -> WhatsApp -> SMS).
- [ ] Student data handling compliant with DPDP parental consent guidelines.
- [ ] School data export capability verified.
- [ ] Audit logs maintained for all institutional modifications.

