// LOGICA DE NEGOCIO: itinerarios (con IA o de ejemplo) y viajes guardados.
import { HttpError } from './errors.js';
import { straightLineKm } from './geo.js';
import { daySchema, planSchema } from './schemas.js';
import { normalize, stripEmoji } from './text.js';

const SYSTEM = [
  'Eres un planificador de viajes experto en turismo en Costa Rica y otros destinos.',
  'Creas itinerarios realistas, con tiempos de traslado razonables y adaptados a los gustos del viajero.',
  'Responde SOLO con un objeto JSON valido, sin texto adicional.',
  'No inventes lugares: si no estas seguro de que un sitio exista, no lo incluyas.',
  'No uses emojis en ningun texto.',
].join(' ');

const PLAN_SHAPE = `{
  "title": "titulo corto de la ruta",
  "overview": "resumen de 2 frases",
  "bestTimeNote": "nota sobre clima o temporada",
  "days": [
    {
      "day": 1,
      "place": "lugar principal del dia",
      "theme": "tema del dia, por ejemplo: Playa y surf",
      "activities": [
        { "time": "Mañana", "title": "...", "details": "...", "costUsd": 0 },
        { "time": "Tarde", "title": "...", "details": "...", "costUsd": 0 },
        { "time": "Noche", "title": "...", "details": "...", "costUsd": 0 }
      ],
      "foodTip": "recomendacion de comida local",
      "rainPlan": "plan B si llueve"
    }
  ],
  "packingTips": ["consejo 1", "consejo 2"],
  "extraIdeas": ["idea opcional 1", "idea opcional 2", "idea opcional 3"]
}`;

// Elimina nulls y convierte numeros escritos como texto, para tolerar pequenas variaciones de la IA.
function clean(value) {
  if (value === null) return undefined;
  if (Array.isArray(value)) return value.map(clean).filter((v) => v !== undefined);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .map(([k, v]) => [k, clean(v)])
        .filter(([, v]) => v !== undefined)
    );
  }
  return value;
}

function coerceNumbers(plan) {
  for (const day of plan.days ?? []) {
    day.day = Number(day.day);
    for (const a of day.activities ?? []) a.costUsd = Number(a.costUsd) || 0;
  }
  return plan;
}

// La IA a veces escribe un poco de mas (un horario largo, una actividad extra): se recorta a los
// limites del esquema en vez de rechazar todo el itinerario.
const cut = (value, max) => (typeof value === 'string' ? value.slice(0, max) : typeof value === 'number' ? String(value) : value);
const cutList = (list, count, max) => (Array.isArray(list) ? list.slice(0, count).map((v) => cut(v, max)) : list);

function fitDay(day) {
  if (!day || typeof day !== 'object') return day;
  return {
    ...day,
    place: cut(day.place, 100),
    theme: cut(day.theme, 160),
    foodTip: cut(day.foodTip, 400),
    rainPlan: cut(day.rainPlan, 400),
    activities: Array.isArray(day.activities)
      ? day.activities.slice(0, 8).map((a) =>
          a && typeof a === 'object'
            ? { ...a, time: cut(a.time, 20), title: cut(a.title, 200), details: cut(a.details, 600), costUsd: Math.min(Number(a.costUsd) || 0, 100000) }
            : a
        )
      : day.activities,
  };
}

function fitPlan(plan) {
  if (!plan || typeof plan !== 'object') return plan;
  return {
    ...plan,
    title: cut(plan.title, 160),
    overview: cut(plan.overview, 800),
    bestTimeNote: cut(plan.bestTimeNote, 400),
    days: Array.isArray(plan.days) ? plan.days.slice(0, 30).map((d, i) => ({ ...fitDay(d), day: i + 1 })) : plan.days,
    packingTips: cutList(plan.packingTips, 12, 200),
    extraIdeas: cutList(plan.extraIdeas, 12, 300),
  };
}

export function createTripService({ trips, ai, destinations }) {
  const catalog = destinations.list();

  const findCatalog = (text) => {
    const n = normalize(text);
    return catalog.find((d) => n.includes(normalize(d.name)) || n.includes(d.id.replace(/-/g, ' '))) ?? null;
  };

  // Destinos del catalogo mencionados en un texto, en el orden en que aparecen.
  function matchDestinations(text) {
    const n = normalize(text);
    return catalog
      .map((d) => ({ d, at: Math.min(...[n.indexOf(normalize(d.name)), n.indexOf(d.id.replace(/-/g, ' '))].filter((i) => i >= 0), Infinity) }))
      .filter((x) => x.at !== Infinity)
      .sort((a, b) => a.at - b.at)
      .map((x) => x.d);
  }

  function enrich(plan) {
    const places = [];
    for (const d of plan.days) if (!places.includes(d.place)) places.push(d.place);
    const stops = places.map(findCatalog);
    const approxKm = places.length >= 2 && stops.every(Boolean) ? straightLineKm(stops) : null;
    return { ...plan, route: { places, approxKm } };
  }

  function validatePlan(raw, expectedDays) {
    const parsed = planSchema.safeParse(fitPlan(coerceNumbers(clean(stripEmoji(raw)) ?? {})));
    if (!parsed.success) {
      console.error('[ia] Itinerario con formato inesperado:', JSON.stringify(parsed.error.issues.slice(0, 5)));
      throw new HttpError(502, 'La IA devolvió un itinerario con formato inesperado. Intenta de nuevo.', {
        code: 'ai_bad_format',
      });
    }
    const plan = parsed.data;
    plan.days = plan.days.slice(0, expectedDays).map((d, i) => ({ ...d, day: i + 1 }));
    return plan;
  }

  function demoDay(dest, dayNumber, offset, fallbackName) {
    if (!dest) {
      return {
        day: dayNumber,
        place: fallbackName,
        theme: 'Día de exploración',
        activities: [
          { time: 'Mañana', title: 'Desayuno local y paseo por el centro', details: 'Ejemplo del modo demo.', costUsd: 0 },
          { time: 'Tarde', title: 'Actividad según tus gustos', details: 'Activa la IA para recibir sugerencias reales.', costUsd: 0 },
          { time: 'Noche', title: 'Cena y descanso', details: '', costUsd: 0 },
        ],
        foodTip: 'Pregunta por el plato típico de la zona.',
        rainPlan: 'Cambia la actividad al aire libre por un museo o un café.',
      };
    }
    const h = dest.highlights;
    const pick = (i) => h[(offset + i) % h.length];
    return {
      day: dayNumber,
      place: dest.name,
      theme: dest.tagline,
      activities: [
        { time: 'Mañana', title: pick(0), details: dest.description, costUsd: 0 },
        { time: 'Tarde', title: pick(1), details: '', costUsd: 0 },
        { time: 'Noche', title: 'Cena y descanso', details: dest.bestTime, costUsd: 0 },
      ],
      foodTip: 'Pregunta en tu alojamiento por restaurantes de comida típica.',
      rainPlan: 'Cambia la actividad al aire libre por un café, un mercado o un museo cercano.',
    };
  }

  function demoPlan(req) {
    const matches = matchDestinations(req.destination);
    const places = matches.length ? matches : [null];
    const used = Math.min(places.length, req.days);
    const base = Math.floor(req.days / used);
    const extra = req.days % used;

    const days = [];
    for (let p = 0; p < used; p += 1) {
      const count = base + (p < extra ? 1 : 0);
      for (let k = 0; k < count; k += 1) {
        days.push(demoDay(places[p], days.length + 1, k * 2, req.destination));
      }
    }
    return {
      title: `Ruta de ${req.days} ${req.days === 1 ? 'día' : 'días'}`,
      overview: matches.length
        ? `Recorrido por ${matches.slice(0, used).map((d) => d.name).join(', ')} con lo más representativo de cada lugar.`
        : `Recorrido de ${req.days} ${req.days === 1 ? 'día' : 'días'} por ${req.destination}.`,
      bestTimeNote: matches[0]?.bestTime ?? '',
      days,
      packingTips: ['Protector solar', 'Calzado cómodo', 'Impermeable ligero'],
      extraIdeas: [],
      demo: true,
    };
  }

  async function generateWithAi(req) {
    const prompt = [
      `Crea un itinerario de ${req.days} día(s) para: ${req.destination}.`,
      `Gustos e intereses: ${req.interests.join(', ') || 'sin preferencias específicas'}.`,
      `Presupuesto: ${req.budget}. Viaja: ${req.travelers}. Ritmo: ${req.pace}.`,
      `Cuando un lugar sea uno de estos, usa exactamente este nombre: ${catalog.map((d) => d.name).join(', ')}.`,
      'Si el destino es una región amplia, puedes repartir los días entre varios lugares cercanos.',
      `Devuelve un JSON con esta estructura:\n${PLAN_SHAPE}`,
      `Debe haber exactamente ${req.days} elementos en "days".`,
    ].join('\n');
    const raw = await ai.askJson({ system: SYSTEM, prompt, maxTokens: Math.min(1500 + req.days * 900, 16000) });
    return validatePlan(raw, req.days);
  }

  return {
    async generate(req) {
      const plan = ai.demo ? demoPlan(req) : await generateWithAi(req);
      return enrich(plan);
    },

    async regenerateDay(req, plan, dayNumber, instruction) {
      const index = plan.days.findIndex((d) => d.day === dayNumber);
      if (index < 0) throw new HttpError(400, 'Ese día no existe en el itinerario.', { code: 'bad_day' });

      let newDay;
      if (ai.demo) {
        const dest = findCatalog(plan.days[index].place);
        newDay = demoDay(dest, dayNumber, Math.floor(Math.random() * 5) + 1, plan.days[index].place);
      } else {
        const prompt = [
          `Este es un itinerario de viaje a ${req.destination}:`,
          JSON.stringify(plan),
          `Reescribe SOLO el día ${dayNumber} aplicando este cambio: ${instruction}`,
          'Devuelve únicamente el JSON de ese día con la misma estructura que los demás días.',
        ].join('\n');
        const raw = await ai.askJson({ system: SYSTEM, prompt, maxTokens: 1500 });
        // A veces la IA envuelve el dia en { "days": [...] } o { "day": {...} }.
        const rawDay = Array.isArray(raw?.days) ? raw.days[0] : raw?.day && typeof raw.day === 'object' ? raw.day : raw;
        const parsed = daySchema.safeParse({ ...fitDay(coerceNumbers({ days: [clean(stripEmoji(rawDay)) ?? {}] }).days[0]), day: dayNumber });
        if (!parsed.success) {
          console.error('[ia] Dia con formato inesperado:', JSON.stringify(parsed.error.issues.slice(0, 5)));
          throw new HttpError(502, 'La IA devolvió un día con formato inesperado. Intenta de nuevo.', {
            code: 'ai_bad_format',
          });
        }
        newDay = { ...parsed.data, day: dayNumber };
      }
      const days = plan.days.map((d, i) => (i === index ? newDay : d));
      return enrich({ ...plan, days });
    },

    save(userId, req, plan) {
      return trips.add(userId, {
        destination: req.destination,
        days: plan.days.length,
        preferences: req.interests.join(', '),
        plan,
      });
    },
    list: (userId) => trips.list(userId),
    get(userId, id) {
      const trip = trips.get(userId, id);
      if (!trip) throw new HttpError(404, 'Viaje no encontrado.', { code: 'not_found' });
      return trip;
    },
    remove(userId, id) {
      if (!trips.delete(userId, id)) throw new HttpError(404, 'Viaje no encontrado.', { code: 'not_found' });
    },
  };
}
