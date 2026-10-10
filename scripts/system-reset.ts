import dotenv from 'dotenv';
dotenv.config();

import { BlobServiceClient } from '@azure/storage-blob';
import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';

const prisma = new PrismaClient();

interface ResetOptions {
  cleanOnly: boolean;
  skipAzure: boolean;
  skipRedis: boolean;
  seed: boolean;
}

function parseArgs(): ResetOptions {
  const args = process.argv.slice(2);
  const cleanOnly = args.includes('--clean-only') || args.includes('-c');
  const skipAzure = args.includes('--skip-azure');
  const skipRedis = args.includes('--skip-redis');
  const seed = !cleanOnly && (args.includes('--seed') || !cleanOnly);

  return { cleanOnly, skipAzure, skipRedis, seed };
}

async function getRedisInstance(): Promise<Redis | null> {
  const redisUrl = process.env.REDIS_URL || process.env.UPSTASH_REDIS_URL;
  if (!redisUrl || redisUrl.trim() === '' || redisUrl.includes('placeholder')) {
    return null;
  }
  try {
    const redis = new Redis(redisUrl.trim(), {
      connectTimeout: 3000,
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
      lazyConnect: false,
    });
    return redis;
  } catch {
    return null;
  }
}

async function resetPostgreSQL(): Promise<number> {
  console.log('\n[1/4] 🐘 PURGING POSTGRESQL DATABASE...');
  const tables: Array<{ tablename: string }> = await prisma.$queryRawUnsafe(`
    SELECT tablename 
    FROM pg_tables 
    WHERE schemaname = 'public' 
      AND tablename NOT LIKE '_prisma_%';
  `);

  if (tables.length === 0) {
    console.log('  ℹ No tables found in public schema.');
    return 0;
  }

  const tableNames = tables.map((t) => `"${t.tablename}"`).join(', ');
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tableNames} RESTART IDENTITY CASCADE;`);
  console.log(`  ✓ Successfully truncated ${tables.length} tables and reset all auto-increment sequences.`);
  return tables.length;
}

async function resetAzureStorage(): Promise<number> {
  console.log('\n[2/4] ☁ PURGING AZURE BLOB STORAGE...');
  const connStr = process.env.AZURE_STORAGE_CONNECTION_STRING;
  if (!connStr || connStr.trim() === '') {
    console.log('  ℹ AZURE_STORAGE_CONNECTION_STRING not provided. Skipping Azure purge.');
    return 0;
  }

  try {
    const blobServiceClient = BlobServiceClient.fromConnectionString(connStr);
    const targetContainers = [
      process.env.AZURE_STORAGE_PRIVATE_CONTAINER || 'rivo-private',
      process.env.AZURE_STORAGE_PUBLIC_CONTAINER || 'rivo-public',
    ];

    let totalDeleted = 0;
    for (const containerName of targetContainers) {
      try {
        const containerClient = blobServiceClient.getContainerClient(containerName);
        const exists = await containerClient.exists();
        if (!exists) {
          console.log(`  ℹ Container "${containerName}" does not exist, creating it.`);
          await containerClient.createIfNotExists();
          continue;
        }

        let containerDeleted = 0;
        for await (const blob of containerClient.listBlobsFlat()) {
          await containerClient.deleteBlob(blob.name);
          containerDeleted++;
          totalDeleted++;
        }
        console.log(`  ✓ Container "${containerName}": Deleted ${containerDeleted} blobs.`);
      } catch (cErr: any) {
        console.warn(`  ! Notice cleaning container "${containerName}":`, cErr.message || cErr);
      }
    }

    console.log(`  ✓ Azure Blob Storage cleaned (Total: ${totalDeleted} files removed).`);
    return totalDeleted;
  } catch (err: any) {
    console.warn('  ! Azure Storage cleanup warning:', err.message || err);
    return 0;
  }
}

async function resetRedis(): Promise<void> {
  console.log('\n[3/4] ⚡ FLUSHING REDIS SESSIONS & RATE LIMITS...');
  const redis = await getRedisInstance();
  if (redis) {
    try {
      await redis.flushdb();
      console.log('  ✓ Redis cache, sessions, and rate limiter keys flushed.');
      await redis.quit();
    } catch (e: any) {
      console.warn('  ! Redis flush warning:', e.message || e);
      redis.disconnect();
    }
  } else {
    console.log('  ℹ Redis not connected or in local development mode. In-memory storage cleared.');
  }
}

async function seedFreshData(): Promise<void> {
  console.log('\n[4/4] 🌱 SEEDING FRESH BASELINE TEST DATA...');
  // Dynamically import and run prisma/seed.ts
  const { execSync } = await import('child_process');
  try {
    execSync('npx tsx prisma/seed.ts', { stdio: 'inherit' });
    console.log('  ✓ Baseline data seeded successfully.');
  } catch (err: any) {
    console.error('  ! Error running seed script:', err.message);
    throw err;
  }
}

async function main() {
  const options = parseArgs();

  console.log('===============================================================');
  console.log('       RIVO COMPLETE SYSTEM & DATABASE RESET SCRIPT           ');
  console.log('===============================================================');
  console.log(`Mode: ${options.cleanOnly ? '100% BLANK SLATE (Clean Only)' : 'CLEAN & SEED FRESH BASELINE DATA'}`);
  console.log(`Target Database: ${process.env.DATABASE_URL ? 'Connected (Neon/PostgreSQL)' : 'None'}`);
  console.log(`Purge Azure Storage: ${options.skipAzure ? 'SKIPPED' : 'ENABLED'}`);
  console.log(`Flush Redis: ${options.skipRedis ? 'SKIPPED' : 'ENABLED'}`);

  const startTime = Date.now();

  try {
    // 1. PostgreSQL Purge
    await resetPostgreSQL();

    // 2. Azure Blob Purge
    if (!options.skipAzure) {
      await resetAzureStorage();
    } else {
      console.log('\n[2/4] ☁ Azure Blob purge skipped (--skip-azure).');
    }

    // 3. Redis Purge
    if (!options.skipRedis) {
      await resetRedis();
    } else {
      console.log('\n[3/4] ⚡ Redis flush skipped (--skip-redis).');
    }

    // 4. Seed Fresh Data
    if (options.seed) {
      await seedFreshData();
    } else {
      console.log('\n[4/4] 🚫 Seeding skipped (--clean-only). Database left 100% empty.');
    }

    const elapsedMs = Date.now() - startTime;
    console.log('\n===============================================================');
    console.log(`✅ SYSTEM RESET COMPLETE IN ${(elapsedMs / 1000).toFixed(2)}s`);
    console.log('===============================================================');

    if (options.seed) {
      console.log('\n🔑 READY-TO-USE FRESH CREDENTIALS:');
      console.log('---------------------------------------------------------------');
      console.log('1. School Administrator:');
      console.log('   Email:    admin@greenwood.edu');
      console.log('   Password: Password@123');
      console.log('   School:   Greenwood International School (greenwood-academy)');
      console.log('   URL:      http://localhost:3000/login');
      console.log('');
      console.log('2. Platform Owner / Super Admin:');
      console.log('   Email:    owner@rivo.local');
      console.log('   Password: Password@123');
      console.log('   URL:      http://localhost:3000/login');
      console.log('');
      console.log('3. Teacher Account:');
      console.log('   Email:    teacher@greenwood.edu');
      console.log('   Password: Password@123');
      console.log('---------------------------------------------------------------');
    } else {
      console.log('\n🚀 DATABASE IS 100% BLANK:');
      console.log('You can now test new school onboarding from scratch at:');
      console.log('👉 http://localhost:3000/signup');
      console.log('---------------------------------------------------------------');
    }
  } catch (error: any) {
    console.error('\n❌ RESET FAILED:', error.message || error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error('Fatal crash during system reset:', err);
  process.exit(1);
});
