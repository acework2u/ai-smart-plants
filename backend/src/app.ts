import express, { Request, Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import pinoHttp from 'pino-http';

import { env } from '@config/env';
import logger from '@utils/logger';
import router from '@routes/index';
import { generalRateLimit } from '@middleware/rateLimiter';
import { requestContext } from '@middleware/requestContext';
import { errorHandler, notFoundHandler } from '@middleware/errorHandler';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(requestContext);

// Apply general rate limiting to all routes
app.use(generalRateLimit);
app.use(
  pinoHttp({
    logger,
    customLogLevel(_req, res, err) {
      if (res.statusCode >= 500 || err) return 'error';
      if (res.statusCode >= 400) return 'warn';
      return 'info';
    },
    customSuccessObject(req, res) {
      return {
        traceId: req.traceId,
        statusCode: res.statusCode,
        method: req.method,
        url: req.originalUrl
      };
    }
  })
);

app.get('/v1/health', (_req: Request, res: Response) => {
  res.json({
    data: {
      status: 'ok',
      service: env.APP_NAME,
      version: process.env.npm_package_version
    },
    meta: { traceId: res.req.traceId ?? null, degraded: false },
    errors: []
  });
});

app.use('/v1', router);
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
