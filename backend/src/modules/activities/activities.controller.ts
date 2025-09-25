import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';

import {
  createActivitySchema,
  updateActivitySchema,
  listActivitiesQuerySchema
} from './activities.schemas';
import {
  listActivities,
  createActivity,
  updateActivity,
  deleteActivity,
  getActivity
} from './activities.service';
import { success } from '@utils/response';
import { HttpError } from '@middleware/errorHandler';
import { requireAuth } from '@middleware/auth';

const router = Router({ mergeParams: true });

router.use(requireAuth());

const getPlantParam = (req: Request, res: Response, next: NextFunction) => {
  const { plantId } = req.params;
  if (!plantId) {
    return next(
      new HttpError(400, {
        code: 'activities/missing-plant-id',
        message: 'ต้องระบุ plantId ในเส้นทาง'
      })
    );
  }
  res.locals.plantId = plantId;
  next();
};

router.use(getPlantParam);

router.get('/', async (req, res, next) => {
  try {
    if (!req.user?.scopes?.includes('activities.read')) {
      throw new HttpError(403, {
        code: 'auth/insufficient-scope',
        message: 'ต้องการ scope activities.read'
      });
    }
    const query = listActivitiesQuerySchema.parse(req.query);
    const userId = (req.user as { id: string }).id;
    const plantId = res.locals.plantId as string;

    const result = await listActivities(plantId, userId, query);
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
          code: 'activities/invalid-query',
          message: 'พารามิเตอร์ค้นหาไม่ถูกต้อง',
          meta: { issues: error.flatten() }
        })
      );
    }
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    if (!req.user?.scopes?.includes('activities.write')) {
      throw new HttpError(403, {
        code: 'auth/insufficient-scope',
        message: 'ต้องการ scope activities.write'
      });
    }
    const body = createActivitySchema.parse(req.body);
    const userId = (req.user as { id: string }).id;
    const plantId = res.locals.plantId as string;

    const activity = await createActivity(plantId, userId, body);
    res.status(201).json(
      success(activity, {
        traceId: req.traceId ?? null,
        api_version: req.apiVersion ?? 'v1'
      })
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(
        new HttpError(400, {
          code: 'activities/invalid-payload',
          message: 'ข้อมูลกิจกรรมไม่ถูกต้อง',
          meta: { issues: error.flatten() }
        })
      );
    }
    next(error);
  }
});

router.get('/:activityId', async (req, res, next) => {
  try {
    if (!req.user?.scopes?.includes('activities.read')) {
      throw new HttpError(403, {
        code: 'auth/insufficient-scope',
        message: 'ต้องการ scope activities.read'
      });
    }
    const userId = (req.user as { id: string }).id;
    const plantId = res.locals.plantId as string;
    const activity = await getActivity(plantId, req.params.activityId, userId);
    res.json(
      success(activity, {
        traceId: req.traceId ?? null,
        api_version: req.apiVersion ?? 'v1'
      })
    );
  } catch (error) {
    next(error);
  }
});

router.patch('/:activityId', async (req, res, next) => {
  try {
    if (!req.user?.scopes?.includes('activities.write')) {
      throw new HttpError(403, {
        code: 'auth/insufficient-scope',
        message: 'ต้องการ scope activities.write'
      });
    }
    const body = updateActivitySchema.parse(req.body);
    const userId = (req.user as { id: string }).id;
    const plantId = res.locals.plantId as string;

    const activity = await updateActivity(plantId, req.params.activityId, userId, body);
    res.json(
      success(activity, {
        traceId: req.traceId ?? null,
        api_version: req.apiVersion ?? 'v1'
      })
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(
        new HttpError(400, {
          code: 'activities/invalid-payload',
          message: 'ข้อมูลกิจกรรมไม่ถูกต้อง',
          meta: { issues: error.flatten() }
        })
      );
    }
    next(error);
  }
});

router.delete('/:activityId', async (req, res, next) => {
  try {
    if (!req.user?.scopes?.includes('activities.write')) {
      throw new HttpError(403, {
        code: 'auth/insufficient-scope',
        message: 'ต้องการ scope activities.write'
      });
    }
    const userId = (req.user as { id: string }).id;
    const plantId = res.locals.plantId as string;
    await deleteActivity(plantId, req.params.activityId, userId);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export const activitiesRouter = router;
