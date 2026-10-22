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

export const longDate = (date = new Date()) =>
  date.toLocaleDateString('es-CR', { weekday: 'short', day: 'numeric', month: 'short' });
