import 'dotenv/config';
import crypto from 'node:crypto';

const env = process.env;
const isProd = env.NODE_ENV === 'production';

function resolveJwtSecret() {
  const secret = (env.JWT_SECRET || '').trim();
  if (secret.length >= 32) return secret;
  if (isProd) {
    throw new Error('JWT_SECRET debe tener al menos 32 caracteres. Ejecuta "npm run setup" para generarlo.');
  }
  console.warn(
    '[config] JWT_SECRET no esta definido (o es muy corto). Se usa un secreto temporal: las sesiones se cierran al reiniciar. Ejecuta "npm run setup" para generar uno.'
  );
  return crypto.randomBytes(32).toString('hex');
}

const anthropicApiKey = (env.ANTHROPIC_API_KEY || '').trim();

export const config = {
  isProd,
  port: Number.parseInt(env.PORT || '4000', 10),
  databasePath: env.DATABASE_PATH || 'rumbo.db',
  jwtSecret: resolveJwtSecret(),
  sessionTtl: '1d',
  rememberTtl: '30d',
  corsOrigins: (env.CORS_ORIGINS || 'http://localhost:5173,http://127.0.0.1:5173')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean),
  anthropicApiKey,
  claudeModel: env.CLAUDE_MODEL || 'claude-sonnet-5-5',
  // Sin clave de IA, los servicios responden con datos de ejemplo (modo demo).
  demoMode: !anthropicApiKey,
  maxImageBytes: 5 * 1024 * 1024,
  rateLimit: true,
};
