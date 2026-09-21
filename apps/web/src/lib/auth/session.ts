import { NextRequest } from 'next/server';
import { verifyToken, TokenPayload } from '@/lib/auth/crypto';

export function getAuthSession(req: NextRequest): TokenPayload | null {
  const token = req.cookies.get('rivo_session')?.value;
  if (!token) return null;
  return verifyToken(token);
}
