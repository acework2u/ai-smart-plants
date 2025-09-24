import { NextFunction, Request, Response } from 'express';
import logger from '@utils/logger';

interface ErrorShape {
  code: string;
  message: string;
  field?: string;
  hint?: string;
  meta?: Record<string, unknown>;
}

export class HttpError extends Error {
  statusCode: number;
  error: ErrorShape;

  constructor(statusCode: number, error: ErrorShape) {
    super(error.message);
    this.statusCode = statusCode;
    this.error = error;
  }
}

const formatError = (err: unknown): HttpError => {
  if (err instanceof HttpError) {
    return err;
  }

  if (err instanceof Error) {
    return new HttpError(500, {
      code: 'internal/server-error',
      message: err.message || 'Unexpected error occurred'
    });
  }

  return new HttpError(500, {
    code: 'internal/server-error',
    message: 'Unexpected error occurred'
  });
};

export const notFoundHandler = (req: Request, res: Response) => {
  const traceId = req.traceId ?? null;
  res.status(404).json({
    data: null,
    meta: { traceId, degraded: false },
    errors: [
      {
        code: 'common/not-found',
        message: 'Resource not found'
      }
    ]
  });
};

export const errorHandler = (err: unknown, req: Request, res: Response, _next: NextFunction) => {
  const httpError = formatError(err);
  const traceId = req.traceId ?? null;

  logger.error({ err: httpError, traceId }, 'Request failed');

  res.status(httpError.statusCode).json({
    data: null,
    meta: {
      traceId,
      degraded: httpError.statusCode >= 500
    },
    errors: [httpError.error]
  });
};
