// LOGICA DE NEGOCIO: consulta del catalogo de destinos.
import { normalize } from './text.js';
import { FEATURED_ROUTE } from '../data/destinations.js';
import { HttpError } from './errors.js';
import { straightLineKm } from './geo.js';

export function createDestinationService({ destinations }) {
  return {
    list({ category, q } = {}) {
      let items = destinations.list();
      if (category && category !== 'todo') {
        items = items.filter((d) => d.categories.includes(category));
      }
      if (q) {
        const needle = normalize(q);
        items = items.filter((d) =>
          normalize(`${d.name} ${d.region} ${d.tagline} ${d.description}`).includes(needle)
        );
      }
      return items;
    },
    get(id) {
      const found = destinations.find(id);
      if (!found) throw new HttpError(404, 'Destino no encontrado.', { code: 'not_found' });
      return found;
    },
    featuredRoute() {
      const stops = FEATURED_ROUTE.stops.map((id) => destinations.find(id)).filter(Boolean);
      return {
        id: FEATURED_ROUTE.id,
        title: FEATURED_ROUTE.title,
        label: FEATURED_ROUTE.label,
        approxKm: straightLineKm(stops),
        stops: stops.map((d, i) => ({ day: i + 1, id: d.id, name: d.name, theme: d.tagline })),
      };
    },
    total() {
      return destinations.list().length;
    },
  };
}
