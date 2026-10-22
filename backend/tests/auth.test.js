import assert from 'node:assert/strict';
import { test } from 'node:test';
import jwt from 'jsonwebtoken';
import { baseConfig, bearer, makeApp, signUp } from './helpers.js';

test('health responde y avisa del modo demo', async () => {
  const api = makeApp();
  const res = await api.request().get('/api/health');
  assert.equal(res.status, 200);
  assert.equal(res.body.demoMode, true);
});

test('registro valida los campos y devuelve mensajes por campo', async () => {
  const api = makeApp();
  const res = await api.request().post('/api/auth/register').send({ name: 'A', email: 'no-es-correo', password: '123' });
  assert.equal(res.status, 400);
  assert.ok(res.body.fields.name);
  assert.ok(res.body.fields.email);
  assert.ok(res.body.fields.password);
});

test('registro crea la cuenta, normaliza el correo y no expone el hash', async () => {
  const api = makeApp();
  const { res } = await signUp(api, { email: '  ANA@Example.com ' });
  assert.equal(res.status, 201);
  assert.equal(res.body.user.email, 'ana@example.com');
  assert.ok(res.body.token);
  assert.equal(JSON.stringify(res.body).includes('password'), false);
});

test('registro rechaza un correo repetido', async () => {
  const api = makeApp();
  const { body } = await signUp(api, { email: 'repetido@example.com' });
  const again = await api.request().post('/api/auth/register').send(body);
  assert.equal(again.status, 409);
  assert.equal(again.body.code, 'email_taken');
});

test('login correcto e incorrecto usan el mismo mensaje generico', async () => {
  const api = makeApp();
  const { body } = await signUp(api);
  const ok = await api.request().post('/api/auth/login').send({ email: body.email, password: body.password });
  assert.equal(ok.status, 200);
  assert.ok(ok.body.token);

  const badPass = await api.request().post('/api/auth/login').send({ email: body.email, password: 'otra-clave-123' });
  const noUser = await api.request().post('/api/auth/login').send({ email: 'nadie@example.com', password: 'otra-clave-123' });
  assert.equal(badPass.status, 401);
  assert.equal(noUser.status, 401);
  assert.equal(badPass.body.message, noUser.body.message);
});

test('mantener sesion alarga la vida del token', async () => {
  const api = makeApp();
  const { body } = await signUp(api);
  const short = await api.request().post('/api/auth/login').send({ email: body.email, password: body.password });
  const long = await api
    .request()
    .post('/api/auth/login')
    .send({ email: body.email, password: body.password, remember: true });
  const ttl = (t) => {
    const p = jwt.decode(t);
    return p.exp - p.iat;
  };
  assert.equal(ttl(short.body.token), 86400);
  assert.equal(ttl(long.body.token), 30 * 86400);
});

test('/me exige un token valido', async () => {
  const api = makeApp();
  const { token, user } = await signUp(api);
  assert.equal((await api.request().get('/api/auth/me')).status, 401);
  assert.equal((await api.request().get('/api/auth/me').set(bearer('basura'))).status, 401);

  const forged = jwt.sign({ sub: String(user.id) }, 'otro-secreto-otro-secreto-otro-secreto');
  assert.equal((await api.request().get('/api/auth/me').set(bearer(forged))).status, 401);

  const noneAlg = `${Buffer.from('{"alg":"none","typ":"JWT"}').toString('base64url')}.${Buffer.from(
    JSON.stringify({ sub: String(user.id) })
  ).toString('base64url')}.`;
  assert.equal((await api.request().get('/api/auth/me').set(bearer(noneAlg))).status, 401);

  const me = await api.request().get('/api/auth/me').set(bearer(token));
  assert.equal(me.status, 200);
  assert.equal(me.body.user.id, user.id);
});

test('JSON invalido da 400 y rutas desconocidas dan 404 en JSON', async () => {
  const api = makeApp();
  const bad = await api.request().post('/api/auth/login').set('Content-Type', 'application/json').send('{no-json');
  assert.equal(bad.status, 400);
  const missing = await api.request().get('/api/nada');
  assert.equal(missing.status, 404);
  assert.equal(missing.body.code, 'not_found');
});

test('el limitador de intentos bloquea tras muchos logins', async () => {
  const api = makeApp({ config: { ...baseConfig, rateLimit: true } });
  let last;
  for (let i = 0; i < 31; i += 1) {
    last = await api.request().post('/api/auth/login').send({ email: 'x@example.com', password: 'abc' });
  }
  assert.equal(last.status, 429);
});
