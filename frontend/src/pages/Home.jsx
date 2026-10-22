import { AnimatePresence, motion } from 'framer-motion';
import { Camera, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { destinationsApi } from '../api/endpoints.js';
import DestinationCard from '../components/DestinationCard.jsx';
import Topography from '../components/Topography.jsx';
import { Button, Sheet, uiStyles } from '../components/ui.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useAsync } from '../hooks/useAsync.js';
import page from '../styles/page.module.css';
import { firstName, initials, normalize } from '../utils/format.js';
import styles from './Home.module.css';

const FILTERS = [
  ['todo', 'Todo'],
  ['playas', 'Playas'],
  ['volcanes', 'Volcanes'],
  ['aventura', 'Aventura'],
  ['naturaleza', 'Naturaleza'],
];
const POPULAR_COUNT = 4;
const EASE = [0.22, 1, 0.36, 1];

// Entrada escalonada del encabezado: cada hijo sube un poco despues del anterior.
const heroMotion = { hidden: {}, show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } } };
const rise = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } } };

export default function Home() {
  const { user } = useAuth();
  const destinations = useAsync(() => destinationsApi.list());
  const route = useAsync(() => destinationsApi.featuredRoute());

  const [filter, setFilter] = useState('todo');
  const [query, setQuery] = useState('');
  const [showAll, setShowAll] = useState(false);

  const items = destinations.data?.items ?? [];
  const filtering = filter !== 'todo' || query.trim() !== '';

  const visible = useMemo(() => {
    const needle = normalize(query.trim());
    const matches = items.filter(
      (d) =>
        (filter === 'todo' || d.categories.includes(filter)) &&
        (!needle || normalize(`${d.name} ${d.region} ${d.tagline}`).includes(needle))
    );
    return filtering || showAll ? matches : matches.slice(0, POPULAR_COUNT);
  }, [items, filter, query, filtering, showAll]);

  return (
    <div className={page.page}>
      <motion.header className={`${page.hero} ${styles.hero}`} variants={heroMotion} initial="hidden" animate="show">
        {/* Curvas de nivel animadas (WebGL) detras del saludo. */}
        <div className={styles.heroBg} aria-hidden="true">
          <Topography color="#5bd6ac" lineCount={18} glow={0.5} speed={0.18} tilt={40} fog={0.5} depthOfField={0.25} mouseStrength={0.5} intro={false} />
        </div>
        <motion.div variants={rise} className={page.heroRow}>
          <Link to="/perfil" className={styles.avatar} aria-label="Ir a mi perfil">
            {initials(user?.name)}
          </Link>
          <div className={page.grow}>
            <h1 className={styles.hello}>Hola, {firstName(user?.name)}</h1>
            <p className={page.heroSub} style={{ marginTop: 0 }}>
              ¿A dónde vamos hoy?
            </p>
          </div>
          <Link to="/escanear" className={page.iconButton} aria-label="Escanear un monumento">
            <Camera size={20} />
          </Link>
        </motion.div>

        <motion.div variants={rise} className={styles.search}>
          <Search size={18} aria-hidden="true" />
          <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar destinos" aria-label="Buscar destinos" />
        </motion.div>

        <motion.div variants={rise} className={styles.titleRow}>
          <h2 className={`${page.sectionTitle} serif`}>Destinos populares</h2>
          {!filtering && items.length > POPULAR_COUNT && (
            <button type="button" className={styles.seeAll} onClick={() => setShowAll((s) => !s)}>
              {showAll ? 'Ver menos' : 'Ver todo'}
            </button>
          )}
        </motion.div>
      </motion.header>

      <Sheet className={page.grow}>
        <div className={styles.chips} role="group" aria-label="Filtrar por categoría">
          {FILTERS.map(([key, label], i) => {
            const on = filter === key;
            return (
              <motion.button
                key={key}
                type="button"
                aria-pressed={on}
                className={`${uiStyles.chip} ${styles.chip}`}
                onClick={() => setFilter(key)}
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.25 + i * 0.05, duration: 0.4, ease: EASE }}
              >
                {on && <motion.span layoutId="filterPill" className={styles.chipPill} transition={{ type: 'spring', stiffness: 420, damping: 34 }} />}
                <span className={styles.chipLabel}>{label}</span>
              </motion.button>
            );
          })}
        </div>

        {destinations.loading && <div className={styles.skeletons} aria-busy="true" aria-label="Cargando destinos">{[0, 1].map((i) => <div key={i} className={styles.skeleton} />)}</div>}

        {destinations.error && (
          <div className={page.empty} role="alert">
            <p>{destinations.error}</p>
            <Button variant="outline" size="small" onClick={destinations.reload} style={{ marginTop: 12 }}>
              Reintentar
            </Button>
          </div>
        )}

        {!destinations.loading && !destinations.error && (
          <div className={page.stack} style={{ marginTop: 16 }}>
            <AnimatePresence mode="popLayout">
              {visible.map((d, i) => (
                <DestinationCard key={d.id} destination={d} index={i} />
              ))}
            </AnimatePresence>
            {visible.length === 0 && (
              <motion.p className={page.empty} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                No encontramos destinos con ese filtro.
              </motion.p>
            )}
          </div>
        )}

        {route.data && !filtering && (
          <motion.section className={styles.route} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }} aria-labelledby="route-title">
            <h2 id="route-title" className={`${styles.routeTitle} serif`}>
              {route.data.title}
            </h2>
            <p className={page.muted}>
              {route.data.label} · {route.data.approxKm} km en línea recta
            </p>
            <ol className={styles.stops}>
              {route.data.stops.map((s) => (
                <li key={s.id} className={styles.stop}>
                  <span className={styles.stopNumber}>{s.day}</span>
                  <Link to={`/destino/${s.id}`} className={styles.stopText}>
                    <strong>{s.name}</strong>
                    <em>
                      Día {s.day} · {s.theme}
                    </em>
                  </Link>
                </li>
              ))}
            </ol>
            <Button block to={`/viajes/nuevo?destino=${encodeURIComponent(route.data.stops.map((s) => s.name).join(', '))}&dias=${route.data.stops.length}`}>
              Planear esta ruta
            </Button>
          </motion.section>
        )}
      </Sheet>
    </div>
  );
}
