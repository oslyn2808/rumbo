// LOGICA DE NEGOCIO: clima de cada destino y recomendaciones segun el pronostico.
// Usa Open-Meteo (gratis, sin clave). Si no hay red, devuelve valores de referencia con live: false.
import { HttpError } from './errors.js';

const CACHE_MS = 10 * 60 * 1000;
const FETCH_TIMEOUT_MS = 5000;
const DAY_NAMES = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

// Codigos meteorologicos WMO -> condicion que entiende la ilustracion del frontend.
export function conditionFromCode(code) {
  if (code === 0 || code === 1) return 'sunny';
  if (code === 2) return 'partly';
  if (code === 3 || code === 45 || code === 48) return 'cloudy';
  if (code >= 95) return 'storm';
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return 'rain';
  return 'cloudy';
}

export const CONDITION_LABEL = {
  sunny: 'Soleado',
  partly: 'Parcialmente nublado',
  cloudy: 'Nublado',
  rain: 'Lluvia',
  storm: 'Tormenta',
};

const round = (n) => (Number.isFinite(n) ? Math.round(n) : null);
const round1 = (n) => (Number.isFinite(n) ? Math.round(n * 10) / 10 : null);
// "2026-10-13T05:32" -> "05:32" (hora local del destino, porque se pide con timezone=auto).
const clock = (iso) => (typeof iso === 'string' && iso.includes('T') ? iso.slice(11, 16) : null);

function dayLabel(isoDate, index) {
  if (index === 0) return 'Hoy';
  if (index === 1) return 'Mañana';
  const d = new Date(`${isoDate}T12:00:00`);
  return DAY_NAMES[d.getDay()];
}

export function recommendationsFor(weather, destination) {
  const out = [];
  const today = weather.days[0];

  if (today && today.rainChance >= 60) {
    out.push({
      id: 'rain-today',
      tag: 'Hoy',
      title: 'Lluvia probable hoy',
      body: 'Deja lo que sea al aire libre para la mañana y reserva la tarde para algo bajo techo.',
      action: { label: 'Armar plan B', kind: 'plan' },
    });
  }

  const rainyIndex = weather.days.findIndex((d, i) => i > 0 && d.rainChance >= 70);
  if (rainyIndex > 0) {
    const d = weather.days[rainyIndex];
    out.push({
      id: 'rain-ahead',
      tag: `${d.label} · ${d.rainChance}% de lluvia`,
      title: `Lluvia esperada ${d.label === 'Mañana' ? 'mañana' : `el ${d.label}`}`,
      body: 'Si ya tienes un itinerario, mueve las actividades de playa o senderismo a otro día.',
      action: { label: 'Ajustar itinerario', kind: 'plan' },
    });
  }

  if (today && today.condition === 'sunny' && (weather.current?.temperature ?? today.max) >= 28) {
    out.push({
      id: 'sun-hot',
      tag: 'Hoy',
      title: 'Día soleado y caluroso',
      body: 'Haz las caminatas temprano, usa protector solar y mantente hidratado en las horas centrales.',
      action: { label: 'Planear aquí', kind: 'plan' },
    });
  }

  if (weather.current && weather.current.windKmh >= 30) {
    out.push({
      id: 'wind',
      tag: 'Hoy',
      title: 'Viento fuerte',
      body: 'Extrema las precauciones en actividades de agua y revisa con el operador si el tour sale.',
      action: { label: 'Planear aquí', kind: 'plan' },
    });
  }

  if (out.length === 0) {
    out.push({
      id: 'good-day',
      tag: 'Esta semana',
      title: `Buen momento para visitar ${destination.name}`,
      body: 'El pronóstico no muestra mayores problemas. Es un buen momento para armar tu ruta.',
      action: { label: 'Planear aquí', kind: 'plan' },
    });
  }
  return out;
}

export function createWeatherService({ fetchFn = globalThis.fetch, now = () => new Date() } = {}) {
  const cache = new Map();

  function reference(destination) {
    const month = now().getMonth(); // 0 = enero
    const wet = month >= 4 && month <= 10; // mayo a noviembre: temporada lluviosa en la mayor parte del pais
    const base = destination.typicalTempC;
    const days = Array.from({ length: 5 }, (_, i) => {
      const date = new Date(now().getTime() + i * 86400000);
      const rainChance = wet ? (i % 2 === 0 ? 60 : 40) : 10;
      return {
        date: date.toISOString().slice(0, 10),
        label: dayLabel(date.toISOString().slice(0, 10), i),
        condition: wet ? (i % 2 === 0 ? 'rain' : 'cloudy') : 'sunny',
        max: base,
        min: base - 7,
        rainChance,
        rainMm: null,
        uvMax: null,
        sunrise: '05:30',
        sunset: '17:40',
      };
    });
    const hour = now().getHours();
    return {
      live: false,
      updatedAt: now().toISOString(),
      current: {
        temperature: base,
        feelsLike: null,
        humidity: wet ? 85 : 70,
        dewPoint: null,
        windKmh: null,
        windDir: null,
        gustKmh: null,
        uv: null,
        isDay: hour >= 6 && hour < 18,
        condition: days[0].condition,
      },
      days,
    };
  }

  async function fetchLive(destination) {
    const params = new URLSearchParams({
      latitude: String(destination.lat),
      longitude: String(destination.lon),
      current:
        'temperature_2m,relative_humidity_2m,apparent_temperature,dew_point_2m,wind_speed_10m,wind_direction_10m,wind_gusts_10m,uv_index,is_day,weather_code',
      daily:
        'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum,uv_index_max,sunrise,sunset',
      timezone: 'auto',
      forecast_days: '5',
    });
    const res = await fetchFn(`https://api.open-meteo.com/v1/forecast?${params}`, {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (!res.ok) throw new Error(`Open-Meteo respondio ${res.status}`);
    const data = await res.json();

    const daily = data.daily;
    const days = daily.time.map((date, i) => ({
      date,
      label: dayLabel(date, i),
      condition: conditionFromCode(daily.weather_code[i]),
      max: round(daily.temperature_2m_max[i]),
      min: round(daily.temperature_2m_min?.[i]),
      rainChance: round(daily.precipitation_probability_max[i]) ?? 0,
      rainMm: round1(daily.precipitation_sum?.[i]),
      uvMax: round(daily.uv_index_max?.[i]),
      sunrise: clock(daily.sunrise?.[i]),
      sunset: clock(daily.sunset?.[i]),
    }));
    const c = data.current;
    return {
      live: true,
      updatedAt: now().toISOString(),
      current: {
        temperature: round(c.temperature_2m),
        feelsLike: round(c.apparent_temperature),
        humidity: round(c.relative_humidity_2m),
        dewPoint: round(c.dew_point_2m),
        windKmh: round(c.wind_speed_10m),
        windDir: round(c.wind_direction_10m),
        gustKmh: round(c.wind_gusts_10m),
        uv: round1(c.uv_index),
        isDay: c.is_day == null ? true : c.is_day === 1,
        condition: conditionFromCode(c.weather_code),
      },
      days,
    };
  }

  return {
    async forDestination(destination) {
      if (!destination) throw new HttpError(404, 'Destino no encontrado.', { code: 'not_found' });

      const hit = cache.get(destination.id);
      if (hit && now().getTime() - hit.at < CACHE_MS) return hit.data;

      let weather;
      try {
        weather = await fetchLive(destination);
      } catch {
        weather = reference(destination);
      }
      const data = {
        ...weather,
        conditionLabels: CONDITION_LABEL,
        recommendations: recommendationsFor(weather, destination),
      };
      // Los valores de referencia se guardan poco tiempo para reintentar pronto la conexion.
      cache.set(destination.id, { at: weather.live ? now().getTime() : now().getTime() - CACHE_MS + 30000, data });
      return data;
    },
  };
}
