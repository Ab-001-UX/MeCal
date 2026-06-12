import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();

async function main() {
  try {
    const users = await prisma.user.findMany({
      take: 10,
      select: {
        id: true,
        name: true,
        phoneNumber: true,
        createdAt: true
      }
    });
    console.log('--- Database Users ---');
    console.log(JSON.stringify(users, null, 2));
  } catch (err) {
    console.error('Error fetching users:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
