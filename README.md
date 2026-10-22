# Rumbo

Descubre Costa Rica a tu ritmo. Aplicación web pensada para el celular (se puede instalar en la pantalla de inicio) con:

- **Explorar:** destinos de Costa Rica con filtros por categoría y una ruta sugerida.
- **Destino:** ilustración animada que cambia con el clima, condiciones del día, pronóstico de 5 días y recomendaciones según el clima.
- **Mapa:** los destinos sobre un mapa esquemático del país.
- **Escanear:** tomas una foto de un monumento y la IA te dice qué es, su historia y datos curiosos.
- **Viajes:** itinerarios día por día según tus gustos, con ajustes por día ("más barato", "más aventura", "más tranquilo").
- **Cuentas:** registro e inicio de sesión; cada persona ve solo sus viajes y su diario de monumentos.

## Tecnologías

| Parte | Tecnología |
| --- | --- |
| Frontend | React 18 + Vite, React Router (rutas protegidas), Axios, Framer Motion, Lucide React |
| Backend | Node.js + Express 5, SQLite incluido en Node.js (`node:sqlite`), JWT, bcrypt, zod, multer, helmet |
| IA | API de Claude (Anthropic). Sin clave funciona en modo demo |
| Clima | Open-Meteo (gratis, sin clave). Sin internet usa valores de referencia |

## Estructura

```
rumbo/
├── backend/
│   ├── src/
│   │   ├── data/        ACCESO A DATOS: SQLite, repositorios y catálogo de destinos
│   │   ├── services/    LÓGICA DE NEGOCIO: auth, viajes, monumentos, clima, IA
│   │   ├── api/         API HTTP: rutas, validación y middlewares
│   │   ├── app.js       arma la aplicación Express
│   │   └── server.js    punto de entrada
│   ├── tests/           pruebas automáticas
│   └── .env.example
└── frontend/
    ├── public/          íconos y manifiesto (app instalable)
    └── src/
        ├── pages/       pantallas
        ├── components/  piezas reutilizables (escena ilustrada, barra inferior, etc.)
        ├── api/         llamadas al backend con Axios
        ├── context/     sesión y avisos
        └── styles/      tokens de diseño
```

Cada capa habla solo con la siguiente: frontend → API → lógica de negocio → acceso a datos.

## Requisitos

- **Node.js 22.13 o más nuevo** (recomendado: la versión LTS actual desde nodejs.org). La base de datos usa el SQLite que viene con Node, así que no hay que instalar ni compilar nada más. Compruébalo con `node --version`.
- **Visual Studio Code**.

## Cómo ejecutarla (Windows)

Abre la carpeta `rumbo` en VS Code y usa dos terminales (**Terminal → Nueva terminal**).

**Terminal 1, backend:**

```
cd backend
npm install
npm run setup
npm run dev
```

`npm run setup` crea el archivo `backend/.env` con un secreto de sesión aleatorio. Solo hace falta la primera vez.

**Terminal 2, frontend:**

```
cd frontend
npm install
npm run dev
```

Abre **http://localhost:5173**. Para verla como celular en Chrome, pulsa `F12` y luego el ícono de dispositivo móvil.

La próxima vez basta con `npm run dev` en cada carpeta. También puedes ir a **Terminal → Ejecutar tarea → Rumbo: iniciar todo** para levantar las dos partes de una vez.

### Activar la IA

Abre `backend/.env` y escribe tu clave en `ANTHROPIC_API_KEY=` (se obtiene en https://console.anthropic.com). Reinicia el backend. Sin clave, los itinerarios y el reconocimiento de monumentos devuelven ejemplos marcados como "modo demo".

Nunca subas `backend/.env` a GitHub; ya está en `.gitignore`.

### Probarla en tu celular

1. Conecta el celular a la misma red Wi-Fi que la computadora.
2. Inicia el frontend con `npm run dev -- --host`.
3. Abre en el celular la dirección "Network" que muestra la terminal (por ejemplo `http://192.168.1.20:5173`).

La cámara y el GPS del navegador necesitan HTTPS fuera de `localhost`. Para probar esas dos funciones en el celular usa un túnel HTTPS, como Cloudflare Tunnel o ngrok.

### Versión de producción

```
cd frontend
npm run build
cd ../backend
npm start
```

El backend sirve la app compilada en **http://localhost:4000**.

## Pruebas

```
cd backend
npm test
```

Son 31 pruebas. Usan una IA falsa y una base de datos en memoria, así que no gastan créditos ni tocan tus datos.

## Pendientes conocidos

- Google, Apple y "¿Olvidaste tu clave?" muestran "Disponible pronto": conectarlos requiere crear credenciales en esas plataformas y un servicio de correo.
- El mapa es esquemático, no cartográfico. La distancia de las rutas se calcula en línea recta, no por carretera.
- Los datos de los destinos son generales; revisa horarios y accesos antes de publicarlos.
