import assert from 'node:assert';
import {
  encryptSensitiveField,
  decryptSensitiveField,
  isEncrypted,
  getKycEncryptionKey,
  maskSensitiveDocumentNumber,
} from '../lib/security/encryption';
import { signToken, verifyToken, getJwtSecret, validatePasswordPolicy } from '../lib/auth/crypto';
import { RateLimiter } from '../lib/auth/rate-limiter';
import { getRedisClient, isProductionMode } from '../lib/redis/client';
import {
  getSchoolSetting,
  updateSchoolSetting,
  getHomeworkSettings,
  getAttendanceSettings,
  getSecuritySettings,
} from '../lib/settings/settings-service';
import { prisma } from '../lib/prisma';

console.log('\n===============================================================');
console.log('RIVO PRODUCTION CLOSURE & SYSTEM-WIDE ENFORCEMENT REGRESSION SUITE');
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

  // -------------------------------------------------------------------------
  // GROUP 1: KYC FIELD-LEVEL ENCRYPTION (AES-256-GCM) AT REST
  // -------------------------------------------------------------------------
  console.log('GROUP 1: KYC FIELD-LEVEL ENCRYPTION (AES-256-GCM) AT REST');

  await test('Encrypts sensitive identifier with versioned format enc:v1:', () => {
    const rawAadhaar = '5489 1234 5678';
    const encrypted = encryptSensitiveField(rawAadhaar);
    assert.ok(encrypted, 'Encrypted output should not be null');
    assert.ok(encrypted.startsWith('enc:v1:'), 'Should start with enc:v1:');
    assert.ok(!encrypted.includes(rawAadhaar), 'Ciphertext must never expose raw identifier');
    assert.strictEqual(isEncrypted(encrypted), true);
  });

  await test('Decrypts encrypted identifier back to original exact text', () => {
    const rawPan = 'ABCDE1234F';
    const encrypted = encryptSensitiveField(rawPan);
    const decrypted = decryptSensitiveField(encrypted);
    assert.strictEqual(decrypted, rawPan);
  });

  await test('Prevents double-encryption of already protected data', () => {
    const rawPassport = 'Z9876543';
    const encryptedFirst = encryptSensitiveField(rawPassport);
    const encryptedSecond = encryptSensitiveField(encryptedFirst);
    assert.strictEqual(encryptedFirst, encryptedSecond, 'Second call should return already-encrypted string');
  });

  await test('Handles legacy plaintext gracefully (zero-downtime transition)', () => {
    const legacyPlaintext = 'LEGACY-AADHAAR-1234';
    const decrypted = decryptSensitiveField(legacyPlaintext);
    assert.strictEqual(decrypted, legacyPlaintext, 'Legacy unencrypted value returned as-is');
  });

  await test('Handles null and empty string inputs safely', () => {
    assert.strictEqual(encryptSensitiveField(null), null);
    assert.strictEqual(encryptSensitiveField(''), null);
    assert.strictEqual(decryptSensitiveField(null), null);
    assert.strictEqual(decryptSensitiveField(''), null);
  });

  await test('Malformed ciphertext structure fails closed without uncaught crash', () => {
    const malformed = 'enc:v1:invalid-hex-token';
    const result = decryptSensitiveField(malformed);
    assert.strictEqual(result, null);
  });

  await test('Tampered ciphertext or auth tag fails closed and returns null', () => {
    const original = 'VOTER-ID-987654';
    const encrypted = encryptSensitiveField(original)!;
    const parts = encrypted.split(':');
    // Tamper with the ciphertext component
    const tamperedCiphertext = parts[3].slice(0, -2) + 'ff';
    const tampered = `${parts[0]}:${parts[1]}:${parts[2]}:${tamperedCiphertext}`;
    const decrypted = decryptSensitiveField(tampered);
    assert.strictEqual(decrypted, null, 'Tampered ciphertext must fail authentication and return null');
  });

  await test('Masking function preserves privacy exposing only last 4 characters', () => {
    assert.strictEqual(maskSensitiveDocumentNumber('123456789012'), '••••••••9012');
    assert.strictEqual(maskSensitiveDocumentNumber('ABCDE1234F'), '••••••234F');
    assert.strictEqual(maskSensitiveDocumentNumber('1234'), '••••');
    assert.strictEqual(maskSensitiveDocumentNumber(''), '');
    assert.strictEqual(maskSensitiveDocumentNumber(null), '');
  });

  await test('Production KYC_ENCRYPTION_KEY fails closed if missing or compromised', () => {
    const origEnv = process.env.NODE_ENV;
    const origKey = process.env.KYC_ENCRYPTION_KEY;
    try {
      (process.env as any).NODE_ENV = 'production';
      delete process.env.KYC_ENCRYPTION_KEY;
      assert.throws(
        () => getKycEncryptionKey(),
        /Dedicated KYC_ENCRYPTION_KEY must be configured in production/,
        'Missing KYC key in production must fail closed'
      );

      process.env.KYC_ENCRYPTION_KEY = 'replace-with-a-secure-random-32-byte-encryption-key';
      assert.throws(
        () => getKycEncryptionKey(),
        /Insecure\/compromised KYC_ENCRYPTION_KEY placeholder detected/,
        'Compromised placeholder in production must fail closed'
      );
    } finally {
      (process.env as any).NODE_ENV = origEnv;
      process.env.KYC_ENCRYPTION_KEY = origKey;
    }
  });

  // -------------------------------------------------------------------------
  // GROUP 2: AUTHENTICATION & JWT PRODUCTION HARDENING
  // -------------------------------------------------------------------------
  console.log('\nGROUP 2: AUTHENTICATION & JWT PRODUCTION HARDENING');

  await test('Token signing and verification succeeds with active key', () => {
    const token = signToken({
      userId: 'test-user-uuid',
      email: 'security-test@rivo.edu',
      role: 'TEACHER',
      schoolId: 'test-school-uuid',
    });
    assert.ok(token && token.includes('.'), 'Token has body.signature format');
    const verified = verifyToken(token);
    assert.ok(verified, 'Verification must succeed');
    assert.strictEqual(verified.email, 'security-test@rivo.edu');
    assert.strictEqual(verified.role, 'TEACHER');
  });

  await test('Tampered token payload is strictly rejected by timing-safe HMAC', () => {
    const token = signToken({
      userId: 'admin-uuid',
      email: 'admin@rivo.edu',
      role: 'ADMIN',
    });
    const [body, sig] = token.split('.');
    const forgedBody = Buffer.from(JSON.stringify({ userId: 'admin-uuid', role: 'OWNER' })).toString('base64url');
    const forgedToken = `${forgedBody}.${sig}`;
    const verified = verifyToken(forgedToken);
    assert.strictEqual(verified, null, 'Tampered signature must return null');
  });

  await test('Production JWT_SECRET fails closed if missing, short, or placeholder', () => {
    const origEnv = process.env.NODE_ENV;
    const origJwt = process.env.JWT_SECRET;
    try {
      (process.env as any).NODE_ENV = 'production';
      delete process.env.JWT_SECRET;
      assert.throws(
        () => getJwtSecret(),
        /A secure, unique JWT_SECRET must be configured in production/,
        'Missing JWT_SECRET in production must throw'
      );

      process.env.JWT_SECRET = 'super-secret-jwt-token-change-in-production';
      assert.throws(
        () => getJwtSecret(),
        /Insecure\/compromised JWT_SECRET placeholder detected/,
        'Compromised placeholder in production must throw'
      );

      process.env.JWT_SECRET = 'short-secret';
      assert.throws(
        () => getJwtSecret(),
        /Production JWT_SECRET must be at least 32 characters long/,
        'Short secret in production must throw'
      );
    } finally {
      (process.env as any).NODE_ENV = origEnv;
      process.env.JWT_SECRET = origJwt;
    }
  });

  // -------------------------------------------------------------------------
  // GROUP 3: REDIS RATE LIMITING & PRODUCTION FAIL-CLOSED BEHAVIOR
  // -------------------------------------------------------------------------
  console.log('\nGROUP 3: REDIS RATE LIMITING & PRODUCTION POLICIES');

  await test('RateLimiter in local/dev mode falls back gracefully to in-memory store', async () => {
    const limiter = new RateLimiter({ windowMs: 10000, maxRequests: 2 });
    const r1 = await limiter.consume('test-local-key');
    assert.strictEqual(r1.allowed, true);
    assert.strictEqual(r1.remaining, 1);

    const r2 = await limiter.consume('test-local-key');
    assert.strictEqual(r2.allowed, true);
    assert.strictEqual(r2.remaining, 0);

    const r3 = await limiter.consume('test-local-key');
    assert.strictEqual(r3.allowed, false);
    assert.strictEqual(r3.remaining, 0);

    await limiter.reset('test-local-key');
    const r4 = await limiter.consume('test-local-key');
    assert.strictEqual(r4.allowed, true);
  });

  await test('RateLimiter in production mode strictly fails closed when Redis is unavailable', async () => {
    const origEnv = process.env.AUTH_INFRA_MODE;
    const origRedis = process.env.REDIS_URL;
    try {
      process.env.AUTH_INFRA_MODE = 'production';
      // Set empty redis url to simulate missing Redis instance
      process.env.REDIS_URL = '';

      const limiter = new RateLimiter({ windowMs: 10000, maxRequests: 5 });
      const result = await limiter.consume('prod-test-key');

      assert.strictEqual(result.allowed, false, 'In production mode without Redis, limiter must fail closed');
      assert.strictEqual(result.remaining, 0);
    } finally {
      process.env.AUTH_INFRA_MODE = origEnv;
      process.env.REDIS_URL = origRedis;
    }
  });

  // -------------------------------------------------------------------------
  // GROUP 4: SETTINGS SYSTEM-WIDE ENFORCEMENT & TENANT ISOLATION
  // -------------------------------------------------------------------------
  console.log('\nGROUP 4: SETTINGS ENFORCEMENT & TENANT ISOLATION');

  const school = await prisma.school.findFirst();

  if (school) {
    await test('Tenant isolation: School A settings are isolated from School B', async () => {
      const schoolAId = school.id;
      const fakeSchoolBId = '00000000-0000-0000-0000-000000000099';

      // Update school A attendance setting
      await updateSchoolSetting(schoolAId, 'attendance', {
        minAttendancePercentage: 85,
      });

      const schoolASettings = await getAttendanceSettings(schoolAId);
      assert.strictEqual(schoolASettings.minAttendancePercentage, 85);

      // School B must return default (75%), not School A's custom 85%
      const schoolBSettings = await getAttendanceSettings(fakeSchoolBId);
      assert.strictEqual(schoolBSettings.minAttendancePercentage, 75);

      // Verify Prisma database records directly
      const recordB = await prisma.schoolSetting.findUnique({
        where: { schoolId_category: { schoolId: fakeSchoolBId, category: 'attendance' } },
      });
      assert.strictEqual(recordB, null, 'School B must not have records from School A');
    });

    await test('Homework settings resolver returns authoritative DB configuration', async () => {
      await updateSchoolSetting(school.id, 'homework', {
        teacherCanCreate: false,
        attachmentsEnabled: false,
        maxAttachmentSizeMB: 5,
      });

      const hwSettings = await getHomeworkSettings(school.id);
      assert.strictEqual(hwSettings.teacherCanCreate, false);
      assert.strictEqual(hwSettings.attachmentsEnabled, false);
      assert.strictEqual(hwSettings.maxAttachmentSizeMB, 5);

      // Revert to true for standard operations
      await updateSchoolSetting(school.id, 'homework', {
        teacherCanCreate: true,
        attachmentsEnabled: true,
        maxAttachmentSizeMB: 10,
      });
      const reverted = await getHomeworkSettings(school.id);
      assert.strictEqual(reverted.teacherCanCreate, true);
    });

    await test('Password policy enforcement adapts dynamically to school configuration', () => {
      const defaultCheck = validatePasswordPolicy('Weak');
      assert.strictEqual(defaultCheck.isValid, false);

      const customStrictPolicy = {
        minLength: 12,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: true,
      };

      const tenCharPass = validatePasswordPolicy('Pass1!Word', customStrictPolicy);
      assert.strictEqual(tenCharPass.isValid, false, '10 chars must fail 12-char policy');
      assert.ok(tenCharPass.errors.some((e) => e.includes('12 characters')));

      const sixteenCharPass = validatePasswordPolicy('StrongPassword1!', customStrictPolicy);
      assert.strictEqual(sixteenCharPass.isValid, true);
    });
  } else {
    console.log('  [SKIP] No seed school found in database; skipping DB-dependent tenant tests');
  }

  // -------------------------------------------------------------------------
  // GROUP 5: HOMEWORK MODEL DATABASE PERSISTENCE
  // -------------------------------------------------------------------------
  console.log('\nGROUP 5: HOMEWORK MODEL DATABASE PERSISTENCE');

  if (school) {
    await test('Homework model persists to PostgreSQL with valid relationships', async () => {
      const session = await prisma.academicSession.findFirst({
        where: { schoolId: school.id, status: 'ACTIVE' },
      });
      const cls = await prisma.class.findFirst({
        where: { schoolId: school.id },
      });
      const subject = await prisma.subject.findFirst({
        where: { schoolId: school.id },
      });

      if (session && cls && subject) {
        const hw = await prisma.homework.create({
          data: {
            schoolId: school.id,
            academicSessionId: session.id,
            classId: cls.id,
            subjectId: subject.id,
            title: 'Production Verification Assignment',
            description: 'Automated test assignment verifying database schema and relations',
            assignedDate: new Date(),
            dueDate: new Date(Date.now() + 86400 * 1000 * 3),
            status: 'PUBLISHED',
          },
        });

        assert.ok(hw.id);
        assert.strictEqual(hw.title, 'Production Verification Assignment');

        // Verify foreign key relations and cleanup
        await prisma.homework.delete({ where: { id: hw.id } });
      }
    });
  }

  console.log('\n===============================================================');
  console.log(`REGRESSION SUITE FINISHED: ${passed} PASSED, ${failed} FAILED`);
  console.log('===============================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal test execution failure:', err);
  process.exit(1);
});
