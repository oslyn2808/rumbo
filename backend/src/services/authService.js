// LOGICA DE NEGOCIO: registro, inicio de sesion y verificacion de tokens.
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { HttpError } from './errors.js';

const BCRYPT_COST = 10;
// Hash falso: se compara igual cuando el correo no existe, para que el tiempo de respuesta
// no revele si una cuenta existe.
const DUMMY_HASH = bcrypt.hashSync('rumbo-dummy-password', BCRYPT_COST);

const publicUser = (u) => ({ id: u.id, name: u.name, email: u.email });

export function createAuthService({ users, config }) {
  const sign = (user, remember) =>
    jwt.sign({ sub: String(user.id) }, config.jwtSecret, {
      algorithm: 'HS256',
      expiresIn: remember ? config.rememberTtl : config.sessionTtl,
    });

  return {
    async register({ name, email, password, remember }) {
      if (users.findByEmail(email)) {
        throw new HttpError(409, 'Ese correo ya está registrado. Inicia sesión.', {
          code: 'email_taken',
          fields: { email: 'Ese correo ya está registrado.' },
        });
      }
      const passwordHash = await bcrypt.hash(password, BCRYPT_COST);
      let user;
      try {
        user = users.create({ name, email, passwordHash });
      } catch (err) {
        if (/UNIQUE constraint failed/.test(err?.message ?? '')) {
          throw new HttpError(409, 'Ese correo ya está registrado. Inicia sesión.', { code: 'email_taken' });
        }
        throw err;
      }
      return { user: publicUser(user), token: sign(user, remember) };
    },

    async login({ email, password, remember }) {
      const row = users.findByEmail(email);
      const ok = await bcrypt.compare(password, row?.password_hash ?? DUMMY_HASH);
      if (!row || !ok) {
        throw new HttpError(401, 'Correo o contraseña incorrectos.', { code: 'invalid_credentials' });
      }
      return { user: publicUser(row), token: sign(row, remember) };
    },

    verify(token) {
      try {
        const payload = jwt.verify(token, config.jwtSecret, { algorithms: ['HS256'] });
        const user = users.findById(Number(payload.sub));
        return user ? publicUser(user) : null;
      } catch {
        return null;
      }
    },
  };
}
