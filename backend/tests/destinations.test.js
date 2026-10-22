import assert from 'node:assert/strict';
import { test } from 'node:test';
import { makeApp } from './helpers.js';

const failingFetch = async () => {
  throw new Error('sin red');
};

const liveFetch = (daily = {}) => async () => ({
  ok: true,
  json: async () => ({
    current: {
      temperature_2m: 27.6,
      apparent_temperature: 30.2,
      relative_humidity_2m: 72,
      dew_point_2m: 22.1,
      wind_speed_10m: 12.4,
      weather_code: 1,
    },
    daily: {
      time: ['2026-10-13', '2026-10-14', '2026-10-15', '2026-10-16', '2026-10-17'],
      weather_code: [1, 3, 61, 80, 0],
      temperature_2m_max: [29, 28, 26, 25, 29],
      precipitation_probability_max: [10, 30, 80, 90, 5],
      ...daily,
    },
  }),
});

test('lista destinos, filtra por categoria y por texto', async () => {
  const api = makeApp();
  const all = await api.request().get('/api/destinations');
  assert.equal(all.status, 200);
  assert.ok(all.body.total >= 10);

  const volcanes = await api.request().get('/api/destinations?category=volcanes');
  assert.ok(volcanes.body.items.length > 0);
  assert.ok(volcanes.body.items.every((d) => d.categories.includes('volcanes')));

  const q = await api.request().get('/api/destinations?q=rincon');
  assert.deepEqual(q.body.items.map((d) => d.id), ['rincon-de-la-vieja']);

  assert.equal((await api.request().get('/api/destinations?category=hackeo')).status, 400);
});

test('detalle de destino y 404', async () => {
  const api = makeApp();
  const ok = await api.request().get('/api/destinations/tamarindo');
  assert.equal(ok.body.name, 'Tamarindo');
  assert.equal((await api.request().get('/api/destinations/no-existe')).status, 404);
});

test('clima en vivo trae metricas, pronostico y recomendaciones', async () => {
  const api = makeApp({ fetchFn: liveFetch() });
  const res = await api.request().get('/api/destinations/tamarindo/weather');
  assert.equal(res.status, 200);
  assert.equal(res.body.live, true);
  assert.equal(res.body.current.temperature, 28);
  assert.equal(res.body.current.condition, 'sunny');
  assert.equal(res.body.days.length, 5);
  assert.equal(res.body.days[0].label, 'Hoy');
  assert.equal(res.body.days[2].condition, 'rain');
  const ids = res.body.recommendations.map((r) => r.id);
  assert.ok(ids.includes('rain-ahead'));
  assert.ok(res.body.recommendations.every((r) => r.action.kind === 'plan'));
});

test('clima en vivo trae viento, UV y horas de sol cuando la API los envia', async () => {
  const base = liveFetch({
    temperature_2m_min: [22, 21, 21, 20, 22],
    uv_index_max: [9.4, 7, 5, 4, 10],
    precipitation_sum: [0, 1.24, 12, 20, 0],
    sunrise: ['2026-10-13T05:31', '', '', '', ''],
    sunset: ['2026-10-13T17:38', '', '', '', ''],
  });
  const fetchFn = async () => {
    const res = await base();
    const body = await res.json();
    Object.assign(body.current, { wind_direction_10m: 45, wind_gusts_10m: 21.6, uv_index: 6.25, is_day: 0 });
    return { ok: true, json: async () => body };
  };
  const res = await makeApp({ fetchFn }).request().get('/api/destinations/tamarindo/weather');
  const { current, days } = res.body;
  assert.equal(current.windDir, 45);
  assert.equal(current.gustKmh, 22);
  assert.equal(current.uv, 6.3);
  assert.equal(current.isDay, false);
  assert.equal(days[0].min, 22);
  assert.equal(days[0].uvMax, 9);
  assert.equal(days[1].rainMm, 1.2);
  assert.equal(days[0].sunrise, '05:31');
  assert.equal(days[0].sunset, '17:38');
  assert.equal(days[1].sunrise, null);
});

test('sin red el clima usa valores de referencia y lo marca', async () => {
  const api = makeApp({ fetchFn: failingFetch });
  const res = await api.request().get('/api/destinations/irazu/weather');
  assert.equal(res.status, 200);
  assert.equal(res.body.live, false);
  assert.equal(res.body.current.temperature, 11);
  assert.ok(res.body.recommendations.length >= 1);
});

test('lluvia hoy genera recomendacion de plan B', async () => {
  const api = makeApp({
    fetchFn: liveFetch({ precipitation_probability_max: [85, 20, 10, 10, 10], weather_code: [63, 1, 1, 1, 1] }),
  });
  const res = await api.request().get('/api/destinations/monteverde/weather');
  assert.ok(res.body.recommendations.some((r) => r.id === 'rain-today'));
});

test('el clima de un destino inexistente da 404', async () => {
  const api = makeApp({ fetchFn: failingFetch });
  assert.equal((await api.request().get('/api/destinations/nada/weather')).status, 404);
});

test('ruta sugerida: tres paradas con distancia aproximada, sin IA', async () => {
  const api = makeApp();
  const res = await api.request().get('/api/destinations/featured-route');
  assert.equal(res.status, 200);
  assert.deepEqual(res.body.stops.map((s) => s.id), ['tamarindo', 'monteverde', 'arenal']);
  assert.equal(res.body.stops[0].theme, 'Playa y surf');
  assert.ok(res.body.approxKm > 100 && res.body.approxKm < 200);
});
