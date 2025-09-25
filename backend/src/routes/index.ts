import { Router } from 'express';

import { apiSpecRouter } from './spec';
import { activitiesRouter } from '@modules/activities/activities.controller';
import { analysesRouter } from '@modules/analyses/analyses.controller';
import { notificationsRouter } from '@modules/notifications/notifications.controller';
import { insightsRouter } from '@modules/insights/insights.controller';
import { authRouter } from '@modules/auth/auth.controller';
import { plantsRouter } from '@modules/plants/plants.controller';
import { versionMiddleware, getVersionInfo, getAllVersionsInfo } from '../middleware/versionMiddleware';

const router = Router();

// Apply version middleware to all routes
router.use(versionMiddleware);

// Version info endpoints
router.get('/versions', getAllVersionsInfo);
router.get('/versions/:version', getVersionInfo);

router.use('/docs', apiSpecRouter);
router.use('/auth', authRouter);
router.use('/analyses', analysesRouter);
router.use('/notifications', notificationsRouter);
router.use('/insights', insightsRouter);
router.use('/plants/:plantId/activities', activitiesRouter);
router.use('/plants', plantsRouter);

router.get('/', (req, res) => {
  const apiVersion = req.apiVersion;
  res.json({
    data: {
      message: 'Smart Plant AI backend',
      version: apiVersion,
      endpoints: ['/v1/health', '/v1/docs', '/v1/versions']
    },
    meta: {
      traceId: req.traceId ?? null,
      degraded: false,
      api_version: apiVersion
    },
    errors: []
  });
});

export default router;
