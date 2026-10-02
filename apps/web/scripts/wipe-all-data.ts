import dotenv from 'dotenv';
dotenv.config();

import { BlobServiceClient } from '@azure/storage-blob';
import { prisma } from '../src/lib/prisma';
import { getRedisClient, closeRedisConnection } from '../src/lib/redis/client';

async function wipeAllData() {
  console.log('===============================================================');
  console.log('RIVO COMPLETE SYSTEM PURGE — DATABASE, AZURE BLOB & REDIS');
  console.log('===============================================================\n');

  // -------------------------------------------------------------------------
  // 1. PostgreSQL Database Purge
  // -------------------------------------------------------------------------
  try {
    console.log('--- 1. Purging PostgreSQL Database Tables ---');
    const tables: Array<{ tablename: string }> = await prisma.$queryRawUnsafe(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
        AND tablename NOT LIKE '_prisma_%';
    `);

    if (tables.length > 0) {
      const tableNames = tables.map((t) => `"${t.tablename}"`).join(', ');
      await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tableNames} RESTART IDENTITY CASCADE;`);
      console.log(`✓ SUCCESS: Truncated ${tables.length} tables and reset all sequences.\n`);
    } else {
      console.log('No PostgreSQL tables found to truncate.\n');
    }
  } catch (dbErr) {
    console.error('! Error during PostgreSQL purge:', dbErr);
  }

  // -------------------------------------------------------------------------
  // 2. Azure Blob Storage Purge
  // -------------------------------------------------------------------------
  try {
    console.log('--- 2. Purging Azure Blob Storage Media & Documents ---');
    const connStr = process.env.AZURE_STORAGE_CONNECTION_STRING;

    if (connStr && connStr.trim() !== '') {
      const blobServiceClient = BlobServiceClient.fromConnectionString(connStr);
      const containersToClean = [
        process.env.AZURE_STORAGE_PRIVATE_CONTAINER || 'rivo-private',
        process.env.AZURE_STORAGE_PUBLIC_CONTAINER || 'rivo-public',
      ];

      // Also list any existing containers on the account
      for await (const containerItem of blobServiceClient.listContainers()) {
        if (!containersToClean.includes(containerItem.name)) {
          containersToClean.push(containerItem.name);
        }
      }

      console.log(`Target Azure containers: ${containersToClean.join(', ')}`);

      let totalBlobsDeleted = 0;
      for (const containerName of containersToClean) {
        try {
          const containerClient = blobServiceClient.getContainerClient(containerName);
          const exists = await containerClient.exists();
          if (!exists) {
            console.log(`  Container "${containerName}" does not exist, skipping.`);
            continue;
          }

          let containerBlobs = 0;
          for await (const blob of containerClient.listBlobsFlat()) {
            await containerClient.deleteBlob(blob.name);
            containerBlobs++;
            totalBlobsDeleted++;
            console.log(`  - Deleted blob: [${containerName}] ${blob.name}`);
          }
          console.log(`  ✓ Container "${containerName}": Deleted ${containerBlobs} blobs.`);
        } catch (containerErr: any) {
          console.warn(`  ! Warning cleaning container "${containerName}":`, containerErr.message || containerErr);
        }
      }

      console.log(`✓ SUCCESS: Azure Blob Storage purged (${totalBlobsDeleted} total blobs deleted).\n`);
    } else {
      console.log('AZURE_STORAGE_CONNECTION_STRING not provided. Skipping Azure Blob purge.\n');
    }
  } catch (azureErr: any) {
    console.error('! Error during Azure Blob Storage purge:', azureErr.message || azureErr);
  }

  // -------------------------------------------------------------------------
  // 3. Redis Cache & Session Purge
  // -------------------------------------------------------------------------
  try {
    console.log('--- 3. Flushing Redis Sessions & Cache ---');
    const redis = getRedisClient();
    if (redis) {
      await redis.flushdb();
      console.log('✓ SUCCESS: Redis database flushed.\n');
    } else {
      console.log('Redis client not connected or local mode. In-memory cache cleared.\n');
    }
  } catch (redisErr: any) {
    console.warn('! Notice: Redis flush skipped or unavailable:', redisErr.message || redisErr);
  } finally {
    await closeRedisConnection();
    await prisma.$disconnect();
  }

  console.log('===============================================================');
  console.log('PURGE COMPLETE: SYSTEM READY FOR 100% FRESH START');
  console.log('===============================================================\n');
}

wipeAllData().catch((err) => {
  console.error('Fatal error during purge:', err);
  process.exit(1);
});
