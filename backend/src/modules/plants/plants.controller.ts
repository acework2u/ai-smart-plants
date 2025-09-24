import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';

import {
  createPlantSchema,
  getPlantsQuerySchema,
  updatePlantSchema,
  upsertPreferenceSchema
} from './plants.schemas';
import {
  createPlant,
  getPlant,
  listPlants,
  softDeletePlant,
  updatePlant,
  upsertPreferences,
  getPreferenceHistory
} from './plants.service';
import { success } from '@utils/response';
import { HttpError } from '@middleware/errorHandler';

const router = Router();

// TODO: replace with real auth middleware once implemented
const RequireUser = (req: Request, _res: Response, next: NextFunction) => {
  const userId = req.headers['x-user-id'] as string | undefined;
  if (!userId) {
    return next(
      new HttpError(401, {
        code: 'auth/not-authenticated',
        message: 'Missing user context. Provide X-User-Id header for now.'
      })
    );
  }
  req.user = { id: userId };
  next();
};

router.use(RequireUser);

router.get('/', async (req, res, next) => {
  try {
    const query = getPlantsQuerySchema.parse(req.query);
    const userId = (req.user as { id: string }).id;

    const result = await listPlants(query, userId);
    res.json(
      success(result, {
        traceId: req.traceId ?? null,
        api_version: req.apiVersion ?? 'v1'
      })
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(
        new HttpError(400, {
          code: 'plants/invalid-query',
          message: 'Invalid query parameters',
          meta: { issues: error.flatten() }
        })
      );
    }
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const body = createPlantSchema.parse(req.body);
    const userId = (req.user as { id: string }).id;
    const result = await createPlant({ ...body, userId });
    res.status(201).json(
      success(result, {
        traceId: req.traceId ?? null,
        api_version: req.apiVersion ?? 'v1'
      })
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(
        new HttpError(400, {
          code: 'plants/invalid-payload',
          message: 'Invalid plant payload',
          meta: { issues: error.flatten() }
        })
      );
    }
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const userId = (req.user as { id: string }).id;
    const plant = await getPlant(req.params.id, userId);
    res.json(
      success(plant, {
        traceId: req.traceId ?? null,
        api_version: req.apiVersion ?? 'v1'
      })
    );
  } catch (error) {
    next(error);
  }
});

router.patch('/:id', async (req, res, next) => {
  try {
    const body = updatePlantSchema.parse(req.body);
    const userId = (req.user as { id: string }).id;
    const plant = await updatePlant(req.params.id, userId, body);
    res.json(
      success(plant, {
        traceId: req.traceId ?? null,
        api_version: req.apiVersion ?? 'v1'
      })
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(
        new HttpError(400, {
          code: 'plants/invalid-payload',
          message: 'Invalid plant payload',
          meta: { issues: error.flatten() }
        })
      );
    }
    next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const userId = (req.user as { id: string }).id;
    await softDeletePlant(req.params.id, userId);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

router.put('/:id/preferences', async (req, res, next) => {
  try {
    const body = upsertPreferenceSchema.parse(req.body);
    const userId = (req.user as { id: string }).id;
    const prefs = await upsertPreferences(req.params.id, userId, body);
    res.json(
      success(prefs, {
        traceId: req.traceId ?? null,
        api_version: req.apiVersion ?? 'v1'
      })
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(
        new HttpError(400, {
          code: 'plants/invalid-preferences',
          message: 'Invalid preference payload',
          meta: { issues: error.flatten() }
        })
      );
    }
    next(error);
  }
});

router.get('/:id/preferences/history', async (req, res, next) => {
  try {
    const userId = (req.user as { id: string }).id;
    const history = await getPreferenceHistory(req.params.id, userId);
    res.json(
      success(history, {
        traceId: req.traceId ?? null,
        api_version: req.apiVersion ?? 'v1'
      })
    );
  } catch (error) {
    next(error);
  }
});

export const plantsRouter = router;
