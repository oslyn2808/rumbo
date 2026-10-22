import { Router } from 'express';
import multer from 'multer';
import { HttpError } from '../../services/errors.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { identifyBody, idParam, saveMonumentBody } from '../schemas.js';

export function monumentRoutes({ monumentService, authService }, { aiLimiter }, config) {
  const router = Router();
  router.use(requireAuth(authService));

  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: config.maxImageBytes, files: 1, fields: 5 },
  }).single('photo');

  router.post('/identify', aiLimiter, upload, validate({ body: identifyBody }), async (req, res) => {
    if (!req.file) throw new HttpError(400, 'Falta la foto.', { code: 'missing_photo' });
    const { lat, lon, language } = req.valid.body;
    res.json(await monumentService.identify({ image: req.file.buffer, lat, lon, language }));
  });

  router.post('/', validate({ body: saveMonumentBody }), (req, res) => {
    const { name, location, info } = req.valid.body;
    res.status(201).json({ id: monumentService.save(req.user.id, { name, location, info }) });
  });

  router.get('/', (req, res) => {
    res.json(monumentService.list(req.user.id));
  });

  router.delete('/:id', validate({ params: idParam }), (req, res) => {
    monumentService.remove(req.user.id, req.valid.params.id);
    res.status(204).end();
  });

  return router;
}
