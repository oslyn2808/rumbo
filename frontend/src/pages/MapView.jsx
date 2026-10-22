import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { destinationsApi } from '../api/endpoints.js';
import { sceneVariant } from '../components/DestinationCard.jsx';
import Scene from '../components/Scene.jsx';
import { Button, Sheet } from '../components/ui.jsx';
import { useAsync } from '../hooks/useAsync.js';
import page from '../styles/page.module.css';
import styles from './MapView.module.css';

// Contorno simplificado de Costa Rica (longitud, latitud). Es un dibujo esquematico, no un mapa cartografico.
const OUTLINE = [
  [-85.72, 11.07], [-85.6, 11.1], [-85.3, 11.03], [-85.0, 11.0], [-84.7, 10.97], [-84.35, 10.95], [-84.0, 10.82],
  [-83.7, 10.78], [-83.66, 10.93], [-83.52, 10.57], [-83.25, 10.3], [-83.0, 10.0], [-82.8, 9.72], [-82.58, 9.57],
  [-82.62, 9.48], [-82.85, 9.35], [-82.95, 9.05], [-82.88, 8.75], [-82.9, 8.45], [-82.88, 8.05], [-83.1, 8.25],
  [-83.2, 8.45], [-83.15, 8.65], [-83.3, 8.72], [-83.4, 8.5], [-83.6, 8.4], [-83.72, 8.6], [-83.68, 8.72],
  [-83.6, 8.92], [-83.86, 9.22], [-84.16, 9.38], [-84.4, 9.5], [-84.63, 9.61], [-84.82, 9.9], [-84.85, 9.99],
  [-84.95, 10.1], [-85.2, 10.15], [-85.18, 9.95], [-84.95, 9.8], [-85.05, 9.65], [-85.12, 9.57], [-85.3, 9.7],
  [-85.5, 9.9], [-85.74, 10.15], [-85.92, 10.33], [-85.78, 10.6], [-85.75, 10.8], [-85.9, 10.92],
];

const W = 350;
const H = 325;
const project = ([lon, lat]) => [(lon + 86) * 100, (11.25 - lat) * 100];
const PATH = `${OUTLINE.map((p, i) => `${i ? 'L' : 'M'}${project(p).map((n) => n.toFixed(1)).join(' ')}`).join(' ')} Z`;

const CATEGORY_COLOR = { playas: '#2B8CBE', volcanes: '#D9532B', naturaleza: '#2F8F5B', aventura: '#E0932B' };
const LEGEND = [
  ['playas', 'Playas'],
  ['volcanes', 'Volcanes'],
  ['naturaleza', 'Naturaleza'],
  ['aventura', 'Aventura'],
];

export default function MapView() {
  const { data, loading, error, reload } = useAsync(() => destinationsApi.list());
  const [selectedId, setSelectedId] = useState(null);

  const items = data?.items ?? [];
  const selected = items.find((d) => d.id === selectedId) ?? null;
  const pins = useMemo(
    () => items.map((d) => ({ d, x: (project([d.lon, d.lat])[0] / W) * 100, y: (project([d.lon, d.lat])[1] / H) * 100 })),
    [items]
  );

  return (
    <div className={page.page}>
      <header className={page.hero}>
        <h1 className={`${page.heroTitle} serif`}>Mapa</h1>
        <p className={page.heroSub}>Toca un destino para ver el detalle.</p>
      </header>

      <Sheet className={page.grow}>
        <div className={styles.mapBox}>
          <div className={styles.aspect} style={{ aspectRatio: `${W} / ${H}` }}>
            <svg viewBox={`0 0 ${W} ${H}`} className={styles.svg} role="img" aria-label="Mapa esquemático de Costa Rica">
              <defs>
                <pattern id="dots" width="14" height="14" patternUnits="userSpaceOnUse">
                  <circle cx="2" cy="2" r="1" fill="#9CC3D1" opacity="0.5" />
                </pattern>
              </defs>
              <rect width={W} height={H} fill="url(#dots)" />
              <motion.path d={PATH} fill="#DDE9CB" stroke="#7FA787" strokeWidth="2.5" strokeLinejoin="round" initial={{ pathLength: 0, fillOpacity: 0 }} animate={{ pathLength: 1, fillOpacity: 1 }} transition={{ duration: 1.4, ease: 'easeInOut' }} />
              <text x="28" y="250" className={styles.sea}>Océano</text>
              <text x="28" y="268" className={styles.sea}>Pacífico</text>
              <text x="262" y="82" className={styles.sea}>Mar</text>
              <text x="262" y="100" className={styles.sea}>Caribe</text>
            </svg>

            {pins.map(({ d, x, y }, i) => {
              const on = d.id === selectedId;
              return (
                <motion.button
                  key={d.id}
                  type="button"
                  className={`${styles.pin} ${on ? styles.pinOn : ''}`}
                  style={{ left: `${x}%`, top: `${y}%`, '--pin': CATEGORY_COLOR[d.categories[0]] ?? '#17785C' }}
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: on ? 1.25 : 1, opacity: 1 }}
                  transition={{ delay: 0.5 + i * 0.05, type: 'spring', stiffness: 380, damping: 18 }}
                  onClick={() => setSelectedId(on ? null : d.id)}
                  aria-pressed={on}
                  aria-label={`${d.name}, ${d.region}`}
                >
                  <span className={styles.dot} />
                  <span className={`${styles.pinLabel} ${on ? styles.pinLabelOn : ''}`}>{d.name}</span>
                </motion.button>
              );
            })}
          </div>
          {loading && <p className={page.empty} role="status">Cargando destinos</p>}
          {error && (
            <div className={page.empty} role="alert">
              <p>{error}</p>
              <Button variant="outline" size="small" onClick={reload} style={{ marginTop: 12 }}>
                Reintentar
              </Button>
            </div>
          )}
        </div>

        <ul className={styles.legend} aria-label="Leyenda">
          {LEGEND.map(([key, label]) => (
            <li key={key}>
              <span className={styles.swatch} style={{ background: CATEGORY_COLOR[key] }} />
              {label}
            </li>
          ))}
        </ul>

        <div className={styles.chips} role="group" aria-label="Elegir destino">
          {items.map((d) => (
            <button key={d.id} type="button" className={styles.chip} aria-pressed={d.id === selectedId} onClick={() => setSelectedId(d.id === selectedId ? null : d.id)}>
              <span className={styles.swatch} style={{ background: CATEGORY_COLOR[d.categories[0]] }} />
              {d.name}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {selected ? (
            <motion.div key={selected.id} className={styles.card} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} transition={{ duration: 0.25 }}>
              <div className={styles.thumb}>
                <Scene kind={selected.scene} condition="sunny" variant={sceneVariant(selected.id)} animated={false} className={styles.thumbScene} label="" />
              </div>
              <div className={styles.cardBody}>
                <h2 className={styles.cardTitle}>{selected.name}</h2>
                <p className={page.muted}>
                  {selected.region} · {selected.tagline}
                </p>
                <Link to={`/destino/${selected.id}`} className={styles.cardLink}>
                  Ver destino <ArrowRight size={16} aria-hidden="true" />
                </Link>
              </div>
            </motion.div>
          ) : (
            !loading && !error && <p key="hint" className={`${page.empty} ${page.muted}`}>Selecciona un punto del mapa o un destino de la lista.</p>
          )}
        </AnimatePresence>
      </Sheet>
    </div>
  );
}
