import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, Cloud, CloudLightning, CloudRain, Lightbulb, MapPin, Moon, Rainbow, RotateCw, Sun, Wind } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { destinationsApi } from '../api/endpoints.js';
import { sceneTransitionName, sceneVariant } from '../components/DestinationCard.jsx';
import Scene from '../components/Scene.jsx';
import { Badge, Button, Sheet } from '../components/ui.jsx';
import { CONDITION_ICON, CONDITION_LABEL, CONDITION_NOTE } from '../components/Weather.jsx';
import { CountUp, DayCards, TodayCards, cardsMotion } from '../components/WeatherCards.jsx';
import { useAsync } from '../hooks/useAsync.js';
import { longDate } from '../utils/format.js';
import styles from './Destination.module.css';

// Modo demo (?demo en la direccion): botones para forzar el clima de la escena.
// Sirve para grabar videos y para revisar cada clima sin esperar a que ocurra.
const DEMO = [
  { id: 'sunny', icon: Sun, label: 'Sol', condition: 'sunny' },
  { id: 'cloudy', icon: Cloud, label: 'Nubes', condition: 'cloudy' },
  { id: 'wind', icon: Wind, label: 'Viento', condition: 'partly', wind: 45, text: 'Ventoso' },
  { id: 'rain', icon: CloudRain, label: 'Lluvia', condition: 'rain' },
  { id: 'storm', icon: CloudLightning, label: 'Tormenta', condition: 'storm' },
  { id: 'rainbow', icon: Rainbow, label: 'Arcoíris', condition: 'partly', rainbow: true, text: 'Despejando' },
  { id: 'night', icon: Moon, label: 'Noche', condition: 'sunny', night: true },
];

export default function Destination() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dest = useAsync(() => destinationsApi.get(id), [id]);
  const weather = useAsync(() => destinationsApi.weather(id), [id]);
  const [day, setDay] = useState(0);
  const [params] = useSearchParams();
  const demoMode = params.has('demo');
  const [sim, setSim] = useState(null);

  useEffect(() => setDay(0), [id]);

  // La tarjeta de Explorar manda el destino y su clima: asi la pantalla se dibuja completa desde el
  // primer cuadro y la transicion empalma con la ilustracion, mientras llegan los datos frescos.
  const { state: nav } = useLocation();
  const preview = nav?.preview?.id === id ? nav : null;
  const d = dest.data ?? preview?.preview ?? null;
  const w = weather.data ?? preview?.weather ?? null;
  const selected = w?.days[day];
  const isToday = day === 0;
  // Hoy muestra el cielo de este momento; los demas dias, el resumen del pronostico.
  const demo = DEMO.find((x) => x.id === sim);
  const condition = demo?.condition ?? (isToday ? w?.current.condition : selected?.condition) ?? selected?.condition ?? 'sunny';
  const night = demo ? Boolean(demo.night) : Boolean(isToday && w && w.current.isDay === false);
  const rainbow = demo ? Boolean(demo.rainbow) : !night && condition === 'partly' && (selected?.rainChance ?? 0) >= 50;
  const wind = demo ? demo.wind ?? 0 : isToday ? w?.current.windKmh ?? 0 : 0;
  const conditionText = demo?.text ?? CONDITION_LABEL[condition];
  const temp = isToday ? w?.current.temperature ?? selected?.max : selected?.max;
  const darkSky = night || condition === 'storm' || condition === 'rain';
  const planLink = d ? `/viajes/nuevo?destino=${encodeURIComponent(d.name)}&dias=3` : '/viajes/nuevo';

  if (dest.error) {
    return (
      <div className={styles.page}>
        <div className={styles.errorBox} role="alert">
          <p>{dest.error}</p>
          <Button variant="mint" size="small" onClick={() => navigate('/explorar')}>
            Volver al inicio
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.scroll}>
        <div className={`${styles.hero} ${darkSky ? styles.heroDark : ''}`}>
          <div className={styles.sceneWrap} data-scene-for={id} style={{ viewTransitionName: sceneTransitionName(id) }}>
            <Scene
            kind={d?.scene ?? 'beach'}
            variant={d ? sceneVariant(d.id) % 2 : 0}
            condition={condition}
            rainbow={rainbow}
            night={night}
            wind={wind}
            tall
            className={styles.scene}
            label={d ? `Ilustración de ${d.name}` : ''}
            />
          </div>
          <div className={styles.topBar}>
            <button type="button" className={styles.roundBtn} onClick={() => (window.history.state?.idx > 0 ? navigate(-1) : navigate('/explorar'))} aria-label="Volver">
              <ArrowLeft size={20} />
            </button>
            <span className={styles.locationPill}>
              <MapPin size={16} aria-hidden="true" />
              {d?.name ?? 'Cargando'}
            </span>
            <button type="button" className={styles.roundBtn} onClick={weather.reload} aria-label="Actualizar clima" disabled={weather.loading}>
              <RotateCw size={18} />
            </button>
          </div>

          <div className={styles.overlay}>
            <div className={styles.reading} aria-live="polite">
              {w ? (
                <>
                  <p className={styles.temp}>
                    <CountUp value={temp} />
                    <span>°C</span>
                  </p>
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.p
                      key={conditionText + night}
                      className={styles.condition}
                      initial={{ opacity: 0, y: 8, filter: 'blur(4px)' }}
                      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                      exit={{ opacity: 0, y: -8, filter: 'blur(4px)' }}
                      transition={{ duration: 0.3 }}
                    >
                      {night && <Moon size={18} aria-hidden="true" />}
                      {conditionText}
                      {night && <span className={styles.nightTag}> · de noche</span>}
                    </motion.p>
                  </AnimatePresence>
                </>
              ) : (
                <p className={styles.condition}>{weather.error ? 'Clima no disponible' : 'Cargando clima'}</p>
              )}
            </div>

            {w && (
              <motion.div className={styles.days} role="tablist" aria-label="Pronóstico por día" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.5 }}>
                {w.days.map((x, i) => {
                  const Icon = CONDITION_ICON[x.condition] ?? CONDITION_ICON.cloudy;
                  const on = i === day;
                  return (
                    <button key={x.date} type="button" role="tab" aria-selected={on} className={`${styles.dayBtn} ${on ? styles.dayOn : ''}`} onClick={() => setDay(i)} aria-label={`${x.label}: ${CONDITION_LABEL[x.condition]}, máxima ${x.max} grados`}>
                      {on && <motion.span layoutId="dayPill" className={styles.dayPill} transition={{ type: 'spring', stiffness: 420, damping: 34 }} />}
                      <Icon size={18} aria-hidden="true" />
                      {on && (
                        <motion.span className={styles.dayLabel} initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.08 }}>
                          {x.label}
                        </motion.span>
                      )}
                    </button>
                  );
                })}
              </motion.div>
            )}

            {w && demoMode && (
              <div className={`${styles.days} ${styles.demo}`} role="group" aria-label="Simular clima">
                {DEMO.map((x) => {
                  const on = x.id === sim;
                  return (
                    <button key={x.id} type="button" aria-pressed={on} aria-label={x.label} className={`${styles.dayBtn} ${on ? styles.dayOn : ''}`} onClick={() => setSim(on ? null : x.id)}>
                      {on && <motion.span layoutId="demoPill" className={styles.dayPill} transition={{ type: 'spring', stiffness: 420, damping: 34 }} />}
                      <x.icon size={18} aria-hidden="true" />
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <Sheet className={styles.sheet}>
          <div className={styles.titleRow}>
            <div>
              <h1 className={`${styles.h1} serif`}>{isToday ? 'Condiciones de hoy' : `Pronóstico: ${selected?.label}`}</h1>
              <p className={styles.date}>
                {selected ? `${longDate(new Date(`${selected.date}T12:00:00`))} · ${CONDITION_NOTE[condition]}` : 'Consultando el clima de la zona.'}
              </p>
            </div>
            {w && <Badge tone={w.live ? 'good' : 'warn'}>{w.live ? 'En vivo' : 'Referencia'}</Badge>}
          </div>

          {weather.loading && !w && <div className={styles.skeleton} aria-busy="true" aria-label="Cargando clima" />}
          {weather.error && (
            <div className={styles.inlineError} role="alert">
              {weather.error}
              <Button variant="outline" size="small" onClick={weather.reload}>
                Reintentar
              </Button>
            </div>
          )}

          {w && (
            <AnimatePresence mode="wait">
              <motion.div key={day} className={styles.metrics} variants={cardsMotion} initial="hidden" animate="show" exit={{ opacity: 0, transition: { duration: 0.15 } }}>
                {isToday ? <TodayCards current={w.current} today={selected} days={w.days} /> : <DayCards day={selected} index={day} days={w.days} />}
              </motion.div>
            </AnimatePresence>
          )}

          {w && (
            <section aria-labelledby="rec-title" className={styles.section}>
              <h2 id="rec-title" className={`${styles.h2} serif`}>
                Recomendaciones
              </h2>
              <p className={styles.muted}>Según el pronóstico de la zona</p>
              <div className={styles.recs}>
                {w.recommendations.map((r) => (
                  <article key={r.id} className={styles.rec}>
                    <div className={styles.recHead}>
                      <span className={styles.recIcon}>
                        <Lightbulb size={18} aria-hidden="true" />
                      </span>
                      <div>
                        <h3 className={styles.recTitle}>{r.title}</h3>
                        <p className={styles.recWhen}>{r.tag}</p>
                      </div>
                    </div>
                    <p className={styles.muted}>{r.body}</p>
                    <Button variant="outline" block size="small" to={planLink}>
                      {r.action.label}
                    </Button>
                  </article>
                ))}
              </div>
            </section>
          )}

          {d && (
            <section className={styles.section} aria-labelledby="about-title">
              <h2 id="about-title" className={`${styles.h2} serif`}>
                Sobre {d.name}
              </h2>
              <p className={styles.about}>{d.description}</p>
              <p className={styles.best}>{d.bestTime}</p>
              <h3 className={styles.h3}>Qué hacer</h3>
              <ul className={styles.todo}>
                {d.highlights.map((h) => (
                  <li key={h}>{h}</li>
                ))}
              </ul>
              <Button block to={planLink}>
                Planear viaje a {d.name}
              </Button>
              <Link to="/mapa" className={styles.mapLink}>
                Ver en el mapa
              </Link>
            </section>
          )}
        </Sheet>
      </div>
    </div>
  );
}
