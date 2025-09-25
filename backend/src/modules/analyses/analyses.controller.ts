import { Router } from 'express';
import { z } from 'zod';

import {
  startAnalysisSchema,
  listAnalysesQuerySchema
} from './analyses.schemas';
import {
  startAnalysis,
  listAnalyses,
  getAnalysis,
  cancelAnalysis
} from './analyses.service';
import { success } from '@utils/response';
import { HttpError } from '@middleware/errorHandler';
import { requireAuth } from '@middleware/auth';

const router = Router();

router.use(requireAuth());

router.post('/', async (req, res, next) => {
  try {
    const body = startAnalysisSchema.parse(req.body);
    const userId = (req.user as { id: string }).id;
    if (!req.user?.scopes?.includes('analyses.write')) {
      throw new HttpError(403, {
        code: 'auth/insufficient-scope',
        message: 'ต้องการ scope analyses.write'
      });
    }

    const result = await startAnalysis(userId, body);
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
          code: 'analyses/invalid-payload',
          message: 'ข้อมูลการวิเคราะห์ไม่ถูกต้อง',
          meta: { issues: error.flatten() }
        })
      );
    }
    next(error);
  }
});

router.get('/', async (req, res, next) => {
  try {
    const query = listAnalysesQuerySchema.parse(req.query);
    const userId = (req.user as { id: string }).id;
    if (!req.user?.scopes?.includes('analyses.read')) {
      throw new HttpError(403, {
        code: 'auth/insufficient-scope',
        message: 'ต้องการ scope analyses.read'
      });
    }

    const result = await listAnalyses(userId, query);
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
          code: 'analyses/invalid-query',
          message: 'พารามิเตอร์ค้นหาไม่ถูกต้อง',
          meta: { issues: error.flatten() }
        })
      );
    }
    next(error);
  }
});

router.get('/:analysisId', async (req, res, next) => {
  try {
    const userId = (req.user as { id: string }).id;
    if (!req.user?.scopes?.includes('analyses.read')) {
      throw new HttpError(403, {
        code: 'auth/insufficient-scope',
        message: 'ต้องการ scope analyses.read'
      });
    }
    const analysis = await getAnalysis(userId, req.params.analysisId);
    res.json(
      success(analysis, {
        traceId: req.traceId ?? null,
        api_version: req.apiVersion ?? 'v1'
      })
    );
  } catch (error) {
    next(error);
  }
});

router.post('/:analysisId/cancel', async (req, res, next) => {
  try {
    const userId = (req.user as { id: string }).id;
    if (!req.user?.scopes?.includes('analyses.write')) {
      throw new HttpError(403, {
        code: 'auth/insufficient-scope',
        message: 'ต้องการ scope analyses.write'
      });
    }
    const analysis = await cancelAnalysis(userId, req.params.analysisId);
    res.json(
      success(analysis, {
        traceId: req.traceId ?? null,
        api_version: req.apiVersion ?? 'v1'
      })
    );
  } catch (error) {
    next(error);
  }
});

export const analysesRouter = router;
