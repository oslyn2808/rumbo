import { ArrowRight, LocateFixed } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, Path, Pattern, Rect, Text as SvgText } from 'react-native-svg';
import { destinationsApi } from '../api/endpoints';
import { sceneVariant } from '../components/DestinationCard';
import Scene from '../components/Scene';
import { Body, Button, Empty, Screen, Title } from '../components/ui';
import { useToast } from '../context/ToastContext';
import { useAsync } from '../hooks/useAsync';
import { colors, fonts, radius, shadow } from '../theme';
import { distanceKm, getPosition } from '../utils/device';

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
const inside = ([x, y]) => x >= 0 && x <= W && y >= 0 && y <= H;

const CATEGORY_COLOR = { playas: '#2B8CBE', volcanes: '#D9532B', naturaleza: '#2F8F5B', aventura: '#E0932B' };
const LEGEND = [
  ['playas', 'Playas'],
  ['volcanes', 'Volcanes'],
  ['naturaleza', 'Naturaleza'],
  ['aventura', 'Aventura'],
];

export default function MapScreen({ navigation, route }) {
  const toast = useToast();
  const { data, loading, error, reload } = useAsync(() => destinationsApi.list());
  const [selectedId, setSelectedId] = useState(null);
  const [here, setHere] = useState(null);
  const [locating, setLocating] = useState(false);

  // "Ver en el mapa" desde un destino llega con el destino ya elegido.
  const focus = route.params?.focus;
  useEffect(() => {
    if (focus) setSelectedId(focus);
  }, [focus]);

  const items = data?.items ?? [];
  const selected = items.find((d) => d.id === selectedId) ?? null;
  const pins = useMemo(() => items.map((d) => ({ d, p: project([d.lon, d.lat]) })), [items]);

  async function locate() {
    setLocating(true);
    const pos = await getPosition();
    setLocating(false);
    if (!pos) return toast.show('No pude obtener tu ubicación. Revisa el permiso de ubicación.', 'error');
    setHere(pos);
    const nearest = items.reduce((best, d) => {
      const km = distanceKm(pos, d);
      return !best || km < best.km ? { d, km } : best;
    }, null);
    if (nearest) {
      setSelectedId(nearest.d.id);
      toast.show(`Lo más cerca: ${nearest.d.name}, a ${Math.round(nearest.km)} km.`);
    }
  }

  const herePoint = here ? project([here.lon, here.lat]) : null;

  return (
    <Screen
      hero={
        <>
          <Title>Mapa</Title>
          <Text style={styles.sub}>Toca un destino para ver el detalle.</Text>
        </>
      }
    >
      <View style={styles.mapBox}>
        <View style={{ width: '100%', aspectRatio: W / H }}>
          <Svg viewBox={`0 0 ${W} ${H}`} style={StyleSheet.absoluteFill}>
            <Defs>
              <Pattern id="dots" width="14" height="14" patternUnits="userSpaceOnUse">
                <Circle cx="2" cy="2" r="1" fill="#9CC3D1" opacity="0.5" />
              </Pattern>
            </Defs>
            <Rect width={W} height={H} fill="url(#dots)" />
            <Path d={PATH} fill="#DDE9CB" stroke="#7FA787" strokeWidth="2.5" strokeLinejoin="round" />
            <SvgText x="28" y="250" fill="#6b9bb0" fontSize="12" fontStyle="italic">Océano</SvgText>
            <SvgText x="28" y="266" fill="#6b9bb0" fontSize="12" fontStyle="italic">Pacífico</SvgText>
            <SvgText x="262" y="82" fill="#6b9bb0" fontSize="12" fontStyle="italic">Mar</SvgText>
            <SvgText x="262" y="98" fill="#6b9bb0" fontSize="12" fontStyle="italic">Caribe</SvgText>
            {herePoint && inside(herePoint) && (
              <>
                <Circle cx={herePoint[0]} cy={herePoint[1]} r="12" fill="#2b8cbe" opacity="0.2" />
                <Circle cx={herePoint[0]} cy={herePoint[1]} r="5.5" fill="#2b8cbe" stroke="#fff" strokeWidth="2" />
              </>
            )}
          </Svg>

          {pins.map(({ d, p }) => {
            const on = d.id === selectedId;
            return (
              <Pressable
                key={d.id}
                onPress={() => setSelectedId(on ? null : d.id)}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
                accessibilityLabel={`${d.name}, ${d.region}`}
                style={[styles.pin, { left: `${(p[0] / W) * 100}%`, top: `${(p[1] / H) * 100}%` }]}
              >
                <View style={[styles.dot, { backgroundColor: CATEGORY_COLOR[d.categories[0]] ?? colors.primary }, on && styles.dotOn]} />
                {on && (
                  <View style={styles.pinLabel}>
                    <Text style={styles.pinLabelText} numberOfLines={1}>
                      {d.name}
                    </Text>
                  </View>
                )}
              </Pressable>
            );
          })}

          <Pressable onPress={locate} disabled={locating || !items.length} style={styles.locate} accessibilityLabel="Mostrar mi ubicación">
            <LocateFixed size={20} color={locating ? colors.textMuted : colors.primary} />
          </Pressable>
        </View>
        {loading && <Empty>Cargando destinos</Empty>}
        {error && <Empty action={<Button variant="outline" small onPress={reload}>Reintentar</Button>}>{error}</Empty>}
      </View>

      <View style={styles.legend}>
        {LEGEND.map(([key, label]) => (
          <View key={key} style={styles.legendItem}>
            <View style={[styles.swatch, { backgroundColor: CATEGORY_COLOR[key] }]} />
            <Text style={styles.legendText}>{label}</Text>
          </View>
        ))}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 4, alignItems: 'center' }} style={{ marginHorizontal: -20, flexGrow: 0 }}>
        <View style={{ width: 12 }} />
        {items.map((d) => {
          const on = d.id === selectedId;
          return (
            <Pressable key={d.id} onPress={() => setSelectedId(on ? null : d.id)} style={[styles.chip, on && styles.chipOn]}>
              <View style={[styles.swatch, { backgroundColor: CATEGORY_COLOR[d.categories[0]] }]} />
              <Text style={[styles.chipText, on && { color: colors.white }]}>{d.name}</Text>
            </Pressable>
          );
        })}
        <View style={{ width: 12 }} />
      </ScrollView>

      {selected ? (
        <Pressable style={styles.card} onPress={() => navigation.navigate('Destino', { id: selected.id })}>
          <View style={styles.thumb}>
            <Scene kind={selected.scene} condition="sunny" variant={sceneVariant(selected.id)} animated={false} style={StyleSheet.absoluteFill} />
          </View>
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={styles.cardTitle}>{selected.name}</Text>
            <Body muted style={{ fontSize: 13.5, lineHeight: 19 }} numberOfLines={2}>
              {selected.region} · {selected.tagline}
              {here ? ` · a ${Math.round(distanceKm(here, selected))} km` : ''}
            </Body>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text style={styles.cardLink}>Ver destino</Text>
              <ArrowRight size={16} color={colors.primary} />
            </View>
          </View>
        </Pressable>
      ) : (
        !loading && !error && <Empty>Selecciona un punto del mapa o un destino de la lista.</Empty>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  sub: { marginTop: 6, fontFamily: fonts.body, fontSize: 14.5, color: colors.textOnDarkMuted },
  mapBox: { backgroundColor: '#eef5f6', borderRadius: radius.lg, padding: 8, overflow: 'hidden' },
  pin: { position: 'absolute', width: 1, height: 1, alignItems: 'center', justifyContent: 'center', overflow: 'visible' },
  dot: { position: 'absolute', width: 16, height: 16, borderRadius: 8, borderWidth: 2.5, borderColor: colors.white, ...shadow },
  dotOn: { width: 22, height: 22, borderRadius: 11 },
  pinLabel: { position: 'absolute', bottom: 14, backgroundColor: colors.ink900, paddingVertical: 4, paddingHorizontal: 8, borderRadius: 8, minWidth: 60, alignItems: 'center' },
  pinLabelText: { fontFamily: fonts.semibold, fontSize: 11.5, color: colors.white },
  locate: { position: 'absolute', right: 6, bottom: 6, width: 42, height: 42, borderRadius: 21, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center', ...shadow },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginVertical: 16 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendText: { fontFamily: fonts.medium, fontSize: 13, color: colors.textMuted },
  swatch: { width: 10, height: 10, borderRadius: 5 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 9, paddingHorizontal: 14, borderRadius: 999, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.cream300 },
  chipOn: { backgroundColor: colors.ink900, borderColor: colors.ink900 },
  chipText: { fontFamily: fonts.medium, fontSize: 13.5, color: colors.text },
  card: { flexDirection: 'row', gap: 14, alignItems: 'center', marginTop: 16, padding: 12, borderRadius: radius.lg, backgroundColor: colors.white, ...shadow },
  thumb: { width: 88, height: 88, borderRadius: radius.md, overflow: 'hidden' },
  cardTitle: { fontFamily: fonts.bold, fontSize: 16.5, color: colors.text },
  cardLink: { fontFamily: fonts.semibold, fontSize: 14, color: colors.primary },
});
