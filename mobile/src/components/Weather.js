import { Cloud, CloudLightning, CloudRain, CloudSun, Sun } from 'lucide-react-native';
import Svg, { Circle, Path } from 'react-native-svg';

export const CONDITION_ICON = { sunny: Sun, partly: CloudSun, cloudy: Cloud, rain: CloudRain, storm: CloudLightning };

export const CONDITION_LABEL = {
  sunny: 'Soleado',
  partly: 'Parcialmente nublado',
  cloudy: 'Nublado',
  rain: 'Lluvia',
  storm: 'Tormenta',
};

export const CONDITION_NOTE = {
  sunny: 'Cielo despejado en la zona.',
  partly: 'Mezcla de sol y nubes.',
  cloudy: 'Cielo cubierto, sin lluvia fuerte.',
  rain: 'Se esperan lluvias; lleva impermeable.',
  storm: 'Tormentas posibles; evita zonas expuestas.',
};

export function Sparkline({ values, width = 96, height = 34 }) {
  const nums = values.filter((v) => Number.isFinite(v));
  if (nums.length < 2) return null;
  const min = Math.min(...nums);
  const max = Math.max(...nums);
  if (max === min) return null;
  const span = max - min;
  const pts = nums.map((v, i) => [(i / (nums.length - 1)) * (width - 6) + 3, height - 4 - ((v - min) / span) * (height - 10)]);
  const d = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
  return (
    <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <Path d={d} fill="none" stroke="#F4A940" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx={pts[0][0]} cy={pts[0][1]} r="3" fill="#F4A940" />
    </Svg>
  );
}
