import dotenv from 'dotenv';
dotenv.config();

import { prisma } from '../src/lib/prisma';

async function wipeDatabase() {
  console.log('===============================================================');
  console.log('RIVO DATABASE RESET — WIPING ALL DATA');
  console.log('===============================================================\n');

  try {
    // 1. Fetch all user tables in public schema except _prisma_migrations
    const tables: Array<{ tablename: string }> = await prisma.$queryRawUnsafe(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
        AND tablename NOT LIKE '_prisma_%';
    `);

    if (tables.length === 0) {
      console.log('No tables found to wipe.');
      return;
    }

    console.log(`Found ${tables.length} tables to truncate.`);

    // 2. Truncate all tables with CASCADE
    const tableNames = tables.map((t) => `"${t.tablename}"`).join(', ');
    console.log(`Truncating: ${tableNames}\n`);

    await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tableNames} RESTART IDENTITY CASCADE;`);

    console.log('✓ SUCCESS: All database tables truncated and identity sequences reset.');

    // 3. Verify row counts
    console.log('\n--- Verifying table counts ---');
    for (const { tablename } of tables) {
      const countResult: Array<{ count: bigint }> = await prisma.$queryRawUnsafe(
        `SELECT COUNT(*) as count FROM "${tablename}";`
      );
      const count = Number(countResult[0]?.count || 0);
      if (count > 0) {
        console.warn(`  ! Warning: Table ${tablename} still has ${count} records`);
      } else {
        console.log(`  ✓ ${tablename}: 0 records`);
      }
    }

    console.log('\n===============================================================');
    console.log('DATABASE WIPE COMPLETED SUCCESSFULLY (100% CLEAN DB)');
    console.log('===============================================================\n');
  } catch (error) {
    console.error('Failed to wipe database:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

wipeDatabase();
