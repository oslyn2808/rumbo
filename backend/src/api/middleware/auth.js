// API: exige una sesion valida (Authorization: Bearer <token>).
import { HttpError } from '../../services/errors.js';

export function requireAuth(authService) {
  return (req, _res, next) => {
    const header = req.get('authorization') ?? '';
    const [scheme, token] = header.split(' ');
    const user = scheme === 'Bearer' && token ? authService.verify(token) : null;
    if (!user) throw new HttpError(401, 'Tu sesión expiró. Inicia sesión de nuevo.', { code: 'unauthorized' });
    req.user = user;
    next();
  };
}
