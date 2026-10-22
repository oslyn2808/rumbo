import Svg, { Circle, G, Line, Path } from 'react-native-svg';
import { colors } from '../theme';

// Marca de Rumbo: una brujula. La aguja norte es el acento de la marca.
export default function Logo({ size = 48, color = colors.textOnDark }) {
  return (
    <Svg viewBox="0 0 64 64" width={size} height={size} fill="none" accessibilityLabel="Rumbo">
      <Circle cx="32" cy="32" r="27" stroke={color} strokeWidth="2.5" />
      {[0, 90, 180, 270].map((deg) => (
        <Line key={deg} x1="32" y1="7" x2="32" y2="12" stroke={color} strokeWidth="2.5" strokeLinecap="round" transform={`rotate(${deg} 32 32)`} />
      ))}
      <G>
        <Path d="M32 13 L39 32 L25 32 Z" fill={colors.mint} />
        <Path d="M32 51 L39 32 L25 32 Z" fill={color} fillOpacity="0.85" />
        <Circle cx="32" cy="32" r="2.8" fill={colors.ink900} />
      </G>
    </Svg>
  );
}
