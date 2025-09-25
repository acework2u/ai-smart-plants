import { createRemoteJWKSet, jwtVerify, JWTPayload } from 'jose';
import { NextFunction, Request, Response } from 'express';

import { env } from '@config/env';
import { HttpError } from '@middleware/errorHandler';

interface AuthenticatedUser {
  id: string;
  scopes: string[];
  role?: string;
}

const jwks = env.AUTH_JWKS_URI ? createRemoteJWKSet(new URL(env.AUTH_JWKS_URI)) : null;
const AUDIENCE = env.AUTH_AUDIENCE.split(',').map((aud) => aud.trim()).filter(Boolean);
const localSecret = env.AUTH_TOKEN_SECRET ? new TextEncoder().encode(env.AUTH_TOKEN_SECRET) : null;
const DEV_DEFAULT_SCOPES = [
  'plants.read',
  'plants.write',
  'activities.read',
  'activities.write',
  'analyses.read',
  'analyses.write',
  'notifications.read',
  'notifications.write',
  'insights.read'
];

const mapScopes = (payload: JWTPayload): string[] => {
  const scope = payload.scope ?? payload.scp;
  if (!scope) return [];
  if (Array.isArray(scope)) return scope.map(String);
  return String(scope).split(' ').filter(Boolean);
};

const extractUserId = (payload: JWTPayload): string => {
  const sub = payload.sub;
  if (!sub) {
    throw new HttpError(401, {
      code: 'auth/missing-subject',
      message: 'Token missing subject'
    });
  }
  return sub;
};

export const verifyAccessToken = async (token: string): Promise<AuthenticatedUser> => {
  const verificationOptions = {
    issuer: env.AUTH_ISSUER,
    audience: AUDIENCE
  } as const;

  if (localSecret) {
    const { payload } = await jwtVerify(token, localSecret, verificationOptions);
    return {
      id: extractUserId(payload),
      scopes: mapScopes(payload),
      role: typeof payload.role === 'string' ? payload.role : undefined
    };
  }

  if (!jwks) {
    throw new HttpError(500, {
      code: 'auth/config-error',
      message: 'ไม่พบการตั้งค่ากุญแจสำหรับตรวจสอบ Token'
    });
  }

  const { payload } = await jwtVerify(token, jwks, verificationOptions);

  return {
    id: extractUserId(payload),
    scopes: mapScopes(payload),
    role: typeof payload.role === 'string' ? payload.role : undefined
  };
};

const getBearerToken = (req: Request): string | null => {
  const header = req.headers.authorization;
  if (!header) return null;
  const [scheme, token] = header.split(' ');
  if (scheme?.toLowerCase() !== 'bearer' || !token) {
    return null;
  }
  return token;
};

export const requireAuth = (requiredScopes: string[] = []) => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const token = getBearerToken(req);
      if (!token) {
        if (env.NODE_ENV === 'development') {
          const devUserId = req.headers['x-user-id'] as string | undefined;
          if (devUserId) {
            req.user = {
              id: devUserId,
              scopes: DEV_DEFAULT_SCOPES,
              role: 'developer'
            };

            const missingScope = requiredScopes.find((scope) => !req.user?.scopes?.includes(scope));
            if (missingScope) {
              throw new HttpError(403, {
                code: 'auth/insufficient-scope',
                message: `ต้องการ scope ${missingScope}`
              });
            }

            return next();
          }
        }
        throw new HttpError(401, {
          code: 'auth/missing-token',
          message: 'ต้องส่ง Bearer token ใน header Authorization'
        });
      }

      const user = await verifyAccessToken(token);
      const missingScope = requiredScopes.find((scope) => !user.scopes.includes(scope));
      if (missingScope) {
        throw new HttpError(403, {
          code: 'auth/insufficient-scope',
          message: `ต้องการ scope ${missingScope}`
        });
      }

      req.user = {
        id: user.id,
        scopes: user.scopes,
        role: user.role
      };

      next();
    } catch (error) {
      if (error instanceof HttpError) {
        return next(error);
      }

      next(
        new HttpError(401, {
          code: 'auth/invalid-token',
          message: error instanceof Error ? error.message : 'Invalid token'
        })
      );
    }
  };
};

export const optionalAuth = () => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const token = getBearerToken(req);
      if (!token) {
        if (env.NODE_ENV === 'development') {
          const devUserId = req.headers['x-user-id'] as string | undefined;
          if (devUserId) {
            req.user = {
              id: devUserId,
              scopes: DEV_DEFAULT_SCOPES,
              role: 'developer'
            };
          }
        }
        return next();
      }

      const user = await verifyAccessToken(token);
      req.user = {
        id: user.id,
        scopes: user.scopes,
        role: user.role
      };
      next();
    } catch (error) {
      next(
        new HttpError(401, {
          code: 'auth/invalid-token',
          message: error instanceof Error ? error.message : 'Invalid token'
        })
      );
    }
  };
};
