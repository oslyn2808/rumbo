import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, CloudRain, Info, LoaderCircle, Utensils } from 'lucide-react';
import { useState } from 'react';
import { money } from '../utils/format.js';
import { Note } from './ui.jsx';
import styles from './PlanView.module.css';

const TWEAKS = [
  ['Más barato', 'hazlo más económico'],
  ['Más aventura', 'añade más aventura y actividad física'],
  ['Más tranquilo', 'hazlo más tranquilo y relajado'],
];

const dayTotal = (d) => d.activities.reduce((s, a) => s + (a.costUsd || 0), 0);

// Muestra un itinerario como linea de tiempo: un numero por dia, con el detalle desplegable.
export default function PlanView({ plan, onRegenerate, regenerating }) {
  const [open, setOpen] = useState(0);
  const total = plan.days.reduce((s, d) => s + dayTotal(d), 0);
  const route = plan.route;

  return (
    <div className={styles.plan}>
      <header>
        <h2 className={`${styles.title} serif`}>{plan.title}</h2>
        {route?.places?.length > 0 && (
          <p className={styles.route}>
            {route.places.join(' → ')}
            {route.approxKm ? ` · ${route.approxKm} km en línea recta` : ''}
          </p>
        )}
        {plan.overview && <p className={styles.overview}>{plan.overview}</p>}
        {total > 0 && <p className={styles.cost}>Costo aproximado de actividades: {money(total)} USD</p>}
      </header>

      {plan.demo && <Note icon={Info}>Plan de ejemplo del modo demo. Activa la IA para recibir un itinerario adaptado a tus gustos.</Note>}
      {plan.bestTimeNote && <p className={styles.best}>{plan.bestTimeNote}</p>}

      <ol className={styles.timeline}>
        {plan.days.map((d, i) => {
          const isOpen = open === i;
          const busy = regenerating === d.day;
          return (
            <li key={d.day} className={styles.item}>
              <span className={styles.number}>{d.day}</span>
              <div className={styles.card}>
                <button type="button" className={styles.head} onClick={() => setOpen(isOpen ? -1 : i)} aria-expanded={isOpen} aria-controls={`day-${d.day}`}>
                  <span>
                    <strong>{d.place}</strong>
                    <em>
                      Día {d.day}
                      {d.theme ? ` · ${d.theme}` : ''}
                    </em>
                  </span>
                  <ChevronDown size={20} aria-hidden="true" className={isOpen ? styles.flip : ''} />
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div id={`day-${d.day}`} initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }} style={{ overflow: 'hidden' }}>
                      <div className={styles.body}>
                        {d.activities.map((a) => (
                          <div key={`${a.time}-${a.title}`} className={styles.activity}>
                            {a.time && <span className={styles.time}>{a.time}</span>}
                            <div>
                              <p className={styles.actTitle}>
                                {a.title}
                                {a.costUsd > 0 && <span className={styles.price}> · ~{money(a.costUsd)}</span>}
                              </p>
                              {a.details && <p className={styles.details}>{a.details}</p>}
                            </div>
                          </div>
                        ))}
                        {d.foodTip && (
                          <p className={styles.tip}>
                            <Utensils size={16} aria-hidden="true" />
                            {d.foodTip}
                          </p>
                        )}
                        {d.rainPlan && (
                          <p className={styles.tip}>
                            <CloudRain size={16} aria-hidden="true" />
                            <span>
                              <strong>Plan B: </strong>
                              {d.rainPlan}
                            </span>
                          </p>
                        )}
                        {onRegenerate && (
                          <div className={styles.tweaks} role="group" aria-label={`Ajustar el día ${d.day}`}>
                            {busy ? (
                              <span className={styles.busy} role="status">
                                <LoaderCircle size={16} className={styles.spin} aria-hidden="true" />
                                Reescribiendo el día
                              </span>
                            ) : (
                              TWEAKS.map(([label, instruction]) => (
                                <button key={label} type="button" className={styles.tweak} disabled={Boolean(regenerating)} onClick={() => onRegenerate(d.day, instruction)}>
                                  {label}
                                </button>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </li>
          );
        })}
      </ol>

      {plan.extraIdeas?.length > 0 && (
        <section className={styles.block}>
          <h3>Más ideas</h3>
          <ul>
            {plan.extraIdeas.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        </section>
      )}
      {plan.packingTips?.length > 0 && (
        <section className={styles.block}>
          <h3>Qué llevar</h3>
          <ul>
            {plan.packingTips.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
