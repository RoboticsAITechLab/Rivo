import { prisma } from '@/lib/prisma';
import {
  ExamMarkStatus,
  ExamResultOverallStatus,
  ResultPublicationStatus,
  SubjectResultStatus,
} from '@/generated/prisma';

export interface GradingBand {
  minPercentage: number;
  maxPercentage: number;
  grade: string;
  points: number;
  description: string;
}

// Extensible grading bands (CBSE / Standard percentage scale)
export const DEFAULT_GRADING_BANDS: GradingBand[] = [
  { minPercentage: 91, maxPercentage: 100, grade: 'A1', points: 10, description: 'Outstanding' },
  { minPercentage: 81, maxPercentage: 90.99, grade: 'A2', points: 9, description: 'Excellent' },
  { minPercentage: 71, maxPercentage: 80.99, grade: 'B1', points: 8, description: 'Very Good' },
  { minPercentage: 61, maxPercentage: 70.99, grade: 'B2', points: 7, description: 'Good' },
  { minPercentage: 51, maxPercentage: 60.99, grade: 'C1', points: 6, description: 'Above Average' },
  { minPercentage: 41, maxPercentage: 50.99, grade: 'C2', points: 5, description: 'Average' },
  { minPercentage: 33, maxPercentage: 40.99, grade: 'D', points: 4, description: 'Pass' },
  { minPercentage: 0, maxPercentage: 32.99, grade: 'E', points: 0, description: 'Needs Improvement' },
];

export function calculateGrade(percentage: number): string {
  const rounded = Math.round(percentage * 100) / 100;
  for (const band of DEFAULT_GRADING_BANDS) {
    if (rounded >= band.minPercentage && rounded <= band.maxPercentage) {
      return band.grade;
    }
  }
  return rounded >= 33 ? 'D' : 'E';
}

export interface MarkEntryItem {
  studentId: string;
  marksObtained: number | null;
  status: ExamMarkStatus;
  remarks?: string;
}

export class ResultsService {
  /**
   * Retrieves students for a paper and class/section along with existing marks
   */
  static async getMarksRoster(params: {
    schoolId: string;
    examTermId: string;
    paperId: string;
    classId: string;
    sectionId: string;
    teacherUserId?: string;
  }) {
    const { schoolId, examTermId, paperId, classId, sectionId, teacherUserId } = params;

    // Verify paper belongs to school & examTerm
    const paper = await prisma.examPaper.findFirst({
      where: {
        id: paperId,
        examTermId,
        examTerm: { schoolId },
      },
      include: {
        subject: { select: { id: true, name: true, code: true } },
        examTerm: { select: { id: true, name: true, academicSessionId: true } },
      },
    });

    if (!paper) {
      throw new Error('Exam paper not found for this school and term');
    }

    // Verify teacher assignment if teacherUserId is provided
    if (teacherUserId) {
      const teacher = await prisma.teacher.findFirst({
        where: { schoolId, userId: teacherUserId },
      });
      if (teacher) {
        const assignment = await prisma.teacherAssignment.findFirst({
          where: {
            schoolId,
            teacherId: teacher.id,
            classId,
            sectionId,
            subjectId: paper.subjectId,
          },
        });
        if (!assignment) {
          throw new Error('Forbidden: You are not assigned to teach this subject for this class/section');
        }
      }
    }

    // Fetch active enrollments for this class & section in the term's academic session
    const enrollments = await prisma.studentEnrollment.findMany({
      where: {
        schoolId,
        classId,
        sectionId,
        academicSessionId: paper.examTerm.academicSessionId,
        status: 'ACTIVE',
      },
      include: {
        student: {
          select: {
            id: true,
            admissionNumber: true,
            firstName: true,
            lastName: true,
            gender: true,
          },
        },
      },
      orderBy: {
        student: { admissionNumber: 'asc' },
      },
    });

    // Fetch existing marks
    const existingMarks = await prisma.examMark.findMany({
      where: {
        schoolId,
        examTermId,
        paperId,
        studentId: { in: enrollments.map((e) => e.student.id) },
      },
    });

    const marksMap = new Map(existingMarks.map((m) => [m.studentId, m]));

    const roster = enrollments.map((e) => {
      const mark = marksMap.get(e.student.id);
      return {
        student: e.student,
        markId: mark?.id || null,
        marksObtained: mark?.marksObtained ?? null,
        maxMarks: mark?.maxMarks ?? paper.maxMarks,
        passingMarks: mark?.passingMarks ?? paper.passingMarks,
        status: mark?.status || 'PRESENT',
        remarks: mark?.remarks || '',
        updatedAt: mark?.updatedAt || null,
      };
    });

    return {
      paper: {
        id: paper.id,
        name: paper.name,
        subject: paper.subject,
        maxMarks: paper.maxMarks,
        passingMarks: paper.passingMarks,
        examTerm: paper.examTerm,
      },
      roster,
    };
  }

  /**
   * Bulk enters or updates marks with validation
   */
  static async saveMarks(params: {
    schoolId: string;
    examTermId: string;
    paperId: string;
    marks: MarkEntryItem[];
    enteredByUserId: string;
  }) {
    const { schoolId, examTermId, paperId, marks, enteredByUserId } = params;

    const paper = await prisma.examPaper.findFirst({
      where: {
        id: paperId,
        examTermId,
        examTerm: { schoolId },
      },
      include: {
        examTerm: { select: { id: true, academicSessionId: true } },
      },
    });

    if (!paper) {
      throw new Error('Exam paper not found for this school and term');
    }

    // Validate marks
    for (const item of marks) {
      if (item.status === 'PRESENT') {
        if (item.marksObtained === null || item.marksObtained === undefined) {
          throw new Error(`Marks obtained is required for student ${item.studentId} when status is PRESENT`);
        }
        if (item.marksObtained < 0) {
          throw new Error(`Marks cannot be negative for student ${item.studentId}`);
        }
        if (item.marksObtained > paper.maxMarks) {
          throw new Error(
            `Marks obtained (${item.marksObtained}) exceeds maximum marks (${paper.maxMarks}) for student ${item.studentId}`
          );
        }
      } else {
        // ABSENT, NOT_ATTEMPTED, EXEMPT: do not store synthetic zero marks
        item.marksObtained = null;
      }
    }

    // Save in transaction
    const saved = await prisma.$transaction(async (tx) => {
      const results = [];
      for (const item of marks) {
        const record = await tx.examMark.upsert({
          where: {
            paperId_studentId: {
              paperId,
              studentId: item.studentId,
            },
          },
          create: {
            schoolId,
            academicSessionId: paper.examTerm.academicSessionId,
            examTermId,
            paperId,
            studentId: item.studentId,
            marksObtained: item.marksObtained,
            maxMarks: paper.maxMarks,
            passingMarks: paper.passingMarks,
            status: item.status,
            remarks: item.remarks?.trim() || null,
            enteredByUserId,
          },
          update: {
            marksObtained: item.marksObtained,
            maxMarks: paper.maxMarks,
            passingMarks: paper.passingMarks,
            status: item.status,
            remarks: item.remarks?.trim() || null,
            enteredByUserId,
          },
        });
        results.push(record);
      }

      // Record audit log
      await tx.resultAuditLog.create({
        data: {
          schoolId,
          examTermId,
          action: 'MARKS_RECORDED',
          performedByUserId: enteredByUserId,
          details: JSON.stringify({
            paperId,
            recordsCount: marks.length,
          }),
        },
      });

      return results;
    });

    return {
      success: true,
      count: saved.length,
    };
  }

  /**
   * Server-side authoritative result calculation engine
   */
  static async calculateResults(params: {
    schoolId: string;
    examTermId: string;
    classId?: string;
    sectionId?: string;
    performedByUserId: string;
  }) {
    const { schoolId, examTermId, classId, sectionId, performedByUserId } = params;

    const term = await prisma.examTerm.findFirst({
      where: { id: examTermId, schoolId },
      include: {
        academicSession: true,
        papers: {
          include: { subject: true },
        },
      },
    });

    if (!term) {
      throw new Error('Exam term not found');
    }

    // Find target enrollments
    const enrollments = await prisma.studentEnrollment.findMany({
      where: {
        schoolId,
        academicSessionId: term.academicSessionId,
        status: 'ACTIVE',
        ...(classId ? { classId } : {}),
        ...(sectionId ? { sectionId } : {}),
      },
      include: {
        student: true,
        class: true,
        section: true,
      },
    });

    if (enrollments.length === 0) {
      return { calculatedCount: 0, message: 'No active students found in target cohort' };
    }

    // Get all marks for this term for these students
    const studentIds = enrollments.map((e) => e.studentId);
    const allMarks = await prisma.examMark.findMany({
      where: {
        schoolId,
        examTermId,
        studentId: { in: studentIds },
      },
    });

    // Group marks by studentId
    const marksByStudent = new Map<string, typeof allMarks>();
    for (const mark of allMarks) {
      const list = marksByStudent.get(mark.studentId) || [];
      list.push(mark);
      marksByStudent.set(mark.studentId, list);
    }

    const calculatedResults = await prisma.$transaction(async (tx) => {
      const results = [];

      for (const enrollment of enrollments) {
        const studentMarks = marksByStudent.get(enrollment.studentId) || [];
        
        let totalObtained = 0;
        let maxTotal = 0;
        let failedSubjectsCount = 0;
        let absentSubjectsCount = 0;

        const subjectResultsData: Array<{
          paperId: string;
          subjectId: string;
          marksObtained: number | null;
          maxMarks: number;
          passingMarks: number;
          grade: string;
          status: SubjectResultStatus;
          remarks?: string | null;
        }> = [];

        for (const paper of term.papers) {
          const mark = studentMarks.find((m) => m.paperId === paper.id);

          maxTotal += paper.maxMarks;

          if (!mark || mark.status === 'ABSENT') {
            absentSubjectsCount++;
            failedSubjectsCount++;
            subjectResultsData.push({
              paperId: paper.id,
              subjectId: paper.subjectId,
              marksObtained: null,
              maxMarks: paper.maxMarks,
              passingMarks: paper.passingMarks,
              grade: 'AB',
              status: 'ABSENT',
              remarks: mark?.remarks || 'Absent from examination',
            });
          } else if (mark.status === 'EXEMPT') {
            subjectResultsData.push({
              paperId: paper.id,
              subjectId: paper.subjectId,
              marksObtained: null,
              maxMarks: paper.maxMarks,
              passingMarks: paper.passingMarks,
              grade: 'EX',
              status: 'EXEMPT',
              remarks: mark.remarks || 'Exempted',
            });
          } else {
            const obtained = mark.marksObtained ?? 0;
            totalObtained += obtained;
            const subjectPercentage = paper.maxMarks > 0 ? (obtained / paper.maxMarks) * 100 : 0;
            const isPass = obtained >= paper.passingMarks;
            if (!isPass) failedSubjectsCount++;

            subjectResultsData.push({
              paperId: paper.id,
              subjectId: paper.subjectId,
              marksObtained: obtained,
              maxMarks: paper.maxMarks,
              passingMarks: paper.passingMarks,
              grade: calculateGrade(subjectPercentage),
              status: isPass ? 'PASS' : 'FAIL',
              remarks: mark.remarks || null,
            });
          }
        }

        const percentage = maxTotal > 0 ? Math.round((totalObtained / maxTotal) * 10000) / 100 : 0;
        const overallGrade = calculateGrade(percentage);

        let overallStatus: ExamResultOverallStatus = 'PASS';
        if (failedSubjectsCount > 1) {
          overallStatus = 'FAIL';
        } else if (failedSubjectsCount === 1) {
          overallStatus = 'COMPARTMENT';
        }

        // Check if existing result was published
        const existingResult = await tx.examResult.findUnique({
          where: {
            examTermId_studentId: {
              examTermId,
              studentId: enrollment.studentId,
            },
          },
        });

        // Retain PUBLISHED status if it was already published, otherwise CALCULATED
        const publicationStatus: ResultPublicationStatus =
          existingResult?.status === 'PUBLISHED' ? 'PUBLISHED' : 'CALCULATED';

        const examResult = await tx.examResult.upsert({
          where: {
            examTermId_studentId: {
              examTermId,
              studentId: enrollment.studentId,
            },
          },
          create: {
            schoolId,
            academicSessionId: term.academicSessionId,
            examTermId,
            studentId: enrollment.studentId,
            classId: enrollment.classId,
            sectionId: enrollment.sectionId,
            totalMarks: totalObtained,
            maxTotalMarks: maxTotal,
            percentage,
            grade: overallGrade,
            overallStatus,
            status: publicationStatus,
            calculatedAt: new Date(),
          },
          update: {
            totalMarks: totalObtained,
            maxTotalMarks: maxTotal,
            percentage,
            grade: overallGrade,
            overallStatus,
            status: publicationStatus,
            calculatedAt: new Date(),
          },
        });

        // Delete old subject results and re-insert fresh
        await tx.examResultSubject.deleteMany({
          where: { examResultId: examResult.id },
        });

        for (const sr of subjectResultsData) {
          await tx.examResultSubject.create({
            data: {
              examResultId: examResult.id,
              paperId: sr.paperId,
              subjectId: sr.subjectId,
              marksObtained: sr.marksObtained,
              maxMarks: sr.maxMarks,
              passingMarks: sr.passingMarks,
              grade: sr.grade,
              status: sr.status,
              remarks: sr.remarks,
            },
          });
        }

        results.push(examResult);
      }

      await tx.resultAuditLog.create({
        data: {
          schoolId,
          examTermId,
          action: 'RESULT_CALCULATED',
          performedByUserId,
          details: JSON.stringify({
            calculatedCount: results.length,
            classId: classId || 'ALL',
            sectionId: sectionId || 'ALL',
          }),
        },
      });

      return results;
    }, { maxWait: 15000, timeout: 60000 });

    return {
      success: true,
      calculatedCount: calculatedResults.length,
    };
  }

  /**
   * Publishes or withdraws exam results for a term
   */
  static async setPublicationStatus(params: {
    schoolId: string;
    examTermId: string;
    publish: boolean;
    classId?: string;
    sectionId?: string;
    performedByUserId: string;
  }) {
    const { schoolId, examTermId, publish, classId, sectionId, performedByUserId } = params;

    const term = await prisma.examTerm.findFirst({
      where: { id: examTermId, schoolId },
    });

    if (!term) {
      throw new Error('Exam term not found');
    }

    const newStatus: ResultPublicationStatus = publish ? 'PUBLISHED' : 'WITHDRAWN';
    const publishedAt = publish ? new Date() : null;

    const updated = await prisma.$transaction(async (tx) => {
      const updateResult = await tx.examResult.updateMany({
        where: {
          schoolId,
          examTermId,
          ...(classId ? { classId } : {}),
          ...(sectionId ? { sectionId } : {}),
        },
        data: {
          status: newStatus,
          publishedAt,
          publishedByUserId: publish ? performedByUserId : null,
        },
      });

      await tx.resultAuditLog.create({
        data: {
          schoolId,
          examTermId,
          action: publish ? 'RESULT_PUBLISHED' : 'RESULT_WITHDRAWN',
          performedByUserId,
          details: JSON.stringify({
            affectedCount: updateResult.count,
            classId: classId || 'ALL',
            sectionId: sectionId || 'ALL',
          }),
        },
      });

      return updateResult;
    });

    return {
      success: true,
      count: updated.count,
      status: newStatus,
    };
  }

  /**
   * Retrieves student marksheet for admin, teacher, or parent
   */
  static async getStudentMarksheet(params: {
    schoolId: string;
    studentId: string;
    examTermId?: string;
    parentUserId?: string;
    requirePublished?: boolean;
  }) {
    const { schoolId, studentId, examTermId, parentUserId, requirePublished } = params;

    // Verify parent authorization if parentUserId is passed
    if (parentUserId) {
      const parent = await prisma.parent.findFirst({
        where: { schoolId, userId: parentUserId },
      });
      if (!parent) {
        return null;
      }

      const parentStudent = await prisma.parentStudent.findFirst({
        where: {
          parentId: parent.id,
          studentId,
        },
      });

      if (!parentStudent) {
        return null; // IDOR protected: foreign student rejected
      }
    }

    const student = await prisma.student.findFirst({
      where: { id: studentId, schoolId },
      include: {
        campus: { select: { id: true, name: true, city: true } },
        school: { select: { id: true, name: true, slug: true } },
      },
    });

    if (!student) {
      return null;
    }

    // Query exam results
    const results = await prisma.examResult.findMany({
      where: {
        schoolId,
        studentId,
        ...(examTermId ? { examTermId } : {}),
        ...(requirePublished ? { status: 'PUBLISHED' } : {}),
      },
      include: {
        examTerm: { select: { id: true, name: true, code: true, startDate: true, endDate: true } },
        class: { select: { id: true, name: true } },
        section: { select: { id: true, name: true } },
        academicSession: { select: { id: true, name: true } },
        subjectResults: {
          include: {
            subject: { select: { id: true, name: true, code: true } },
            paper: { select: { id: true, name: true, maxMarks: true, passingMarks: true } },
          },
        },
      },
      orderBy: { calculatedAt: 'desc' },
    });

    return {
      student,
      results,
    };
  }

  /**
   * Retrieves class tabulation sheet with server-side pagination & aggregation
   */
  static async getClassTabulation(params: {
    schoolId: string;
    examTermId: string;
    classId: string;
    sectionId?: string;
    page?: number;
    limit?: number;
    search?: string;
  }) {
    const { schoolId, examTermId, classId, sectionId, page = 1, limit = 20, search } = params;

    const term = await prisma.examTerm.findFirst({
      where: { id: examTermId, schoolId },
      include: {
        papers: {
          include: { subject: true },
          orderBy: { name: 'asc' },
        },
      },
    });

    if (!term) {
      throw new Error('Exam term not found');
    }

    const whereClause: any = {
      schoolId,
      examTermId,
      classId,
      ...(sectionId && sectionId !== 'ALL' ? { sectionId } : {}),
    };

    if (search && search.trim() !== '') {
      whereClause.student = {
        OR: [
          { firstName: { contains: search.trim(), mode: 'insensitive' } },
          { lastName: { contains: search.trim(), mode: 'insensitive' } },
          { admissionNumber: { contains: search.trim(), mode: 'insensitive' } },
        ],
      };
    }

    const totalCount = await prisma.examResult.count({ where: whereClause });

    const records = await prisma.examResult.findMany({
      where: whereClause,
      include: {
        student: {
          select: {
            id: true,
            admissionNumber: true,
            firstName: true,
            lastName: true,
          },
        },
        class: { select: { id: true, name: true } },
        section: { select: { id: true, name: true } },
        subjectResults: {
          include: {
            subject: { select: { id: true, name: true, code: true } },
          },
        },
      },
      orderBy: [
        { percentage: 'desc' },
        { student: { admissionNumber: 'asc' } },
      ],
      skip: (page - 1) * limit,
      take: limit,
    });

    // Compute server-side summary statistics
    const statsAgg = await prisma.examResult.aggregate({
      where: {
        schoolId,
        examTermId,
        classId,
        ...(sectionId && sectionId !== 'ALL' ? { sectionId } : {}),
      },
      _avg: { percentage: true },
      _max: { percentage: true },
      _min: { percentage: true },
      _count: { id: true },
    });

    const passedCount = await prisma.examResult.count({
      where: {
        schoolId,
        examTermId,
        classId,
        ...(sectionId && sectionId !== 'ALL' ? { sectionId } : {}),
        overallStatus: 'PASS',
      },
    });

    const failedCount = await prisma.examResult.count({
      where: {
        schoolId,
        examTermId,
        classId,
        ...(sectionId && sectionId !== 'ALL' ? { sectionId } : {}),
        overallStatus: 'FAIL',
      },
    });

    const compartmentCount = await prisma.examResult.count({
      where: {
        schoolId,
        examTermId,
        classId,
        ...(sectionId && sectionId !== 'ALL' ? { sectionId } : {}),
        overallStatus: 'COMPARTMENT',
      },
    });

    const publishedCount = await prisma.examResult.count({
      where: {
        schoolId,
        examTermId,
        classId,
        ...(sectionId && sectionId !== 'ALL' ? { sectionId } : {}),
        status: 'PUBLISHED',
      },
    });

    return {
      term: {
        id: term.id,
        name: term.name,
        papers: term.papers,
      },
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      },
      statistics: {
        totalStudents: statsAgg._count.id,
        averagePercentage: Math.round((statsAgg._avg.percentage || 0) * 100) / 100,
        highestPercentage: statsAgg._max.percentage || 0,
        lowestPercentage: statsAgg._min.percentage || 0,
        passedCount,
        failedCount,
        compartmentCount,
        publishedCount,
      },
      records,
    };
  }
}
