# Rivo — School Management Digital Ecosystem

Rivo is an enterprise multi-tenant School Management SaaS built for educational institutions, school administrators, and faculty educators.

---

## 🚀 Quick Start & Running Locally

### 1. Installation
```bash
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the project root:
```env
DATABASE_URL="postgresql://<user>:<password>@<neon-host>/neondb?sslmode=require"
PORT=4000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
JWT_SECRET=rivo-institutional-auth-secret-production-2026
```

### 3. Initialize Database & Seed Real Login Accounts
Run the database seed command:
```bash
npm run db:seed
```

This populates:
- **School Tenant**: Greenwood International School
- **Academic Session**: 2026-27
- **Class & Section**: Class 10 - Section A & B
- **Curriculum**: Mathematics, Science
- **Enrolled Students**: Active real student enrollment in Class 10-A
- **Teacher Assignment**: Teacher assigned to Class 10-A (Mathematics) as Class Teacher
- **Active Accounts**: School Admin and Teacher credentials

---

## 🔑 Login Credentials

Navigate to `http://localhost:3000/login` to sign in:

### 1. School Administrator
- **Email:** `admin@greenwood.edu`
- **Password:** `Password@123`
- **Role:** `SCHOOL_ADMIN`
- **Redirects to:** `/school` (Institutional Control Center, Student Directory, Teachers, Timetable, Exams)

### 2. Faculty Teacher
- **Email:** `teacher@greenwood.edu`
- **Password:** `Password@123`
- **Role:** `TEACHER`
- **Redirects to:** `/teacher/dashboard` (My Classes, Daily Attendance, Students, Timetable)

---

## 👨‍🏫 Teacher Workspace & Attendance Features

- **Teacher Dashboard (`/teacher/dashboard`)**:
  - Live statistics: Assigned Classes count, Enrolled Students count, Attendance Submitted Today.
  - Assigned class divisions and subjects.
  - Direct action buttons to take roll call.

- **Teacher Attendance (`/teacher/attendance`)**:
  - Teacher can only view and take attendance for authorized classes/sections.
  - Select assigned class, section, and date.
  - Quick action: "All Present" or individually toggle `PRESENT`, `ABSENT`, `LATE`, `LEAVE`.
  - Saves directly to Neon PostgreSQL database via `/api/teacher/attendance`.
  - Creates immutable audit log in `AttendanceAuditLog`.

- **Security & Multi-Tenancy**:
  - Strict tenant and class boundary checks on both frontend and backend.
  - Backend authorization validates teacher assignment before allowing attendance read/write.
  - Passwords hashed with secure Node `scrypt`.
  - Sessions handled with signed, HttpOnly cookies.

---

## 🌐 Deployment to Vercel

To deploy Rivo to Vercel:

### Method A: Via Git & Vercel Dashboard (Recommended)
1. Push your repository to GitHub:
   ```bash
   git add .
   git commit -m "Implement teacher authentication, real database seed, and attendance flow"
   git push origin main
   ```
2. Go to [vercel.com/new](https://vercel.com/new).
3. Import your repository: `RoboticsAITechLab/Rivo`.
4. Set **Root Directory** to: `apps/web`.
5. Add the following **Environment Variables**:
   - `DATABASE_URL`: Your Neon PostgreSQL connection string.
   - `JWT_SECRET`: A secure random string for signing session tokens.
6. Click **Deploy**.

### Method B: Via Vercel CLI
```bash
npx vercel
```
Follow the interactive prompts to link and deploy the project.

---

## 🧪 Testing & Verification

- **Build Check**:
  ```bash
  npm run build --workspace=web
  ```
- **Database Synchronization**:
  ```bash
  npx prisma db push
  ```
