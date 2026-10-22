import { animate, motion, useMotionValue, useReducedMotion, useTransform } from 'framer-motion';
import { CloudRain, Droplets, Sun, Sunrise, Thermometer, Wind } from 'lucide-react';
import { useEffect } from 'react';
import styles from './WeatherCards.module.css';

// Tarjetas del clima con micro-animaciones: curva que se dibuja, tubo que se llena,
// molino que gira con el viento real, barra de lluvia, medidor UV y arco del sol.

const EASE = [0.22, 1, 0.36, 1];

export const cardsMotion = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};
const cardMotion = {
  hidden: { opacity: 0, y: 18, scale: 0.97 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.55, ease: EASE } },
};

// Numero que "cuenta" hasta su valor cada vez que cambia.
export function CountUp({ value, decimals = 0, suffix = '' }) {
  const reduce = useReducedMotion();
  const mv = useMotionValue(Number.isFinite(value) ? value : 0);
  const text = useTransform(mv, (v) => `${v.toFixed(decimals)}${suffix}`);
  useEffect(() => {
    if (!Number.isFinite(value)) return undefined;
    if (reduce) {
      mv.set(value);
      return undefined;
    }
    const controls = animate(mv, value, { duration: 0.9, ease: EASE });
    return () => controls.stop();
  }, [value, reduce, mv]);
  if (!Number.isFinite(value)) return <span>--</span>;
  return <motion.span>{text}</motion.span>;
}

function Card({ icon: Icon, tone, label, value, hint, visual, wide, children }) {
  return (
    <motion.div variants={cardMotion} className={`${styles.card} ${wide ? styles.wide : ''}`}>
      <div className={styles.top}>
        <span className={`${styles.icon} ${styles[tone]}`}>
          <Icon size={18} aria-hidden="true" />
        </span>
        {visual}
      </div>
      <p className={styles.label}>{label}</p>
      {value != null && <p className={styles.value}>{value}</p>}
      {hint && <p className={styles.hint}>{hint}</p>}
      {children}
    </motion.div>
  );
}

/* ---------- Visuales ---------- */

function Curve({ values, active = 0, width = 96, height = 38 }) {
  const nums = values.map((v) => (Number.isFinite(v) ? v : null));
  const ok = nums.filter((v) => v != null);
  if (ok.length < 2) return null;
  const min = Math.min(...ok);
  const span = Math.max(...ok) - min || 1;
  const pts = nums.map((v, i) => [(i / (nums.length - 1)) * (width - 8) + 4, height - 5 - (((v ?? min) - min) / span) * (height - 12)]);
  const d = pts.map(([x, y], i) => {
    if (!i) return `M${x} ${y}`;
    const [px, py] = pts[i - 1];
    const cx = (px + x) / 2;
    return `C${cx} ${py} ${cx} ${y} ${x} ${y}`;
  });
  const [ax, ay] = pts[Math.min(active, pts.length - 1)];
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
      <motion.path d={d.join(' ')} fill="none" stroke="#F4A940" strokeWidth="2.4" strokeLinecap="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.1, ease: EASE }} />
      <motion.circle r="4.5" fill="#FFFFFF" stroke="#F4A940" strokeWidth="2.4" initial={false} animate={{ cx: ax, cy: ay }} transition={{ type: 'spring', stiffness: 260, damping: 22 }} />
    </svg>
  );
}

function Tube({ percent, color = '#4C9BE8' }) {
  const p = Math.max(0, Math.min(100, percent ?? 0));
  return (
    <div className={styles.tube} aria-hidden="true">
      <motion.div className={styles.tubeFill} style={{ background: color }} initial={{ height: '0%' }} animate={{ height: `${p}%` }} transition={{ duration: 1.2, ease: EASE, delay: 0.2 }}>
        <span className={styles.tubeWave} />
      </motion.div>
    </div>
  );
}

function Windmill({ kmh }) {
  const reduce = useReducedMotion();
  // Mas viento, mas rapido. Sin viento gira muy lento para que se note vivo.
  const duration = Math.max(0.5, 7 - (kmh ?? 0) / 5);
  return (
    <svg width="46" height="46" viewBox="0 0 46 46" aria-hidden="true">
      <path d="M23 22 L20 45 H26 Z" fill="#C9D4D0" />
      <motion.g animate={reduce ? undefined : { rotate: 360 }} transition={{ duration, repeat: Infinity, ease: 'linear' }}>
        {/* Circulo invisible: centra la caja del rotor para que gire sobre su eje. */}
        <circle cx="23" cy="20" r="18" fill="none" />
        {[0, 120, 240].map((deg) => (
          <path key={deg} d="M23 20 L21 4 Q 23 1 25 4 Z" fill="#2E3A36" transform={`rotate(${deg} 23 20)`} />
        ))}
      </motion.g>
      <circle cx="23" cy="20" r="2.6" fill="#F4A940" />
    </svg>
  );
}

function Compass({ deg }) {
  if (!Number.isFinite(deg)) return null;
  return (
    <span className={styles.compass} aria-hidden="true">
      <motion.svg width="16" height="16" viewBox="0 0 16 16" initial={{ rotate: 0 }} animate={{ rotate: deg + 180 }} transition={{ type: 'spring', stiffness: 80, damping: 12 }}>
        <path d="M8 1 L12 13 L8 10 L4 13 Z" fill="currentColor" />
      </motion.svg>
    </span>
  );
}

function Bar({ percent, color }) {
  return (
    <div className={styles.bar} aria-hidden="true">
      <motion.span style={{ background: color }} initial={{ width: '0%' }} animate={{ width: `${Math.max(0, Math.min(100, percent ?? 0))}%` }} transition={{ duration: 1.1, ease: EASE, delay: 0.25 }} />
    </div>
  );
}

const UV_LEVELS = [
  [2, 'Bajo', '#3FAE6A', 'Puedes estar al sol sin protección especial.'],
  [5, 'Moderado', '#E0A82E', 'Bloqueador SPF 30+ si pasas tiempo afuera.'],
  [7, 'Alto', '#EE7B30', 'SPF 50, sombrero y sombra entre 10 a. m. y 3 p. m.'],
  [10, 'Muy alto', '#E0483A', 'Evita el sol del mediodía y reaplica bloqueador.'],
  [Infinity, 'Extremo', '#9B4FD0', 'Evita la exposición directa al sol.'],
];
const uvLevel = (uv) => UV_LEVELS.find(([max]) => uv <= max);

function UvMeter({ uv }) {
  const pos = Math.min(100, (Math.max(0, uv) / 11) * 100);
  return (
    <div aria-hidden="true">
      <div className={styles.uvTrack}>
        <motion.span className={styles.uvKnob} initial={{ left: '0%' }} animate={{ left: `${pos}%` }} transition={{ type: 'spring', stiffness: 70, damping: 14, delay: 0.3 }} />
      </div>
      <div className={styles.uvScale}>
        <span>Bajo</span>
        <span>Moderado</span>
        <span>Alto</span>
        <span>Extremo</span>
      </div>
    </div>
  );
}

const toMinutes = (hhmm) => {
  if (!hhmm) return null;
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};
const fmtHours = (min) => {
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  return h ? `${h} h ${m ? `${m} min` : ''}`.trim() : `${m} min`;
};

// Hora actual en Costa Rica (todos los destinos estan ahi), sin importar donde este la persona.
export function costaRicaMinutes(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'America/Costa_Rica', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(date);
  const get = (t) => Number(parts.find((p) => p.type === t)?.value ?? 0);
  return get('hour') * 60 + get('minute');
}

function SunArc({ sunrise, sunset, now }) {
  const rise = toMinutes(sunrise);
  const set = toMinutes(sunset);
  if (rise == null || set == null) return null;
  // Sin hora (otro dia) el sol se dibuja al mediodia; de noche no se dibuja.
  const t = now == null ? 0.5 : (now - rise) / (set - rise);
  const visible = t >= 0 && t <= 1;
  const W = 280;
  const H = 74;
  // Arco: semielipse de (14,H-8) a (W-14,H-8).
  const point = (u) => {
    const a = Math.PI * (1 - u);
    return [W / 2 + (W / 2 - 14) * Math.cos(a), H - 8 - (H - 18) * Math.sin(a)];
  };
  const arc = `M14 ${H - 8} A ${W / 2 - 14} ${H - 18} 0 0 1 ${W - 14} ${H - 8}`;
  const [sx, sy] = point(visible ? t : 0);
  return (
    <svg className={styles.arc} viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
      <path d={arc} fill="none" stroke="#EADFC8" strokeWidth="2" strokeDasharray="4 5" />
      {visible && (
        <motion.path d={arc} fill="none" stroke="#F4A940" strokeWidth="2.6" strokeLinecap="round" initial={{ pathLength: 0 }} animate={{ pathLength: t }} transition={{ duration: 1.4, ease: EASE }} />
      )}
      <line x1="4" y1={H - 8} x2={W - 4} y2={H - 8} stroke="#EADFC8" strokeWidth="1.5" />
      {visible && (
        <motion.g initial={{ x: 14, y: H - 8, opacity: 0 }} animate={{ x: sx, y: sy, opacity: 1 }} transition={{ duration: 1.4, ease: EASE }}>
          <circle r="11" fill="#FFE9A3" opacity="0.6" />
          <circle r="6.5" fill="#F4A940" />
        </motion.g>
      )}
    </svg>
  );
}

/* ---------- Tarjetas ---------- */

export function TodayCards({ current, today, days }) {
  const uv = today?.uvMax ?? current.uv;
  const level = Number.isFinite(uv) ? uvLevel(uv) : null;
  const now = costaRicaMinutes();
  const rise = toMinutes(today?.sunrise);
  const set = toMinutes(today?.sunset);
  let sunHint = null;
  if (rise != null && set != null) {
    if (now < rise) sunHint = `Amanece a las ${today.sunrise}`;
    else if (now <= set) sunHint = `Quedan ${fmtHours(set - now)} de luz`;
    else sunHint = `Ya anocheció · amanece a las ${today.sunrise}`;
  }
  const dir = Number.isFinite(current.windDir) ? ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO'][Math.round(current.windDir / 45) % 8] : null;
  const windHint = [dir, Number.isFinite(current.gustKmh) ? `Ráfagas ${current.gustKmh}` : null].filter(Boolean).join(' · ');

  return (
    <>
      <Card
        icon={Thermometer}
        tone="sun"
        label="Temperatura"
        value={<CountUp value={current.temperature} suffix="°" />}
        hint={current.feelsLike != null ? `Sensación de ${current.feelsLike}°` : 'Valor de referencia'}
        visual={<Curve values={days.map((x) => x.max)} active={0} />}
      />
      <Card
        icon={Droplets}
        tone="ocean"
        label="Humedad"
        value={<CountUp value={current.humidity} suffix="%" />}
        hint={current.dewPoint != null ? `Punto de rocío ${current.dewPoint}°` : undefined}
        visual={<Tube percent={current.humidity} />}
      />
      {current.windKmh != null && (
        <Card
          icon={Wind}
          tone="mint"
          label="Viento"
          value={
            <>
              <CountUp value={current.windKmh} /> <small>km/h</small>
            </>
          }
          hint={
            windHint ? (
              <>
                <Compass deg={current.windDir} /> {windHint}
              </>
            ) : undefined
          }
          visual={<Windmill kmh={current.windKmh} />}
        />
      )}
      <Card icon={CloudRain} tone="rain" label="Prob. de lluvia" value={<CountUp value={today?.rainChance} suffix="%" />} hint={today?.rainMm != null ? `${today.rainMm} mm esperados` : undefined}>
        <Bar percent={today?.rainChance} color="#5B8FD9" />
      </Card>
      {level && (
        <Card icon={Sun} tone="uv" label="Índice UV máximo" wide>
          <p className={styles.uvValue}>
            <CountUp value={uv} />
            <span style={{ color: level[2] }}>{level[1]}</span>
          </p>
          <UvMeter uv={uv} />
          <p className={styles.hint}>{level[3]}</p>
        </Card>
      )}
      {sunHint && (
        <Card icon={Sunrise} tone="sun" label="Sol" wide hint={sunHint}>
          <SunArc sunrise={today.sunrise} sunset={today.sunset} now={now} />
          <div className={styles.arcTimes}>
            <span>{today.sunrise}</span>
            <span>{today.sunset}</span>
          </div>
        </Card>
      )}
    </>
  );
}

export function DayCards({ day, index, days }) {
  const level = Number.isFinite(day.uvMax) ? uvLevel(day.uvMax) : null;
  return (
    <>
      <Card
        icon={Thermometer}
        tone="sun"
        label="Máxima"
        value={<CountUp value={day.max} suffix="°" />}
        hint={day.min != null ? `Mínima de ${day.min}°` : undefined}
        visual={<Curve values={days.map((x) => x.max)} active={index} />}
      />
      <Card icon={CloudRain} tone="rain" label="Prob. de lluvia" value={<CountUp value={day.rainChance} suffix="%" />} hint={day.rainMm != null ? `${day.rainMm} mm esperados` : undefined}>
        <Bar percent={day.rainChance} color="#5B8FD9" />
      </Card>
      {level && (
        <Card icon={Sun} tone="uv" label="Índice UV máximo" wide>
          <p className={styles.uvValue}>
            <CountUp value={day.uvMax} />
            <span style={{ color: level[2] }}>{level[1]}</span>
          </p>
          <UvMeter uv={day.uvMax} />
          <p className={styles.hint}>{level[3]}</p>
        </Card>
      )}
      {day.sunrise && day.sunset && (
        <Card icon={Sunrise} tone="sun" label="Sol" wide hint={`${fmtHours(toMinutes(day.sunset) - toMinutes(day.sunrise))} de luz`}>
          <SunArc sunrise={day.sunrise} sunset={day.sunset} now={null} />
          <div className={styles.arcTimes}>
            <span>{day.sunrise}</span>
            <span>{day.sunset}</span>
          </div>
        </Card>
      )}
    </>
  );
}
