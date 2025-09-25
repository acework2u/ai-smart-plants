import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  startAnalysis,
  listAnalyses,
  getAnalysis,
  cancelAnalysis,
  __test__
} from '../../src/modules/analyses/analyses.service';

const mockAnalysisCreate = vi.fn();
const mockAnalysisUpdate = vi.fn();
const mockAnalysisFindMany = vi.fn();
const mockAnalysisFindFirst = vi.fn();
const mockUserFindUnique = vi.fn();
const mockPlantFindFirst = vi.fn();

vi.mock('../../src/config/prisma', () => ({
  prisma: {
    analysis: {
      create: mockAnalysisCreate,
      update: mockAnalysisUpdate,
      findMany: mockAnalysisFindMany,
      findFirst: mockAnalysisFindFirst
    },
    user: {
      findUnique: mockUserFindUnique
    },
    plant: {
      findFirst: mockPlantFindFirst
    }
  }
}));

vi.mock('../../src/config/env', () => ({
  env: {
    ANALYSIS_API_BASE_URL: 'http://analysis-api:5000'
  }
}));

const completedAnalysis = {
  id: 'a1',
  userId: 'u1',
  plantId: 'p1',
  status: 'completed',
  imageRef: null,
  plantName: 'Monstera',
  score: 0.9,
  issues: null,
  recommendations: null,
  weatherSnapshot: null,
  createdAt: new Date('2024-01-01T00:00:00Z'),
  updatedAt: new Date('2024-01-01T00:00:00Z')
};

describe('analyses.service', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockUserFindUnique.mockResolvedValue({ id: 'u1' });
    mockPlantFindFirst.mockResolvedValue({ id: 'p1' });
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          id: 'external',
          status: 'completed',
          plantName: 'Monstera',
          issues: [],
          score: 0.95,
          recommendations: [],
          weatherSnapshot: { tempC: 33 }
        }
      })
    } as any);
  });

  it('starts analysis and returns completed record', async () => {
    mockAnalysisCreate.mockResolvedValue({ id: 'a1' });
    mockAnalysisUpdate.mockResolvedValueOnce({ id: 'a1' });
    mockAnalysisUpdate.mockResolvedValueOnce({
      ...completedAnalysis,
      issues: [],
      recommendations: [],
      weatherSnapshot: { tempC: 33 }
    });

    const result = await startAnalysis('u1', {
      plantId: 'p1',
      imageUrl: 'https://example.com/image.jpg'
    });

    expect(mockAnalysisCreate).toHaveBeenCalled();
    expect(result.status).toBe('completed');
    expect(result.plantName).toBe('Monstera');
  });

  it('lists analyses with pagination meta', async () => {
    mockAnalysisFindMany.mockResolvedValue([completedAnalysis]);
    const result = await listAnalyses('u1', {});
    expect(result.nodes).toHaveLength(1);
  });

  it('gets analysis by id', async () => {
    mockAnalysisFindFirst.mockResolvedValue(completedAnalysis);
    const result = await getAnalysis('u1', 'a1');
    expect(result.id).toBe('a1');
  });

  it('cancels processing analysis', async () => {
    mockAnalysisFindFirst.mockResolvedValueOnce({ id: 'a1', userId: 'u1', status: 'processing' });
    mockAnalysisUpdate.mockResolvedValueOnce({ ...completedAnalysis, status: 'failed' });
    const result = await cancelAnalysis('u1', 'a1');
    expect(result.status).toBe('failed');
  });
});
