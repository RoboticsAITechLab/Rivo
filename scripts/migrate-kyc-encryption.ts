/**
 * SAFE KYC DATA-AT-REST ENCRYPTION MIGRATION UTILITY
 *
 * Scans all existing TeacherDocument records in the database.
 * If any documentNumber is stored in legacy plaintext, it encrypts it
 * using AES-256-GCM authenticated encryption and updates the record safely.
 *
 * Preserves record integrity, avoids double-encryption, never logs raw numbers.
 */

import { PrismaClient } from '@prisma/client';
import { isEncrypted, encryptSensitiveField } from '../apps/web/src/lib/security/encryption';

const prisma = new PrismaClient();

async function run() {
  console.log('--- Starting Safe KYC Document Data-at-Rest Encryption Migration ---');

  const documents = await prisma.teacherDocument.findMany({
    where: {
      documentNumber: {
        not: null,
      },
    },
    select: {
      id: true,
      documentNumber: true,
      documentType: true,
      schoolId: true,
    },
  });

  console.log(`Found ${documents.length} teacher documents with non-null document numbers.`);

  let migratedCount = 0;
  let alreadyEncryptedCount = 0;

  for (const doc of documents) {
    if (isEncrypted(doc.documentNumber)) {
      alreadyEncryptedCount++;
      continue;
    }

    const encrypted = encryptSensitiveField(doc.documentNumber);
    if (encrypted) {
      await prisma.teacherDocument.update({
        where: { id: doc.id },
        data: { documentNumber: encrypted },
      });
      migratedCount++;
    }
  }

  console.log(`Migration Complete:`);
  console.log(`- Successfully encrypted: ${migratedCount} records`);
  console.log(`- Already protected: ${alreadyEncryptedCount} records`);
  console.log(`- Total inspected: ${documents.length} records`);
}

run()
  .catch((err) => {
    console.error('Migration failed:', err.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
