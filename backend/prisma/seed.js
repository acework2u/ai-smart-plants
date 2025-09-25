const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SEED_USER_EMAIL?.trim().toLowerCase() || 'demo@example.com';
  const password = process.env.SEED_USER_PASSWORD || 'Password123';
  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      passwordHash,
      role: 'owner'
    }
  });

  const plant = await prisma.plant.upsert({
    where: { id: 'seed-plant-1' },
    update: {},
    create: {
      id: 'seed-plant-1',
      userId: user.id,
      nickname: 'Monstera Deliciosa',
      scientificName: 'Monstera deliciosa',
      status: 'healthy',
      imageRef: 'https://images.unsplash.com/photo-1614594857263-4a3b8d54915f?q=80&w=800&auto=format&fit=crop',
      preferences: {
        create: {
          lastKind: 'water',
          lastUnit: 'ml',
          lastQty: '500'
        }
      }
    }
  });

  await prisma.activity.upsert({
    where: { id: 'seed-activity-1' },
    update: {},
    create: {
      id: 'seed-activity-1',
      userId: user.id,
      plantId: plant.id,
      kind: 'water',
      quantity: '500',
      unit: 'ml',
      note: 'Morning watering',
      dateISO: new Date(),
      time24: '08:00'
    }
  });

  await prisma.notification.upsert({
    where: { id: 'seed-notification-1' },
    update: {},
    create: {
      id: 'seed-notification-1',
      userId: user.id,
      plantId: plant.id,
      type: 'reminder',
      title: 'ถึงเวลารดน้ำ Monstera',
      detail: 'รดน้ำ 500 ml เพื่อให้ดินชุ่ม',
      timeLabel: 'วันนี้ 18:00',
      read: false
    }
  });

  console.log('Seed data created:');
  console.log(`  Email: ${email}`);
  console.log(`  Password: ${password}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
