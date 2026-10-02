import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/authorize';
import { NoticeService } from '@/lib/notices/notice-service';
import { getCommunicationSettings } from '@/lib/settings/settings-service';

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.authorized) return auth.response;

  try {
    const { searchParams } = new URL(req.url);
    const status = (searchParams.get('status') || 'ALL') as any;
    const priority = (searchParams.get('priority') || 'ALL') as any;
    const targetType = (searchParams.get('targetType') || 'ALL') as any;
    const search = searchParams.get('search') || undefined;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    const data = await NoticeService.getNotices({
      schoolId: auth.schoolId,
      userId: auth.userId,
      role: auth.role,
      status,
      priority,
      targetType,
      search,
      page,
      limit,
    });

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error fetching notices:', error);
    return NextResponse.json(
      { message: error.message || 'Failed to fetch notices' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req, {
    permission: 'notices.create',
  });
  if (!auth.authorized) return auth.response;

  try {
    const body = await req.json();
    const { title, body: messageBody, priority, targetType, classId, sectionId, publishImmediately } = body;

    if (!title || !messageBody || !targetType) {
      return NextResponse.json(
        { message: 'Missing required fields: title, body, targetType' },
        { status: 400 }
      );
    }

    // Enforce Institutional Communication Settings
    const commSettings = await getCommunicationSettings(auth.schoolId);
    if (auth.role === 'TEACHER' && !commSettings.teacherCanCreate) {
      return NextResponse.json(
        { message: 'Faculty circular/notice creation is disabled in institution settings.' },
        { status: 403 }
      );
    }

    let effectivePublish = !!publishImmediately;
    if (auth.role === 'TEACHER' && !commSettings.teacherCanPublish) {
      effectivePublish = false; // Requires administrative broadcast approval
    }

    const notice = await NoticeService.createNotice({
      schoolId: auth.schoolId,
      authorId: auth.userId,
      title,
      body: messageBody,
      priority,
      targetType,
      classId,
      sectionId,
      publishImmediately: effectivePublish,
    });

    return NextResponse.json(notice, { status: 201 });
  } catch (error: any) {
    console.error('Error creating notice:', error);
    return NextResponse.json(
      { message: error.message || 'Failed to create notice' },
      { status: 400 }
    );
  }
}

