// LOGICA DE NEGOCIO: reconocimiento de monumentos a partir de una foto y diario de monumentos.
import { HttpError } from './errors.js';
import { detectImageType } from './imageType.js';
import { monumentInfoSchema } from './schemas.js';
import { stripEmoji } from './text.js';

const LANGUAGES = { es: 'español', en: 'inglés', fr: 'francés', pt: 'portugués' };

const SYSTEM = [
  'Eres un guia turistico experto. Recibes la foto de un monumento o lugar y, opcionalmente, la ubicacion GPS del turista.',
  'Identifica el lugar y responde SOLO con un objeto JSON, sin texto extra.',
  'Si no estas seguro, da tu mejor hipotesis con confianza baja; nunca inventes datos.',
  'Si la foto no muestra un monumento o lugar identificable, pon identified=false.',
  'No uses emojis en ningun texto.',
].join(' ');

const SHAPE = `{
  "identified": true o false,
  "name": "nombre del lugar",
  "confidence": "alta" | "media" | "baja",
  "location": "ciudad y pais",
  "yearBuilt": "año o epoca, o null si no se sabe",
  "style": "estilo arquitectonico o tipo de lugar",
  "summary": "resumen de 2-3 frases",
  "history": "historia en un parrafo corto",
  "funFacts": ["dato curioso 1", "dato curioso 2", "dato curioso 3"],
  "visitTips": "consejos para visitar (horarios, mejor momento) o null si no se sabe"
}`;

const DEMO_RESULT = {
  identified: true,
  name: 'Teatro Nacional de Costa Rica',
  confidence: 'alta',
  location: 'San José, Costa Rica',
  yearBuilt: '1897',
  style: 'Neorrenacentista',
  summary:
    'Resultado de ejemplo del modo demo: configura ANTHROPIC_API_KEY para identificar tus propias fotos.',
  history: 'El Teatro Nacional se inauguró en 1897 y es uno de los edificios más emblemáticos de San José.',
  funFacts: [
    'Su construcción se financió en parte con un impuesto al café.',
    'Su interior está decorado con pinturas y esculturas de artistas europeos.',
  ],
  visitTips: 'Conviene verificar horarios de visitas guiadas antes de ir.',
  demo: true,
};

export function createMonumentService({ monuments, ai }) {
  return {
    async identify({ image, lat, lon, language = 'es' }) {
      const mediaType = detectImageType(image);
      if (!mediaType) {
        throw new HttpError(400, 'El archivo no es una imagen válida. Usa JPG, PNG, WEBP o GIF.', {
          code: 'bad_image',
        });
      }
      if (ai.demo) return { ...DEMO_RESULT };

      const gps = lat != null && lon != null ? `${lat.toFixed(5)}, ${lon.toFixed(5)}` : 'no disponible';
      const prompt = [
        'Identifica el monumento o lugar de la foto.',
        `Ubicación GPS aproximada: ${gps}.`,
        `Idioma de la respuesta: ${LANGUAGES[language] ?? LANGUAGES.es}.`,
        `Devuelve un JSON con exactamente estas claves:\n${SHAPE}`,
      ].join('\n');

      const raw = await ai.askJsonWithImage({ system: SYSTEM, prompt, image, mediaType });
      const noNulls = Object.fromEntries(Object.entries(stripEmoji(raw)).filter(([, v]) => v !== null));
      const parsed = monumentInfoSchema.safeParse({ identified: false, name: 'No identificado', ...noNulls });
      if (!parsed.success) {
        throw new HttpError(502, 'La IA devolvió una respuesta con formato inesperado. Intenta de nuevo.', {
          code: 'ai_bad_format',
        });
      }
      return parsed.data;
    },

    save: (userId, { name, location, info }) => monuments.add(userId, { name, location, info }),
    list: (userId) => monuments.list(userId),
    remove(userId, id) {
      if (!monuments.delete(userId, id)) {
        throw new HttpError(404, 'Monumento no encontrado.', { code: 'not_found' });
      }
    },
  };
}
