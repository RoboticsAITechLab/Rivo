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

// GET /api/streams - Fetch active streams for institution
export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req, { permission: 'classes.view' });
    if (!auth.authorized) {
      return auth.response;
    }

    // Return standard institutional streams
    return NextResponse.json({ streams: DEFAULT_STREAMS });
  } catch (error) {
    console.error('Error in GET /api/streams:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
