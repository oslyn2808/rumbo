import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useId } from 'react';
import s from './Scene.module.css';

// Ilustracion de un destino. "kind" elige el paisaje y "condition" el clima:
// sunny | partly | cloudy | rain | storm. "rainbow" agrega un arcoiris, "night" pasa a noche
// y "wind" (km/h) decide cuanto se mecen los arboles.
// tall={true} agrega cielo arriba (para la cabecera de Destino); animated={false} la deja quieta (miniaturas).
// lite={true} (tarjetas): menos particulas, sin desenfoques y sin los detalles diminutos, para que
// varias escenas a la vez no traben la pantalla.
//
// Las animaciones continuas viven en Scene.module.css. Ojo: un elemento con animacion CSS de
// transform pierde su atributo transform, por eso siempre van dentro de un <g> que lo posiciona.

const SKY = {
  day: {
    sunny: ['#58B4EC', '#D3EEFC'],
    partly: ['#73B9E6', '#DDEFF9'],
    cloudy: ['#9AAEC1', '#DDE5EC'],
    rain: ['#5E7387', '#A4B4C3'],
    storm: ['#334155', '#6D7D8F'],
  },
  night: {
    sunny: ['#0B1838', '#2A3E6C'],
    partly: ['#101D3B', '#30446E'],
    cloudy: ['#1A2436', '#3A475D'],
    rain: ['#131B29', '#2F3B4D'],
    storm: ['#0B111C', '#252F3E'],
  },
};
const SUNSET = ['#F2956A', '#FCE0B6'];

const CLOUD_FILL = {
  day: { sunny: '#FFFFFF', partly: '#FFFFFF', cloudy: '#EEF2F5', rain: '#B9C4CE', storm: '#7C8998' },
  night: { sunny: '#4A5A80', partly: '#4A5A80', cloudy: '#465169', rain: '#3A4457', storm: '#2C3442' },
};

// Cuantas nubes se ven segun el clima (las demas "entran" deslizandose al cambiar).
const CLOUD_COUNT = { sunny: 1, partly: 3, cloudy: 5, rain: 6, storm: 6 };
const CLOUDS = [
  { x: 86, y: 54, sc: 1, dur: 26, delay: -4 },
  { x: 262, y: 34, sc: 0.8, dur: 31, delay: -12 },
  { x: 168, y: 90, sc: 1.15, dur: 22, delay: -8 },
  { x: 336, y: 82, sc: 0.95, dur: 28, delay: -16 },
  { x: 30, y: 104, sc: 1.1, dur: 25, delay: -2 },
  { x: 210, y: 12, sc: 1.3, dur: 34, delay: -20 },
];

const SHADE = { sunny: 0, partly: 0, cloudy: 0.05, rain: 0.14, storm: 0.26 };

// Numeros pseudoaleatorios estables (para estrellas, gotas, etc.).
const rnd = (i, salt = 1) => {
  const x = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
};

/* ---------- Cielo ---------- */

function Cloud({ x, y, sc, fill, on, dur, delay }) {
  return (
    <g className={`${s.cloud} ${on ? s.cloudOn : ''}`}>
      <g transform={`translate(${x} ${y}) scale(${sc})`}>
        <g className={s.drift} style={{ animationDuration: `${dur}s`, animationDelay: `${delay}s` }}>
          <ellipse cx="0" cy="2" rx="44" ry="13" fill={fill} />
          <circle cx="-20" cy="-8" r="16" fill={fill} />
          <circle cx="4" cy="-16" r="22" fill={fill} />
          <circle cx="28" cy="-5" r="14" fill={fill} />
          <ellipse cx="0" cy="9" rx="40" ry="6" fill="#000" opacity="0.05" />
        </g>
      </g>
    </g>
  );
}

function Sun({ visible, y }) {
  return (
    <g className={s.celestial} opacity={visible} transform={`translate(312 ${y})`}>
      <g className={s.pulse}>
        <circle r="58" fill="#FFF1B8" opacity="0.35" />
      </g>
      <circle r="40" fill="#FFE58A" opacity="0.45" />
      <g className={s.spin}>
        {Array.from({ length: 14 }, (_, i) => (
          <line key={i} x1="0" y1="-33" x2="0" y2={i % 2 ? '-40' : '-46'} stroke="#FFCB3D" strokeWidth="3" strokeLinecap="round" transform={`rotate(${i * (360 / 14)})`} />
        ))}
      </g>
      <circle r="25" fill="#FFD04F" />
      <circle r="25" fill="url(#sunShine)" />
    </g>
  );
}

function Moon({ visible, y }) {
  return (
    <g className={s.celestial} opacity={visible} transform={`translate(312 ${y})`}>
      <g className={s.pulse}>
        <circle r="46" fill="#E9F0FF" opacity="0.12" />
      </g>
      <circle r="22" fill="#F4F1DE" />
      <circle cx="-7" cy="-5" r="5" fill="#DEDAC0" />
      <circle cx="6" cy="6" r="3.5" fill="#DEDAC0" />
      <circle cx="8" cy="-8" r="2.4" fill="#DEDAC0" />
    </g>
  );
}

function Stars({ top, lite }) {
  return (
    <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1.2 }}>
      {Array.from({ length: lite ? 22 : 46 }, (_, i) => (
        <circle
          key={i}
          className={s.twinkle}
          cx={rnd(i) * 400}
          cy={top + rnd(i, 2) * (150 - top)}
          r={rnd(i, 3) > 0.85 ? 1.6 : 0.9}
          fill="#FFFFFF"
          style={{ animationDelay: `${-rnd(i, 4) * 3}s`, animationDuration: `${2 + rnd(i, 5) * 2}s` }}
        />
      ))}
    </motion.g>
  );
}

function Birds({ y, color = '#22312D' }) {
  return (
    <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1 }}>
      <g transform={`translate(0 ${y})`}>
        <g className={s.flock}>
          {[
            [0, 0, 1],
            [16, -8, 0.8],
            [-14, -10, 0.7],
          ].map(([bx, by, sc], i) => (
            <g key={i} transform={`translate(${bx} ${by}) scale(${sc})`}>
              <path className={s.flap} d="M-8 0 Q -4 -6 0 0 Q 4 -6 8 0" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" style={{ animationDelay: `${-i * 0.17}s` }} />
            </g>
          ))}
        </g>
      </g>
    </motion.g>
  );
}

function Gusts() {
  return (
    <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} stroke="#FFFFFF" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.85">
      {[
        [40, 120],
        [150, 150],
        [90, 186],
        [230, 110],
      ].map(([x, y], i) => (
        <g key={i} transform={`translate(${x} ${y})`}>
          <path className={s.gust} d="M0 0 q 30 -8 60 0 q 14 4 18 -6" style={{ animationDelay: `${-i * 0.7}s` }} />
        </g>
      ))}
    </motion.g>
  );
}

function Rain({ storm, top, lite }) {
  const n = lite ? (storm ? 34 : 24) : storm ? 90 : 64;
  return (
    <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.8 }}>
      <g stroke="#E8F1F8" strokeWidth="1.5" strokeLinecap="round" opacity="0.7">
        {Array.from({ length: n }, (_, i) => {
          const x = rnd(i, 7) * 440;
          const y = top - 30 - rnd(i, 8) * 60;
          return (
            <line
              key={i}
              className={s.drop}
              x1={x}
              y1={y}
              x2={x - 4}
              y2={y + 14}
              style={{ animationDuration: `${(storm ? 0.55 : 0.75) + rnd(i, 9) * 0.3}s`, animationDelay: `${-rnd(i, 10)}s` }}
            />
          );
        })}
      </g>
      <g fill="none" stroke="#FFFFFF" strokeWidth="1" opacity="0.7">
        {Array.from({ length: lite ? 0 : 10 }, (_, i) => (
          <g key={i} transform={`translate(${30 + rnd(i, 11) * 340} ${226 + rnd(i, 12) * 28})`}>
            <ellipse className={s.splash} rx="6" ry="2" style={{ animationDelay: `${-rnd(i, 13) * 1.1}s` }} />
          </g>
        ))}
      </g>
    </motion.g>
  );
}

function Lightning({ top }) {
  return (
    <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <rect className={s.flash} x="0" y={top} width="400" height={260 - top} fill="#F4F7FF" />
      <polygon className={s.flash} points="250,20 230,78 248,78 234,132 276,64 254,64 268,20" fill="#FFF6B8" />
    </motion.g>
  );
}

function Rainbow() {
  const colors = ['#E85D5D', '#F4A940', '#F6D55C', '#6CC38A', '#4C9BE8', '#8C6BD1'];
  return (
    <motion.g initial={{ opacity: 0 }} animate={{ opacity: 0.6 }} exit={{ opacity: 0 }} transition={{ duration: 1.2 }} fill="none" strokeWidth="6" strokeLinecap="round">
      {colors.map((c, i) => {
        const r = 170 - i * 6;
        return (
          <motion.path
            key={c}
            d={`M ${250 - r} 200 A ${r} ${r} 0 0 1 ${250 + r} 200`}
            stroke={c}
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.8, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
          />
        );
      })}
    </motion.g>
  );
}

/* ---------- Piezas del paisaje ---------- */

// Arbol redondo que se mece. k = cuanto se mece respecto al viento.
function Tree({ x, y, h = 40, r = 20, color = '#2F8550', dark = '#256B43', k = 1, delay = 0 }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <g className={s.sway} style={{ '--k': k, animationDelay: `${delay}s` }}>
        <rect x="-3" y={-h} width="6" height={h} rx="2" fill="#5B4531" />
        <circle cx="0" cy={-h - r * 0.5} r={r} fill={color} />
        <circle cx={-r * 0.7} cy={-h + r * 0.1} r={r * 0.7} fill={dark} />
        <circle cx={r * 0.75} cy={-h} r={r * 0.65} fill={color} />
        <circle cx={-r * 0.25} cy={-h - r} r={r * 0.45} fill="#FFFFFF" opacity="0.12" />
      </g>
    </g>
  );
}

function Pine({ x, y, sc = 1, k = 0.6, delay = 0 }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${sc})`}>
      <g className={s.sway} style={{ '--k': k, animationDelay: `${delay}s` }}>
        <rect x="-2" y="-8" width="4" height="8" fill="#4A3A2C" />
        <path d="M-12 -6 L0 -30 L12 -6 Z" fill="#256B43" />
        <path d="M-9 -18 L0 -40 L9 -18 Z" fill="#2F8250" />
      </g>
    </g>
  );
}

function Palm({ x, y, sc = 1, flip = false, delay = 0 }) {
  const leaves = [
    [-160, '#2C8A56'],
    [-120, '#3AA066'],
    [-80, '#2C8A56'],
    [-40, '#3AA066'],
    [-5, '#2C8A56'],
    [-200, '#3AA066'],
  ];
  return (
    <g transform={`translate(${x} ${y}) scale(${flip ? -sc : sc} ${sc})`}>
      <g className={s.sway} style={{ '--k': 1.3, animationDelay: `${delay}s` }}>
        <path d="M0 0 Q 10 -40 -6 -82" stroke="#8A6744" strokeWidth="7" strokeLinecap="round" fill="none" />
        <path d="M0 0 Q 10 -40 -6 -82" stroke="#6E5134" strokeWidth="7" strokeDasharray="2 7" fill="none" />
        <g transform="translate(-6 -82)">
          {leaves.map(([deg, c], i) => (
            <g key={deg} transform={`rotate(${deg})`}>
              <path className={s.leaf} d="M0 0 Q 26 -16 58 4 Q 28 -2 0 0 Z" fill={c} style={{ animationDelay: `${-i * 0.35 - delay}s` }} />
            </g>
          ))}
          <circle cx="-3" cy="4" r="4.5" fill="#5C4328" />
          <circle cx="4" cy="5" r="4" fill="#6B4E2F" />
        </g>
      </g>
    </g>
  );
}

function Cow({ x, y, sc = 0.6, flip = false, delay = 0 }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${flip ? -sc : sc} ${sc})`}>
      <g className={s.tail} style={{ animationDelay: `${delay}s` }}>
        <path d="M-20 -14 q -6 6 -4 14" stroke="#2A2A2A" strokeWidth="2" fill="none" />
      </g>
      <rect x="-20" y="-22" width="36" height="18" rx="8" fill="#FFFFFF" />
      <path d="M-12 -22 q 6 8 0 14 q -6 -4 -8 -6 v-6 z" fill="#2A2A2A" />
      <ellipse cx="6" cy="-14" rx="5" ry="4" fill="#2A2A2A" />
      {[-15, -7, 6, 12].map((lx) => (
        <rect key={lx} x={lx} y="-6" width="3.5" height="10" fill="#E8E8E8" />
      ))}
      <g transform="translate(14 -20)">
        <g className={s.graze} style={{ animationDelay: `${delay}s` }}>
          <rect x="0" y="-6" width="12" height="10" rx="4" fill="#FFFFFF" />
          <rect x="7" y="-1" width="6" height="5" rx="2" fill="#F2B9B0" />
          <path d="M2 -6 l -3 -4 M8 -6 l 3 -4" stroke="#C9B48A" strokeWidth="1.6" />
        </g>
      </g>
    </g>
  );
}

function Fireflies({ area, lite }) {
  const [x0, y0, w, h] = area;
  return (
    <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1.2 }}>
      {Array.from({ length: lite ? 6 : 14 }, (_, i) => (
        <g key={i} transform={`translate(${x0 + rnd(i, 21) * w} ${y0 + rnd(i, 22) * h})`}>
          <circle
            className={s.firefly}
            r="1.8"
            fill="#FFF3A0"
            style={{ animationDelay: `${-rnd(i, 23) * 3}s, ${-rnd(i, 24) * 7}s`, filter: lite ? undefined : 'drop-shadow(0 0 3px #FFE76A)' }}
          />
        </g>
      ))}
    </motion.g>
  );
}

/* ---------- Paisajes ---------- */
// Cada paisaje tiene su "Base" (se oscurece de noche) y sus "Lights" (brillan encima de noche).

function Beach({ uid }) {
  return (
    <g>
      <defs>
        <linearGradient id={`${uid}-sea`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#4FB0DC" />
          <stop offset="1" stopColor="#1C78AA" />
        </linearGradient>
        <linearGradient id={`${uid}-sand`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#F3E0B0" />
          <stop offset="1" stopColor="#E2C182" />
        </linearGradient>
        <clipPath id={`${uid}-seaclip`}>
          <rect x="-10" y="145" width="420" height="80" />
        </clipPath>
      </defs>
      <path d="M-10 147 Q 30 110 82 120 Q 124 128 156 147 Z" fill="#79A893" />
      <path d="M-10 147 Q 44 126 94 134 Q 126 140 156 147 Z" fill="#5E8E79" />
      <path d="M290 147 Q 326 130 360 134 Q 392 138 410 147 Z" fill="#8DB8A6" />
      <rect x="-10" y="145" width="420" height="80" fill={`url(#${uid}-sea)`} />
      <g clipPath={`url(#${uid}-seaclip)`}>
        {[158, 172, 188, 204].map((y, i) => (
          <path
            key={y}
            className={s.wave}
            d={`M-80 ${y} q 20 -5 40 0 t 40 0 t 40 0 t 40 0 t 40 0 t 40 0 t 40 0 t 40 0 t 40 0 t 40 0 t 40 0 t 40 0 t 40 0`}
            stroke="#FFFFFF"
            strokeOpacity={0.5 - i * 0.08}
            strokeWidth="2"
            fill="none"
            style={{ animationDuration: `${3 + i * 1.2}s` }}
          />
        ))}
        {Array.from({ length: 9 }, (_, i) => (
          <g key={i} transform={`translate(${282 + rnd(i, 31) * 60} ${152 + i * 4})`}>
            <rect className={s.twinkle} width={8 + rnd(i, 32) * 10} height="1.6" rx="0.8" fill="#FFF6D0" style={{ animationDelay: `${-rnd(i, 33) * 3}s`, animationDuration: '1.4s' }} />
          </g>
        ))}
      </g>
      <g transform="translate(70 152)">
        <g className={s.sail}>
          <g className={s.bob}>
            <path d="M-14 0 L14 0 L9 6 L-9 6 Z" fill="#7A4B2A" />
            <line x1="0" y1="0" x2="0" y2="-26" stroke="#5B3B22" strokeWidth="1.5" />
            <path d="M1.5 -25 L16 -3 L1.5 -3 Z" fill="#FFFFFF" />
            <path d="M-1.5 -20 L-12 -3 L-1.5 -3 Z" fill="#F4A940" />
          </g>
        </g>
      </g>
      <path d="M-10 206 Q 100 190 210 200 T 410 194 V 262 H -10 Z" fill={`url(#${uid}-sand)`} />
      <path className={s.foam} d="M-10 205 Q 100 189 210 199 T 410 193" stroke="#FFFFFF" strokeWidth="3.5" fill="none" strokeLinecap="round" />
      <path d="M-10 224 Q 120 208 232 218 T 410 214 V 262 H -10 Z" fill="#E4C587" />
      <g transform="translate(244 224)">
        <path d="M-22 6 L18 6 L24 14 L-16 14 Z" fill="#E8604C" />
        <path d="M-16 8 L20 8" stroke="#FFFFFF" strokeWidth="2" />
        <line x1="0" y1="10" x2="-4" y2="-36" stroke="#6E5134" strokeWidth="2.4" />
        <path d="M-34 -30 Q -4 -58 26 -36 Z" fill="#F4A940" />
        <path d="M-34 -30 Q -22 -40 -14 -38 L -4 -42 Q 6 -40 12 -38 L 26 -36 Z" fill="#E8604C" opacity="0.9" />
      </g>
      <g transform="translate(150 240)">
        <g className={s.crab}>
          <g className={s.bob} style={{ animationDuration: '0.4s' }}>
            <ellipse cx="0" cy="0" rx="8" ry="5" fill="#E2553F" />
            <path d="M-8 0 l -5 3 M-7 3 l -4 4 M8 0 l 5 3 M7 3 l 4 4" stroke="#C23F2C" strokeWidth="1.4" />
            <circle cx="-3" cy="-6" r="1.6" fill="#1C2B27" />
            <circle cx="3" cy="-6" r="1.6" fill="#1C2B27" />
            <path d="M-9 -3 q -5 -6 -1 -9 M9 -3 q 5 -6 1 -9" stroke="#E2553F" strokeWidth="2.4" fill="none" strokeLinecap="round" />
          </g>
        </g>
      </g>
      <path d="M300 246 q 4 -6 8 0 z M110 252 q 3 -5 6 0 z" fill="#F7EBD0" />
      <g transform="translate(196 246)">
        <path d="M-9 0 L9 -4 M-9 -4 L9 0" stroke="#6E5134" strokeWidth="3" strokeLinecap="round" />
        <circle cx="-14" cy="0" r="3" fill="#B9B2A4" />
        <circle cx="14" cy="-1" r="3" fill="#B9B2A4" />
      </g>
      <Palm x={98} y={242} sc={1.15} />
      <Palm x={310} y={236} sc={1} flip delay={0.8} />
      <Palm x={340} y={248} sc={0.7} delay={1.6} />
    </g>
  );
}

function BeachLights({ lite }) {
  return (
    <g>
      <g transform="translate(196 242)">
        <circle className={s.glow} r="22" fill="#FF9A3D" opacity="0.35" style={lite ? undefined : { filter: 'blur(4px)' }} />
        <g className={s.flame}>
          <path d="M-6 0 Q -7 -10 0 -18 Q 7 -10 6 0 Z" fill="#FF7A2B" />
          <path d="M-3 0 Q -3 -7 1 -12 Q 4 -6 3 0 Z" fill="#FFD25A" />
        </g>
      </g>
      <Fireflies area={[70, 200, 260, 30]} lite={lite} />
    </g>
  );
}

function Volcano({ uid, condition }) {
  const smoke = condition === 'rain' || condition === 'storm' ? '#9AA6B0' : '#EEF2F4';
  return (
    <g>
      <defs>
        <linearGradient id={`${uid}-cone`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#7C8A84" />
          <stop offset="1" stopColor="#3F4D48" />
        </linearGradient>
        <linearGradient id={`${uid}-lake`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#6CC0E0" />
          <stop offset="1" stopColor="#2A86B0" />
        </linearGradient>
      </defs>
      <path d="M-10 150 Q 40 118 100 136 Q 150 120 200 140 Q 260 112 320 134 Q 370 120 410 140 V 200 H -10 Z" fill="#9CC0CF" opacity="0.75" />
      <g transform="translate(0 0)">
        {[0, 1, 2, 3].map((i) => (
          <g key={i} transform="translate(200 96)">
            <circle className={s.smoke} r="12" fill={smoke} style={{ animationDelay: `${-i * 1.5}s` }} />
          </g>
        ))}
      </g>
      <path d="M92 206 L178 104 Q 200 92 222 104 L308 206 Z" fill={`url(#${uid}-cone)`} />
      <path d="M200 98 L222 104 L308 206 L222 206 Z" fill="#000000" opacity="0.18" />
      <path d="M190 104 L170 140 L160 176 M206 104 L214 150 L208 196 M182 106 L146 160" stroke="#2E3A36" strokeWidth="2" opacity="0.3" fill="none" />
      <ellipse cx="200" cy="101" rx="22" ry="5.5" fill="#2B3431" />
      <ellipse className={s.pulse} cx="200" cy="101" rx="14" ry="3" fill="#FF7A3D" opacity="0.7" />
      <path d="M50 206 Q 90 178 128 190 Q 160 172 200 188 Q 240 172 272 188 Q 312 176 350 198 V 262 H 50 Z" fill="#4A9A63" />
      {[96, 120, 146, 176, 230, 258, 286, 312].map((x, i) => (
        <circle key={x} cx={x} cy={192 - (i % 3) * 3} r={9 + (i % 2) * 3} fill={i % 2 ? '#3E8A56' : '#56A86E'} />
      ))}
      <path d="M-10 210 Q 90 188 190 206 T 410 202 V 262 H -10 Z" fill="#6DB070" />
      <path d="M-10 236 L112 214 L196 236 L80 262 H -10 Z" fill="#A87A4C" />
      {Array.from({ length: 7 }, (_, i) => (
        <path key={i} d={`M${-6 + i * 18} ${244 - i * 3} L${110 + i * 12} ${218 + i * 2.6}`} stroke="#8A6038" strokeWidth="2" opacity="0.7" />
      ))}
      {Array.from({ length: 16 }, (_, i) => (
        <circle key={i} cx={20 + (i % 8) * 18 + Math.floor(i / 8) * 8} cy={236 - (i % 8) * 2.4 + Math.floor(i / 8) * 9} r="2.6" fill="#4CA35C" />
      ))}
      <path d="M212 232 Q 262 214 330 218 Q 392 220 410 226 V 252 Q 330 258 262 248 Q 222 242 212 232 Z" fill={`url(#${uid}-lake)`} />
      {[0, 1, 2].map((i) => (
        <g key={i} transform={`translate(${250 + i * 46} ${228 + (i % 2) * 8})`}>
          <path className={s.shimmer} d="M0 0 h 26" stroke="#FFFFFF" strokeWidth="1.6" strokeLinecap="round" style={{ animationDelay: `${-i}s` }} />
        </g>
      ))}
      <g transform="translate(120 214)">
        <rect x="-14" y="-14" width="28" height="16" fill="#F4E7CF" />
        <path d="M-18 -13 L0 -26 L18 -13 Z" fill="#C2513B" />
        <rect x="-9" y="-9" width="6" height="6" fill="#7FB6D6" />
        <rect x="4" y="-9" width="6" height="11" fill="#7A4B2A" />
        <ellipse cx="26" cy="2" rx="9" ry="3" fill="#7CC7DD" />
        {[0, 1, 2].map((i) => (
          <g key={i} transform={`translate(${22 + i * 4} -2)`}>
            <path className={s.steam} d="M0 0 q -3 -5 0 -10" stroke="#FFFFFF" strokeWidth="1.6" fill="none" strokeLinecap="round" style={{ animationDelay: `${-i * 1.1}s` }} />
          </g>
        ))}
      </g>
      <Cow x={166} y={230} delay={0} />
      <Cow x={196} y={240} sc={0.55} flip delay={2.2} />
      <Tree x={30} y={216} h={30} r={17} delay={0.3} />
      <Tree x={348} y={214} h={34} r={19} delay={1.1} />
      <Pine x={318} y={210} sc={0.9} delay={0.6} />
      <Pine x={66} y={214} sc={0.8} delay={1.4} />
      <path d="M-10 252 Q 100 242 200 252 T 410 248 V 262 H -10 Z" fill="#4F9A5C" />
    </g>
  );
}

function VolcanoLights({ lite }) {
  return (
    <g>
      <g transform="translate(200 100)">
        <ellipse className={s.glow} rx="30" ry="12" fill="#FF6A2B" opacity="0.55" style={lite ? undefined : { filter: 'blur(3px)' }} />
      </g>
      <path className={s.lava} d="M196 104 L188 124 L192 140 L182 162" stroke="#FF7A3D" strokeWidth="2.4" strokeDasharray="10 5" fill="none" strokeLinecap="round" />
      <rect x="111" y="205" width="6" height="6" fill="#FFD36E" />
      <Fireflies area={[20, 200, 180, 40]} lite={lite} />
    </g>
  );
}

function CloudForest({ uid }) {
  return (
    <g>
      <defs>
        <radialGradient id={`${uid}-mist`}>
          <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.75" />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
        </radialGradient>
      </defs>
      <path d="M-10 140 Q 60 100 140 128 T 290 118 T 410 132 V 260 H -10 Z" fill="#A9CFBB" />
      <g transform="translate(200 140)">
        <ellipse className={s.mist} rx="210" ry="16" fill={`url(#${uid}-mist)`} />
      </g>
      <path d="M-10 166 Q 80 132 170 158 T 410 152 V 260 H -10 Z" fill="#6DB08C" />
      <path d="M-10 128 Q 50 108 94 124 L 108 206 L -10 206 Z" fill="#6F8379" />
      <path d="M-10 128 Q 50 108 94 124 L 98 146 L -10 146 Z" fill="#3E8A62" />
      <rect x="72" y="126" width="13" height="80" fill="#BFE6F5" />
      <g transform="translate(0 0)">
        {[74, 79, 83].map((x, i) => (
          <line key={x} className={s.falls} x1={x} y1="126" x2={x} y2="206" stroke="#FFFFFF" strokeWidth="1.6" strokeDasharray="8 4" style={{ animationDelay: `${-i * 0.2}s` }} />
        ))}
      </g>
      <ellipse cx="79" cy="208" rx="26" ry="5" fill="#8FD0EA" />
      <g transform="translate(79 208)">
        <ellipse className={s.splash} rx="10" ry="2.5" fill="none" stroke="#FFFFFF" strokeWidth="1" />
      </g>
      <path d="M-10 196 Q 100 172 210 192 T 410 186 V 260 H -10 Z" fill="#3C9068" />
      <rect x="118" y="146" width="6" height="94" fill="#4A3A2C" />
      <rect x="296" y="142" width="6" height="96" fill="#4A3A2C" />
      <g className={s.bob} style={{ animationDuration: '4s' }}>
        <path d="M121 160 Q 210 192 299 156" stroke="#5B4531" strokeWidth="3" fill="none" />
        <path d="M121 148 Q 210 180 299 144" stroke="#3B2F25" strokeWidth="1.4" fill="none" />
        {Array.from({ length: 9 }, (_, i) => {
          const t = (i + 1) / 10;
          const x = (1 - t) ** 2 * 121 + 2 * (1 - t) * t * 210 + t * t * 299;
          const y = (1 - t) ** 2 * 160 + 2 * (1 - t) * t * 192 + t * t * 156;
          return <line key={i} x1={x} y1={y - 12} x2={x} y2={y} stroke="#3B2F25" strokeWidth="1" opacity="0.7" />;
        })}
        <g className={s.walker}>
          <g transform="translate(0 -1)">
            <g className={s.step}>
              <line x1="-1" y1="-6" x2="-2" y2="0" stroke="#2B3A55" strokeWidth="1.6" />
            </g>
            <g className={s.step} style={{ animationDelay: '-0.45s' }}>
              <line x1="1" y1="-6" x2="2" y2="0" stroke="#2B3A55" strokeWidth="1.6" />
            </g>
            <rect x="-2.6" y="-14" width="5.2" height="8" rx="2" fill="#E8604C" />
            <circle cy="-17" r="2.8" fill="#F1C7A1" />
            <rect x="-3.5" y="-13" width="3" height="6" rx="1" fill="#F4A940" />
          </g>
        </g>
      </g>
      <Tree x={120} y={150} h={4} r={20} color="#2C7A50" dark="#1F5E44" k={0.5} />
      <Tree x={300} y={146} h={4} r={22} color="#2C7A50" dark="#1F5E44" k={0.5} delay={0.7} />
      <Tree x={96} y={250} h={26} r={18} color="#2C7A50" dark="#1F5E44" delay={0.2} />
      <Tree x={160} y={238} h={24} r={18} color="#38905F" dark="#26704F" delay={1.2} />
      <Tree x={340} y={236} h={34} r={24} color="#2C7A50" dark="#1F5E44" delay={0.5} />
      <Tree x={380} y={230} h={28} r={18} color="#38905F" dark="#26704F" delay={1.6} />
      <g transform="translate(236 222)">
        <path d="M0 18 Q 2 4 -2 -6" stroke="#2F7E5A" strokeWidth="2" fill="none" />
        {[0, 1, 2].map((i) => (
          <path key={i} d={`M${-2 + i} ${-4 + i * 6} l 8 -3 l -6 6 z`} fill="#E8473A" />
        ))}
      </g>
      <g transform="translate(252 206)">
        <g className={s.hover}>
          <ellipse cx="0" cy="0" rx="5" ry="2.6" fill="#1F8F6A" />
          <path d="M-5 0 l -6 -1" stroke="#1C2B27" strokeWidth="1" />
          <path d="M4 1 l 4 3" stroke="#1F8F6A" strokeWidth="1.6" />
          <circle cx="-3" cy="-1" r="0.8" fill="#000" />
          <g transform="translate(0 -1)">
            <path className={s.buzz} d="M-1 0 l 4 -8 l 3 1 z" fill="#9BE0C5" opacity="0.8" />
          </g>
        </g>
      </g>
      <g transform="translate(200 236)">
        <ellipse className={s.mist} rx="220" ry="18" fill={`url(#${uid}-mist)`} style={{ animationDuration: '14s', animationDirection: 'alternate-reverse' }} />
      </g>
    </g>
  );
}

function CloudForestLights({ lite }) {
  return <Fireflies area={[60, 170, 300, 70]} lite={lite} />;
}

function Jungle({ uid }) {
  return (
    <g>
      <defs>
        <linearGradient id={`${uid}-river`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#5BB7D6" />
          <stop offset="1" stopColor="#2A84AA" />
        </linearGradient>
      </defs>
      <path d="M-10 156 a 26 22 0 0 1 50 -6 a 30 26 0 0 1 58 -4 a 28 22 0 0 1 54 2 a 30 26 0 0 1 58 -6 a 26 22 0 0 1 52 4 a 30 24 0 0 1 58 -2 a 26 22 0 0 1 90 6 V 260 H -10 Z" fill="#2E7D4F" />
      <path d="M-10 186 Q 80 160 170 182 T 410 176 V 260 H -10 Z" fill="#3F9761" />
      <path d="M-10 218 Q 100 196 200 214 T 410 206 V 246 Q 300 236 200 246 T -10 244 Z" fill={`url(#${uid}-river)`} />
      {[0, 1, 2, 3].map((i) => (
        <g key={i} transform={`translate(${30 + i * 92} ${222 + (i % 2) * 8})`}>
          <path className={s.shimmer} d="M0 0 q 14 -4 28 0" stroke="#FFFFFF" strokeWidth="1.8" fill="none" strokeLinecap="round" style={{ animationDelay: `${-i * 0.8}s` }} />
        </g>
      ))}
      <g transform="translate(110 226)">
        <g className={s.canoe}>
          <g className={s.bob}>
            <path d="M-20 0 Q 0 8 20 0 L16 -3 L-16 -3 Z" fill="#8A5A34" />
            <rect x="-3" y="-12" width="6" height="9" rx="2" fill="#F4A940" />
            <circle cy="-15" r="3" fill="#F1C7A1" />
            <path d="M-4 -16 h 8" stroke="#E8E2C8" strokeWidth="2.4" />
            <g transform="translate(4 -9)">
              <g className={s.paddle}>
                <line x1="0" y1="0" x2="6" y2="14" stroke="#5B3B22" strokeWidth="1.6" />
                <ellipse cx="6.5" cy="15" rx="2" ry="3.5" fill="#5B3B22" />
              </g>
            </g>
          </g>
        </g>
      </g>
      <path d="M-10 246 Q 80 236 160 248 L 160 262 H -10 Z" fill="#2B7A48" />
      <path d="M250 250 Q 330 234 410 244 V 262 H 250 Z" fill="#2B7A48" />
      <g transform="translate(100 214)">
        <rect x="-6" y="-120" width="12" height="120" fill="#5B4531" />
        <path d="M2 -78 Q 30 -86 58 -78" stroke="#5B4531" strokeWidth="6" fill="none" strokeLinecap="round" />
        <g className={s.sway} style={{ '--k': 0.5 }}>
          <circle cx="0" cy="-132" r="30" fill="#1F6B43" />
          <circle cx="-22" cy="-116" r="20" fill="#2F8F5B" />
          <circle cx="22" cy="-120" r="22" fill="#27784C" />
        </g>
        <g transform="translate(44 -84)">
          <g className={s.peck}>
            <ellipse cx="0" cy="-6" rx="6" ry="9" fill="#1C1C1C" />
            <ellipse cx="1.5" cy="-9" rx="3.6" ry="4" fill="#FFE27A" />
            <circle cx="1" cy="-13" r="1.2" fill="#1C1C1C" />
            <path d="M3 -13 Q 16 -14 16 -8 Q 9 -9 3 -9 Z" fill="#F38B2C" />
            <path d="M14 -12 Q 16 -11 16 -8 L 13 -9 Z" fill="#1C1C1C" />
            <path d="M-3 2 l -2 8" stroke="#1C1C1C" strokeWidth="3" />
          </g>
        </g>
      </g>
      <g transform="translate(300 210)">
        <rect x="-6" y="-112" width="12" height="112" fill="#5B4531" />
        <path d="M-2 -72 Q -30 -80 -56 -70" stroke="#5B4531" strokeWidth="6" fill="none" strokeLinecap="round" />
        <g className={s.sway} style={{ '--k': 0.5, animationDelay: '0.6s' }}>
          <circle cx="0" cy="-124" r="28" fill="#1F6B43" />
          <circle cx="22" cy="-108" r="18" fill="#2F8F5B" />
          <circle cx="-20" cy="-112" r="20" fill="#27784C" />
        </g>
        <g transform="translate(-36 -74)">
          <g className={s.hang}>
            <path d="M-6 0 L -5 10 M6 0 L 5 10" stroke="#8C7356" strokeWidth="3" strokeLinecap="round" />
            <ellipse cx="0" cy="16" rx="10" ry="8" fill="#9C8466" />
            <ellipse cx="0" cy="19" rx="5.5" ry="4.5" fill="#E9D8B8" />
            <path d="M-4 18 q 2 -2 3 0 M1 18 q 2 -2 3 0" stroke="#3A2C20" strokeWidth="1.4" fill="none" />
            <ellipse cx="0" cy="21.5" rx="1.2" ry="0.8" fill="#3A2C20" />
          </g>
        </g>
      </g>
      {[
        [170, 180, 0],
        [240, 168, 3],
      ].map(([x, y, d]) => (
        <g key={x} transform={`translate(${x} ${y})`}>
          <g className={s.butterfly} style={{ animationDelay: `${-d}s` }}>
            <g className={s.wing} style={{ animationDelay: `${-d * 0.1}s` }}>
              <path d="M0 0 q -7 -8 -9 -1 q 2 5 9 1 q 7 -8 9 -1 q -2 5 -9 1 z" fill="#3D7FF0" />
            </g>
          </g>
        </g>
      ))}
      <g transform="translate(-6 262)">
        <g className={s.sway} style={{ '--k': 1.6 }}>
          <path d="M0 0 Q 10 -50 50 -62 Q 44 -30 0 0 Z" fill="#1E6B3E" />
          <path d="M0 0 Q 40 -24 74 -20 Q 50 2 0 0 Z" fill="#2A8550" />
        </g>
      </g>
      <g transform="translate(406 262) scale(-1 1)">
        <g className={s.sway} style={{ '--k': 1.6, animationDelay: '0.9s' }}>
          <path d="M0 0 Q 10 -54 46 -66 Q 44 -30 0 0 Z" fill="#1E6B3E" />
          <path d="M0 0 Q 36 -30 70 -26 Q 48 2 0 0 Z" fill="#2A8550" />
        </g>
      </g>
    </g>
  );
}

function JungleLights({ lite }) {
  return <Fireflies area={[40, 150, 320, 80]} lite={lite} />;
}

const LANDSCAPE = {
  beach: [Beach, BeachLights],
  volcano: [Volcano, VolcanoLights],
  cloudforest: [CloudForest, CloudForestLights],
  jungle: [Jungle, JungleLights],
};

export default function Scene({
  kind = 'beach',
  condition = 'sunny',
  rainbow = false,
  night = false,
  wind = 0,
  tall = false,
  animated = true,
  lite = false,
  variant = 0,
  className,
  label,
}) {
  const reduce = useReducedMotion();
  const live = animated && !reduce;
  const uid = useId().replace(/:/g, '');
  const [Base, Lights] = LANDSCAPE[kind] ?? LANDSCAPE.beach;
  const top = tall ? -90 : 0;
  const rainy = condition === 'rain' || condition === 'storm';
  const time = night ? 'night' : 'day';
  const [skyTop, skyBottom] = !night && variant === 2 && condition === 'sunny' ? SUNSET : SKY[time][condition] ?? SKY.day.sunny;
  const cloudFill = CLOUD_FILL[time][condition] ?? '#fff';
  const clouds = CLOUD_COUNT[condition] ?? 1;
  const sunVisible = night ? 0 : { sunny: 1, partly: 1, cloudy: 0.25, rain: 0, storm: 0 }[condition] ?? 1;
  const moonVisible = night ? (rainy ? 0.15 : condition === 'cloudy' ? 0.5 : 1) : 0;
  // Viento efectivo: la lluvia y la tormenta tambien mueven los arboles.
  const gust = Math.max(wind || 0, condition === 'storm' ? 40 : condition === 'rain' ? 22 : 0);
  const sway = Math.min(1.4 + gust / 9, 7);
  const sunY = tall ? -18 : 54;

  return (
    <svg
      className={`${s.svg} ${live ? '' : s.still} ${lite ? s.lite : ''} ${className ?? ''}`}
      style={{ '--sway': sway }}
      viewBox={`0 ${top} 400 ${260 - top}`}
      preserveAspectRatio="xMidYMax slice"
      role="img"
      aria-label={label ?? 'Ilustración del destino'}
    >
      <defs>
        <linearGradient id={`${uid}-sky`} className={s.sky} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" style={{ stopColor: skyTop }} />
          <stop offset="1" style={{ stopColor: skyBottom }} />
        </linearGradient>
        <radialGradient id="sunShine" cx="0.35" cy="0.35" r="0.7">
          <stop offset="0" stopColor="#FFF6C8" stopOpacity="0.9" />
          <stop offset="1" stopColor="#FFF6C8" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect x="-10" y={top} width="420" height={270 - top} fill={`url(#${uid}-sky)`} />

      <AnimatePresence>{night && !rainy && <Stars key="stars" top={top} lite={lite} />}</AnimatePresence>
      <Sun visible={sunVisible} y={sunY} />
      <Moon visible={moonVisible} y={sunY} />
      <AnimatePresence>{live && rainbow && !rainy && !night && <Rainbow key="rainbow" />}</AnimatePresence>

      {CLOUDS.map((c, i) => (
        <Cloud key={i} {...c} y={tall ? c.y - (i === 5 ? 40 : 0) : Math.max(c.y, 30) + 14} fill={cloudFill} on={i < clouds} />
      ))}
      <AnimatePresence>{live && !night && !rainy && <Birds key="birds" y={tall ? -38 : 70} />}</AnimatePresence>

      <g transform={variant % 2 ? 'translate(400 0) scale(-1 1)' : undefined}>
        <Base uid={uid} condition={condition} />
      </g>

      <rect x="-10" y={top} width="420" height={270 - top} fill="#0B1714" opacity={SHADE[condition] ?? 0} className={s.celestial} pointerEvents="none" />
      <rect x="-10" y={top} width="420" height={270 - top} fill="#0A1433" opacity={night ? 0.5 : 0} className={s.celestial} pointerEvents="none" />

      <g transform={variant % 2 ? 'translate(400 0) scale(-1 1)' : undefined}>
        <AnimatePresence>
          {night && (
            <motion.g key="lights" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1.2 }}>
              <Lights lite={lite} />
            </motion.g>
          )}
        </AnimatePresence>
      </g>

      <AnimatePresence>
        {live && !lite && gust >= 25 && !rainy && <Gusts key="gusts" />}
        {live && rainy && <Rain key="rain" storm={condition === 'storm'} top={top} lite={lite} />}
        {live && condition === 'storm' && <Lightning key="bolt" top={top} />}
      </AnimatePresence>
    </svg>
  );
}
