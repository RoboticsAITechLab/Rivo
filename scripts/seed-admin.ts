import dotenv from 'dotenv';
dotenv.config();

import { PrismaClient, Role, SchoolStatus } from '@prisma/client';
import crypto from 'node:crypto';

const prisma = new PrismaClient();

async function hashPassword(password: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString('hex');
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) return reject(err);
      resolve(`${salt}:${derivedKey.toString('hex')}`);
    });
  });
}

async function main() {
  console.log('Seeding admin@greenwood.edu into database...');
  const passwordHash = await hashPassword('Password@123');

  // Ensure school exists
  const school = await prisma.school.upsert({
    where: { slug: 'greenwood-academy' },
    update: { status: SchoolStatus.ACTIVE },
    create: {
      name: 'Greenwood International School',
      slug: 'greenwood-academy',
      status: SchoolStatus.ACTIVE,
    },
  });

  // Upsert user with Platform Owner permissions
  const user = await prisma.user.upsert({
    where: { email: 'admin@greenwood.edu' },
    update: {
      passwordHash,
      isActive: true,
      status: 'ACTIVE',
      isPlatformOwner: true,
      platformRole: 'OWNER',
    },
    create: {
      email: 'admin@greenwood.edu',
      firstName: 'Alice',
      lastName: 'Administrator',
      passwordHash,
      isPlatformOwner: true,
      platformRole: 'OWNER',
      isActive: true,
      status: 'ACTIVE',
    },
  });

  // Upsert membership
  await prisma.schoolMembership.upsert({
    where: {
      userId_schoolId: {
        userId: user.id,
        schoolId: school.id,
      },
    },
    update: {
      role: Role.DIRECTOR,
      status: 'ACTIVE',
    },
    create: {
      userId: user.id,
      schoolId: school.id,
      role: Role.DIRECTOR,
      status: 'ACTIVE',
    },
  });

  console.log('Successfully provisioned admin@greenwood.edu with password Password@123 and Platform Owner privileges!');
}

main()
  .catch((e) => {
    console.error('Failed to seed admin:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
