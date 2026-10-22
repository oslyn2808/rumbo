import assert from 'node:assert/strict';
import { test } from 'node:test';
import { bearer, fakeAi, makeApp, signUp } from './helpers.js';

const REQ = { destination: 'Guanacaste, Monteverde y Arenal', days: 3, interests: ['playa', 'volcanes'] };

test('los viajes exigen sesion', async () => {
  const api = makeApp();
  assert.equal((await api.request().post('/api/trips/generate').send(REQ)).status, 401);
  assert.equal((await api.request().get('/api/trips')).status, 401);
});

test('modo demo arma una ruta con los destinos del catalogo y calcula distancia', async () => {
  const api = makeApp();
  const { token } = await signUp(api);
  const res = await api
    .request()
    .post('/api/trips/generate')
    .set(bearer(token))
    .send({ destination: 'Tamarindo, Monteverde y Arenal', days: 3 });
  assert.equal(res.status, 200);
  assert.equal(res.body.demo, true);
  assert.equal(res.body.days.length, 3);
  assert.deepEqual(res.body.route.places, ['Tamarindo', 'Monteverde', 'Arenal']);
  assert.ok(res.body.route.approxKm > 100 && res.body.route.approxKm < 600);
  assert.ok(res.body.days.every((d, i) => d.day === i + 1 && d.activities.length === 3));
});

test('valida dias y destino', async () => {
  const api = makeApp();
  const { token } = await signUp(api);
  const tooMany = await api.request().post('/api/trips/generate').set(bearer(token)).send({ destination: 'Tamarindo', days: 99 });
  assert.equal(tooMany.status, 400);
  const noDest = await api.request().post('/api/trips/generate').set(bearer(token)).send({ destination: '', days: 2 });
  assert.equal(noDest.status, 400);
});

test('con IA: limpia emojis, normaliza numeros y ajusta los dias', async () => {
  const ai = fakeAi({
    askJson: async () => ({
      title: 'Ruta de prueba 🌴',
      overview: 'Un viaje 😀 genial',
      days: [
        { day: '1', place: 'Tamarindo', theme: 'Playa', activities: [{ time: 'Mañana', title: 'Surf 🏄', details: null, costUsd: '25' }], foodTip: null },
        { day: 2, place: 'Tamarindo', theme: 'Otro', activities: [] },
        { day: 3, place: 'Tamarindo', theme: 'Sobra', activities: [] },
      ],
    }),
  });
  const api = makeApp({ ai });
  const { token } = await signUp(api);
  const res = await api.request().post('/api/trips/generate').set(bearer(token)).send({ destination: 'Tamarindo', days: 2 });
  assert.equal(res.status, 200);
  assert.equal(res.body.title, 'Ruta de prueba');
  assert.equal(res.body.days.length, 2);
  assert.equal(res.body.days[0].activities[0].costUsd, 25);
  assert.equal(res.body.days[0].activities[0].title, 'Surf');
  assert.doesNotMatch(JSON.stringify(res.body), /\p{Extended_Pictographic}/u);
  assert.match(ai.calls[0].prompt, /Tamarindo/);
});

test('con IA: textos demasiado largos se recortan en vez de fallar', async () => {
  const long = 'x'.repeat(900);
  const ai = fakeAi({
    askJson: async () => ({
      title: long,
      days: [
        {
          day: 1,
          place: 'Tamarindo',
          activities: Array.from({ length: 10 }, (_, i) => ({ time: `Mañana temprano (6:00 a 8:00) ${i}`, title: 'Surf', details: long, costUsd: 10 })),
        },
      ],
      packingTips: Array.from({ length: 20 }, () => 'Bloqueador'),
    }),
  });
  const api = makeApp({ ai });
  const { token } = await signUp(api);
  const res = await api.request().post('/api/trips/generate').set(bearer(token)).send({ destination: 'Tamarindo', days: 1 });
  assert.equal(res.status, 200);
  assert.equal(res.body.title.length, 160);
  assert.equal(res.body.days[0].activities.length, 8);
  assert.equal(res.body.days[0].activities[0].time.length, 20);
  assert.equal(res.body.packingTips.length, 12);
});

test('con IA: ajustar un dia acepta el dia envuelto en { days: [...] }', async () => {
  const day = { day: 1, place: 'Tamarindo', theme: 'Más barato', activities: [{ time: 'Tarde', title: 'Playa gratis', details: '', costUsd: 0 }] };
  const ai = fakeAi({ askJson: async () => ({ days: [day] }) });
  const api = makeApp({ ai });
  const { token } = await signUp(api);
  const plan = { title: 'Ruta', days: [{ day: 1, place: 'Tamarindo', activities: [] }] };
  const res = await api
    .request()
    .post('/api/trips/regenerate-day')
    .set(bearer(token))
    .send({ request: { destination: 'Tamarindo', days: 1 }, plan, day: 1, instruction: 'hazlo más económico' });
  assert.equal(res.status, 200);
  assert.equal(res.body.days[0].activities[0].title, 'Playa gratis');
});

test('con IA: una respuesta rota devuelve 502 con mensaje claro', async () => {
  const api = makeApp({ ai: fakeAi({ askJson: async () => ({ foo: 'bar' }) }) });
  const { token } = await signUp(api);
  const res = await api.request().post('/api/trips/generate').set(bearer(token)).send({ destination: 'Tamarindo', days: 2 });
  assert.equal(res.status, 502);
  assert.equal(res.body.code, 'ai_bad_format');
});

test('guardar, listar, leer y borrar un viaje; cada usuario ve solo los suyos', async () => {
  const api = makeApp();
  const a = await signUp(api);
  const b = await signUp(api);
  const plan = (await api.request().post('/api/trips/generate').set(bearer(a.token)).send(REQ)).body;

  const saved = await api.request().post('/api/trips').set(bearer(a.token)).send({ request: REQ, plan });
  assert.equal(saved.status, 201);
  const id = saved.body.id;

  assert.equal((await api.request().get('/api/trips').set(bearer(a.token))).body.length, 1);
  assert.equal((await api.request().get(`/api/trips/${id}`).set(bearer(a.token))).body.plan.days.length, 3);

  assert.equal((await api.request().get('/api/trips').set(bearer(b.token))).body.length, 0);
  assert.equal((await api.request().get(`/api/trips/${id}`).set(bearer(b.token))).status, 404);
  assert.equal((await api.request().delete(`/api/trips/${id}`).set(bearer(b.token))).status, 404);

  assert.equal((await api.request().delete(`/api/trips/${id}`).set(bearer(a.token))).status, 204);
  assert.equal((await api.request().get(`/api/trips/${id}`).set(bearer(a.token))).status, 404);
});

test('rechaza planes con forma invalida al guardar', async () => {
  const api = makeApp();
  const { token } = await signUp(api);
  const res = await api.request().post('/api/trips').set(bearer(token)).send({ request: REQ, plan: { title: 'x' } });
  assert.equal(res.status, 400);
});

test('regenerar un dia (demo) cambia solo ese dia y valida el numero', async () => {
  const api = makeApp();
  const { token } = await signUp(api);
  const plan = (await api.request().post('/api/trips/generate').set(bearer(token)).send({ destination: 'Tamarindo', days: 3 })).body;
  const ok = await api
    .request()
    .post('/api/trips/regenerate-day')
    .set(bearer(token))
    .send({ request: { destination: 'Tamarindo', days: 3 }, plan, day: 2, instruction: 'mas barato' });
  assert.equal(ok.status, 200);
  assert.equal(ok.body.days.length, 3);
  assert.deepEqual(ok.body.days[0], plan.days[0]);
  assert.deepEqual(ok.body.days[2], plan.days[2]);

  const bad = await api
    .request()
    .post('/api/trips/regenerate-day')
    .set(bearer(token))
    .send({ request: { destination: 'Tamarindo', days: 3 }, plan, day: 9, instruction: 'mas barato' });
  assert.equal(bad.status, 400);
});
