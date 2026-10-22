import request from 'supertest';
import { createApp } from '../src/app.js';
import { buildServices } from '../src/container.js';
import { openDatabase } from '../src/data/database.js';

export const PNG = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  Buffer.from('fake-png-body-bytes'),
]);

export const baseConfig = {
  jwtSecret: 'test-secret-test-secret-test-secret-123456',
  sessionTtl: '1d',
  rememberTtl: '30d',
  corsOrigins: ['http://localhost:5173'],
  demoMode: true,
  maxImageBytes: 1024 * 1024,
  rateLimit: false,
};

export const DEMO_AI = { demo: true };

export function fakeAi(handlers = {}) {
  const calls = [];
  return {
    demo: false,
    calls,
    async askJson(args) {
      calls.push({ kind: 'json', ...args });
      return handlers.askJson(args);
    },
    async askJsonWithImage(args) {
      calls.push({ kind: 'image', ...args });
      return handlers.askJsonWithImage(args);
    },
  };
}

export function makeApp({ ai = DEMO_AI, fetchFn, config = {} } = {}) {
  const cfg = { ...baseConfig, ...config };
  const db = openDatabase(':memory:');
  const services = buildServices({ db, config: cfg, ai, weatherOptions: fetchFn ? { fetchFn } : undefined });
  const app = createApp({ services, config: cfg });
  return { app, db, request: () => request(app) };
}

let counter = 0;
export async function signUp(api, overrides = {}) {
  counter += 1;
  const body = { name: 'Ana Prueba', email: `ana${counter}@example.com`, password: 'clave-segura-1', ...overrides };
  const res = await api.request().post('/api/auth/register').send(body);
  return { token: res.body.token, user: res.body.user, body, res };
}

export const bearer = (token) => ({ Authorization: `Bearer ${token}` });
