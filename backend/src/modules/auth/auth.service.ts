import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';

import { prisma } from '@config/prisma';
import { env } from '@config/env';
import { HttpError } from '@middleware/errorHandler';
import type { LoginInput, RegisterInput } from './auth.schemas';

const DEFAULT_SCOPES = [
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

const signerKey = new TextEncoder().encode(env.AUTH_TOKEN_SECRET);
const ACCESS_TOKEN_TTL = env.AUTH_ACCESS_TOKEN_TTL;

const normalizeEmail = (email: string) => email.trim().toLowerCase();

export const hashPassword = async (password: string) => bcrypt.hash(password, 10);
export const verifyPassword = async (password: string, hash: string) => bcrypt.compare(password, hash);

const buildScopes = (role?: string) => {
  if (!role) return DEFAULT_SCOPES;
  if (role === 'viewer') return ['plants.read', 'activities.read', 'analyses.read', 'notifications.read', 'insights.read'];
  return DEFAULT_SCOPES;
};

export const issueAccessToken = async (
  userId: string,
  email: string,
  role?: string,
  scopes: string[] = DEFAULT_SCOPES
) => {
  const jwt = await new SignJWT({
    sub: userId,
    email,
    role,
    scope: scopes.join(' ')
  })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setIssuer(env.AUTH_ISSUER)
    .setAudience(env.AUTH_AUDIENCE.split(',').map((aud) => aud.trim()))
    .setIssuedAt()
    .setExpirationTime(`${ACCESS_TOKEN_TTL}s`)
    .sign(signerKey);

  return jwt;
};

export const registerUser = async (payload: RegisterInput) => {
  const email = normalizeEmail(payload.email);

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new HttpError(409, {
      code: 'auth/email-exists',
      message: 'อีเมลนี้ถูกใช้งานแล้ว'
    });
  }

  const passwordHash = await hashPassword(payload.password);

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      role: payload.role ?? 'owner'
    }
  });

  const scopes = buildScopes(user.role);
  const accessToken = await issueAccessToken(user.id, user.email, user.role, scopes);

  return {
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt
    },
    accessToken,
    tokenType: 'Bearer',
    expiresIn: ACCESS_TOKEN_TTL
  };
};

export const loginUser = async (payload: LoginInput) => {
  const email = normalizeEmail(payload.email);
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !user.passwordHash) {
    throw new HttpError(401, {
      code: 'auth/invalid-credentials',
      message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง'
    });
  }

  const isValid = await verifyPassword(payload.password, user.passwordHash);
  if (!isValid) {
    throw new HttpError(401, {
      code: 'auth/invalid-credentials',
      message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง'
    });
  }

  const scopes = buildScopes(user.role);
  const accessToken = await issueAccessToken(user.id, user.email, user.role, scopes);

  return {
    user: {
      id: user.id,
      email: user.email,
      role: user.role
    },
    accessToken,
    tokenType: 'Bearer',
    expiresIn: ACCESS_TOKEN_TTL
  };
};
