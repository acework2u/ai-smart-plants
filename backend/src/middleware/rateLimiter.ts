import { NextFunction, Request, Response } from 'express';

interface RateWindow {
  count: number;
  expiresAt: number;
}

const RATE_LIMIT = 120; // requests
const WINDOW_MS = 60_000; // per minute

const buckets = new Map<string, RateWindow>();

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
      meta: { degraded: false, retryAfter },
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
};
