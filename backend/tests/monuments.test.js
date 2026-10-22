import assert from 'node:assert/strict';
import { test } from 'node:test';
import { PNG, bearer, fakeAi, makeApp, signUp } from './helpers.js';

const identify = (api, token, buf, name = 'foto.png', type = 'image/png', extra = {}) => {
  let r = api.request().post('/api/monuments/identify').set(bearer(token)).attach('photo', buf, { filename: name, contentType: type });
  for (const [k, v] of Object.entries(extra)) r = r.field(k, v);
  return r;
};

test('identificar exige sesion y foto', async () => {
  const api = makeApp();
  const { token } = await signUp(api);
  assert.equal((await api.request().post('/api/monuments/identify')).status, 401);
  const none = await api.request().post('/api/monuments/identify').set(bearer(token));
  assert.equal(none.status, 400);
});

test('rechaza archivos que no son imagenes aunque declaren ser imagen', async () => {
  const api = makeApp();
  const { token } = await signUp(api);
  const res = await identify(api, token, Buffer.from('esto es texto plano, no una imagen'), 'x.png', 'image/png');
  assert.equal(res.status, 400);
  assert.equal(res.body.code, 'bad_image');
});

test('rechaza imagenes demasiado grandes', async () => {
  const api = makeApp();
  const { token } = await signUp(api);
  const big = Buffer.concat([PNG, Buffer.alloc(2 * 1024 * 1024)]);
  const res = await identify(api, token, big);
  assert.equal(res.status, 413);
});

test('modo demo responde con un ejemplo marcado como demo', async () => {
  const api = makeApp();
  const { token } = await signUp(api);
  const res = await identify(api, token, PNG);
  assert.equal(res.status, 200);
  assert.equal(res.body.demo, true);
});

test('con IA: envia la imagen y el GPS, y normaliza la respuesta', async () => {
  const ai = fakeAi({
    askJsonWithImage: async () => ({
      identified: true,
      name: 'Monumento X 🏛',
      confidence: 'media',
      location: 'Ciudad Y',
      yearBuilt: null,
      funFacts: ['Dato uno'],
      extra: 'se descarta',
    }),
  });
  const api = makeApp({ ai });
  const { token } = await signUp(api);
  const res = await identify(api, token, PNG, 'f.png', 'image/png', { lat: '9.65', lon: '-85.15', language: 'en' });
  assert.equal(res.status, 200);
  assert.equal(res.body.name, 'Monumento X');
  assert.equal(res.body.history, '');
  assert.equal(res.body.extra, undefined);
  assert.equal(ai.calls[0].mediaType, 'image/png');
  assert.match(ai.calls[0].prompt, /9\.65000, -85\.15000/);
  assert.match(ai.calls[0].prompt, /inglés/);
});

test('coordenadas fuera de rango o idioma desconocido dan 400', async () => {
  const api = makeApp();
  const { token } = await signUp(api);
  assert.equal((await identify(api, token, PNG, 'f.png', 'image/png', { lat: '200', lon: '0' })).status, 400);
  assert.equal((await identify(api, token, PNG, 'f.png', 'image/png', { language: 'klingon' })).status, 400);
});

test('diario: guardar, listar y borrar, aislado por usuario', async () => {
  const api = makeApp();
  const a = await signUp(api);
  const b = await signUp(api);
  const info = (await identify(api, a.token, PNG)).body;

  const saved = await api.request().post('/api/monuments').set(bearer(a.token)).send({ name: info.name, location: info.location, info });
  assert.equal(saved.status, 201);
  const list = await api.request().get('/api/monuments').set(bearer(a.token));
  assert.equal(list.body.length, 1);
  assert.equal(list.body[0].info.name, info.name);

  assert.equal((await api.request().get('/api/monuments').set(bearer(b.token))).body.length, 0);
  assert.equal((await api.request().delete(`/api/monuments/${saved.body.id}`).set(bearer(b.token))).status, 404);
  assert.equal((await api.request().delete(`/api/monuments/${saved.body.id}`).set(bearer(a.token))).status, 204);
});
