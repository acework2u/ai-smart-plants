import { Router } from 'express';
import { z } from 'zod';

import {
  listNotificationsQuerySchema,
  markReadSchema,
  subscribeSchema
} from './notifications.schemas';
import {
  listNotifications,
  markNotificationsRead,
  subscribeNotification,
  unsubscribeNotification,
  listSubscriptions
} from './notifications.service';
import { success } from '@utils/response';
import { HttpError } from '@middleware/errorHandler';
import { requireAuth } from '@middleware/auth';

const router = Router();

router.use(requireAuth());

router.get('/', async (req, res, next) => {
  try {
    const query = listNotificationsQuerySchema.parse(req.query);
    const userId = (req.user as { id: string }).id;
    if (!req.user?.scopes?.includes('notifications.read')) {
      throw new HttpError(403, {
        code: 'auth/insufficient-scope',
        message: 'ต้องการ scope notifications.read'
      });
    }

    const result = await listNotifications(userId, query);
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
          code: 'notifications/invalid-query',
          message: 'พารามิเตอร์ค้นหาไม่ถูกต้อง',
          meta: { issues: error.flatten() }
        })
      );
    }
    next(error);
  }
});

router.post('/mark-read', async (req, res, next) => {
  try {
    const body = markReadSchema.parse(req.body);
    const userId = (req.user as { id: string }).id;
    if (!req.user?.scopes?.includes('notifications.write')) {
      throw new HttpError(403, {
        code: 'auth/insufficient-scope',
        message: 'ต้องการ scope notifications.write'
      });
    }

    const result = await markNotificationsRead(userId, body);
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
          code: 'notifications/invalid-payload',
          message: 'ข้อมูลไม่ถูกต้อง',
          meta: { issues: error.flatten() }
        })
      );
    }
    next(error);
  }
});

router.get('/subscriptions', async (req, res, next) => {
  try {
    const userId = (req.user as { id: string }).id;
    if (!req.user?.scopes?.includes('notifications.read')) {
      throw new HttpError(403, {
        code: 'auth/insufficient-scope',
        message: 'ต้องการ scope notifications.read'
      });
    }
    const subscriptions = await listSubscriptions(userId);
    res.json(
      success({ nodes: subscriptions }, {
        traceId: req.traceId ?? null,
        api_version: req.apiVersion ?? 'v1'
      })
    );
  } catch (error) {
    next(error);
  }
});

router.post('/subscribe', async (req, res, next) => {
  try {
    const body = subscribeSchema.parse(req.body);
    const userId = (req.user as { id: string }).id;
    if (!req.user?.scopes?.includes('notifications.write')) {
      throw new HttpError(403, {
        code: 'auth/insufficient-scope',
        message: 'ต้องการ scope notifications.write'
      });
    }

    const subscription = await subscribeNotification(userId, body);
    res.status(201).json(
      success(subscription, {
        traceId: req.traceId ?? null,
        api_version: req.apiVersion ?? 'v1'
      })
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(
        new HttpError(400, {
          code: 'notifications/invalid-subscription',
          message: 'ข้อมูลสมัครรับแจ้งเตือนไม่ถูกต้อง',
          meta: { issues: error.flatten() }
        })
      );
    }
    next(error);
  }
});

router.delete('/subscribe/:subscriptionId', async (req, res, next) => {
  try {
    const userId = (req.user as { id: string }).id;
    if (!req.user?.scopes?.includes('notifications.write')) {
      throw new HttpError(403, {
        code: 'auth/insufficient-scope',
        message: 'ต้องการ scope notifications.write'
      });
    }
    await unsubscribeNotification(userId, req.params.subscriptionId);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export const notificationsRouter = router;
