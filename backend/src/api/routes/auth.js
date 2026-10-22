import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { loginBody, registerBody } from '../schemas.js';

export function authRoutes({ authService }, { authLimiter }) {
  const router = Router();

  router.post('/register', authLimiter, validate({ body: registerBody }), async (req, res) => {
    const result = await authService.register(req.valid.body);
    res.status(201).json(result);
  });

  router.post('/login', authLimiter, validate({ body: loginBody }), async (req, res) => {
    res.json(await authService.login(req.valid.body));
  });

  router.get('/me', requireAuth(authService), (req, res) => {
    res.json({ user: req.user });
  });

  return router;
}
