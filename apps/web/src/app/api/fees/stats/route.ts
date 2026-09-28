import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth/authorize';
import { FeeObligationStatus, FeePaymentStatus } from '@prisma/client';

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req, { permission: 'fees.view' });
    if (!auth.authorized) return auth.response;

    const { searchParams } = new URL(req.url);
    const academicSessionId = searchParams.get('academicSessionId');
    const campusId = searchParams.get('campusId');

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Build obligations where clause
    const obligationsWhere: any = {
      schoolId: auth.schoolId,
      status: { not: FeeObligationStatus.CANCELLED },
    };
    if (academicSessionId) obligationsWhere.academicSessionId = academicSessionId;
    if (campusId) {
      obligationsWhere.student = { campusId };
    }

    // 1. Aggregate obligations for Expected, Net, Paid, Balance, and Overdue
    const obligations = await prisma.feeObligation.findMany({
      where: obligationsWhere,
      select: {
        id: true,
        dueDate: true,
        originalAmount: true,
        concessionAmount: true,
        netAmount: true,
        paidAmount: true,
        balanceAmount: true,
        status: true,
        student: {
          select: {
            campus: { select: { id: true, name: true } },
          },
        },
        studentEnrollment: {
          select: {
            class: { select: { id: true, name: true } },
          },
        },
      },
    });

    let totalExpected = 0;
    let totalCollected = 0;
    let totalOutstanding = 0;
    let totalOverdue = 0;
    let totalConcessions = 0;

    const classOutstandingMap = new Map<string, { className: string; amount: number }>();
    const campusOutstandingMap = new Map<string, { campusName: string; amount: number }>();

    for (const ob of obligations) {
      const net = Number(ob.netAmount);
      const paid = Number(ob.paidAmount);
      const bal = Number(ob.balanceAmount);
      const con = Number(ob.concessionAmount);

      totalExpected += net;
      totalCollected += paid;
      totalOutstanding += bal;
      totalConcessions += con;

      if (bal > 0 && new Date(ob.dueDate) < now) {
        totalOverdue += bal;
      }

      // Group outstanding by class
      if (bal > 0 && ob.studentEnrollment?.class) {
        const cName = ob.studentEnrollment.class.name;
        const current = classOutstandingMap.get(cName) || { className: cName, amount: 0 };
        current.amount += bal;
        classOutstandingMap.set(cName, current);
      }

      // Group outstanding by campus
      if (bal > 0 && ob.student?.campus) {
        const campName = ob.student.campus.name;
        const current = campusOutstandingMap.get(campName) || { campusName: campName, amount: 0 };
        current.amount += bal;
        campusOutstandingMap.set(campName, current);
      }
    }

    // 2. Query Payments for Today, This Month, and Collection Trends
    const paymentsWhere: any = {
      schoolId: auth.schoolId,
      status: FeePaymentStatus.COLLECTED,
    };
    if (academicSessionId) paymentsWhere.academicSessionId = academicSessionId;

    const payments = await prisma.feePayment.findMany({
      where: paymentsWhere,
      select: {
        id: true,
        amount: true,
        paymentDate: true,
        paymentMode: true,
      },
      orderBy: { paymentDate: 'desc' },
    });

    let todayCollections = 0;
    let thisMonthCollections = 0;

    // Daily buckets for last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const trendMap = new Map<string, number>();

    for (const p of payments) {
      const amt = Number(p.amount);
      const pDate = new Date(p.paymentDate);

      if (pDate >= startOfToday) {
        todayCollections += amt;
      }
      if (pDate >= startOfMonth) {
        thisMonthCollections += amt;
      }
      if (pDate >= thirtyDaysAgo) {
        const key = pDate.toISOString().slice(0, 10);
        trendMap.set(key, (trendMap.get(key) || 0) + amt);
      }
    }

    // Convert trendMap to sorted array
    const trend = Array.from(trendMap.entries())
      .map(([date, amount]) => ({ date, amount }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // 3. Recent 5 Payments
    const recentPayments = await prisma.feePayment.findMany({
      where: { schoolId: auth.schoolId },
      include: {
        student: { select: { id: true, firstName: true, lastName: true, admissionNumber: true } },
        receipt: { select: { id: true, receiptNumber: true } },
      },
      orderBy: { paymentDate: 'desc' },
      take: 6,
    });

    // 4. Recent 5 Receipts
    const recentReceipts = await prisma.feeReceipt.findMany({
      where: { schoolId: auth.schoolId },
      include: {
        student: { select: { id: true, firstName: true, lastName: true, admissionNumber: true } },
      },
      orderBy: { receiptDate: 'desc' },
      take: 6,
    });

    // 5. Upcoming Due Obligations (next 30 days, pending)
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const upcomingDues = await prisma.feeObligation.findMany({
      where: {
        schoolId: auth.schoolId,
        status: { in: [FeeObligationStatus.PENDING, FeeObligationStatus.PARTIALLY_PAID] },
        balanceAmount: { gt: 0 },
        dueDate: { gte: now, lte: thirtyDaysFromNow },
        ...(academicSessionId ? { academicSessionId } : {}),
      },
      include: {
        student: { select: { id: true, firstName: true, lastName: true, admissionNumber: true } },
        studentEnrollment: {
          select: {
            class: { select: { name: true } },
            section: { select: { name: true } },
          },
        },
      },
      orderBy: { dueDate: 'asc' },
      take: 6,
    });

    // 6. Overdue Students (distinct students with overdue obligations)
    const overdueObligations = await prisma.feeObligation.findMany({
      where: {
        schoolId: auth.schoolId,
        status: { in: [FeeObligationStatus.PENDING, FeeObligationStatus.PARTIALLY_PAID] },
        balanceAmount: { gt: 0 },
        dueDate: { lt: now },
        ...(academicSessionId ? { academicSessionId } : {}),
      },
      include: {
        student: { select: { id: true, firstName: true, lastName: true, admissionNumber: true } },
        studentEnrollment: {
          select: {
            class: { select: { name: true } },
            section: { select: { name: true } },
          },
        },
      },
      orderBy: { dueDate: 'asc' },
      take: 6,
    });

    // 7. Recent Reversals
    const recentReversals = await prisma.feePayment.findMany({
      where: {
        schoolId: auth.schoolId,
        status: FeePaymentStatus.REVERSED,
      },
      include: {
        student: { select: { id: true, firstName: true, lastName: true, admissionNumber: true } },
        reversedByUser: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { reversedAt: 'desc' },
      take: 5,
    });

    return NextResponse.json({
      summary: {
        totalExpected,
        totalCollected,
        totalOutstanding,
        totalOverdue,
        totalConcessions,
        todayCollections,
        thisMonthCollections,
      },
      outstandingByClass: Array.from(classOutstandingMap.values()),
      outstandingByCampus: Array.from(campusOutstandingMap.values()),
      collectionTrend: trend,
      recentPayments,
      recentReceipts,
      upcomingDues,
      overdueObligations,
      recentReversals,
    });
  } catch (error) {
    console.error('Error in GET /api/fees/stats:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
