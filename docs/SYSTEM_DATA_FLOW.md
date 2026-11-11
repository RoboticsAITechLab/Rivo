# RIVO — System Data Flow Architecture

> **Last Verified:** November 11, 2026  
> **Status:** Code-Verified Data Lifecycle  
> **Scope:** End-to-End Tracing Across UI, API, Business Services, and Datastores

---

## 1. Authentication & Session Resolution Flow

```mermaid
sequenceDiagram
    autonumber
    actor User as User Browser / Client
    participant Edge as Edge Middleware (apps/web/src/middleware.ts)
    participant Route as Auth Route (/api/auth/login)
    participant Scrypt as Crypto Engine (lib/auth/crypto.ts)
    participant DB as Neon PostgreSQL (Prisma)
    participant Redis as Upstash Redis (rivo:session:*)

    User->>Route: POST /api/auth/login { email, password, rememberMe }
    Route->>DB: Query User by email with memberships & MFA
    DB-->>Route: User Record (passwordHash, status, mfa)
    Route->>Scrypt: verifyPassword(password, user.passwordHash)
    Scrypt-->>Route: Valid Boolean
    alt Invalid Password
        Route-->>User: HTTP 401 { message: 'Invalid email or password.' }
    else Valid Password
        alt MFA Enabled
            Route->>DB: Generate MfaChallenge token
            Route-->>User: HTTP 200 { requireMfa: true, challengeToken }
        else MFA Disabled / Verified
            Route->>Route: generateSecureToken(32) -> rawToken
            Route->>Route: hashToken(rawToken) -> tokenHash
            Route->>DB: Create Session row (tokenHash, userId, schoolId, expiresAt)
            Route->>Redis: Cache Session (rivo:session:<tokenHash>)
            Route-->>User: HTTP 200 (Set-Cookie: rivo_session=<rawToken>)
        end
    end
```

---

## 2. Fee Collection & Instant Receipt PDF Flow

```mermaid
sequenceDiagram
    autonumber
    actor Admin as School Cashier / Admin
    participant UI as /school/fees/payments/new
    participant API as POST /api/fees/payments
    participant FeeSvc as FeePaymentService (lib/fees)
    participant DB as Neon PostgreSQL ($transaction)
    participant PDFSvc as FeePdfService (lib/fees/fee-pdf-service.ts)

    Admin->>UI: Select Student, Input Amount ($500), Mode (UPI/Cash)
    UI->>API: POST /api/fees/payments { studentId, amount, paymentMode, ... }
    API->>FeeSvc: recordFeePayment(schoolId, userId, payload)
    FeeSvc->>DB: prisma.$transaction(async (tx) => ...)
    Note over DB: 1. Fetch pending FeeObligations for student<br>2. Validate totalAmount <= sum(pending obligations)<br>3. Insert FeePayment record<br>4. Increment atomic receipt number in IdSequence<br>5. Generate FeePaymentAllocation rows<br>6. Update FeeObligation paidAmount & balanceAmount<br>7. Create immutable FeeReceipt record<br>8. Write FeeAuditLog entry
    DB-->>FeeSvc: Committed { payment, receipt }
    FeeSvc-->>API: Payment Result
    API-->>UI: HTTP 201 { success: true, receiptId: receipt.id }
    
    UI->>API: GET /api/fees/receipts/[id]/pdf
    API->>PDFSvc: generateReceiptPdfBuffer(schoolId, receiptId)
    PDFSvc->>DB: Fetch receipt with payment, school branding, student snapshot
    PDFSvc->>PDFSvc: Render vector A4 PDF using pdf-lib in memory
    PDFSvc-->>API: Uint8Array PDF Buffer
    API-->>Admin: HTTP 200 (Content-Type: application/pdf)
```

---

## 3. Student Admission & Roll Number Balancing Flow

```mermaid
sequenceDiagram
    autonumber
    actor Registrar as School Admissions Officer
    participant Form as AdmissionWorkspace (students/new)
    participant API as POST /api/students
    participant IdGen as ID Generator (lib/id-generator)
    participant RollSvc as RollNumberService (lib/students)
    participant DB as Neon PostgreSQL ($transaction)

    Registrar->>Form: Fill 6-step intake form (Personal, Guardian, Class)
    Form->>API: POST /api/students { studentData, guardianData, enrollmentData }
    API->>IdGen: generateNextStudentId(schoolId, 'STUDENT', academicYear)
    IdGen->>DB: Atomic increment in IdSequence table
    IdGen-->>API: Next Admission Number (e.g. "GIS-2026-042")
    
    alt Roll Number Mode == 'AUTO'
        API->>RollSvc: calculateNextAlphabeticalRollNumber(schoolId, classId, sectionId, studentName)
        RollSvc->>DB: Query existing enrolled students in class/section
        RollSvc->>RollSvc: Unicode NFC collation & sort with tie-breakers
        RollSvc-->>API: Assigned Roll Number (e.g. 14)
    end

    API->>DB: prisma.$transaction(...)
    Note over DB: 1. Insert Student record<br>2. Upsert Parent record<br>3. Link via ParentStudent<br>4. Create StudentEnrollment (rollNumber, status: ACTIVE)<br>5. Create initial StudentDocument rows
    DB-->>API: Transaction Committed
    API-->>Registrar: HTTP 201 { success: true, student: { id, admissionNumber } }
```

---

## 4. Timetable Clash Validation Flow

```mermaid
sequenceDiagram
    autonumber
    actor Scheduler as Timetable Incharge
    participant Grid as Timetable Grid UI (/school/timetable)
    participant API as POST /api/timetable/school
    participant Clash as ConflictEngine (lib/timetable)
    participant DB as Neon PostgreSQL

    Scheduler->>Grid: Drop Subject/Teacher into Slot (Day: Monday, Period: 3, Room: 101)
    Grid->>API: POST /api/timetable/school { classId, sectionId, dayOfWeek, periodNumber, teacherId, subjectId, roomNumber }
    API->>Clash: validateTimetableSlotConflict(schoolId, slotInput)
    Clash->>DB: Query existing slots for same session & dayOfWeek
    
    alt Teacher Conflict
        Clash-->>API: Conflict: Teacher already assigned to Class 10-B in Period 3
        API-->>Grid: HTTP 409 { code: 'TEACHER_DOUBLE_BOOKED', message: '...' }
    else Room Conflict
        Clash-->>API: Conflict: Room 101 occupied by Class 12-A in Period 3
        API-->>Grid: HTTP 409 { code: 'ROOM_COLLISION', message: '...' }
    else Conflict Free
        Clash-->>API: Validated (No Conflicts)
        API->>DB: Upsert TimetableSlot record
        DB-->>API: Slot Created
        API-->>Grid: HTTP 201 { success: true, slot }
    end
```

---

## 5. Direct-to-Cloud Media Upload Flow

```mermaid
sequenceDiagram
    autonumber
    actor User as User Browser (Avatar / Document Upload)
    participant SAS_API as POST /api/media/sas/upload
    participant Azure as Azure Blob Storage (rivo-private)
    participant EntityAPI as Entity Route (e.g. /api/students/[id]/photo)
    participant DB as Neon PostgreSQL

    User->>SAS_API: POST /api/media/sas/upload { category: 'AVATAR', mimeType: 'image/jpeg', size: 1048576 }
    SAS_API->>SAS_API: Verify user authenticated & tenant active
    SAS_API->>SAS_API: Check quota (max 2MB for avatar) & MIME type
    SAS_API->>SAS_API: Generate write-only SAS URL (cw permissions, 15m TTL)
    SAS_API-->>User: { uploadUrl, blobKey: "schools/SCH-1/avatars/STU-1/hash.jpg" }
    
    User->>Azure: PUT <uploadUrl> (Binary payload direct from browser)
    Azure-->>User: HTTP 201 Created (ETag response)
    
    User->>EntityAPI: POST /api/students/[id]/photo { blobKey }
    EntityAPI->>DB: Update student photoUrl = blobKey
    DB-->>EntityAPI: Record Updated
    EntityAPI-->>User: HTTP 200 { success: true, photoUrl }
```

