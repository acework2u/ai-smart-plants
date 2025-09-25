import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getSummaryInsights, getTrendInsights } from '../../src/modules/insights/insights.service';

const mockUserFindUnique = vi.fn();
const mockPlantCount = vi.fn();
const mockNotificationCount = vi.fn();
const mockActivityCount = vi.fn();
const mockActivityFindMany = vi.fn();
const mockAnalysisFindMany = vi.fn();

vi.mock('../../src/config/prisma', () => ({
  prisma: {
    user: {
      findUnique: mockUserFindUnique
    },
    plant: {
      count: mockPlantCount
    },
    notification: {
      count: mockNotificationCount
    },
    activity: {
      count: mockActivityCount,
      findMany: mockActivityFindMany
    },
    analysis: {
      findMany: mockAnalysisFindMany
    }
  }
}));

describe('insights.service', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockUserFindUnique.mockResolvedValue({ id: 'u1' });
  });

  it('returns summary metrics', async () => {
    mockPlantCount.mockResolvedValue(3);
    mockNotificationCount.mockResolvedValue(5);
    mockActivityCount.mockResolvedValue(10);

    const result = await getSummaryInsights('u1', {});
    expect(result.totalPlants).toBe(3);
    expect(result.unreadNotifications).toBe(5);
  });

  it('computes watering consistency', async () => {
    mockActivityFindMany.mockResolvedValue([
      { dateISO: new Date('2024-01-01') },
      { dateISO: new Date('2024-01-05') },
      { dateISO: new Date('2024-01-09') }
    ]);

    const result = await getTrendInsights('u1', {
      metric: 'wateringConsistency',
      window: '30d'
    });

    expect(result.metric).toBe('wateringConsistency');
    expect(result.samples).toBe(2);
    expect(result.averageInterval).toBeCloseTo(4);
  });

  it('returns fertilizer entries', async () => {
    mockActivityFindMany.mockResolvedValue([
      { dateISO: new Date('2024-01-01'), npk: { n: '10', p: '10', k: '10' } }
    ]);

    const result = await getTrendInsights('u1', {
      metric: 'fertilizerBalance',
      window: '30d'
    });

    expect(result.entries).toHaveLength(1);
  });

  it('returns plant health index average', async () => {
    mockAnalysisFindMany.mockResolvedValue([
      { createdAt: new Date('2024-01-01'), score: 0.8 },
      { createdAt: new Date('2024-01-10'), score: 0.9 }
    ]);

    const result = await getTrendInsights('u1', {
      metric: 'plantHealthIndex',
      window: '30d'
    });

    expect(result.averageScore).toBeCloseTo(0.85);
  });
});
