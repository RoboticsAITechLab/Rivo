import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth/authorize';
import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB

// POST /api/teachers/[id]/photo - Secure photo upload with strict validation
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await requireAuth(req, { permission: 'teachers.edit' });
    if (!auth.authorized) {
      return auth.response;
    }

    const teacher = await prisma.teacher.findFirst({
      where: { id, schoolId: auth.schoolId },
    });

    if (!teacher) {
      return NextResponse.json({ message: 'Teacher not found' }, { status: 404 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ message: 'No photo file provided' }, { status: 400 });
    }

    // 1. Validate File Size
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { message: 'File size exceeds maximum allowed limit of 2MB' },
        { status: 413 }
      );
    }

    // 2. Validate MIME type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { message: 'Invalid file format. Only JPEG, PNG, and WebP images are allowed.' },
        { status: 415 }
      );
    }

    // 3. Inspect magic bytes for image authenticity
    const buffer = Buffer.from(await file.arrayBuffer());
    if (buffer.length < 4) {
      return NextResponse.json({ message: 'Corrupt or unreadable image file' }, { status: 400 });
    }

    // Magic number checks
    const isJpeg = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
    const isPng = buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47;
    const isWebp = buffer.slice(0, 4).toString('ascii') === 'RIFF' && buffer.slice(8, 12).toString('ascii') === 'WEBP';

    if (!isJpeg && !isPng && !isWebp) {
      return NextResponse.json(
        { message: 'File contents do not match authentic JPEG, PNG, or WebP signatures.' },
        { status: 422 }
      );
    }

    // 4. Generate secure unique filename with school isolation
    const ext = isJpeg ? 'jpg' : isPng ? 'png' : 'webp';
    const secureToken = crypto.randomBytes(16).toString('hex');
    const filename = `${teacher.schoolId}-${teacher.id}-${Date.now()}-${secureToken}.${ext}`;

    const uploadDir = path.join(/*turbopackIgnore: true*/ process.cwd(), 'public', 'uploads', 'teachers');
    await fs.mkdir(uploadDir, { recursive: true });

    const filePath = path.join(/*turbopackIgnore: true*/ uploadDir, filename);
    await fs.writeFile(filePath, buffer);

    const publicUrl = `/uploads/teachers/${filename}`;

    // 5. Update teacher record in database
    const updated = await prisma.teacher.update({
      where: { id: teacher.id },
      data: { photoUrl: publicUrl },
    });

    return NextResponse.json({
      success: true,
      message: 'Photo uploaded successfully.',
      photoUrl: updated.photoUrl,
    });
  } catch (error) {
    console.error('Error uploading teacher photo:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/teachers/[id]/photo - Remove teacher photo
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await requireAuth(req, { permission: 'teachers.edit' });
    if (!auth.authorized) {
      return auth.response;
    }

    const teacher = await prisma.teacher.findFirst({
      where: { id, schoolId: auth.schoolId },
    });

    if (!teacher) {
      return NextResponse.json({ message: 'Teacher not found' }, { status: 404 });
    }

    // Remove photo file if local
    if (teacher.photoUrl && teacher.photoUrl.startsWith('/uploads/teachers/')) {
      try {
        const localPath = path.join(/*turbopackIgnore: true*/ process.cwd(), 'public', teacher.photoUrl);
        await fs.unlink(localPath);
      } catch (err) {
        // File may already be absent, continue safely
      }
    }

    await prisma.teacher.update({
      where: { id: teacher.id },
      data: { photoUrl: null },
    });

    return NextResponse.json({
      success: true,
      message: 'Photo removed successfully.',
    });
  } catch (error) {
    console.error('Error removing teacher photo:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
