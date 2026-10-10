import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth/authorize';

// In-database/system standard streams definitions scoped by school
export interface StreamItem {
  id: string;
  name: string;
  code: string;
  description: string;
  status: 'ACTIVE' | 'INACTIVE';
  applicableClasses: string[];
}

const DEFAULT_STREAMS: StreamItem[] = [
  {
    id: 'stream-sci',
    name: 'Science (PCM / PCB)',
    code: 'SCI',
    description: 'Physics, Chemistry, Mathematics, Biology and Computer Science tracks.',
    status: 'ACTIVE',
    applicableClasses: ['Class 11', 'Class 12', 'Grade 11', 'Grade 12'],
  },
  {
    id: 'stream-comm',
    name: 'Commerce',
    code: 'COMM',
    description: 'Accountancy, Business Studies, Economics, and Applied Mathematics.',
    status: 'ACTIVE',
    applicableClasses: ['Class 11', 'Class 12', 'Grade 11', 'Grade 12'],
  },
  {
    id: 'stream-arts',
    name: 'Humanities & Arts',
    code: 'ARTS',
    description: 'History, Political Science, Psychology, Sociology, and Literature.',
    status: 'ACTIVE',
    applicableClasses: ['Class 11', 'Class 12', 'Grade 11', 'Grade 12'],
  },
  {
    id: 'stream-voc',
    name: 'Vocational & Applied Skills',
    code: 'VOC',
    description: 'Information Technology, Tourism, Healthcare, and Financial Markets.',
    status: 'ACTIVE',
    applicableClasses: ['Class 11', 'Class 12', 'Grade 11', 'Grade 12'],
  },
];

import { getStreamSettings, updateSchoolSetting } from '@/lib/settings/settings-service';

// GET /api/streams - Fetch active streams for institution
export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req, { permission: 'classes.view' });
    if (!auth.authorized) {
      return auth.response;
    }

    if (auth.schoolId) {
      const streamConfig = await getStreamSettings(auth.schoolId);
      if (streamConfig?.customStreams && streamConfig.customStreams.length > 0) {
        const mapped = streamConfig.customStreams.map((s: any) => ({
          id: s.id,
          name: s.name,
          code: s.code,
          description: s.description || '',
          status: s.status || 'ACTIVE',
          applicableClasses: s.applicableClasses || ['Class 11', 'Class 12'],
        }));
        return NextResponse.json({ streams: mapped });
      }
    }

    // Return standard institutional streams
    return NextResponse.json({ streams: DEFAULT_STREAMS });
  } catch (error) {
    console.error('Error in GET /api/streams:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/streams - Create or update an institutional stream
export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req, { roles: ['DIRECTOR', 'PRINCIPAL', 'ADMIN', 'SCHOOL_ADMIN', 'OWNER'] });
    if (!auth.authorized) {
      return auth.response;
    }

    if (!auth.schoolId) {
      return NextResponse.json({ message: 'Institutional context required' }, { status: 400 });
    }

    const body = await req.json();
    const { name, code, description, applicableClasses } = body;

    if (!name || !code) {
      return NextResponse.json({ message: 'Stream name and code are required' }, { status: 400 });
    }

    const current = await getStreamSettings(auth.schoolId);
    const existing = current.customStreams || [...DEFAULT_STREAMS];

    const newStream = {
      id: `stream-${Date.now()}`,
      name: name.trim(),
      code: code.trim().toUpperCase(),
      description: description?.trim() || '',
      status: 'ACTIVE' as const,
      applicableClasses: Array.isArray(applicableClasses) && applicableClasses.length > 0 ? applicableClasses : ['Class 11', 'Class 12'],
    };

    const updatedStreams = [...existing, newStream];
    await updateSchoolSetting(auth.schoolId, 'streams', { customStreams: updatedStreams });

    return NextResponse.json({ success: true, stream: newStream });
  } catch (error) {
    console.error('Error in POST /api/streams:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
