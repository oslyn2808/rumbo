// LOGICA DE NEGOCIO: distancias entre destinos del catalogo.
// Se calcula en linea recta (no por carretera): en las montanas de Costa Rica el recorrido real
// puede ser mucho mayor, asi que la interfaz siempre lo indica como "en linea recta".
const R_KM = 6371;
const rad = (deg) => (deg * Math.PI) / 180;

export function haversineKm(a, b) {
  const dLat = rad(b.lat - a.lat);
  const dLon = rad(b.lon - a.lon);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R_KM * Math.asin(Math.sqrt(h));
}

export function straightLineKm(stops) {
  let total = 0;
  for (let i = 1; i < stops.length; i += 1) total += haversineKm(stops[i - 1], stops[i]);
  return Math.round(total / 5) * 5;
}
