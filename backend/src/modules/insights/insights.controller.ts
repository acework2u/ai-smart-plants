import { Router } from 'express';
import { z } from 'zod';

import { summaryQuerySchema, trendsQuerySchema } from './insights.schemas';
import { getSummaryInsights, getTrendInsights } from './insights.service';
import { success } from '@utils/response';
import { HttpError } from '@middleware/errorHandler';
import { requireAuth } from '@middleware/auth';

const router = Router();

router.use(requireAuth());

router.get('/summary', async (req, res, next) => {
  try {
    const query = summaryQuerySchema.parse(req.query);
    const userId = (req.user as { id: string }).id;
    if (!req.user?.scopes?.includes('insights.read')) {
      throw new HttpError(403, {
        code: 'auth/insufficient-scope',
        message: 'ต้องการ scope insights.read'
      });
    }

    const result = await getSummaryInsights(userId, query);
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
          code: 'insights/invalid-query',
          message: 'พารามิเตอร์ค้นหาไม่ถูกต้อง',
          meta: { issues: error.flatten() }
        })
      );
    }
    next(error);
  }
});

router.get('/trends', async (req, res, next) => {
  try {
    const query = trendsQuerySchema.parse(req.query);
    const userId = (req.user as { id: string }).id;
    if (!req.user?.scopes?.includes('insights.read')) {
      throw new HttpError(403, {
        code: 'auth/insufficient-scope',
        message: 'ต้องการ scope insights.read'
      });
    }

    const result = await getTrendInsights(userId, query);
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
          code: 'insights/invalid-query',
          message: 'พารามิเตอร์ค้นหาไม่ถูกต้อง',
          meta: { issues: error.flatten() }
        })
      );
    }
    next(error);
  }
});

export const insightsRouter = router;
