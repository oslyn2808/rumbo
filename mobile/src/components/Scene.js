import { useEffect, useId, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, StyleSheet, View } from 'react-native';
import Svg, { Circle, ClipPath, Defs, Ellipse, G, Line, LinearGradient, Path, Polygon, RadialGradient, Rect, Stop } from 'react-native-svg';

// Ilustracion de un destino. "kind" elige el paisaje y "condition" el clima:
// sunny | partly | cloudy | rain | storm. "rainbow" agrega un arcoiris.
// Con animated={false} queda estatica (miniaturas). Cada parte animada es una capa encima de la otra.

const SKY = {
  sunny: ['#6FC3F0', '#EAF7FF'],
  partly: ['#86C3EA', '#E8F3FA'],
  cloudy: ['#A3B5C5', '#E1E8EE'],
  rain: ['#5F7589', '#A8B7C4'],
  storm: ['#3B4859', '#7A8897'],
};
const CLOUD_FILL = { sunny: '#FFFFFF', partly: '#FFFFFF', cloudy: '#E4EAEF', rain: '#B4C0CB', storm: '#7F8C99' };
const CLOUD_OPACITY = { sunny: [0.95, 0, 0], partly: [1, 1, 0], cloudy: [1, 1, 1], rain: [1, 1, 1], storm: [1, 1, 1] };
const SUN_OPACITY = { sunny: 1, partly: 1, cloudy: 0.2, rain: 0, storm: 0 };
const SHADE = { sunny: 0, partly: 0, cloudy: 0.06, rain: 0.14, storm: 0.28 };
const CLOUDS = [
  { x: 92, y: 58, scale: 1.05, drift: 22, dur: 13 },
  { x: 238, y: 40, scale: 0.8, drift: -18, dur: 16 },
  { x: 176, y: 96, scale: 1.15, drift: 26, dur: 19 },
];

function useReducedMotion() {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduce).catch(() => {});
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduce);
    return () => sub?.remove?.();
  }, []);
  return reduce;
}

// Repite una animacion 0 → 1 → 0 (o 0 → 1 si "once") mientras la escena este visible.
function useLoop(active, duration, { pingPong = true, delay = 0 } = {}) {
  const value = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!active) {
      value.setValue(0);
      return undefined;
    }
    const ease = pingPong ? Easing.inOut(Easing.sin) : Easing.linear;
    const steps = pingPong
      ? [Animated.timing(value, { toValue: 1, duration: duration / 2, easing: ease, useNativeDriver: true }), Animated.timing(value, { toValue: 0, duration: duration / 2, easing: ease, useNativeDriver: true })]
      : [Animated.timing(value, { toValue: 1, duration, easing: ease, useNativeDriver: true }), Animated.timing(value, { toValue: 0, duration: 0, useNativeDriver: true })];
    const anim = Animated.loop(Animated.sequence([Animated.delay(delay), ...steps]));
    anim.start();
    return () => anim.stop();
  }, [active, duration, pingPong, delay, value]);
  return value;
}

/* ---------- Piezas del cielo ---------- */

function CloudShape({ x, y, scale, fill, opacity }) {
  if (!opacity) return null;
  return (
    <G transform={`translate(${x} ${y}) scale(${scale})`} opacity={opacity} fill={fill}>
      <Ellipse cx="0" cy="0" rx="36" ry="12" />
      <Circle cx="-15" cy="-10" r="14" />
      <Circle cx="7" cy="-15" r="19" />
      <Circle cx="26" cy="-6" r="12" />
    </G>
  );
}

function Sun({ condition, low }) {
  const opacity = SUN_OPACITY[condition] ?? 1;
  if (!opacity) return null;
  return (
    <G transform={low ? 'translate(300 118)' : 'translate(318 62)'} opacity={opacity}>
      <Circle r="46" fill="#FFE9A3" opacity="0.35" />
      {Array.from({ length: 12 }, (_, i) => (
        <Line key={i} x1="0" y1="-34" x2="0" y2="-42" stroke="#FFC93C" strokeWidth="3" strokeLinecap="round" transform={`rotate(${i * 30})`} />
      ))}
      <Circle r="26" fill="#FFD25A" />
    </G>
  );
}

function Rainbow() {
  const colors = ['#E85D5D', '#F4A940', '#F6D55C', '#6CC38A', '#4C9BE8', '#8C6BD1'];
  const cx = 150;
  return (
    <G opacity={0.6} fill="none" strokeWidth="5">
      {colors.map((c, i) => {
        const r = 128 - i * 5;
        return <Path key={c} d={`M ${cx - r} 205 A ${r} ${r} 0 0 1 ${cx + r} 205`} stroke={c} />;
      })}
    </G>
  );
}

/* ---------- Paisajes ---------- */

function Palm({ x, y, scale = 1, flip = false }) {
  const leaves = [-78, -38, 2, 42, 82];
  return (
    <G transform={`translate(${x} ${y}) scale(${flip ? -scale : scale} ${scale})`}>
      <Path d="M0 0 Q 8 -34 -4 -70" stroke="#7A5B3A" strokeWidth="6" strokeLinecap="round" fill="none" />
      <G transform="translate(-4 -70)">
        {leaves.map((deg) => (
          <Path key={deg} d="M0 0 Q 26 -22 52 -2 Q 26 -8 0 0 Z" fill="#2F8F5B" transform={`rotate(${deg})`} />
        ))}
        <Circle r="4" fill="#5C4328" />
      </G>
    </G>
  );
}

function Beach({ uid }) {
  return (
    <G>
      <Defs>
        <LinearGradient id={`${uid}sea`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#58B6DE" />
          <Stop offset="1" stopColor="#1F7FB0" />
        </LinearGradient>
        <ClipPath id={`${uid}seaclip`}>
          <Rect x="0" y="148" width="400" height="70" />
        </ClipPath>
      </Defs>
      <Rect x="0" y="148" width="400" height="70" fill={`url(#${uid}sea)`} />
      <G clipPath={`url(#${uid}seaclip)`}>
        {[162, 178, 194].map((y, i) => (
          <Path
            key={y}
            d={`M-20 ${y} q 20 -6 40 0 t 40 0 t 40 0 t 40 0 t 40 0 t 40 0 t 40 0 t 40 0 t 40 0 t 40 0 t 40 0`}
            stroke="#FFFFFF"
            strokeOpacity={0.45 - i * 0.08}
            strokeWidth="2"
            fill="none"
          />
        ))}
      </G>
      <Path d="M0 206 Q 110 188 210 200 T 400 194 L400 260 L0 260 Z" fill="#F1DDAE" />
      <Path d="M0 214 Q 120 200 220 210 T 400 204 L400 260 L0 260 Z" fill="#E7CE97" opacity="0.7" />
      <Palm x={62} y={232} scale={1.15} />
      <Palm x={338} y={226} scale={0.95} flip />
    </G>
  );
}

function Volcano({ uid }) {
  return (
    <G>
      <Defs>
        <LinearGradient id={`${uid}cone`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#6A7A74" />
          <Stop offset="1" stopColor="#3E4D48" />
        </LinearGradient>
      </Defs>
      <Path d="M0 192 Q 60 156 130 178 T 262 172 T 400 186 L400 260 L0 260 Z" fill="#86BFA0" opacity="0.85" />
      <Path d="M86 208 L170 74 Q200 58 230 74 L316 208 Z" fill={`url(#${uid}cone)`} />
      <Path d="M200 62 L230 74 L316 208 L214 208 Z" fill="#000" opacity="0.2" />
      <Ellipse cx="200" cy="70" rx="30" ry="7" fill="#2B3734" />
      <Path d="M0 220 Q 100 196 200 214 T 400 208 L400 260 L0 260 Z" fill="#3E8E5A" />
      {[26, 70, 120, 290, 340, 378].map((x, i) => (
        <G key={x} transform={`translate(${x} ${222 + (i % 2) * 8})`}>
          <Path d="M0 0 L9 -26 L18 0 Z" fill="#256B43" />
          <Path d="M3 -12 L9 -34 L15 -12 Z" fill="#2F8250" />
        </G>
      ))}
    </G>
  );
}

function CloudForest({ uid }) {
  const treeSet = [
    [42, 230, 54],
    [128, 238, 40],
    [330, 232, 52],
    [380, 240, 38],
  ];
  return (
    <G>
      <Defs>
        <RadialGradient id={`${uid}mist`} cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor="#FFFFFF" stopOpacity="0.7" />
          <Stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
        </RadialGradient>
      </Defs>
      <Path d="M0 160 Q 70 120 150 150 T 300 140 T 400 156 L400 260 L0 260 Z" fill="#A5CDB8" />
      <Path d="M0 184 Q 90 150 180 176 T 400 172 L400 260 L0 260 Z" fill="#62AA85" />
      <Ellipse cx="200" cy="168" rx="190" ry="22" fill={`url(#${uid}mist)`} />
      <Path d="M0 208 Q 100 186 210 206 T 400 200 L400 260 L0 260 Z" fill="#2F7E5A" />
      <Path d="M96 192 Q 200 214 304 186" stroke="#3B2F25" strokeWidth="2.2" fill="none" />
      <Path d="M96 200 Q 200 222 304 194" stroke="#3B2F25" strokeWidth="1.4" fill="none" opacity="0.7" />
      {[130, 160, 200, 240, 272].map((x) => (
        <Line key={x} x1={x} y1={196} x2={x} y2={x < 200 ? 207 : 204} stroke="#3B2F25" strokeWidth="1" opacity="0.6" />
      ))}
      <Rect x="92" y="170" width="5" height="40" fill="#3B2F25" />
      <Rect x="302" y="164" width="5" height="40" fill="#3B2F25" />
      {treeSet.map(([x, y, h]) => (
        <G key={x} transform={`translate(${x} ${y})`}>
          <Rect x="-3" y={-h} width="6" height={h} fill="#4A3A2C" />
          <Ellipse cx="0" cy={-h - 8} rx="22" ry="17" fill="#1F5E44" />
          <Ellipse cx="-12" cy={-h + 2} rx="14" ry="10" fill="#26704F" />
        </G>
      ))}
      <Ellipse cx="200" cy="226" rx="200" ry="20" fill={`url(#${uid}mist)`} />
    </G>
  );
}

function Jungle({ uid }) {
  return (
    <G>
      <Defs>
        <LinearGradient id={`${uid}river`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#58B6D8" />
          <Stop offset="1" stopColor="#2A87AE" />
        </LinearGradient>
      </Defs>
      <Path d="M0 168 Q 60 134 130 158 T 260 150 T 400 164 L400 260 L0 260 Z" fill="#2E7D4F" />
      <Path d="M0 192 Q 80 168 170 188 T 400 180 L400 260 L0 260 Z" fill="#3E9660" />
      <Path d="M0 226 Q 100 198 200 222 T 400 212 L400 260 L0 260 Z" fill={`url(#${uid}river)`} />
      {[0, 1].map((i) => (
        <Path key={i} d={`M${40 + i * 160} ${234 - i * 6} q 30 -6 60 0`} stroke="#FFFFFF" strokeOpacity="0.45" strokeWidth="2" fill="none" strokeLinecap="round" />
      ))}
      <Path d="M0 238 Q 60 226 110 240 L110 260 L0 260 Z" fill="#256B43" />
      <Path d="M290 244 Q 350 226 400 240 L400 260 L290 260 Z" fill="#256B43" />
      {[
        [34, 214, 1.1],
        [372, 212, 1],
        [96, 206, 0.8],
      ].map(([x, y, s]) => (
        <G key={x} transform={`translate(${x} ${y}) scale(${s})`}>
          <Rect x="-4" y="-78" width="8" height="78" fill="#5B4531" />
          <Circle cx="0" cy="-86" r="24" fill="#1F6B43" />
          <Circle cx="-16" cy="-74" r="16" fill="#2F8F5B" />
          <Circle cx="16" cy="-76" r="17" fill="#27784C" />
        </G>
      ))}
    </G>
  );
}

const LANDSCAPE = { beach: Beach, volcano: Volcano, cloudforest: CloudForest, jungle: Jungle };

/* ---------- Capas animadas ---------- */

// Una capa del mismo tamano que la escena, con el mismo encuadre (viewBox + slice).
function Layer({ flip, children }) {
  return (
    <Svg style={StyleSheet.absoluteFill} viewBox="0 0 400 260" preserveAspectRatio="xMidYMid slice" pointerEvents="none">
      <G transform={flip ? 'translate(400 0) scale(-1 1)' : undefined}>{children}</G>
    </Svg>
  );
}

function DriftingCloud({ cloud, fill, opacity, flip, unit, live }) {
  const t = useLoop(live, cloud.dur * 1000);
  if (!opacity) return null;
  const dx = cloud.drift * unit * (flip ? -1 : 1);
  return (
    <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ translateX: t.interpolate({ inputRange: [0, 1], outputRange: [0, dx] }) }] }]} pointerEvents="none">
      <Layer flip={flip}>
        <CloudShape {...cloud} fill={fill} opacity={opacity} />
      </Layer>
    </Animated.View>
  );
}

function Drop({ index, height }) {
  const t = useLoop(true, 750 + (index % 5) * 100, { pingPong: false, delay: (index % 9) * 90 });
  const left = `${((index * 53) % 420) / 4.2}%`;
  return (
    <Animated.View
      style={[
        styles.drop,
        { left, transform: [{ translateY: t.interpolate({ inputRange: [0, 1], outputRange: [-30, height + 10] }) }, { rotate: '18deg' }] },
      ]}
    />
  );
}

function Rain({ storm, height }) {
  return (
    <View style={[StyleSheet.absoluteFill, { overflow: 'hidden' }]} pointerEvents="none">
      {Array.from({ length: storm ? 34 : 24 }, (_, i) => (
        <Drop key={i} index={i} height={height} />
      ))}
    </View>
  );
}

function Lightning() {
  const t = useLoop(true, 5000, { pingPong: false });
  const opacity = t.interpolate({ inputRange: [0, 0.5, 0.52, 0.56, 0.6, 0.64, 1], outputRange: [0, 0, 1, 0, 0.8, 0, 0] });
  return (
    <Animated.View style={[StyleSheet.absoluteFill, { opacity }]} pointerEvents="none">
      <Layer>
        <Polygon points="248,40 232,92 250,92 238,140 272,80 252,80 262,40" fill="#FFF6B8" />
      </Layer>
    </Animated.View>
  );
}

export default function Scene({ kind = 'beach', condition = 'sunny', rainbow = false, animated = true, variant = 0, style, label }) {
  const reduce = useReducedMotion();
  const live = animated && !reduce;
  const uid = `s${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const [size, setSize] = useState({ width: 0, height: 0 });

  const Landscape = LANDSCAPE[kind] ?? Beach;
  const sunset = variant === 2 && condition === 'sunny';
  const [top, bottom] = sunset ? ['#F6B26B', '#FCE6C4'] : SKY[condition] ?? SKY.sunny;
  const clouds = CLOUD_OPACITY[condition] ?? CLOUD_OPACITY.sunny;
  const fill = CLOUD_FILL[condition] ?? '#fff';
  const rainy = condition === 'rain' || condition === 'storm';
  const flip = variant % 2 === 1;
  // Pixeles por unidad del dibujo (el dibujo mide 400 x 260 y llena la caja recortando lo que sobre).
  const unit = size.width ? Math.max(size.width / 400, size.height / 260) : 1;

  return (
    <View
      style={[styles.box, style]}
      onLayout={(e) => setSize(e.nativeEvent.layout)}
      accessible={Boolean(label)}
      accessibilityRole="image"
      accessibilityLabel={label || undefined}
    >
      <Svg style={StyleSheet.absoluteFill} viewBox="0 0 400 260" preserveAspectRatio="xMidYMid slice">
        <Defs>
          <LinearGradient id={`${uid}sky`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={top} />
            <Stop offset="1" stopColor={bottom} />
          </LinearGradient>
        </Defs>
        <Rect width="400" height="260" fill={`url(#${uid}sky)`} />
        <G transform={flip ? 'translate(400 0) scale(-1 1)' : undefined}>
          <Sun condition={condition} low={variant === 2} />
          {rainbow && !rainy && <Rainbow />}
          {!live && CLOUDS.map((c, i) => <CloudShape key={i} {...c} fill={fill} opacity={clouds[i]} />)}
        </G>
      </Svg>

      {live && CLOUDS.map((c, i) => <DriftingCloud key={i} cloud={c} fill={fill} opacity={clouds[i]} flip={flip} unit={unit} live={live} />)}

      <Layer flip={flip}>
        <Landscape uid={uid} />
        <Rect x={flip ? 0 : 0} width="400" height="260" fill="#0B1714" opacity={SHADE[condition] ?? 0} />
      </Layer>

      {live && rainy && size.height > 0 && <Rain storm={condition === 'storm'} height={size.height} />}
      {live && condition === 'storm' && <Lightning />}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { overflow: 'hidden', backgroundColor: '#86C3EA' },
  drop: { position: 'absolute', top: 0, width: 1.6, height: 16, borderRadius: 1, backgroundColor: 'rgba(230,240,247,0.75)' },
});
