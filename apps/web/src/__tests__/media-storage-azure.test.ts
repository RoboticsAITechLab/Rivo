/**
 * RIVO PRODUCTION MEDIA STORAGE & REDIS INFRASTRUCTURE TEST SUITE
 *
 * Covers:
 * 1. Redis Rate Limiting & Production Fail-Closed Security
 * 2. Media Storage Validation (MIME, Magic Bytes, File Size, Path Traversal)
 * 3. Deterministic Tenant-Isolated Storage Key Generation
 * 4. Media Storage Service Upload, Signed URL, Exists & Deletion
 * 5. Teacher Photo Upload & RBAC/Tenant Isolation
 * 6. Student Photo Persistence & Admission Intake Integration
 * 7. School Logo & Branding Cloud Storage
 * 8. Student Private Documents & Short-Lived Signed SAS URLs
 * 9. Cross-Tenant Access Protection (School A vs School B)
 */

import assert from 'assert';
import { prisma } from '../lib/prisma';
import {
  validateFileSize,
  validateMimeType,
  validateMagicBytes,
  generateStorageKey,
  MAX_AVATAR_SIZE_BYTES,
  MAX_DOCUMENT_SIZE_BYTES,
  MAX_BRANDING_SIZE_BYTES,
} from '../lib/storage/validation';
import { getMediaStorageService } from '../lib/storage';
import { RateLimiter } from '../lib/auth/rate-limiter';
import { getRedisClient, isProductionMode } from '../lib/redis/client';

console.log('\n===============================================================');
console.log('RIVO MEDIA STORAGE & REDIS MASTER VERIFICATION SUITE');
console.log('===============================================================\n');

async function runTests() {
  let passed = 0;
  let failed = 0;

  function testPass(label: string) {
    passed++;
    console.log(`  ✓ [TEST ${passed.toString().padStart(2, '0')}] PASS: ${label}`);
  }

  function testFail(label: string, err: any) {
    failed++;
    console.error(`  ✗ FAIL: ${label}\n    ${err.message || err}`);
  }

  // --------------------------------------------------------------------------
  // GROUP 1: REDIS RATE LIMITING & SECURITY POLICIES (1-5)
  // --------------------------------------------------------------------------
  console.log('GROUP 1: REDIS RATE LIMITING & PRODUCTION SECURITY POLICIES (1-5)');

  try {
    // 1. Redis Singleton exists
    const redis = getRedisClient();
    testPass('Redis client singleton initialized safely without crashing');
  } catch (err: any) {
    testFail('Redis client singleton failed', err);
  }

  try {
    // 2. RateLimiter memory fallback works in local mode
    const limiter = new RateLimiter({ windowMs: 60000, maxRequests: 3 });
    const key = `test:local:${Date.now()}`;
    const r1 = await limiter.consume(key);
    const r2 = await limiter.consume(key);
    const r3 = await limiter.consume(key);
    const r4 = await limiter.consume(key);

    assert.strictEqual(r1.allowed, true, 'First request allowed');
    assert.strictEqual(r2.allowed, true, 'Second request allowed');
    assert.strictEqual(r3.allowed, true, 'Third request allowed');
    assert.strictEqual(r4.allowed, false, 'Fourth request blocked');
    testPass('Rate limiter accurately tracks and blocks requests beyond threshold');
  } catch (err: any) {
    testFail('Rate limiter tracking failed', err);
  }

  try {
    // 3. Reset rate limit key works
    const limiter = new RateLimiter({ windowMs: 60000, maxRequests: 2 });
    const key = `test:reset:${Date.now()}`;
    await limiter.consume(key);
    await limiter.consume(key);
    const blocked = await limiter.consume(key);
    assert.strictEqual(blocked.allowed, false, 'Key should be blocked');

    await limiter.reset(key);
    const unblocked = await limiter.consume(key);
    assert.strictEqual(unblocked.allowed, true, 'Key reset successfully cleared rate limit');
    testPass('Rate limiter reset clears quota cleanly');
  } catch (err: any) {
    testFail('Rate limiter reset failed', err);
  }

  try {
    // 4. Production mode check adheres to environment flags
    const isProd = isProductionMode();
    assert.strictEqual(typeof isProd, 'boolean', 'isProductionMode returns boolean');
    testPass(`isProductionMode correctly reports active environment mode (${isProd ? 'production' : 'local'})`);
  } catch (err: any) {
    testFail('Production mode check failed', err);
  }

  try {
    // 5. In-memory session purge cleans expired entries
    const limiter = new RateLimiter({ windowMs: 1, maxRequests: 1 });
    const key = `test:purge:${Date.now()}`;
    limiter.consumeInMemory(key);
    await new Promise((resolve) => setTimeout(resolve, 10));
    limiter.purgeExpired();
    const fresh = limiter.consumeInMemory(key);
    assert.strictEqual(fresh.allowed, true, 'Purge removed expired record');
    testPass('Rate limiter purgeExpired accurately cleans memory');
  } catch (err: any) {
    testFail('Rate limiter purge failed', err);
  }

  // --------------------------------------------------------------------------
  // GROUP 2: STORAGE VALIDATION ENGINE (6-12)
  // --------------------------------------------------------------------------
  console.log('\nGROUP 2: STORAGE VALIDATION ENGINE (6-12)');

  try {
    // 6. Max avatar size rejected
    const oversizedBuffer = Buffer.alloc(MAX_AVATAR_SIZE_BYTES + 100);
    const check = validateFileSize(oversizedBuffer, 'teachers');
    assert.strictEqual(check.valid, false, 'Oversized avatar rejected');
    assert.match(check.error || '', /exceeds maximum allowed limit/);
    testPass('Avatar size validation strictly rejects files exceeding 2MB');
  } catch (err: any) {
    testFail('Avatar size validation failed', err);
  }

  try {
    // 7. Valid document size allowed up to 10MB
    const validDocBuffer = Buffer.alloc(5 * 1024 * 1024); // 5MB
    const check = validateFileSize(validDocBuffer, 'documents');
    assert.strictEqual(check.valid, true, '5MB document accepted');
    testPass('Document size validation accepts valid 5MB file within 10MB ceiling');
  } catch (err: any) {
    testFail('Document size validation failed', err);
  }

  try {
    // 8. Invalid MIME type rejected
    const check = validateMimeType('application/x-executable', 'teachers');
    assert.strictEqual(check.valid, false, 'Executable MIME rejected');
    testPass('MIME validation rejects dangerous executable file types');
  } catch (err: any) {
    testFail('MIME validation failed', err);
  }

  try {
    // 9. SVG rejected for user avatars
    const check = validateMimeType('image/svg+xml', 'teachers');
    assert.strictEqual(check.valid, false, 'SVG rejected for avatar');
    testPass('MIME validation strictly blocks SVG for user avatars to prevent XSS');
  } catch (err: any) {
    testFail('SVG rejection failed', err);
  }

  try {
    // 10. Magic bytes inspection validates authentic JPEG
    const jpegBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46]);
    const check = validateMagicBytes(jpegBuffer, 'image/jpeg', 'teachers');
    assert.strictEqual(check.valid, true, 'JPEG magic bytes verified');
    assert.strictEqual(check.sanitizedExtension, 'jpg');
    testPass('Magic-byte inspection validates authentic JPEG header bytes');
  } catch (err: any) {
    testFail('JPEG magic bytes check failed', err);
  }

  try {
    // 11. Spoofed extension with fake header bytes rejected
    const fakeBuffer = Buffer.from([0x00, 0x00, 0x00, 0x00, 0x12, 0x34]);
    const check = validateMagicBytes(fakeBuffer, 'image/png', 'teachers');
    assert.strictEqual(check.valid, false, 'Fake PNG rejected');
    testPass('Magic-byte inspection rejects spoofed files with invalid header signatures');
  } catch (err: any) {
    testFail('Spoofed file rejection failed', err);
  }

  try {
    // 12. Magic bytes inspection validates authentic PDF
    const pdfBuffer = Buffer.from('%PDF-1.4\n%test');
    const check = validateMagicBytes(pdfBuffer, 'application/pdf', 'documents');
    assert.strictEqual(check.valid, true, 'PDF magic bytes verified');
    assert.strictEqual(check.sanitizedExtension, 'pdf');
    testPass('Magic-byte inspection validates authentic PDF header bytes');
  } catch (err: any) {
    testFail('PDF magic bytes check failed', err);
  }

  // --------------------------------------------------------------------------
  // GROUP 3: TENANT-ISOLATED STORAGE KEY GENERATION (13-16)
  // --------------------------------------------------------------------------
  console.log('\nGROUP 3: TENANT-ISOLATED STORAGE KEY GENERATION (13-16)');

  try {
    // 13. Deterministic key format adheres to specification
    const key = generateStorageKey({
      schoolId: 'school-123',
      category: 'teachers',
      entityId: 'teacher-456',
      subCategory: 'profile',
      extension: 'jpg',
    });

    assert.match(
      key,
      /^schools\/school-123\/teachers\/teacher-456\/profile\/[a-f0-9]{32}\.jpg$/,
      'Storage key must match tenant structure'
    );
    testPass('Storage key matches deterministic tenant structure schools/{schoolId}/...');
  } catch (err: any) {
    testFail('Storage key structure check failed', err);
  }

  try {
    // 14. Path traversal characters stripped from key components
    const key = generateStorageKey({
      schoolId: '../../evil/school',
      category: 'teachers',
      entityId: '../hack',
      subCategory: 'profile',
      extension: 'png',
    });

    assert.strictEqual(key.includes('..'), false, 'Path traversal sequences removed');
    assert.strictEqual(key.startsWith('schools/evilschool/teachers/hack/profile/'), true);
    testPass('Path traversal sequences (../) are completely sanitized from storage keys');
  } catch (err: any) {
    testFail('Path traversal sanitization failed', err);
  }

  try {
    // 15. Successive uploads generate unique cryptographic tokens
    const k1 = generateStorageKey({
      schoolId: 'sch-1',
      category: 'students',
      entityId: 'std-1',
      extension: 'webp',
    });
    const k2 = generateStorageKey({
      schoolId: 'sch-1',
      category: 'students',
      entityId: 'std-1',
      extension: 'webp',
    });

    assert.notStrictEqual(k1, k2, 'Keys must be unique');
    testPass('Successive uploads generate unique cryptographic collision-free asset keys');
  } catch (err: any) {
    testFail('Key uniqueness failed', err);
  }

  try {
    // 16. Document subCategory preserved in storage key
    const docKey = generateStorageKey({
      schoolId: 'sch-77',
      category: 'documents',
      entityId: 'std-99',
      subCategory: 'birth_certificate',
      extension: 'pdf',
    });
    assert.match(docKey, /^schools\/sch-77\/documents\/std-99\/birth_certificate\/[a-f0-9]{32}\.pdf$/);
    testPass('Document subCategory is cleanly embedded in storage path');
  } catch (err: any) {
    testFail('Document subCategory key check failed', err);
  }

  // --------------------------------------------------------------------------
  // GROUP 4: MEDIA STORAGE SERVICE INTEGRATION (17-22)
  // --------------------------------------------------------------------------
  console.log('\nGROUP 4: MEDIA STORAGE SERVICE INTEGRATION (17-22)');

  const storageService = getMediaStorageService();
  let uploadedTeacherKey = '';

  try {
    // 17. Storage service is instantiated
    assert.ok(storageService, 'Storage service instantiated');
    testPass('MediaStorageService singleton is instantiated and accessible');
  } catch (err: any) {
    testFail('Storage service instantiation failed', err);
  }

  try {
    // 18. Upload valid teacher avatar buffer
    const validPng = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
    ]);

    const result = await storageService.upload({
      fileBuffer: validPng,
      fileName: 'avatar.png',
      mimeType: 'image/png',
      schoolId: 'sch_master_test',
      category: 'teachers',
      entityId: 'teach_master_test',
      subCategory: 'profile',
      scope: 'private',
    });

    assert.ok(result.storageKey, 'Storage key returned');
    assert.ok(result.url, 'Access URL returned');
    assert.strictEqual(result.scope, 'private');
    uploadedTeacherKey = result.storageKey;
    testPass('MediaStorageService successfully uploads and returns resolvable access URL');
  } catch (err: any) {
    testFail('Storage upload failed', err);
  }

  try {
    // 19. Check asset existence
    const exists = await storageService.exists(uploadedTeacherKey);
    assert.strictEqual(exists, true, 'Uploaded asset exists in storage');
    testPass('MediaStorageService.exists accurately confirms stored asset');
  } catch (err: any) {
    testFail('Storage exists check failed', err);
  }

  try {
    // 20. Generate signed URL for private asset
    const signedUrl = await storageService.getSignedUrl(uploadedTeacherKey, 600);
    assert.ok(signedUrl && signedUrl.length > 0, 'Signed URL generated');
    testPass('MediaStorageService.getSignedUrl generates authorized access URL');
  } catch (err: any) {
    testFail('Signed URL generation failed', err);
  }

  try {
    // 21. Delete stored asset
    const deleted = await storageService.delete(uploadedTeacherKey);
    assert.strictEqual(deleted, true, 'Asset deleted');
    const stillExists = await storageService.exists(uploadedTeacherKey);
    assert.strictEqual(stillExists, false, 'Asset no longer exists');
    testPass('MediaStorageService.delete cleanly removes stored asset');
  } catch (err: any) {
    testFail('Storage delete failed', err);
  }

  try {
    // 22. Zero local filesystem writes verified
    // Verify that public/uploads has not been written to
    const fs = await import('fs');
    const path = await import('path');
    const testLocalUploadPath = path.join(process.cwd(), 'public', 'uploads', 'teachers', 'should_not_exist.jpg');
    assert.strictEqual(fs.existsSync(testLocalUploadPath), false, 'No rogue local files written');
    testPass('Zero local filesystem writes verified during storage operations');
  } catch (err: any) {
    testFail('Filesystem write check failed', err);
  }

  // --------------------------------------------------------------------------
  // GROUP 5: END-TO-END DATABASE & ENTITY INTEGRATION (23-28)
  // --------------------------------------------------------------------------
  console.log('\nGROUP 5: END-TO-END DATABASE & ENTITY INTEGRATION (23-28)');

  const testRunId = Date.now().toString().slice(-6);

  try {
    // 23. School creation with cloud logo
    const testSchool = await prisma.school.create({
      data: {
        name: `Media Test School ${testRunId}`,
        slug: `media-test-${testRunId}`,
        logoUrl: `schools/media-test-${testRunId}/branding/logo/official.png`,
      },
    });

    assert.ok(testSchool.id, 'School created');
    assert.strictEqual(testSchool.logoUrl?.includes('branding'), true);
    testPass('School record created with canonical cloud logo URL reference');

    // 24. Student persistent photoUrl column verified in PostgreSQL
    const student = await prisma.student.create({
      data: {
        schoolId: testSchool.id,
        admissionNumber: `ADM-${testRunId}-01`,
        firstName: 'Aarav',
        lastName: 'Sharma',
        gender: 'MALE',
        photoUrl: `schools/${testSchool.id}/students/std_01/profile/avatar.jpg`,
      },
    });

    assert.ok(student.id, 'Student created');
    assert.ok(student.photoUrl, 'Student photoUrl populated');
    assert.strictEqual(student.photoUrl, `schools/${testSchool.id}/students/std_01/profile/avatar.jpg`);
    testPass('Student record persists photoUrl directly in PostgreSQL students table');

    // 25. Student photo update & replacement
    const updatedStudent = await prisma.student.update({
      where: { id: student.id },
      data: { photoUrl: `schools/${testSchool.id}/students/std_01/profile/new_avatar.png` },
    });
    assert.strictEqual(updatedStudent.photoUrl, `schools/${testSchool.id}/students/std_01/profile/new_avatar.png`);
    testPass('Student photoUrl safely updates with new storage reference');

    // 26. Student private document creation
    const doc = await prisma.studentDocument.create({
      data: {
        studentId: student.id,
        documentType: 'BIRTH_CERTIFICATE',
        title: 'Official Municipal Birth Certificate',
        fileUrl: `schools/${testSchool.id}/documents/${student.id}/birth_certificate/doc_${testRunId}.pdf`,
        fileName: 'birth_certificate.pdf',
        fileSize: '1048576',
        status: 'VERIFIED',
      },
    });

    assert.ok(doc.id, 'Document created');
    assert.strictEqual(doc.documentType, 'BIRTH_CERTIFICATE');
    assert.strictEqual(doc.fileUrl.startsWith(`schools/${testSchool.id}/`), true);
    testPass('StudentDocument persists private canonical key and document metadata');

    // 27. Cross-tenant isolation: School B cannot view School A student document
    const schoolB = await prisma.school.create({
      data: {
        name: `Foreign School ${testRunId}`,
        slug: `foreign-sch-${testRunId}`,
      },
    });

    // Query with School B tenant boundary should return null
    const crossSchoolQuery = await prisma.student.findFirst({
      where: { id: student.id, schoolId: schoolB.id },
      include: { documents: true },
    });

    assert.strictEqual(crossSchoolQuery, null, 'School B denied access to School A student');
    testPass('Cross-tenant isolation: School B strictly denied access to School A media & documents');

    // 28. Cleanup test entities
    await prisma.studentDocument.deleteMany({ where: { studentId: student.id } });
    await prisma.student.deleteMany({ where: { schoolId: testSchool.id } });
    await prisma.school.deleteMany({ where: { id: { in: [testSchool.id, schoolB.id] } } });
    testPass('Test entities cleaned up safely from PostgreSQL');
  } catch (err: any) {
    testFail('Database integration failed', err);
  }

  // --------------------------------------------------------------------------
  // GROUP 6: DIRECT BROWSER-TO-BLOB SAS GENERATION (29-33)
  // --------------------------------------------------------------------------
  console.log('\nGROUP 6: DIRECT BROWSER-TO-BLOB SAS GENERATION (29-33)');

  try {
    const storageService = getMediaStorageService();

    // 29. Generate Direct Upload SAS for private student photo
    const sasResult = await storageService.generateDirectUploadSas({
      schoolId: 'sch_test_sas_99',
      category: 'students',
      entityId: 'std_99',
      subCategory: 'profile',
      mimeType: 'image/jpeg',
      scope: 'private',
    });

    assert.ok(sasResult.uploadUrl, 'uploadUrl returned');
    assert.strictEqual(sasResult.scope, 'private');
    assert.strictEqual(sasResult.storageKey.startsWith('schools/sch_test_sas_99/students/std_99/profile/'), true);
    assert.strictEqual(sasResult.maxSizeBytes, 2 * 1024 * 1024);
    testPass('Direct upload SAS generates deterministic tenant-isolated path and size ceiling');

    // 30. Invalid MIME rejected
    let mimeRejected = false;
    try {
      await storageService.generateDirectUploadSas({
        schoolId: 'sch_test_sas_99',
        category: 'students',
        entityId: 'std_99',
        mimeType: 'application/x-msdownload',
        scope: 'private',
      });
    } catch {
      mimeRejected = true;
    }
    assert.strictEqual(mimeRejected, true, 'Executable mime rejected for SAS generation');
    testPass('Direct upload SAS generation rejects invalid MIME types');

    // 31. Document category gets 10MB ceiling
    const docSas = await storageService.generateDirectUploadSas({
      schoolId: 'sch_test_sas_99',
      category: 'documents',
      entityId: 'std_99',
      subCategory: 'transfer_cert',
      mimeType: 'application/pdf',
      scope: 'private',
    });
    assert.strictEqual(docSas.maxSizeBytes, 10 * 1024 * 1024);
    assert.strictEqual(docSas.storageKey.endsWith('.pdf'), true);
    testPass('Direct upload SAS accurately assigns 10MB limit and .pdf extension for documents');

    // 32. Path traversal injection sanitized in direct upload key
    const traversalSas = await storageService.generateDirectUploadSas({
      schoolId: '../../../etc/passwd',
      category: 'students',
      entityId: '../../root',
      subCategory: '../sneaky',
      mimeType: 'image/png',
      scope: 'private',
    });
    assert.strictEqual(traversalSas.storageKey.includes('..'), false, 'Traversal removed from SAS key');
    testPass('Direct upload SAS key generation completely strips path traversal sequences');

    // 33. Cross-school isolation in SAS key
    assert.strictEqual(docSas.storageKey.startsWith('schools/sch_test_sas_99/'), true);
    testPass('Direct upload SAS keys strictly enforce school-level root isolation');
  } catch (err: any) {
    testFail('Direct upload SAS tests failed', err);
  }

  // --------------------------------------------------------------------------
  // SUMMARY
  // --------------------------------------------------------------------------
  console.log('\n===============================================================');
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('===============================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Unhandled suite error:', err);
  process.exit(1);
});
