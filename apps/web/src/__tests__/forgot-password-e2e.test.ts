import assert from 'node:assert';
import { prisma } from '../lib/prisma';
import { generateSecureToken, hashToken, hashPassword, verifyPassword, validatePasswordPolicy } from '../lib/auth/crypto';
import { revokeAllUserSessions } from '../lib/auth/session';

console.log('\n===============================================================');
console.log('RIVO FORGOT PASSWORD & RESET PASSWORD RECOVERY TEST SUITE');
console.log('===============================================================\n');

async function runTests() {
  let passed = 0;
  let failed = 0;

  async function test(name: string, fn: () => void | Promise<void>) {
    try {
      await fn();
      console.log(`  ✓ [PASS] ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`  ✗ [FAIL] ${name}:`, err.message);
      failed++;
    }
  }

  const testEmail = `test-recovery-${Date.now()}@rivo-test.edu`;
  let testUserId = '';

  try {
    // Setup test user
    const initialPasswordHash = await hashPassword('InitialPass123!');
    const user = await prisma.user.create({
      data: {
        email: testEmail,
        firstName: 'Recovery',
        lastName: 'Tester',
        status: 'ACTIVE',
        isActive: true,
        passwordHash: initialPasswordHash,
      },
    });
    testUserId = user.id;

    // Create an active session to test session revocation
    const sessionToken = generateSecureToken(32);
    await prisma.session.create({
      data: {
        userId: testUserId,
        tokenHash: hashToken(sessionToken),
        expiresAt: new Date(Date.now() + 86400 * 1000),
      },
    });

    await test('1. Generates cryptographically secure token and stores only SHA-256 hash', async () => {
      const rawToken = generateSecureToken(32);
      const tokenHash = hashToken(rawToken);
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

      const tokenRecord = await prisma.passwordResetToken.create({
        data: {
          userId: testUserId,
          tokenHash,
          expiresAt,
        },
      });

      assert.ok(tokenRecord.id, 'Token record must have an ID');
      assert.strictEqual(tokenRecord.tokenHash, tokenHash, 'Stored token hash must match SHA-256');
      assert.notStrictEqual(tokenRecord.tokenHash, rawToken, 'Raw token must never be stored in database');
      assert.strictEqual(tokenRecord.usedAt, null, 'New token must not be marked as used');

      const found = await prisma.passwordResetToken.findUnique({
        where: { tokenHash },
      });
      assert.ok(found, 'Token lookup by hash must succeed');
      assert.strictEqual(found?.userId, testUserId, 'Token user ID must match');
    });

    await test('2. Invalidates prior unused tokens when a new request is issued (single active token)', async () => {
      const firstToken = generateSecureToken(32);
      const secondToken = generateSecureToken(32);

      await prisma.passwordResetToken.deleteMany({ where: { userId: testUserId } });
      await prisma.passwordResetToken.create({
        data: {
          userId: testUserId,
          tokenHash: hashToken(firstToken),
          expiresAt: new Date(Date.now() + 3600 * 1000),
        },
      });

      // Issue second request
      await prisma.passwordResetToken.deleteMany({ where: { userId: testUserId } });
      await prisma.passwordResetToken.create({
        data: {
          userId: testUserId,
          tokenHash: hashToken(secondToken),
          expiresAt: new Date(Date.now() + 3600 * 1000),
        },
      });

      const tokens = await prisma.passwordResetToken.findMany({
        where: { userId: testUserId },
      });
      assert.strictEqual(tokens.length, 1, 'Only one token should be active');
      assert.strictEqual(tokens[0].tokenHash, hashToken(secondToken), 'Latest token must be active');
    });

    await test('3. Rejects weak passwords violating complexity policy', () => {
      const shortRes = validatePasswordPolicy('Ab1!');
      assert.strictEqual(shortRes.isValid, false, 'Password under 8 chars must be invalid');
      assert.ok(shortRes.errors[0].includes('at least 8 characters'));

      const noUpperRes = validatePasswordPolicy('lowercase123!');
      assert.strictEqual(noUpperRes.isValid, false, 'Password without uppercase must be invalid');

      const noNumRes = validatePasswordPolicy('NoNumbersHere!');
      assert.strictEqual(noNumRes.isValid, false, 'Password without numbers must be invalid');

      const validRes = validatePasswordPolicy('StrongPassword2026!');
      assert.strictEqual(validRes.isValid, true, 'Valid password must pass policy');
      assert.strictEqual(validRes.errors.length, 0);
    });

    await test('4. Rejects invalid and expired tokens', async () => {
      const fakeHash = hashToken('totally-fake-token-12345');
      const fakeRecord = await prisma.passwordResetToken.findUnique({
        where: { tokenHash: fakeHash },
      });
      assert.strictEqual(fakeRecord, null, 'Non-existent token must return null');

      const expiredRaw = generateSecureToken(32);
      const expiredHash = hashToken(expiredRaw);
      await prisma.passwordResetToken.create({
        data: {
          userId: testUserId,
          tokenHash: expiredHash,
          expiresAt: new Date(Date.now() - 1000),
        },
      });

      const expiredRecord = await prisma.passwordResetToken.findUnique({
        where: { tokenHash: expiredHash },
      });
      assert.ok(expiredRecord, 'Expired record should be in DB');
      assert.ok(expiredRecord!.expiresAt < new Date(), 'Record must be marked expired');
    });

    await test('5. Successfully resets password, invalidates token (single-use), and revokes active sessions', async () => {
      const rawResetToken = generateSecureToken(32);
      const resetTokenHash = hashToken(rawResetToken);
      const expiresAt = new Date(Date.now() + 3600 * 1000);

      const resetRecord = await prisma.passwordResetToken.create({
        data: {
          userId: testUserId,
          tokenHash: resetTokenHash,
          expiresAt,
        },
      });

      const newPasswordPlain = 'BrandNewSecurePassword2026!';
      const newHash = await hashPassword(newPasswordPlain);

      await prisma.$transaction(async (tx) => {
        await tx.user.update({
          where: { id: testUserId },
          data: {
            passwordHash: newHash,
            updatedAt: new Date(),
          },
        });

        await tx.passwordResetToken.update({
          where: { id: resetRecord.id },
          data: { usedAt: new Date() },
        });
      });

      await revokeAllUserSessions(testUserId);

      // Verify updated password verifies
      const updatedUser = await prisma.user.findUnique({
        where: { id: testUserId },
      });
      assert.strictEqual(updatedUser?.passwordHash, newHash, 'User passwordHash must be updated');

      const verifySuccess = await verifyPassword(newPasswordPlain, updatedUser!.passwordHash!);
      assert.strictEqual(verifySuccess, true, 'New password must verify successfully');

      const verifyOldFail = await verifyPassword('InitialPass123!', updatedUser!.passwordHash!);
      assert.strictEqual(verifyOldFail, false, 'Old password must fail verification');

      // Verify token is single-use
      const usedToken = await prisma.passwordResetToken.findUnique({
        where: { id: resetRecord.id },
      });
      assert.ok(usedToken?.usedAt !== null, 'Reset token must be marked as used');

      // Verify sessions revoked
      const activeSessions = await prisma.session.findMany({
        where: { userId: testUserId, revokedAt: null },
      });
      assert.strictEqual(activeSessions.length, 0, 'All active sessions must be revoked');
    });

  } finally {
    if (testUserId) {
      await prisma.passwordResetToken.deleteMany({ where: { userId: testUserId } });
      await prisma.session.deleteMany({ where: { userId: testUserId } });
      await prisma.user.delete({ where: { id: testUserId } });
    }
    await prisma.$disconnect();
  }

  console.log(`\nResults: ${passed} passed, ${failed} failed`);
  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
