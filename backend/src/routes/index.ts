import { Router } from 'express';

import { apiSpecRouter } from './spec';
import { versionMiddleware, getVersionInfo, getAllVersionsInfo } from '../middleware/versionMiddleware';

const router = Router();

// Apply version middleware to all routes
router.use(versionMiddleware);

// Version info endpoints
router.get('/versions', getAllVersionsInfo);
router.get('/versions/:version', getVersionInfo);

router.use('/docs', apiSpecRouter);

router.get('/', (_req, res) => {
  const apiVersion = (res.req as typeof res.req & { apiVersion?: string }).apiVersion;
  res.json({
    data: {
      message: 'Smart Plant AI backend',
      version: apiVersion,
      endpoints: ['/v1/health', '/v1/docs', '/v1/versions']
    },
    meta: {
      traceId: res.req.headers['x-trace-id'] ?? null,
      degraded: false,
      api_version: apiVersion
    },
    errors: []
  });
});

export default router;
