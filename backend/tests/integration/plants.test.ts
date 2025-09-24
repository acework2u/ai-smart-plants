import request from 'supertest';
import app from '../../src/app';
import { prisma } from '../../src/config/prisma';

// Note: these tests assume a running Postgres instance pointed by DATABASE_URL.
// In CI, use docker-compose services or a dedicated test database.
describe.skip('Plants API (integration)', () => {
  const userId = 'test-user';

  beforeAll(async () => {
    await prisma.user.upsert({
      where: { id: userId },
      update: {},
      create: {
        id: userId,
        email: 'test@example.com'
      }
    });
  });

  afterAll(async () => {
    await prisma.activity.deleteMany({ where: { userId } });
    await prisma.plant.deleteMany({ where: { userId } });
    await prisma.user.deleteMany({ where: { id: userId } });
    await prisma.$disconnect();
  });

  it('creates and fetches a plant', async () => {
    const createPayload = {
      nickname: 'Monstera Deliciosa',
      scientificName: 'Monstera deliciosa',
      status: 'healthy'
    };

    const response = await request(app)
      .post('/v1/plants')
      .set('X-User-Id', userId)
      .send(createPayload)
      .expect(201);

    const plantId = response.body.data.id;

    await request(app)
      .get(`/v1/plants/${plantId}`)
      .set('X-User-Id', userId)
      .expect(200);
  });
});
