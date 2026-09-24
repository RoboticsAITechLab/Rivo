import path from 'path';
import fs from 'fs';

if (process.platform === 'win32' && !process.env.PRISMA_QUERY_ENGINE_LIBRARY) {
  const candidates = [
    path.join(process.cwd(), 'apps/web/src/generated/prisma/query_engine-windows.dll.node'),
    path.join(process.cwd(), 'src/generated/prisma/query_engine-windows.dll.node'),
    path.join(process.cwd(), 'apps/web/prisma/query_engine-windows.dll.node'),
    path.join(process.cwd(), 'prisma/query_engine-windows.dll.node'),
    path.join(process.cwd(), 'apps/web/prisma/generated_temp/query_engine-windows.dll.node'),
    path.join(process.cwd(), 'prisma/generated_temp/query_engine-windows.dll.node'),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) {
      process.env.PRISMA_QUERY_ENGINE_LIBRARY = c;
      break;
    }
  }
}

import { PrismaClient } from '@/generated/prisma';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
export * from '@/generated/prisma';
