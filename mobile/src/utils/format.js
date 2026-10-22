export const initials = (name = '') =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('') || 'R';

export const firstName = (name = '') => name.trim().split(/\s+/)[0] || '';

export const normalize = (text = '') =>
  text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();

export const money = (n) => `$${Math.round(n)}`;

const WEEKDAYS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sept', 'oct', 'nov', 'dic'];

// Fechas armadas a mano: no todos los celulares traen los datos de idioma para toLocaleDateString.
export const longDate = (date = new Date()) => `${WEEKDAYS[date.getDay()]}, ${date.getDate()} ${MONTHS[date.getMonth()]}`;

export const shortDate = (date = new Date()) => `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
