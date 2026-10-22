import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { generateBody, idParam, regenerateBody, saveTripBody } from '../schemas.js';

export function tripRoutes({ tripService, authService }, { aiLimiter }) {
  const router = Router();
  router.use(requireAuth(authService));

  router.post('/generate', aiLimiter, validate({ body: generateBody }), async (req, res) => {
    res.json(await tripService.generate(req.valid.body));
  });

  router.post('/regenerate-day', aiLimiter, validate({ body: regenerateBody }), async (req, res) => {
    const { request, plan, day, instruction } = req.valid.body;
    res.json(await tripService.regenerateDay(request, plan, day, instruction));
  });

  router.post('/', validate({ body: saveTripBody }), (req, res) => {
    const { request, plan } = req.valid.body;
    res.status(201).json({ id: tripService.save(req.user.id, request, plan) });
  });

  router.get('/', (req, res) => {
    res.json(tripService.list(req.user.id));
  });

  router.get('/:id', validate({ params: idParam }), (req, res) => {
    res.json(tripService.get(req.user.id, req.valid.params.id));
  });

  router.delete('/:id', validate({ params: idParam }), (req, res) => {
    tripService.remove(req.user.id, req.valid.params.id);
    res.status(204).end();
  });

  return router;
}
