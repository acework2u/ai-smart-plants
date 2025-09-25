import { prisma } from '@config/prisma';
import { HttpError } from '@middleware/errorHandler';
import type { SummaryQueryInput, TrendsQueryInput } from './insights.schemas';

const ensureUser = async (userId: string) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new HttpError(404, {
      code: 'users/not-found',
      message: 'User not found'
    });
  }
};

export const getSummaryInsights = async (userId: string, query: SummaryQueryInput) => {
  await ensureUser(userId);

  const plantFilter = query.plantId ? { plantId: query.plantId } : {};

  const [totalPlants, unreadNotifications, recentActivities] = await Promise.all([
    prisma.plant.count({ where: { userId, deletedAt: null } }),
    prisma.notification.count({ where: { userId, read: false } }),
    prisma.activity.count({
      where: {
        userId,
        deletedAt: null,
        dateISO: { gte: new Date(Date.now() - 7 * 24 * 3600 * 1000) },
        ...plantFilter
      }
    })
  ]);

  return {
    totalPlants,
    unreadNotifications,
    recentActivities,
    generatedAt: new Date().toISOString()
  };
};

const windowToDays = (window: string) => {
  switch (window) {
    case '7d':
      return 7;
    case '30d':
      return 30;
    case '90d':
      return 90;
    default:
      return 30;
  }
};

export const getTrendInsights = async (userId: string, query: TrendsQueryInput) => {
  await ensureUser(userId);

  const days = windowToDays(query.window);
  const since = new Date(Date.now() - days * 24 * 3600 * 1000);

  const plantFilter = query.plantId
    ? { plantId: query.plantId }
    : {};

  if (query.metric === 'wateringConsistency') {
    const activities = await prisma.activity.findMany({
      where: {
        userId,
        deletedAt: null,
        kind: 'water',
        dateISO: { gte: since },
        ...plantFilter
      },
      orderBy: { dateISO: 'asc' }
    });

    const intervals: number[] = [];
    for (let i = 1; i < activities.length; i += 1) {
      const prev = activities[i - 1].dateISO.getTime();
      const curr = activities[i].dateISO.getTime();
      intervals.push((curr - prev) / (24 * 3600 * 1000));
    }

    const averageInterval = intervals.length
      ? intervals.reduce((sum, val) => sum + val, 0) / intervals.length
      : null;

    return {
      metric: 'wateringConsistency',
      window: query.window,
      averageInterval,
      samples: intervals.length,
      generatedAt: new Date().toISOString()
    };
  }

  if (query.metric === 'fertilizerBalance') {
    const fertilizers = await prisma.activity.findMany({
      where: {
        userId,
        deletedAt: null,
        kind: 'fertilize',
        dateISO: { gte: since },
        ...plantFilter
      },
      orderBy: { dateISO: 'desc' }
    });

    const ratios = fertilizers.map((activity) => ({
      n: (activity.npk as any)?.n ?? null,
      p: (activity.npk as any)?.p ?? null,
      k: (activity.npk as any)?.k ?? null,
      dateISO: activity.dateISO
    }));

    return {
      metric: 'fertilizerBalance',
      window: query.window,
      entries: ratios,
      generatedAt: new Date().toISOString()
    };
  }

  if (query.metric === 'plantHealthIndex') {
    const analyses = await prisma.analysis.findMany({
      where: {
        userId,
        plantId: query.plantId ?? undefined,
        status: 'completed',
        createdAt: { gte: since }
      },
      orderBy: { createdAt: 'asc' }
    });

    const scores = analyses.map((analysis) => ({
      createdAt: analysis.createdAt,
      score: analysis.score
    }));

    const averageScore = scores.length
      ? scores.reduce((sum, item) => sum + (item.score ?? 0), 0) / scores.length
      : null;

    return {
      metric: 'plantHealthIndex',
      window: query.window,
      averageScore,
      samples: scores.length,
      generatedAt: new Date().toISOString()
    };
  }

  throw new HttpError(400, {
    code: 'insights/metric-not-supported',
    message: 'ไม่รองรับ metric ที่ร้องขอ'
  });
};
