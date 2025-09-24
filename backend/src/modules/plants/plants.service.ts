import { Prisma, PlantStatus, ActivityKind, Unit } from '@prisma/client';
import type { z } from 'zod';

import { prisma } from '@config/prisma';
import { HttpError } from '@middleware/errorHandler';
import type {
  createPlantSchema,
  getPlantsQuerySchema,
  updatePlantSchema,
  upsertPreferenceSchema
} from './plants.schemas';

export type CreatePlantInput = z.infer<typeof createPlantSchema>;
export type UpdatePlantInput = z.infer<typeof updatePlantSchema>;
export type PlantsQueryInput = z.infer<typeof getPlantsQuerySchema>;
export type UpsertPreferenceInput = z.infer<typeof upsertPreferenceSchema>;

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

const mapActivityKindFromApi = (value?: string | null) => {
  if (!value) return undefined;
  return API_KIND_TO_DB[value] ?? undefined;
};

const mapActivityKindToApi = (value?: ActivityKind | null) => {
  if (!value) return null;
  return DB_KIND_TO_API[value];
};

const mapUnitFromApi = (value?: string | null) => {
  if (!value) return undefined;
  return API_UNIT_TO_DB[value] ?? undefined;
};

const mapUnitToApi = (value?: Unit | null) => {
  if (!value) return null;
  return DB_UNIT_TO_API[value];
};

type PlantWithPrefs = Prisma.PlantGetPayload<{ include: { preferences: true } }>;
type PreferenceHistory = Prisma.PlantPreferenceHistoryGetPayload<{}>;

const toJsonInput = (
  value?: Record<string, unknown> | null
): Prisma.NullableJsonNullValueInput | Prisma.InputJsonValue | undefined => {
  if (value === undefined) return undefined;
  if (value === null) return Prisma.JsonNull;
  return value as Prisma.JsonObject;
};

const fromJson = <T>(value: Prisma.JsonValue | null): T | null => {
  if (value === null) {
    return null;
  }

  if (value === (Prisma.JsonNull as unknown)) {
    return null;
  }

  return value as T;
};

const serializePreference = (pref: PlantWithPrefs['preferences']) => {
  if (!pref) return pref;
  return {
    ...pref,
    lastKind: mapActivityKindToApi(pref.lastKind),
    lastUnit: mapUnitToApi(pref.lastUnit)
  };
};

const serializePlant = (plant: PlantWithPrefs) => ({
  ...plant,
  location: fromJson<Record<string, unknown>>(plant.location ?? null),
  preferences: serializePreference(plant.preferences)
});

const serializePrefHistory = (history: PreferenceHistory[]) =>
  history.map((item) => ({
    ...item,
    lastKind: mapActivityKindToApi(item.lastKind as ActivityKind | null),
    lastUnit: mapUnitToApi(item.lastUnit as Unit | null)
  }));

export async function listPlants(query: PlantsQueryInput, userId: string) {
  const { status, q, updatedSince, limit = 20, cursor } = query;

  const where: Prisma.PlantWhereInput = {
    userId,
    deletedAt: null
  };

  if (status) {
    where.status = status as PlantStatus;
  }

  if (q) {
    where.OR = [
      { nickname: { contains: q, mode: 'insensitive' } },
      { scientificName: { contains: q, mode: 'insensitive' } }
    ];
  }

  if (updatedSince) {
    where.updatedAt = { gte: new Date(updatedSince) };
  }

  const plants = await prisma.plant.findMany({
    where,
    take: limit + 1,
    skip: cursor ? 1 : 0,
    include: {
      preferences: true
    },
    orderBy: { createdAt: 'desc' },
    cursor: cursor ? { id: cursor } : undefined
  });

  const hasNextPage = plants.length > limit;
  const nodesRaw = hasNextPage ? plants.slice(0, -1) : plants;
  const nodes = nodesRaw.map(serializePlant);
  const nextCursor = hasNextPage ? nodesRaw[nodesRaw.length - 1].id : null;

  return {
    nodes,
    pageInfo: {
      hasNextPage,
      nextCursor
    }
  };
}

export async function getPlant(id: string, userId: string) {
  const plant = await prisma.plant.findFirst({
    where: { id, userId, deletedAt: null },
    include: { preferences: true }
  });

  if (!plant) {
    throw new HttpError(404, {
      code: 'plants/not-found',
      message: 'Plant not found'
    });
  }

  return serializePlant(plant);
}

export async function createPlant(payload: CreatePlantInput) {
  const {
    userId,
    preferences,
    id,
    nickname,
    scientificName,
    status,
    imageRef,
    location,
    statusColor
  } = payload;

  try {
    const userExists = await prisma.user.findUnique({ where: { id: userId } });

    if (!userExists) {
      throw new HttpError(404, {
        code: 'users/not-found',
        message: 'User not found'
      });
    }

    const data: Prisma.PlantCreateInput = {
      nickname,
      scientificName: scientificName ?? null,
      status: (status as PlantStatus | undefined) ?? PlantStatus.healthy,
      imageRef: imageRef ?? null,
      statusColor: statusColor ?? null,
      user: {
        connect: { id: userId }
      }
    };

    if (id) {
      data.id = id;
    }

    if (location !== undefined) {
      data.location = toJsonInput(location);
    }

    if (preferences) {
      data.preferences = {
        create: {
          lastKind: mapActivityKindFromApi(preferences.lastKind) ?? null,
          lastUnit: mapUnitFromApi(preferences.lastUnit) ?? null,
          lastQty: preferences.lastQty ?? null,
          lastN: preferences.lastN ?? null,
          lastP: preferences.lastP ?? null,
          lastK: preferences.lastK ?? null,
          reminderWater: preferences.reminderWater ?? null,
          reminderFertil: preferences.reminderFertil ?? null,
          enableReminders: preferences.enableReminders ?? true,
          history: {
            create: {
              lastKind: mapActivityKindFromApi(preferences.lastKind) ?? null,
              lastUnit: mapUnitFromApi(preferences.lastUnit) ?? null,
              lastQty: preferences.lastQty ?? null,
              lastN: preferences.lastN ?? null,
              lastP: preferences.lastP ?? null,
              lastK: preferences.lastK ?? null,
              reminderWater: preferences.reminderWater ?? null,
              reminderFertil: preferences.reminderFertil ?? null,
              enableReminders: preferences.enableReminders ?? true
            }
          }
        }
      };
    }

    const result = await prisma.plant.create({
      data,
      include: { preferences: true }
    });

    return serializePlant(result);
  } catch (error) {
    throw new HttpError(400, {
      code: 'plants/create-failed',
      message: 'Unable to create plant'
    });
  }
}

export async function updatePlant(id: string, userId: string, payload: UpdatePlantInput) {
  const plant = await prisma.plant.findFirst({
    where: { id, userId, deletedAt: null },
    include: { preferences: true }
  });

  if (!plant) {
    throw new HttpError(404, {
      code: 'plants/not-found',
      message: 'Plant not found'
    });
  }

  const data: Prisma.PlantUpdateInput = {};

  if (payload.nickname !== undefined) data.nickname = { set: payload.nickname };
  if (payload.scientificName !== undefined) data.scientificName = { set: payload.scientificName };
  if (payload.status !== undefined) data.status = { set: payload.status as PlantStatus };
  if (payload.imageRef !== undefined) data.imageRef = { set: payload.imageRef };
  if (payload.statusColor !== undefined) data.statusColor = { set: payload.statusColor };
  if (payload.location !== undefined) data.location = toJsonInput(payload.location);

  if (Object.keys(data).length === 0) {
    return serializePlant(plant as PlantWithPrefs);
  }

  const updated = await prisma.plant.update({
    where: { id },
    data,
    include: { preferences: true }
  });

  return serializePlant(updated);
}

export async function softDeletePlant(id: string, userId: string) {
  const plant = await prisma.plant.findFirst({ where: { id, userId, deletedAt: null } });

  if (!plant) {
    throw new HttpError(404, {
      code: 'plants/not-found',
      message: 'Plant not found'
    });
  }

  await prisma.plant.update({
    where: { id },
    data: { deletedAt: new Date() }
  });

  return { success: true };
}

export async function upsertPreferences(plantId: string, userId: string, payload: UpsertPreferenceInput) {
  const plant = await prisma.plant.findFirst({ where: { id: plantId, userId, deletedAt: null } });

  if (!plant) {
    throw new HttpError(404, {
      code: 'plants/not-found',
      message: 'Plant not found'
    });
  }

  const prefs = await prisma.plantPreference.upsert({
    where: { plantId },
    update: {
      lastKind: mapActivityKindFromApi(payload.lastKind) ?? undefined,
      lastUnit: mapUnitFromApi(payload.lastUnit) ?? undefined,
      lastQty: payload.lastQty ?? undefined,
      lastN: payload.lastN ?? undefined,
      lastP: payload.lastP ?? undefined,
      lastK: payload.lastK ?? undefined,
      reminderWater: payload.reminderWater ?? undefined,
      reminderFertil: payload.reminderFertil ?? undefined,
      enableReminders: payload.enableReminders ?? undefined,
      history: {
        create: {
          lastKind: mapActivityKindFromApi(payload.lastKind) ?? null,
          lastUnit: mapUnitFromApi(payload.lastUnit) ?? null,
          lastQty: payload.lastQty ?? null,
          lastN: payload.lastN ?? null,
          lastP: payload.lastP ?? null,
          lastK: payload.lastK ?? null,
          reminderWater: payload.reminderWater ?? null,
          reminderFertil: payload.reminderFertil ?? null,
          enableReminders: payload.enableReminders ?? true
        }
      }
    },
    create: {
      plantId,
      lastKind: mapActivityKindFromApi(payload.lastKind) ?? null,
      lastUnit: mapUnitFromApi(payload.lastUnit) ?? null,
      lastQty: payload.lastQty ?? null,
      lastN: payload.lastN ?? null,
      lastP: payload.lastP ?? null,
      lastK: payload.lastK ?? null,
      reminderWater: payload.reminderWater ?? null,
      reminderFertil: payload.reminderFertil ?? null,
      enableReminders: payload.enableReminders ?? true,
      history: {
        create: {
          lastKind: mapActivityKindFromApi(payload.lastKind) ?? null,
          lastUnit: mapUnitFromApi(payload.lastUnit) ?? null,
          lastQty: payload.lastQty ?? null,
          lastN: payload.lastN ?? null,
          lastP: payload.lastP ?? null,
          lastK: payload.lastK ?? null,
          reminderWater: payload.reminderWater ?? null,
          reminderFertil: payload.reminderFertil ?? null,
          enableReminders: payload.enableReminders ?? true
        }
      }
    }
  });

  return serializePreference(prefs);
}

export async function getPreferenceHistory(plantId: string, userId: string) {
  const plant = await prisma.plant.findFirst({ where: { id: plantId, userId, deletedAt: null } });

  if (!plant) {
    throw new HttpError(404, {
      code: 'plants/not-found',
      message: 'Plant not found'
    });
  }

  const history = await prisma.plantPreferenceHistory.findMany({
    where: { plantPref: { plantId } },
    orderBy: { recordedAt: 'desc' },
    take: 20
  });

  return serializePrefHistory(history);
}
