import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  createActivity,
  listActivities,
  __test__
} from '../../src/modules/activities/activities.service';

vi.mock('../../src/modules/plants/plants.service', () => ({
  upsertPreferences: vi.fn().mockResolvedValue(null)
}));

const mockActivityCreate = vi.fn();
const mockActivityFindMany = vi.fn();
const mockActivityFindFirst = vi.fn();
const mockActivityUpdate = vi.fn();
const mockPlantFindFirst = vi.fn();

vi.mock('../../src/config/prisma', () => ({
  prisma: {
    plant: {
      findFirst: mockPlantFindFirst
    },
    activity: {
      create: mockActivityCreate,
      findMany: mockActivityFindMany,
      findFirst: mockActivityFindFirst,
      update: mockActivityUpdate
    }
  }
}));

const baseActivity = {
  id: 'a1',
  plantId: 'p1',
  userId: 'u1',
  kind: 'water',
  quantity: '500',
  unit: 'ml',
  npk: null,
  note: null,
  dateISO: new Date('2024-01-01T00:00:00Z'),
  time24: null,
  createdAt: new Date('2024-01-01T00:00:00Z'),
  updatedAt: new Date('2024-01-01T00:00:00Z'),
  deletedAt: null
};

const { mapKindFromApi, mapKindToApi } = __test__;

describe('activities.service mappings', () => {
  it('maps Thai kind to DB enum and back', () => {
    expect(mapKindFromApi('รดน้ำ')).toBe('water');
    expect(mapKindToApi('fertilize')).toBe('ใส่ปุ๋ย');
  });
});

describe('createActivity', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPlantFindFirst.mockResolvedValue({ id: 'p1' });
    mockActivityCreate.mockResolvedValue(baseActivity);
  });

  it('persists mapped enums and returns Thai labels', async () => {
    const result = await createActivity('p1', 'u1', {
      kind: 'รดน้ำ',
      quantity: '500',
      unit: 'ml',
      note: 'morning care'
    });

    expect(mockActivityCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          kind: 'water',
          unit: 'ml',
          note: 'morning care'
        })
      })
    );
    expect(result.kind).toBe('รดน้ำ');
  });
});

describe('listActivities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPlantFindFirst.mockResolvedValue({ id: 'p1' });
    mockActivityFindMany.mockResolvedValue([baseActivity]);
  });

  it('returns paginated activities with localized fields', async () => {
    const result = await listActivities('p1', 'u1', {});

    expect(mockActivityFindMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ plantId: 'p1', userId: 'u1' })
    }));
    expect(result.nodes[0].kind).toBe('รดน้ำ');
  });
});
