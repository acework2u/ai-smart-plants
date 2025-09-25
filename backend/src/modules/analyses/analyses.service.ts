import {
  Prisma,
  AnalysisStatus,
  Analysis
} from '@prisma/client';
import type { z } from 'zod';

import { prisma } from '@config/prisma';
import { env } from '@config/env';
import { HttpError } from '@middleware/errorHandler';
import type { StartAnalysisInput, ListAnalysesQueryInput } from './analyses.schemas';

const ANALYSIS_TIMEOUT_MS = 10_000;

type AnalysisPayload = {
  id: string;
  status: string;
  plantName?: string;
  issues?: Array<{ code: string; severity?: string; confidence?: number }>;
  score?: number;
  recommendations?: Array<{ id: string; title: string; desc: string }>;
  weatherSnapshot?: Record<string, unknown>;
  createdAt?: string;
};

const serializeAnalysis = (analysis: Analysis) => ({
  ...analysis,
  issues: analysis.issues as Array<Record<string, unknown>> | null,
  recommendations: analysis.recommendations as Array<Record<string, unknown>> | null,
  weatherSnapshot: analysis.weatherSnapshot as Record<string, unknown> | null
});

const ensureUserExists = async (userId: string) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new HttpError(404, {
      code: 'users/not-found',
      message: 'User not found'
    });
  }
};

const ensurePlantOwnership = async (plantId: string, userId: string) => {
  if (!plantId) return;
  const plant = await prisma.plant.findFirst({ where: { id: plantId, userId, deletedAt: null } });
  if (!plant) {
    throw new HttpError(404, {
      code: 'plants/not-found',
      message: 'Plant not found'
    });
  }
};

const callAnalysisService = async (
  payload: StartAnalysisInput
): Promise<AnalysisPayload | null> => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ANALYSIS_TIMEOUT_MS);

  try {
    const response = await fetch(`${env.ANALYSIS_API_BASE_URL}/v1/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageUrl: payload.imageUrl,
        imageBase64: payload.imageBase64
      }),
      signal: controller.signal
    });

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as { data?: AnalysisPayload } | AnalysisPayload;

    return 'data' in data && data.data ? data.data : (data as AnalysisPayload);
  } catch (error) {
    return null;
  } finally {
    clearTimeout(timeout);
  }
};

export const startAnalysis = async (
  userId: string,
  payload: StartAnalysisInput
) => {
  await ensureUserExists(userId);
  if (payload.plantId) {
    await ensurePlantOwnership(payload.plantId, userId);
  }

  const analysis = await prisma.analysis.create({
    data: {
      userId,
      plantId: payload.plantId ?? null,
      imageRef: payload.imageUrl ?? null,
      status: AnalysisStatus.processing,
      createdAt: new Date()
    }
  });

  const externalResult = await callAnalysisService(payload);

  if (!externalResult) {
    const failed = await prisma.analysis.update({
      where: { id: analysis.id },
      data: {
        status: AnalysisStatus.failed,
        updatedAt: new Date()
      }
    });

    throw new HttpError(502, {
      code: 'analyses/service-unavailable',
      message: 'ไม่สามารถประมวลผลการวิเคราะห์ได้ในขณะนี้'
    });
  }

  const updated = await prisma.analysis.update({
    where: { id: analysis.id },
    data: {
      status: AnalysisStatus.completed,
      plantName: externalResult.plantName ?? null,
      score: externalResult.score ?? null,
      issues: ((externalResult.issues ?? []) as Prisma.InputJsonValue),
      recommendations: ((externalResult.recommendations ?? []) as Prisma.InputJsonValue),
      weatherSnapshot: ((externalResult.weatherSnapshot ?? {}) as Prisma.InputJsonValue),
      updatedAt: new Date()
    }
  });

  return serializeAnalysis(updated);
};

export const listAnalyses = async (
  userId: string,
  query: ListAnalysesQueryInput
) => {
  await ensureUserExists(userId);

  const { plantId, status, since, limit = 20, cursor } = query;

  const where: Prisma.AnalysisWhereInput = {
    userId
  };

  if (plantId) {
    await ensurePlantOwnership(plantId, userId);
    where.plantId = plantId;
  }

  if (status) {
    where.status = status as AnalysisStatus;
  }

  if (since) {
    where.createdAt = { gte: new Date(since) };
  }

  const analyses = await prisma.analysis.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: limit + 1,
    skip: cursor ? 1 : 0,
    cursor: cursor ? { id: cursor } : undefined
  });

  const hasNextPage = analyses.length > limit;
  const nodesRaw = hasNextPage ? analyses.slice(0, -1) : analyses;

  return {
    nodes: nodesRaw.map(serializeAnalysis),
    pageInfo: {
      hasNextPage,
      nextCursor: hasNextPage ? nodesRaw[nodesRaw.length - 1].id : null
    }
  };
};

export const getAnalysis = async (userId: string, analysisId: string) => {
  await ensureUserExists(userId);

  const analysis = await prisma.analysis.findFirst({
    where: { id: analysisId, userId }
  });

  if (!analysis) {
    throw new HttpError(404, {
      code: 'analyses/not-found',
      message: 'Analysis not found'
    });
  }

  return serializeAnalysis(analysis);
};

export const cancelAnalysis = async (userId: string, analysisId: string) => {
  await ensureUserExists(userId);

  const analysis = await prisma.analysis.findFirst({
    where: { id: analysisId, userId }
  });

  if (!analysis) {
    throw new HttpError(404, {
      code: 'analyses/not-found',
      message: 'Analysis not found'
    });
  }

  if (analysis.status !== AnalysisStatus.processing && analysis.status !== AnalysisStatus.queued) {
    throw new HttpError(409, {
      code: 'analyses/not-cancellable',
      message: 'ยกเลิกได้เฉพาะการวิเคราะห์ที่อยู่ระหว่างดำเนินการ'
    });
  }

  const updated = await prisma.analysis.update({
    where: { id: analysis.id },
    data: {
      status: AnalysisStatus.failed,
      updatedAt: new Date()
    }
  });

  return serializeAnalysis(updated);
};

export const __test__ = {
  serializeAnalysis,
  callAnalysisService
};
