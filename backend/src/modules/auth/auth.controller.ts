import { Router } from 'express';
import { z } from 'zod';

import { registerSchema, loginSchema } from './auth.schemas';
import { loginUser, registerUser } from './auth.service';
import { success } from '@utils/response';
import { HttpError } from '@middleware/errorHandler';

const router = Router();

router.post('/register', async (req, res, next) => {
  try {
    const body = registerSchema.parse(req.body);
    const result = await registerUser(body);
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
          code: 'auth/invalid-payload',
          message: 'ข้อมูลสมัครสมาชิกไม่ถูกต้อง',
          meta: { issues: error.flatten() }
        })
      );
    }
    next(error);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const body = loginSchema.parse(req.body);
    const result = await loginUser(body);
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
          code: 'auth/invalid-payload',
          message: 'ข้อมูลเข้าสู่ระบบไม่ถูกต้อง',
          meta: { issues: error.flatten() }
        })
      );
    }
    next(error);
  }
});

export const authRouter = router;
