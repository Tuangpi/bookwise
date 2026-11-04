import { Router } from 'express';
import { validate } from '../../shared/middleware/validate';
import { authenticate } from '../../shared/middleware/auth';
import { registerSchema, loginSchema, refreshSchema } from './auth.schema';
import * as c from './auth.controller';

export const authRouter = Router();

authRouter.post('/register', validate(registerSchema), c.register);
authRouter.post('/login', validate(loginSchema), c.login);
authRouter.post('/refresh', validate(refreshSchema), c.refresh);
authRouter.post('/logout', validate(refreshSchema), c.logout);
authRouter.get('/me', authenticate, c.me);
