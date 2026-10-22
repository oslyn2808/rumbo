import { StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { colors } from '../theme';

// Curvas de nivel topograficas (como en un mapa de montana). Fondo de marca para las pantallas oscuras.
function ring(cx, cy, r, seed) {
  const pts = [];
  const steps = 48;
  for (let i = 0; i <= steps; i += 1) {
    const a = (i / steps) * Math.PI * 2;
    const wobble = 1 + 0.09 * Math.sin(a * 3 + seed) + 0.05 * Math.sin(a * 5 - seed * 1.7);
    pts.push([cx + Math.cos(a) * r * wobble * 1.18, cy + Math.sin(a) * r * wobble * 0.82]);
  }
  return `M${pts.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join(' L')} Z`;
}

const PEAKS = [
  { cx: 120, cy: 150, rings: 7, seed: 0.4 },
  { cx: 330, cy: 70, rings: 5, seed: 2.1 },
  { cx: 300, cy: 420, rings: 6, seed: 4.2 },
];

const PATHS = PEAKS.flatMap((p) => Array.from({ length: p.rings }, (_, i) => ring(p.cx, p.cy, 18 + i * 22, p.seed + i * 0.35)));

export default function Contours() {
  return (
    <Svg style={StyleSheet.absoluteFill} viewBox="0 0 400 520" preserveAspectRatio="xMidYMid slice" fill="none" pointerEvents="none">
      {PATHS.map((d, i) => (
        <Path key={i} d={d} stroke={colors.mint} strokeOpacity="0.09" strokeWidth="1.2" />
      ))}
    </Svg>
  );
}
