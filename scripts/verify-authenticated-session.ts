import dotenv from 'dotenv';
dotenv.config();

import { PrismaClient } from '@prisma/client';
import crypto from 'node:crypto';

const prisma = new PrismaClient();

function generateSecureToken(bytes: number = 32): string {
  return crypto.randomBytes(bytes).toString('hex');
}

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

async function verifyAuthSession() {
  const base = 'https://rivo-web-sand.vercel.app';
  console.log('Testing authenticated session on live target:', base);

  // 1. Fetch admin user from DB
  const user = await prisma.user.findUnique({
    where: { email: 'admin@greenwood.edu' },
  });
  if (!user) throw new Error('admin@greenwood.edu not found in DB');

  // 2. Create durable DB session
  const rawToken = generateSecureToken(32);
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + 7 * 86400 * 1000);

  const session = await prisma.session.create({
    data: {
      userId: user.id,
      schoolId: null, // Platform scope
      tokenHash,
      expiresAt,
      userAgent: 'VerificationSuite/1.0',
    },
  });
  console.log('1. Created active session in DB for user:', user.email, 'sessionId:', session.id);

  const cookieStr = `rivo_session=${rawToken}`;

  // 3. Authenticated GET /api/testing-center/health
  const healthRes = await fetch(base + '/api/testing-center/health', {
    headers: { Cookie: cookieStr },
  });
  console.log('2. Authenticated GET /api/testing-center/health -> status:', healthRes.status);
  if (healthRes.ok) {
    const healthData = await healthRes.json();
    console.log('   Health overall status:', healthData.overallStatus);
    console.log('   Postgres status:', healthData.services?.postgres?.status);
    console.log('   Azure blob status:', healthData.services?.azureBlob?.status);
  }

  // 4. Authenticated GET /api/testing-center/regression (preflight)
  const regPreflightRes = await fetch(base + '/api/testing-center/regression', {
    headers: { Cookie: cookieStr },
  });
  console.log('3. Authenticated GET /api/testing-center/regression (preflight) -> status:', regPreflightRes.status);
  if (regPreflightRes.ok) {
    const preflight = await regPreflightRes.json();
    console.log('   Total configured suites:', preflight.totalSuitesConfigured);
    console.log('   Eligible suites count:', preflight.eligibleSuites?.length);
    console.log('   Blocked suites:', preflight.blockedSuites?.map((b: any) => b.suite).join(', '));
  }

  // 5. Trigger Live Complete Production Regression via POST
  console.log('4. Triggering Live Complete Production Regression...');
  const runRes = await fetch(base + '/api/testing-center/regression', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookieStr },
    body: JSON.stringify({ targetUrl: base }),
  });
  console.log('   Regression execution status:', runRes.status);
  if (runRes.ok) {
    const report = await runRes.json();
    console.log('   Run ID:', report.runId);
    console.log('   Final Outcome Status:', report.status);
    console.log('   Pass Rate:', report.passRate + '%');
    console.log('   Total Tests:', report.totalTests, '(Passed:', report.passedTests, 'Failed:', report.failedTests, 'Blocked:', report.blockedTests, ')');
    console.log('   Duration:', report.totalDurationMs + 'ms');

    // 6. Test report exports
    const jsonExport = await fetch(`${base}/api/testing-center/runs/${report.runId}/export?format=json`, {
      headers: { Cookie: cookieStr },
    });
    console.log('5. JSON Export status:', jsonExport.status, 'Content-Type:', jsonExport.headers.get('content-type'));

    const htmlExport = await fetch(`${base}/api/testing-center/runs/${report.runId}/export?format=html`, {
      headers: { Cookie: cookieStr },
    });
    console.log('   HTML Export status:', htmlExport.status, 'Content-Type:', htmlExport.headers.get('content-type'));

    const csvExport = await fetch(`${base}/api/testing-center/runs/${report.runId}/export?format=csv`, {
      headers: { Cookie: cookieStr },
    });
    console.log('   CSV Export status:', csvExport.status, 'Content-Type:', csvExport.headers.get('content-type'));
  }

  await prisma.$disconnect();
}

verifyAuthSession().catch((e) => {
  console.error('Execution error:', e);
  process.exit(1);
});
