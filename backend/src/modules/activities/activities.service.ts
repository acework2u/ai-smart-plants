import {
  Prisma,
  ActivityKind,
  Unit,
  Activity
} from '@prisma/client';
import type { z } from 'zod';

import { prisma } from '@config/prisma';
import { HttpError } from '@middleware/errorHandler';
import { upsertPreferences } from '@modules/plants/plants.service';
import type {
  createActivitySchema,
  updateActivitySchema,
  listActivitiesQuerySchema
} from './activities.schemas';

const API_KIND_TO_DB: Record<string, ActivityKind> = {
  'รดน้ำ': 'water',
  'ใส่ปุ๋ย': 'fertilize',
  'พ่นยา': 'spray',
  'ย้ายกระถาง': 'repot',
  'ตรวจใบ': 'inspect'
};

const DB_KIND_TO_API: Record<ActivityKind, string> = {
  water: 'รดน้ำ',
  fertilize: 'ใส่ปุ๋ย',
  spray: 'พ่นยา',
  repot: 'ย้ายกระถาง',
  inspect: 'ตรวจใบ'
};

const API_UNIT_TO_DB: Record<string, Unit> = {
  ml: 'ml',
  g: 'g',
  pcs: 'pcs',
  'ล.': 'liter'
};

const DB_UNIT_TO_API: Record<Unit, string> = {
  ml: 'ml',
  g: 'g',
  pcs: 'pcs',
  liter: 'ล.'
};

const mapKindFromApi = (kind: string) => API_KIND_TO_DB[kind];
const mapKindToApi = (kind: ActivityKind) => DB_KIND_TO_API[kind];
const mapUnitFromApi = (unit?: string) => (unit ? API_UNIT_TO_DB[unit] : undefined);
const mapUnitToApi = (unit?: Unit | null) => (unit ? DB_UNIT_TO_API[unit] : null);

const serializeActivity = (activity: Activity) => ({
  ...activity,
  kind: mapKindToApi(activity.kind),
  unit: mapUnitToApi(activity.unit),
  npk: activity.npk as Record<string, string> | null
});

export type CreateActivityInput = z.infer<typeof createActivitySchema>;
export type UpdateActivityInput = z.infer<typeof updateActivitySchema>;
export type ListActivitiesQueryInput = z.infer<typeof listActivitiesQuerySchema>;

const ensurePlantOwnership = async (plantId: string, userId: string) => {
  const plant = await prisma.plant.findFirst({ where: { id: plantId, userId, deletedAt: null } });
  if (!plant) {
    throw new HttpError(404, {
      code: 'plants/not-found',
      message: 'Plant not found'
    });
  }
  return plant;
};

export const listActivities = async (
  plantId: string,
  userId: string,
  query: ListActivitiesQueryInput
) => {
  await ensurePlantOwnership(plantId, userId);

  const { kind, from, to, limit = 20, cursor } = query;

  const where: Prisma.ActivityWhereInput = {
    plantId,
    userId,
    deletedAt: null
  };

  if (kind) {
    where.kind = mapKindFromApi(kind);
  }

  if (from || to) {
    where.dateISO = {};
    if (from) {
      where.dateISO.gte = new Date(from);
    }
    if (to) {
      where.dateISO.lte = new Date(to);
    }
  }

  const activities = await prisma.activity.findMany({
    where,
    orderBy: [{ dateISO: 'desc' }, { createdAt: 'desc' }],
    take: limit + 1,
    skip: cursor ? 1 : 0,
    cursor: cursor ? { id: cursor } : undefined
  });

  const hasNextPage = activities.length > limit;
  const nodesRaw = hasNextPage ? activities.slice(0, -1) : activities;
  const nodes = nodesRaw.map(serializeActivity);
  const nextCursor = hasNextPage ? nodesRaw[nodesRaw.length - 1].id : null;

  return {
    nodes,
    pageInfo: {
      hasNextPage,
      nextCursor
    }
  };
};

export const createActivity = async (
  plantId: string,
  userId: string,
  payload: CreateActivityInput
) => {
  await ensurePlantOwnership(plantId, userId);

  const data: Prisma.ActivityCreateInput = {
    kind: mapKindFromApi(payload.kind),
    quantity: payload.quantity ?? null,
    unit: mapUnitFromApi(payload.unit) ?? null,
    note: payload.note ?? null,
    dateISO: payload.dateISO ? new Date(payload.dateISO) : new Date(),
    time24: payload.time24 ?? null,
    plant: { connect: { id: plantId } },
    user: { connect: { id: userId } }
  };

  if (payload.id) {
    data.id = payload.id;
  }

  if (payload.npk) {
    data.npk = {
      n: payload.npk.n,
      p: payload.npk.p,
      k: payload.npk.k
    } as Prisma.InputJsonValue;
  }

  const created = await prisma.activity.create({ data });

  await upsertPreferences(plantId, userId, {
    lastKind: payload.kind,
    lastUnit: payload.unit,
    lastQty: payload.quantity,
    lastN: payload.npk?.n,
    lastP: payload.npk?.p,
    lastK: payload.npk?.k,
    reminderWater: undefined,
    reminderFertil: undefined,
    enableReminders: undefined
  });

  return serializeActivity(created);
};

export const updateActivity = async (
  plantId: string,
  activityId: string,
  userId: string,
  payload: UpdateActivityInput
) => {
  const activity = await prisma.activity.findFirst({
    where: { id: activityId, plantId, userId, deletedAt: null }
  });

  if (!activity) {
    throw new HttpError(404, {
      code: 'activities/not-found',
      message: 'Activity not found'
    });
  }

  const data: Prisma.ActivityUpdateInput = {};

  if (payload.kind !== undefined) {
    data.kind = { set: mapKindFromApi(payload.kind) };
  }
  if (payload.quantity !== undefined) {
    data.quantity = { set: payload.quantity ?? null };
  }
  if (payload.unit !== undefined) {
    data.unit = { set: mapUnitFromApi(payload.unit) ?? null };
  }
  if (payload.npk) {
    data.npk = {
      set: {
        n: payload.npk.n,
        p: payload.npk.p,
        k: payload.npk.k
      } as Prisma.InputJsonValue
    };
  }
  if (payload.note !== undefined) {
    data.note = { set: payload.note ?? null };
  }
  if (payload.dateISO !== undefined) {
    data.dateISO = { set: payload.dateISO ? new Date(payload.dateISO) : new Date() };
  }
  if (payload.time24 !== undefined) {
    data.time24 = { set: payload.time24 ?? null };
  }

  if (Object.keys(data).length === 0) {
    return serializeActivity(activity);
  }

  const updated = await prisma.activity.update({
    where: { id: activityId },
    data
  });

  if (payload.kind || payload.unit || payload.quantity || payload.npk) {
    await upsertPreferences(plantId, userId, {
      lastKind: (payload.kind ?? mapKindToApi(activity.kind)) as any,
      lastUnit: (payload.unit ?? mapUnitToApi(activity.unit) ?? undefined) as any,
      lastQty: payload.quantity ?? activity.quantity ?? undefined,
      lastN: payload.npk?.n ?? (activity.npk as any)?.n,
      lastP: payload.npk?.p ?? (activity.npk as any)?.p,
      lastK: payload.npk?.k ?? (activity.npk as any)?.k,
      reminderWater: undefined,
      reminderFertil: undefined,
      enableReminders: undefined
    });
  }

  return serializeActivity(updated);
};

export const deleteActivity = async (
  plantId: string,
  activityId: string,
  userId: string
) => {
  const activity = await prisma.activity.findFirst({
    where: { id: activityId, plantId, userId, deletedAt: null }
  });

  if (!activity) {
    throw new HttpError(404, {
      code: 'activities/not-found',
      message: 'Activity not found'
    });
  }

  await prisma.activity.update({
    where: { id: activityId },
    data: { deletedAt: new Date() }
  });

  return { success: true };
};

export const getActivity = async (
  plantId: string,
  activityId: string,
  userId: string
) => {
  const activity = await prisma.activity.findFirst({
    where: { id: activityId, plantId, userId, deletedAt: null }
  });

  if (!activity) {
    throw new HttpError(404, {
      code: 'activities/not-found',
      message: 'Activity not found'
    });
  }

  return serializeActivity(activity);
};

export const __test__ = {
  mapKindFromApi,
  mapKindToApi,
  mapUnitFromApi,
  mapUnitToApi,
  serializeActivity
};
