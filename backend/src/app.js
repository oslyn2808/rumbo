// API: construye la aplicacion Express 5 con todas sus dependencias ya creadas (facil de probar).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { errorHandler, notFound } from './api/middleware/errors.js';
import { authRoutes } from './api/routes/auth.js';
import { destinationRoutes } from './api/routes/destinations.js';
import { monumentRoutes } from './api/routes/monuments.js';
import { tripRoutes } from './api/routes/trips.js';

const FRONTEND_DIST = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../frontend/dist');

export function createApp({ services, config }) {
  const app = express();
  app.disable('x-powered-by');

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          ...helmet.contentSecurityPolicy.getDefaultDirectives(),
          'img-src': ["'self'", 'data:', 'blob:'],
        },
      },
    })
  );
  app.use(cors({ origin: config.corsOrigins }));
  app.use(express.json({ limit: '100kb' }));

  const limiter = (windowMs, limit, message) =>
    config.rateLimit
      ? rateLimit({
          windowMs,
          limit,
          standardHeaders: true,
          legacyHeaders: false,
          message: { message, code: 'rate_limited' },
        })
      : (_req, _res, next) => next();

  const limiters = {
    authLimiter: limiter(15 * 60 * 1000, 30, 'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.'),
    aiLimiter: limiter(60 * 1000, 10, 'Vas muy rápido. Espera un momento e inténtalo de nuevo.'),
  };
  app.use('/api', limiter(60 * 1000, 300, 'Demasiadas solicitudes. Espera un momento.'));

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', demoMode: config.demoMode });
  });
  app.use('/api/auth', authRoutes(services, limiters));
  app.use('/api/destinations', destinationRoutes(services));
  app.use('/api/trips', tripRoutes(services, limiters));
  app.use('/api/monuments', monumentRoutes(services, limiters, config));
  app.use('/api', notFound);

  // Si el frontend ya fue compilado (npm run build), este mismo servidor lo entrega.
  if (fs.existsSync(path.join(FRONTEND_DIST, 'index.html'))) {
    app.use(express.static(FRONTEND_DIST));
    app.use((req, res, next) => {
      if (req.method !== 'GET') return next();
      res.sendFile(path.join(FRONTEND_DIST, 'index.html'));
    });
  }

  app.use(errorHandler);
  return app;
}
