// LOGICA DE NEGOCIO: utilidades de texto.
const EMOJI = /[\p{Extended_Pictographic}‍️⃣]/gu;

// La app no usa emojis: se eliminan de cualquier texto que genere la IA.
export function stripEmoji(value) {
  if (typeof value === 'string') return value.replace(EMOJI, '').replace(/[ \t]{2,}/g, ' ').trim();
  if (Array.isArray(value)) return value.map(stripEmoji);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, stripEmoji(v)]));
  }
  return value;
}

export function normalize(text) {
  return String(text)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}

export function parseJsonLoose(text) {
  const trimmed = String(text).trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const match = trimmed.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    throw new Error('La IA no devolvio un JSON valido.');
  }
}
