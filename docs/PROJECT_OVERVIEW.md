# RIVO — Project Overview

> **Last Verified:** November 11, 2026  
> **Target Audience:** Product Managers, Engineering Leads, Stakeholders  
> **Status:** Code-Verified Ground Truth

---

## 1. Executive Summary

**Rivo** is an institutional School Management SaaS and Operating System designed specifically for modern K-12 private, public, and independent schools, senior secondary academies, and multi-campus educational networks.

The system replaces legacy, fragmented administrative spreadsheets and paper registers with a unified, cloud-native platform that automates:
- Multi-campus physical and academic governance.
- Annual multi-installment fee planning, collection ledgers, and serverless receipt generation.
- Real-time student intake, custom ID generation, and deterministic alphabetical roll number balancing.
- Faculty directory management, KYC document compliance, and granular scope-based access delegation.
- Conflict-free timetable scheduling and formal examination cycle administration.
- Daily roll-call attendance registers, homework distribution, and audience-scoped circular broadcasts.
- Authoritative grade calculation, CBSE 8-band grading, and examination publication lockdowns.

---

## 2. Product Vision & Commercial Objectives

### 2.1 The Problem Space
Schools operate in high-friction administrative environments:
1. **Financial Discrepancies:** Manual fee tracking leads to uncollected balances, disputed cash collections, and lost receipts.
2. **Scheduling Clashes:** Timetable and examination scheduling manually created on whiteboards result in teacher double-booking, room capacity collisions, and cohort overlaps.
3. **Fragmented Communication:** Important circulars get lost in unorganized WhatsApp groups with no read-receipt accountability.
4. **Data Silos:** Student records, attendance marks, fee obligations, and exam results exist in independent, unconnected databases or physical files.

### 2.2 Rivo's Value Proposition
- **Single Institutional Truth:** Campuses, classes, teachers, and students are configured once and immediately power fee assignments, timetable slots, attendance rosters, and examination marksheets.
- **Financial Auditability:** Immutable versioned fee plans, double-entry payment allocations, non-destructive transactional reversals, and tamper-evident receipt numbers.
- **Zero-Friction Adoption:** High-speed Next.js 16 web interface, fast mobile-optimized views, and WhatsApp-friendly communication links.

---

## 3. Current Phase Focus & Priorities

### Current Priority: The School Administration Engine (`apps/web/src/app/(school)/school/*`)
To ensure a successful market launch, development is strictly focused on finalizing the **School / Admin Management OS**.

- **Frozen Subsystems:** The Parent Web Portal (`/(parent)`), Parent Mobile App (`apps/parent`), and Student views are functionally complete for current requirements. No redesigns or feature additions should be performed on parent/student code until the administrative engine is deployed.
- **Top Commercial Modules:**
  1. **Fee Management:** Heads, plans, installment schedules, obligations, payment collections, and PDF receipts.
  2. **Student Admissions & Roll Allocation:** Sequential atomic ID assignment and alphabetical roll balancing.
  3. **Faculty & Compliance:** Staff onboarding, verification workflows, and granular permission overrides.
  4. **Examinations & Tabulation:** Date sheets, hall allocations, marks entry, and calculation locks.

---

## 4. User Personas & Access Boundaries

| User Persona | Target Interface | Core Responsibilities | Access Scope |
| :--- | :--- | :--- | :--- |
| **Director / Trustee** | `/(school)/school` | Executive governance, financial audits, custom role definitions, system security policies. | `SCHOOL` (Unrestricted Institutional Authority) |
| **Principal / Admin** | `/(school)/school` | Day-to-day operations, student admissions, fee collections, faculty allocation, timetable approvals, exam publishing. | `SCHOOL` (Operational & Academic Authority) |
| **Fee Manager** | `/(school)/school/fees` | Fee plan versioning, recording student payments, applying concessions, issuing official receipts, reversing payments. | `SCHOOL` (Restricted to Financial Ledger) |
| **Teacher / Faculty** | `/(teacher)/teacher` & `/(school)` | Daily roll-call attendance, class timetable viewing, student directory, KYC document upload, marks entry. | `ASSIGNED` (Assigned classes, sections, and subjects) |
| **Parent / Guardian** | `/(parent)/parent` & Mobile | Reviewing student fee obligations, downloading verified PDF receipts, circular notices, exam marksheets. | `OWN` (Linked wards only) |
| **Platform Operator** | `/testing-center` | Multi-tenant provisioning, platform health monitoring, synthetic load tests, automated regression runs. | `PLATFORM` (Super-Administrator) |

