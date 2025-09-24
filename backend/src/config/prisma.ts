import { PrismaClient } from '@prisma/client';
import { env } from '@config/env';

export const prisma = new PrismaClient({
  log: env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error']
});

export async function connectPrisma() {
  await prisma.$connect();
}

export async function disconnectPrisma() {
  await prisma.$disconnect();
}
