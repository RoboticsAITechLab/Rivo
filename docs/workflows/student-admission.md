# Student Admission & Intake Workflow

The Student Admission Workspace (`/school/students/admission` or modal trigger from `/school/students`) provides a multi-stage wizard for onboarding newly enrolled scholars into the school registry.

---

## 1. Admission Lifecycle Flow

```
[1. Personal Identity]
         │
         ▼
[2. Contact & Address]
         │
         ▼
[3. Guardians Roster]
         │
         ▼
[4. Academic Placement]
         │
         ▼
[5. Documents & Intake Type]
         │
         ▼
[6. Health & Safety]
         │
         ▼
[7. Transport (Optional)]
         │
         ▼
[8. Communication Preferences]
         │
         ▼
[Duplicate Detection Check]
         │
    ┌────┴────┐
    ▼ Pass    ▼ Conflict Found
[Review]    [Duplicate Alert Modal]
    │
    ▼
[Submit & Allocate Enrollment]
```

---

## 2. Step-by-Step Intake Stages

### Step 1: Personal Identity
- **Photo Upload**: Optional student portrait (JPEG, PNG).
- **Name**: First Name (Required), Middle Name (Optional), Last Name (Required).
- **Demographics**: Gender (`Male`, `Female`, `Other`), Date of Birth (Required), Blood Group (`O+`, `A+`, `B+`, etc.), Nationality, Mother Tongue.

### Step 2: Contact & Address
- **Student Email & Phone**: Optional contact details for senior students.
- **Current Address**: Street, City, State, Postal PIN Code.
- **Permanent Address**: Option to mirror Current Address via checkbox (*"Permanent address same as current address"*).

### Step 3: Guardians Roster
- Multiple guardians can be attached.
- Exactly one guardian must be designated as **Primary Guardian** (`isPrimary = true`).
- Contact details, relationship (`Father`, `Mother`, `Legal Guardian`), occupation, emergency contact flag, and communication channel preferences (Receive SMS, Receive Email).

### Step 4: Academic Placement
- **Campus**: Branch where student will attend.
- **Class & Section**: Grade level and classroom division.
- **Class Roll Number**: Auto-suggested or manually overridden.
- **Academic Session**: Current academic intake year.
- **Academic Stream**: Mandatory if enrolling into senior grades where streams are enabled.
- **House Assignment**: **Completely Optional**. Students may have `houseId = null`.

### Step 5: Documents & Intake Type

The document requirements strictly depend on the **Intake Type**:

| Intake Type | Document Required | Status / Rule |
| :--- | :--- | :--- |
| **All Intakes** | National ID Proof (Aadhaar / National ID) | **Required** |
| **All Intakes** | Municipal Birth Certificate | **OPTIONAL** (Never blocks submission) |
| **First-Time Admission (`FIRST_TIME`)** | Previous Marksheet / Transfer Certificate | **NOT APPLICABLE** (Disabled) |
| **Transfer / Lateral Admission (`TRANSFER`)** | Previous School Marksheet & Transfer Certificate (TC) | **REQUIRED** (Must provide previous school name, grade, and documents) |

### Step 6: Health & Safety
- Known allergies, chronic medications, family physician contact.
- Emergency medical action instructions.

### Step 7: Transport (Optional)
- Opt-in toggle: *"Uses School Transport"*.
- If active: Bus route number, scheduled pickup stop, scheduled drop point.

### Step 8: Communication Preferences
- Preferred language for institutional notices (English, regional languages).
- Event category subscription flags (Academic alerts, attendance SMS, emergency circulars).

---

## 3. Duplicate Detection Safeguard

Before final creation, the intake engine executes `duplicate-detector.ts`:
- Checks for matching First Name + Last Name + Date of Birth + Primary Guardian Phone Number against active enrollments.
- If a collision occurs, a modal surfaces the existing student record to prevent accidental duplicate enrollment.
- The administrator can review the existing profile or confirm an intentional override.

---

## 4. Successful Enrollment Output

Upon submission:
1. Student record is created in the central store (`students`).
2. Unique Admission Number (`admissionNumber`) is assigned.
3. Class roll assignment is recorded.
4. Student 360 sheet becomes immediately accessible in the Student Directory.
