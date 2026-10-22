import { AnimatePresence, motion, useInView, useReducedMotion } from 'framer-motion';
import { ArrowRight, MapPin } from 'lucide-react';
import { forwardRef, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { destinationsApi } from '../api/endpoints.js';
import Scene from './Scene.jsx';
import { CONDITION_ICON, CONDITION_LABEL } from './Weather.jsx';
import styles from './DestinationCard.module.css';

export const CATEGORY_LABEL = {
  playas: 'Playas',
  volcanes: 'Volcanes',
  aventura: 'Aventura',
  naturaleza: 'Naturaleza',
};

// Variante estable por destino, para que dos playas no se vean identicas.
export const sceneVariant = (id) => [...id].reduce((n, c) => n + c.charCodeAt(0), 0) % 3;

// Nombre compartido entre la ilustracion de la tarjeta y la cabecera de Destino:
// el navegador anima una hacia la otra al abrir el destino (View Transitions).
export const sceneTransitionName = (id) => `dest-${id}`;

const EASE = [0.22, 1, 0.36, 1];

// Espera (como maximo "ms") a que la nueva pantalla tenga dibujada la ilustracion del destino.
function waitForScene(id, ms = 600) {
  const start = performance.now();
  return new Promise((resolve) => {
    const tick = () => {
      if (document.querySelector(`[data-scene-for="${id}"]`) || performance.now() - start > ms) resolve();
      else setTimeout(tick, 16);
    };
    tick();
  });
}

// forwardRef: AnimatePresence con mode="popLayout" necesita medir la tarjeta al salir.
const DestinationCard = forwardRef(function DestinationCard({ destination: d, index = 0 }, outerRef) {
  const mediaRef = useRef(null);
  // La escena solo se anima mientras se ve al menos a la mitad; el clima se pide la primera vez que se acerca.
  const inView = useInView(mediaRef, { amount: 0.5 });
  const near = useInView(mediaRef, { once: true, margin: '200px 0px' });
  const [weather, setWeather] = useState(null);
  const navigate = useNavigate();
  const reduce = useReducedMotion();
  // Mientras la tarjeta entra, su escena queda quieta y sin animacion de acomodo ("layout"):
  // asi la entrada usa todo el rendimiento y no se traba. Despues se encienden ambas.
  const [settled, setSettled] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setSettled(true), 650 + Math.min(index, 6) * 70);
    return () => clearTimeout(t);
  }, [index]);

  useEffect(() => {
    if (!near) return undefined;
    let cancelled = false;
    destinationsApi
      .weather(d.id)
      .then((w) => !cancelled && setWeather(w))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [near, d.id]);

  const now = weather?.current;
  const condition = now?.condition ?? 'sunny';
  const night = now?.isDay === false;
  const Icon = CONDITION_ICON[condition] ?? CONDITION_ICON.sunny;
  const to = `/destino/${d.id}`;
  const state = { preview: d, weather };

  // La app usa <BrowserRouter>, donde la opcion viewTransition de React Router no aplica:
  // la transicion se arranca aqui. Sin soporte del navegador (o con clic modificado) el Link navega normal.
  const open = (e) => {
    if (!document.startViewTransition || reduce || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    document.startViewTransition(async () => {
      navigate(to, { state });
      await waitForScene(d.id);
    });
  };

  return (
    <motion.div
      ref={outerRef}
      layout={settled}
      initial={{ opacity: 0, y: 28, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.94, transition: { duration: 0.2 } }}
      transition={{ delay: Math.min(index, 6) * 0.07, duration: 0.55, ease: EASE, layout: { type: 'spring', stiffness: 380, damping: 36 } }}
    >
      <Link to={to} state={state} onClick={open} className={styles.card} aria-label={`${d.name}, ${d.tagline}`}>
        <div ref={mediaRef} className={styles.media} style={{ viewTransitionName: sceneTransitionName(d.id) }}>
          <Scene kind={d.scene} condition={condition} night={night} wind={now?.windKmh ?? 0} variant={sceneVariant(d.id)} animated={inView && settled} lite className={styles.scene} label="" />
          <span className={styles.region}>
            <MapPin size={13} aria-hidden="true" />
            {d.region}
          </span>
          <AnimatePresence>
            {now && Number.isFinite(now.temperature) && (
              <motion.span
                className={styles.weather}
                initial={{ opacity: 0, y: -8, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                aria-label={`${CONDITION_LABEL[condition]}, ${now.temperature} grados`}
              >
                <Icon size={15} aria-hidden="true" />
                {now.temperature}°
              </motion.span>
            )}
          </AnimatePresence>
        </div>
        <div className={styles.body}>
          <div className={styles.text}>
            <h3 className={styles.name}>{d.name}</h3>
            <p className={styles.tag}>{d.tagline}</p>
            <div className={styles.cats}>
              {d.categories.map((c) => (
                <span key={c} className={styles.cat}>
                  {CATEGORY_LABEL[c] ?? c}
                </span>
              ))}
            </div>
          </div>
          <span className={styles.go} aria-hidden="true">
            <ArrowRight size={20} />
          </span>
        </div>
      </Link>
    </motion.div>
  );
});

export default DestinationCard;
