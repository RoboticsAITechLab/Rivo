import dotenv from 'dotenv';
dotenv.config();

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function inspectRun() {
  const run = await prisma.testRun.findFirst({
    where: { id: 'fcca3b9b-cf3a-4ad3-ab36-32d1513e37e4' },
    include: { results: true },
  });
  console.log('Run status:', run?.status);
  const failed = run?.results.filter((r) => r.status === 'FAILED');
  console.log(
    'Failed tests:',
    failed?.map((f) => ({
      name: f.name,
      endpoint: f.endpoint,
      error: f.errorMessage,
      httpStatus: f.httpStatus,
    }))
  );
  await prisma.$disconnect();
}

inspectRun();
