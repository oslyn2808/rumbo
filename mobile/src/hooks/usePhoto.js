import { useEffect, useState } from 'react';
import { DESTINATION_PHOTOS } from '../data/photos';

// Cache en memoria: cada foto se busca una sola vez por sesion (expo-image guarda el archivo en disco).
const cache = new Map();
const WIDTH = 1080;

async function fromWikipedia(article) {
  const [lang, title] = article.split(':');
  const res = await fetch(`https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title.replace(/ /g, '_'))}`, {
    headers: { 'Api-User-Agent': 'Rumbo/1.0 (app de viajes)' },
  });
  if (!res.ok) return null;
  const page = await res.json();
  const thumb = page.thumbnail?.source;
  // Solo fotos: los mapas, escudos y banderas suelen ser SVG o PNG.
  if (!thumb || !/\.jpe?g/i.test(thumb)) return null;
  // Las miniaturas de Wikimedia aceptan otro ancho cambiando el "NNNpx-" de la URL.
  const uri = /\/\d+px-/.test(thumb) && (page.originalimage?.width ?? 0) > WIDTH ? thumb.replace(/\/\d+px-/, `/${WIDTH}px-`) : page.originalimage?.source ?? thumb;
  return { uri, credit: 'Wikimedia Commons', link: page.content_urls?.mobile?.page ?? null };
}

export function findPhoto(id) {
  if (cache.has(id)) return cache.get(id);
  const entry = DESTINATION_PHOTOS[id];
  const job = (async () => {
    if (!entry) return null;
    if (entry.uri) return { uri: entry.uri, credit: entry.credit ?? null, link: entry.link ?? null };
    for (const article of entry.articles) {
      const photo = await fromWikipedia(article).catch(() => null);
      if (photo) return photo;
    }
    return null;
  })();
  cache.set(id, job);
  // Si fallo (sin internet, por ejemplo) se vuelve a intentar la proxima vez.
  job.then((p) => !p && cache.delete(id));
  return job;
}

// undefined mientras busca, null si no hay foto (se muestra la ilustracion), o { uri, credit, link }.
export function usePhoto(id) {
  const [photo, setPhoto] = useState(undefined);
  useEffect(() => {
    if (!id) return setPhoto(null);
    let alive = true;
    setPhoto(undefined);
    findPhoto(id).then((p) => alive && setPhoto(p));
    return () => {
      alive = false;
    };
  }, [id]);
  return photo;
}
