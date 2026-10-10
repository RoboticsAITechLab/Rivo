import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth/authorize';

type ImportEntity = 'STUDENTS' | 'TEACHERS' | 'CLASSES' | 'SUBJECTS';

function parseCSV(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) return { headers: [], rows: [] };

  const rawHeaders = lines[0].split(',').map((h) => h.replace(/^["']|["']$/g, '').trim());
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map((v) => v.replace(/^["']|["']$/g, '').trim());
    const row: Record<string, string> = {};
    rawHeaders.forEach((header, idx) => {
      row[header] = values[idx] || '';
    });
    rows.push(row);
  }

  return { headers: rawHeaders, rows };
}

// POST /api/school/data/import - Handle real CSV bulk upload & parsing for students, teachers, classes, subjects
export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req, {
      roles: ['DIRECTOR', 'PRINCIPAL', 'ADMIN', 'SCHOOL_ADMIN', 'OWNER'],
    });
    if (!auth.authorized) {
      return auth.response;
    }

    if (!auth.schoolId) {
      return NextResponse.json({ message: 'School context required' }, { status: 400 });
    }

    let entity: ImportEntity = 'STUDENTS';
    let fileContent = '';
    let dryRun = false;

    const contentType = req.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') as File | null;
      entity = ((formData.get('entity') as string) || 'STUDENTS').toUpperCase() as ImportEntity;
      dryRun = formData.get('dryRun') === 'true';

      if (!file) {
        return NextResponse.json({ message: 'No file provided in form data' }, { status: 400 });
      }

      fileContent = await file.text();
    } else {
      const body = await req.json();
      entity = (body.entity || 'STUDENTS').toUpperCase() as ImportEntity;
      fileContent = body.fileContent || '';
      dryRun = Boolean(body.dryRun);
    }

    if (!fileContent.trim()) {
      return NextResponse.json({ message: 'CSV content is empty' }, { status: 400 });
    }

    const { headers, rows } = parseCSV(fileContent);

    if (rows.length === 0) {
      return NextResponse.json({ message: 'No data rows found in uploaded file' }, { status: 400 });
    }

    const errors: { row: number; reason: string }[] = [];
    const validRows: any[] = [];

    // Row-level schema validation
    rows.forEach((row, idx) => {
      const rowNum = idx + 2; // 1-indexed, accounting for header
      if (entity === 'STUDENTS') {
        const admissionNumber = row.AdmissionNumber || row.admissionNumber || row['Admission No'];
        const firstName = row.FirstName || row.firstName || row['First Name'];
        const lastName = row.LastName || row.lastName || row['Last Name'] || '';

        if (!admissionNumber) {
          errors.push({ row: rowNum, reason: 'AdmissionNumber is required' });
          return;
        }
        if (!firstName) {
          errors.push({ row: rowNum, reason: 'FirstName is required' });
          return;
        }

        validRows.push({
          admissionNumber: admissionNumber.trim(),
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          gender: row.Gender || row.gender || null,
          house: row.House || row.house || null,
          stream: row.Stream || row.stream || null,
          rollNumber: row.RollNumber || row.rollNumber || null,
        });
      } else if (entity === 'TEACHERS') {
        const employeeId = row.EmployeeId || row.employeeId || row['Employee ID'];
        const fullName = row.FullName || row.fullName || row['Full Name'];
        const email = row.Email || row.email;

        if (!employeeId) {
          errors.push({ row: rowNum, reason: 'EmployeeId is required' });
          return;
        }
        if (!fullName) {
          errors.push({ row: rowNum, reason: 'FullName is required' });
          return;
        }

        const parts = fullName.trim().split(/\s+/);
        validRows.push({
          employeeId: employeeId.trim(),
          firstName: parts[0] || '',
          lastName: parts.slice(1).join(' ') || '',
          email: email?.trim() || null,
          phone: row.Phone || row.phone || null,
        });
      } else if (entity === 'CLASSES') {
        const className = row.ClassName || row.className || row['Class Name'];
        if (!className) {
          errors.push({ row: rowNum, reason: 'ClassName is required' });
          return;
        }
        validRows.push({
          name: className.trim(),
          gradeLevel: Number(row.GradeLevel || row.gradeLevel) || 1,
        });
      } else if (entity === 'SUBJECTS') {
        const name = row.SubjectName || row.subjectName || row['Subject Name'];
        const code = row.SubjectCode || row.subjectCode || row['Subject Code'];
        if (!name || !code) {
          errors.push({ row: rowNum, reason: 'SubjectName and SubjectCode are required' });
          return;
        }
        validRows.push({
          name: name.trim(),
          code: code.trim().toUpperCase(),
        });
      }
    });

    if (dryRun) {
      return NextResponse.json({
        success: true,
        dryRun: true,
        entity,
        totalRows: rows.length,
        validCount: validRows.length,
        errorCount: errors.length,
        errors,
        preview: validRows.slice(0, 5),
      });
    }

    // Real persistence execution scoped strictly to auth.schoolId
    let processedCount = 0;

    await prisma.$transaction(async (tx) => {
      for (const item of validRows) {
        if (entity === 'STUDENTS') {
          const existing = await tx.student.findFirst({
            where: { schoolId: auth.schoolId, admissionNumber: item.admissionNumber },
          });

          if (!existing) {
            await tx.student.create({
              data: {
                schoolId: auth.schoolId,
                admissionNumber: item.admissionNumber,
                firstName: item.firstName,
                lastName: item.lastName,
                gender: item.gender,
                house: item.house,
                stream: item.stream,
                status: 'ACTIVE',
              },
            });
            processedCount++;
          }
        } else if (entity === 'TEACHERS') {
          const existing = await tx.teacher.findFirst({
            where: { schoolId: auth.schoolId, employeeId: item.employeeId },
          });

          if (!existing) {
            let user = item.email ? await tx.user.findFirst({ where: { email: item.email } }) : null;
            if (!user) {
              user = await tx.user.create({
                data: {
                  firstName: item.firstName,
                  lastName: item.lastName,
                  email: item.email || `${item.employeeId.toLowerCase()}@school.internal`,
                  phone: item.phone,
                  status: 'ACTIVE',
                  isActive: true,
                },
              });
            }

            await tx.teacher.create({
              data: {
                schoolId: auth.schoolId,
                employeeId: item.employeeId,
                userId: user.id,
              },
            });
            processedCount++;
          }
        } else if (entity === 'CLASSES') {
          const existing = await tx.class.findFirst({
            where: { schoolId: auth.schoolId, name: item.name },
          });

          if (!existing) {
            await tx.class.create({
              data: {
                schoolId: auth.schoolId,
                name: item.name,
                displayOrder: item.gradeLevel || 1,
              },
            });
            processedCount++;
          }
        } else if (entity === 'SUBJECTS') {
          const existing = await tx.subject.findFirst({
            where: { schoolId: auth.schoolId, code: item.code },
          });

          if (!existing) {
            await tx.subject.create({
              data: {
                schoolId: auth.schoolId,
                name: item.name,
                code: item.code,
              },
            });
            processedCount++;
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      entity,
      totalRows: rows.length,
      processedCount,
      errorCount: errors.length,
      errors,
    });
  } catch (error: any) {
    console.error('Error in POST /api/school/data/import:', error);
    return NextResponse.json({ message: 'Internal server error during import', detail: error.message }, { status: 500 });
  }
}
