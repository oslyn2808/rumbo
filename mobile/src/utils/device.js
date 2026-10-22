import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as Location from 'expo-location';

// Reduce fotos grandes antes de enviarlas: mas rapido y evita el limite de 5 MB del backend.
export async function prepareImage(photo, maxSide = 1600) {
  const { width = maxSide, height = maxSide } = photo;
  const longest = Math.max(width, height);
  const context = ImageManipulator.manipulate(photo.uri);
  if (longest > maxSide) context.resize(width >= height ? { width: maxSide } : { height: maxSide });
  const image = await context.renderAsync();
  const result = await image.saveAsync({ compress: 0.8, format: SaveFormat.JPEG });
  return result.uri;
}

// Ubicacion actual con permiso. Devuelve null si la persona no da permiso o el GPS no responde.
export async function getPosition({ ask = true, timeout = 8000 } = {}) {
  try {
    let { status } = await Location.getForegroundPermissionsAsync();
    if (status !== 'granted' && ask) ({ status } = await Location.requestForegroundPermissionsAsync());
    if (status !== 'granted') return null;
    const last = await Location.getLastKnownPositionAsync({ maxAge: 60000 });
    if (last) return { lat: last.coords.latitude, lon: last.coords.longitude };
    const pos = await Promise.race([
      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
      new Promise((resolve) => setTimeout(() => resolve(null), timeout)),
    ]);
    return pos ? { lat: pos.coords.latitude, lon: pos.coords.longitude } : null;
  } catch {
    return null;
  }
}

// Distancia en linea recta (km) entre dos puntos.
export function distanceKm(a, b) {
  const rad = (d) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLon = rad(b.lon - a.lon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
}
