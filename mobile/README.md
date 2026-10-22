# Rumbo móvil (Expo)

App nativa de Rumbo para Android e iPhone, hecha con Expo (React Native, SDK 57). Usa el mismo backend de `../backend`.

## Probarla en tu celular con Expo Go

1. El celular y la computadora tienen que estar en la **misma red Wi-Fi**.
2. **Terminal 1, backend** (desde la carpeta `rumbo`):

   ```
   cd backend
   npm run dev
   ```

3. **Terminal 2, app móvil:**

   ```
   cd mobile
   npm install
   npx expo start
   ```

   `npm install` solo hace falta la primera vez.

4. Escanea el código QR que aparece en la terminal:
   - **Android:** ábrelo desde la app Expo Go (botón "Scan QR code").
   - **iPhone:** ábrelo con la cámara del iPhone y toca el aviso de Expo Go.

La app se conecta sola al backend usando la IP de tu computadora y el puerto 4000. En **Perfil**, abajo, se ve la dirección que está usando.

## Si no conecta

- **"No se pudo conectar con el servidor":** la primera vez que corres el backend, Windows puede preguntar si permites que Node.js use la red. Elige **Permitir** en redes privadas. Si ya lo rechazaste, abre "Firewall de Windows Defender → Permitir una aplicación" y marca Node.js en **Privada**. Tu Wi-Fi también debe estar marcada como red privada.
- **El QR no abre o se queda cargando:** prueba `npx expo start --tunnel`. Con túnel la app abre, pero el backend no queda accesible por esa vía; en ese caso crea `mobile/.env` (copia de `.env.example`) con la IP de tu computadora (la ves con `ipconfig`, "Dirección IPv4").
- **Expo Go dice que el proyecto es de otra versión del SDK:** actualiza Expo Go desde la tienda.

Después de cambiar `.env`, reinicia con `npx expo start --clear`.

## Qué incluye

- Inicio de sesión y registro (la sesión se guarda en el almacenamiento seguro del celular).
- Explorar destinos con filtros y la ruta sugerida; si ya diste permiso de ubicación, cada destino muestra a cuántos km está.
- Destino con ilustración animada según el clima, pronóstico y recomendaciones.
- Mapa esquemático con botón de "mi ubicación" (GPS) que te muestra el destino más cercano.
- Escanear: cámara del celular (`expo-camera`) o galería, con tu ubicación opcional (`expo-location`), e identificación con IA.
- Viajes: itinerarios con IA, ajustes por día, guardar y borrar.
- Perfil con tu diario de monumentos.

## Estructura

```
mobile/
├── App.js            navegación (pestañas + pantallas) y fuentes
├── app.json          nombre, ícono y textos de permisos
└── src/
    ├── api/          llamadas al backend (fetch)
    ├── components/   piezas reutilizables (escena ilustrada, tarjetas, botones)
    ├── context/      sesión y avisos
    ├── screens/      pantallas
    └── utils/        cámara/GPS, formato y almacenamiento
```
