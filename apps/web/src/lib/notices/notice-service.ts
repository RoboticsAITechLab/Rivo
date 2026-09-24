import { prisma } from '@/lib/prisma';
import {
  NoticeStatus,
  NoticePriority,
  NoticeTargetType,
} from '@/generated/prisma';
import { AudienceResolver, NotificationDispatcher } from '@/lib/communication/communication-service';

export interface CreateNoticeInput {
  schoolId: string;
  authorId: string;
  title: string;
  body: string;
  priority?: NoticePriority;
  targetType: NoticeTargetType;
  classId?: string | null;
  sectionId?: string | null;
  publishImmediately?: boolean;
}

export class NoticeService {
  /**
   * Retrieves notices with role-based audience filtering & read status
   */
  static async getNotices(params: {
    schoolId: string;
    userId: string;
    role: string;
    status?: NoticeStatus | 'ALL';
    priority?: NoticePriority | 'ALL';
    targetType?: NoticeTargetType | 'ALL';
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const {
      schoolId,
      userId,
      role,
      status = 'ALL',
      priority = 'ALL',
      targetType = 'ALL',
      search,
      page = 1,
      limit = 20,
    } = params;

    const baseWhere: any = { schoolId };

    if (priority !== 'ALL') {
      baseWhere.priority = priority;
    }

    if (targetType !== 'ALL') {
      baseWhere.targetType = targetType;
    }

    if (search && search.trim() !== '') {
      baseWhere.OR = [
        { title: { contains: search.trim(), mode: 'insensitive' } },
        { body: { contains: search.trim(), mode: 'insensitive' } },
      ];
    }

    // Role-specific visibility logic
    if (role === 'PARENT') {
      // Find parent record
      const parent = await prisma.parent.findFirst({
        where: { schoolId, userId },
      });

      const childrenClassIds: string[] = [];
      const childrenSectionIds: string[] = [];

      if (parent) {
        const parentStudents = await prisma.parentStudent.findMany({
          where: { parentId: parent.id },
          include: {
            student: {
              include: {
                enrollments: {
                  where: { status: 'ACTIVE' },
                  select: { classId: true, sectionId: true },
                },
              },
            },
          },
        });

        for (const ps of parentStudents) {
          for (const enr of ps.student.enrollments) {
            childrenClassIds.push(enr.classId);
            childrenSectionIds.push(enr.sectionId);
          }
        }
      }

      baseWhere.status = 'PUBLISHED';
      baseWhere.AND = [
        {
          OR: [
            { targetType: 'ALL_SCHOOL' },
            { targetType: 'PARENTS' },
            ...(childrenClassIds.length > 0
              ? [{ targetType: 'CLASS', classId: { in: childrenClassIds } }]
              : []),
            ...(childrenSectionIds.length > 0
              ? [{ targetType: 'SECTION', sectionId: { in: childrenSectionIds } }]
              : []),
          ],
        },
      ];
    } else if (role === 'TEACHER') {
      baseWhere.status = 'PUBLISHED';
      baseWhere.AND = [
        {
          OR: [
            { targetType: 'ALL_SCHOOL' },
            { targetType: 'TEACHERS' },
          ],
        },
      ];
    } else {
      // School Admin, Director, Principal, Owner can filter by status
      if (status !== 'ALL') {
        baseWhere.status = status;
      }
    }

    const totalCount = await prisma.notice.count({ where: baseWhere });

    const notices = await prisma.notice.findMany({
      where: baseWhere,
      include: {
        class: { select: { id: true, name: true } },
        section: { select: { id: true, name: true } },
        readStatuses: {
          where: { userId },
          select: { id: true, readAt: true },
        },
      },
      orderBy: [
        { publishedAt: 'desc' },
        { createdAt: 'desc' },
      ],
      skip: (page - 1) * limit,
      take: limit,
    });

    const items = notices.map((n) => ({
      id: n.id,
      title: n.title,
      body: n.body,
      status: n.status,
      priority: n.priority,
      targetType: n.targetType,
      class: n.class,
      section: n.section,
      publishedAt: n.publishedAt,
      createdAt: n.createdAt,
      isRead: n.readStatuses.length > 0,
      readAt: n.readStatuses[0]?.readAt || null,
    }));

    return {
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      },
      notices: items,
    };
  }

  /**
   * Creates a draft or published notice
   */
  static async createNotice(input: CreateNoticeInput) {
    const {
      schoolId,
      authorId,
      title,
      body,
      priority = 'NORMAL',
      targetType,
      classId,
      sectionId,
      publishImmediately = false,
    } = input;

    if (!title || title.trim() === '') {
      throw new Error('Notice title is required');
    }
    if (!body || body.trim() === '') {
      throw new Error('Notice message body is required');
    }

    // Verify class & section belongs to school
    if (classId) {
      const cls = await prisma.class.findFirst({ where: { id: classId, schoolId } });
      if (!cls) throw new Error('Invalid class specified');
    }
    if (sectionId) {
      const sec = await prisma.section.findFirst({ where: { id: sectionId, schoolId } });
      if (!sec) throw new Error('Invalid section specified');
    }

    const status: NoticeStatus = publishImmediately ? 'PUBLISHED' : 'DRAFT';
    const publishedAt = publishImmediately ? new Date() : null;

    const notice = await prisma.$transaction(async (tx) => {
      const created = await tx.notice.create({
        data: {
          schoolId,
          authorId,
          title: title.trim(),
          body: body.trim(),
          priority,
          targetType,
          classId: classId || null,
          sectionId: sectionId || null,
          status,
          publishedAt,
        },
        include: {
          class: { select: { id: true, name: true } },
          section: { select: { id: true, name: true } },
        },
      });

      await tx.noticeAuditLog.create({
        data: {
          schoolId,
          noticeId: created.id,
          action: 'NOTICE_CREATED',
          performedByUserId: authorId,
          details: JSON.stringify({
            title: created.title,
            targetType: created.targetType,
            status: created.status,
          }),
        },
      });

      if (publishImmediately) {
        await tx.noticeAuditLog.create({
          data: {
            schoolId,
            noticeId: created.id,
            action: 'NOTICE_PUBLISHED',
            performedByUserId: authorId,
            details: JSON.stringify({ publishedAt }),
          },
        });
      }

      return created;
    });

    // If published immediately, dispatch notifications to resolved audience
    if (publishImmediately) {
      try {
        const userIds = await AudienceResolver.resolveUserIds({
          schoolId,
          targetType,
          classId,
          sectionId,
        });

        await NotificationDispatcher.dispatch({
          schoolId,
          userIds,
          title: notice.title,
          body: notice.body.slice(0, 150),
          category: 'NOTICE',
          linkUrl: `/school/notices`,
          priority,
        });
      } catch (dispatchErr) {
        console.error('[NOTICE DISPATCH ERROR]:', dispatchErr);
      }
    }

    return notice;
  }

  /**
   * Publishes an existing draft notice
   */
  static async publishNotice(params: {
    schoolId: string;
    noticeId: string;
    userId: string;
  }) {
    const { schoolId, noticeId, userId } = params;

    const notice = await prisma.notice.findFirst({
      where: { id: noticeId, schoolId },
    });

    if (!notice) {
      throw new Error('Notice not found');
    }

    const publishedAt = new Date();

    const updated = await prisma.$transaction(async (tx) => {
      const res = await tx.notice.update({
        where: { id: noticeId },
        data: {
          status: 'PUBLISHED',
          publishedAt,
        },
      });

      await tx.noticeAuditLog.create({
        data: {
          schoolId,
          noticeId,
          action: 'NOTICE_PUBLISHED',
          performedByUserId: userId,
          details: JSON.stringify({ publishedAt }),
        },
      });

      return res;
    });

    // Fan out notifications
    try {
      const userIds = await AudienceResolver.resolveUserIds({
        schoolId,
        targetType: notice.targetType,
        classId: notice.classId,
        sectionId: notice.sectionId,
      });

      await NotificationDispatcher.dispatch({
        schoolId,
        userIds,
        title: notice.title,
        body: notice.body.slice(0, 150),
        category: 'NOTICE',
        linkUrl: `/school/notices`,
        priority: notice.priority,
      });
    } catch (dispatchErr) {
      console.error('[NOTICE PUBLISH DISPATCH ERROR]:', dispatchErr);
    }

    return updated;
  }

  /**
   * Archives a notice
   */
  static async archiveNotice(params: {
    schoolId: string;
    noticeId: string;
    userId: string;
  }) {
    const { schoolId, noticeId, userId } = params;

    const notice = await prisma.notice.findFirst({
      where: { id: noticeId, schoolId },
    });

    if (!notice) {
      throw new Error('Notice not found');
    }

    return await prisma.$transaction(async (tx) => {
      const res = await tx.notice.update({
        where: { id: noticeId },
        data: { status: 'ARCHIVED' },
      });

      await tx.noticeAuditLog.create({
        data: {
          schoolId,
          noticeId,
          action: 'NOTICE_ARCHIVED',
          performedByUserId: userId,
        },
      });

      return res;
    });
  }

  /**
   * Marks a notice as read by a user
   */
  static async markNoticeRead(params: { noticeId: string; userId: string }) {
    const { noticeId, userId } = params;

    return await prisma.noticeReadStatus.upsert({
      where: {
        noticeId_userId: {
          noticeId,
          userId,
        },
      },
      create: {
        noticeId,
        userId,
        readAt: new Date(),
      },
      update: {
        readAt: new Date(),
      },
    });
  }
}
