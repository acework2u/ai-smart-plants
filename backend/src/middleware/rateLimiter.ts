import { NextFunction, Request, Response } from 'express';

import { env } from '@config/env';

interface RateWindow {
  count: number;
  expiresAt: number;
}

const RATE_LIMIT = env.RATE_LIMIT_GENERAL_LIMIT;
const WINDOW_MS = env.RATE_LIMIT_GENERAL_WINDOW_MS;
const CLEANUP_INTERVAL_MS = Math.max(WINDOW_MS, 60_000);

const buckets = new Map<string, RateWindow>();
let lastCleanup = 0;

const getBucketKey = (req: Request): string => {
  const userId = (req as Request & { user?: { id?: string } }).user?.id;
  if (userId) {
    return `user:${userId}`;
  }
  return `ip:${req.ip}`;
};

export const generalRateLimit = (req: Request, res: Response, next: NextFunction) => {
  const key = getBucketKey(req);
  const now = Date.now();
  maybeCleanup(now);

  const existing = buckets.get(key);

  if (!existing || existing.expiresAt <= now) {
    buckets.set(key, { count: 1, expiresAt: now + WINDOW_MS });
    return next();
  }

  if (existing.count >= RATE_LIMIT) {
    const retryAfter = Math.max(0, Math.ceil((existing.expiresAt - now) / 1000));
    res.setHeader('Retry-After', retryAfter.toString());
    return res.status(429).json({
      data: null,
      meta: {
        degraded: false,
        retryAfter,
        traceId: (req as Request & { traceId?: string }).traceId ?? null,
        api_version: (req as Request & { apiVersion?: string }).apiVersion ?? null
      },
      errors: [
        {
          code: 'rate_limit/exceeded',
          message: 'Too many requests. Please try again later.'
        }
      ]
    });
  }

  existing.count += 1;
  buckets.set(key, existing);
  return next();
};

export const resetRateLimits = () => {
  buckets.clear();
  lastCleanup = 0;
};

const maybeCleanup = (now: number) => {
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) {
    return;
  }

  for (const [key, window] of buckets.entries()) {
    if (window.expiresAt <= now) {
      buckets.delete(key);
    }
  }

  lastCleanup = now;
};

export const __internal = {
  getBucketSize: () => buckets.size
};
