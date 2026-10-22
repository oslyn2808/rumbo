import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { destinationIdParam, destinationsQuery } from '../schemas.js';

export function destinationRoutes({ destinationService, weatherService }) {
  const router = Router();

  router.get('/', validate({ query: destinationsQuery }), (req, res) => {
    const items = destinationService.list(req.valid.query);
    res.json({ items, total: destinationService.total() });
  });

  router.get('/featured-route', (_req, res) => {
    res.json(destinationService.featuredRoute());
  });

  router.get('/:id', validate({ params: destinationIdParam }), (req, res) => {
    res.json(destinationService.get(req.valid.params.id));
  });

  router.get('/:id/weather', validate({ params: destinationIdParam }), async (req, res) => {
    const destination = destinationService.get(req.valid.params.id);
    res.json(await weatherService.forDestination(destination));
  });

  return router;
}
