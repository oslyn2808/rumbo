import { ArrowLeft, CloudRain, Droplets, Lightbulb, MapPin, RotateCw, Thermometer, Wind } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, interpolate, useAnimatedScrollHandler, useAnimatedStyle, useReducedMotion, useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { destinationsApi } from '../api/endpoints';
import Photo, { sceneVariant } from '../components/Photo';
import Scene from '../components/Scene';
import { Badge, Body, Button, IconButton, Sheet } from '../components/ui';
import { CONDITION_ICON, CONDITION_LABEL, CONDITION_NOTE, Sparkline } from '../components/Weather';
import { useAsync } from '../hooks/useAsync';
import { usePhoto } from '../hooks/usePhoto';
import { colors, fonts, radius, shadow } from '../theme';
import { longDate } from '../utils/format';

const HERO = 460;

const TONES = { sun: '#fdf0da', ocean: '#e0f0f8', mint: '#e0f5ee', rain: '#e6ecf2' };
const TONE_FG = { sun: '#b9741a', ocean: colors.ocean, mint: colors.primary, rain: colors.rain };

function Metric({ icon: Icon, label, value, hint, children, tone }) {
  return (
    <View style={styles.metric}>
      <View style={styles.metricTop}>
        <View style={[styles.metricIcon, { backgroundColor: TONES[tone] }]}>
          <Icon size={18} color={TONE_FG[tone]} />
        </View>
        {children}
      </View>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
      {hint ? <Text style={styles.metricHint}>{hint}</Text> : null}
    </View>
  );
}

export default function DestinationScreen({ route, navigation }) {
  const { id } = route.params;
  const insets = useSafeAreaInsets();
  const dest = useAsync(() => destinationsApi.get(id), [id]);
  const weather = useAsync(() => destinationsApi.weather(id), [id]);
  const [day, setDay] = useState(0);
  const photo = usePhoto(id);
  const reduceMotion = useReducedMotion();

  useEffect(() => setDay(0), [id]);

  // Parallax: la foto baja a la mitad de velocidad al hacer scroll y se amplia al tirar hacia abajo.
  const scrollY = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((e) => {
    scrollY.value = e.contentOffset.y;
  });
  const heroStyle = useAnimatedStyle(() => {
    if (reduceMotion) return {};
    const y = scrollY.value;
    return {
      transform: [{ translateY: y < 0 ? y / 2 : y * 0.5 }, { scale: interpolate(y, [-HERO, 0], [2, 1], 'clamp') }],
    };
  });

  const d = dest.data;
  const w = weather.data;
  const selected = w?.days[day];
  const isToday = day === 0;
  const condition = selected?.condition ?? 'sunny';
  const rainbow = condition === 'partly' && (selected?.rainChance ?? 0) >= 50;
  const temp = isToday ? w?.current.temperature ?? selected?.max : selected?.max;
  const plan = () => navigation.navigate('NuevoViaje', d ? { destino: d.name, dias: 3 } : {});

  if (dest.error) {
    return (
      <View style={[styles.page, { justifyContent: 'center', padding: 24, gap: 16 }]}>
        <Text style={{ color: colors.textOnDark, fontFamily: fonts.medium, fontSize: 16, textAlign: 'center' }}>{dest.error}</Text>
        <Button variant="mint" onPress={() => navigation.goBack()}>
          Volver
        </Button>
      </View>
    );
  }

  return (
    <View style={styles.page}>
      <Animated.ScrollView onScroll={onScroll} scrollEventThrottle={16} contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Animated.View style={[StyleSheet.absoluteFill, heroStyle]}>
            <Photo
              destination={d ?? { id }}
              photo={photo}
              style={StyleSheet.absoluteFill}
              fallback={<Scene kind={d?.scene ?? 'beach'} variant={d ? sceneVariant(d.id) % 2 : 0} condition={condition} rainbow={rainbow} style={StyleSheet.absoluteFill} label={d ? `Ilustración de ${d.name}` : ''} />}
            />
          </Animated.View>
          <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
            <IconButton icon={ArrowLeft} light label="Volver" onPress={() => navigation.goBack()} />
            <View style={styles.locationPill}>
              <MapPin size={16} color={colors.text} />
              <Text style={styles.locationText} numberOfLines={1}>
                {d?.region ?? 'Cargando'}
              </Text>
            </View>
            <IconButton icon={RotateCw} light label="Actualizar clima" onPress={weather.reload} disabled={weather.loading} />
          </View>

          <View style={styles.reading}>
            {d && <Text style={styles.heroName}>{d.name}</Text>}
            {w ? (
              <>
                {photo && (
                  <View style={styles.weatherWindow}>
                    <Scene kind={d?.scene ?? 'beach'} variant={d ? sceneVariant(d.id) % 2 : 0} condition={condition} rainbow={rainbow} style={StyleSheet.absoluteFill} />
                  </View>
                )}
                <Text style={styles.temp}>
                  {temp ?? '--'}
                  <Text style={styles.unit}>°C</Text>
                </Text>
                <Text style={styles.condition}>{CONDITION_LABEL[condition]}</Text>
              </>
            ) : (
              <Text style={styles.condition}>{weather.error ? 'Clima no disponible' : 'Cargando clima'}</Text>
            )}
          </View>

          {w && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={styles.days}>
              {w.days.map((x, i) => {
                const Icon = CONDITION_ICON[x.condition] ?? CONDITION_ICON.cloudy;
                const on = i === day;
                return (
                  <Pressable
                    key={x.date}
                    onPress={() => setDay(i)}
                    style={[styles.dayBtn, on && styles.dayOn]}
                    accessibilityRole="tab"
                    accessibilityState={{ selected: on }}
                    accessibilityLabel={`${x.label}: ${CONDITION_LABEL[x.condition]}, máxima ${x.max} grados`}
                  >
                    <Icon size={18} color={on ? colors.white : colors.text} />
                    <Text style={[styles.dayText, on && { color: colors.white }]}>{x.label}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          )}
        </View>

        <Sheet style={{ marginTop: -28, gap: 20 }}>
          <View style={styles.titleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.h1}>{isToday ? 'Condiciones de hoy' : `Pronóstico: ${selected?.label}`}</Text>
              <Body muted style={{ fontSize: 14 }}>
                {selected ? `${longDate(new Date(`${selected.date}T12:00:00`))} · ${CONDITION_NOTE[condition]}` : 'Consultando el clima de la zona.'}
              </Body>
            </View>
            {w && <Badge tone={w.live ? 'good' : 'warn'}>{w.live ? 'En vivo' : 'Referencia'}</Badge>}
          </View>

          {weather.loading && !w && <View style={styles.skeleton} />}
          {weather.error && (
            <View style={styles.inlineError}>
              <Text style={{ flex: 1, fontFamily: fonts.medium, color: colors.danger }}>{weather.error}</Text>
              <Button variant="outline" small onPress={weather.reload}>
                Reintentar
              </Button>
            </View>
          )}

          {w && (
            <Animated.View key={day} entering={FadeInDown.duration(280)} style={styles.metrics}>
              {isToday ? (
                <>
                  <Metric icon={Thermometer} tone="sun" label="Temperatura" value={`${w.current.temperature ?? '--'}°`} hint={w.current.feelsLike != null ? `Sensación de ${w.current.feelsLike}°` : 'Valor de referencia'}>
                    <Sparkline values={w.days.map((x) => x.max)} width={72} />
                  </Metric>
                  <Metric icon={Droplets} tone="ocean" label="Humedad" value={`${w.current.humidity ?? '--'}%`} hint={w.current.dewPoint != null ? `Punto de rocío ${w.current.dewPoint}°` : undefined} />
                  {w.current.windKmh != null && <Metric icon={Wind} tone="mint" label="Viento" value={`${w.current.windKmh} km/h`} />}
                  <Metric icon={CloudRain} tone="rain" label="Prob. de lluvia" value={`${selected.rainChance}%`} />
                </>
              ) : (
                <>
                  <Metric icon={Thermometer} tone="sun" label="Máxima" value={`${selected.max ?? '--'}°`}>
                    <Sparkline values={w.days.map((x) => x.max)} width={72} />
                  </Metric>
                  <Metric icon={CloudRain} tone="rain" label="Prob. de lluvia" value={`${selected.rainChance}%`} />
                </>
              )}
            </Animated.View>
          )}

          {w && (
            <View style={{ gap: 12 }}>
              <View>
                <Text style={styles.h2}>Recomendaciones</Text>
                <Body muted style={{ fontSize: 14 }}>
                  Según el pronóstico de la zona
                </Body>
              </View>
              {w.recommendations.map((r) => (
                <View key={r.id} style={styles.rec}>
                  <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
                    <View style={styles.recIcon}>
                      <Lightbulb size={18} color={colors.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.recTitle}>{r.title}</Text>
                      <Text style={styles.recWhen}>{r.tag}</Text>
                    </View>
                  </View>
                  <Body muted style={{ fontSize: 14 }}>
                    {r.body}
                  </Body>
                  <Button variant="outline" small block onPress={plan}>
                    {r.action.label}
                  </Button>
                </View>
              ))}
            </View>
          )}

          {d && (
            <View style={{ gap: 10, paddingBottom: insets.bottom }}>
              <Text style={styles.h2}>Sobre {d.name}</Text>
              <Body>{d.description}</Body>
              <Body muted style={{ fontStyle: 'italic', fontSize: 14 }}>
                {d.bestTime}
              </Body>
              {photo?.credit && (
                <Pressable onPress={() => photo.link && Linking.openURL(photo.link)} hitSlop={6}>
                  <Text style={styles.credit}>Foto: {photo.credit}</Text>
                </Pressable>
              )}
              <Text style={styles.h3}>Qué hacer</Text>
              {d.highlights.map((h) => (
                <View key={h} style={{ flexDirection: 'row', gap: 8 }}>
                  <Text style={{ color: colors.primary, fontFamily: fonts.bold }}>•</Text>
                  <Body style={{ flex: 1 }}>{h}</Body>
                </View>
              ))}
              <Button block onPress={plan} style={{ marginTop: 8 }}>
                Planear viaje a {d.name}
              </Button>
              <Button variant="ghost" block onPress={() => navigation.navigate('Tabs', { screen: 'Mapa', params: { focus: d.id } })}>
                Ver en el mapa
              </Button>
            </View>
          )}
        </Sheet>
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.cream100 },
  hero: { height: HERO, paddingBottom: 40, justifyContent: 'space-between' },
  heroName: { fontFamily: fonts.display, fontSize: 40, lineHeight: 46, color: colors.white, textAlign: 'center', paddingHorizontal: 20, textShadowColor: 'rgba(0,0,0,0.35)', textShadowRadius: 14 },
  weatherWindow: { width: 56, height: 56, borderRadius: 28, overflow: 'hidden', marginTop: 10, borderWidth: 2, borderColor: 'rgba(255,255,255,0.85)' },
  credit: { fontFamily: fonts.medium, fontSize: 12, color: colors.textMuted, textDecorationLine: 'underline' },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, gap: 10 },
  locationPill: {
    flexShrink: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  locationText: { fontFamily: fonts.semibold, fontSize: 14, color: colors.text, flexShrink: 1 },
  reading: { alignItems: 'center', gap: 2 },
  temp: { fontFamily: fonts.bold, fontSize: 72, lineHeight: 80, color: colors.white, textShadowColor: 'rgba(0,0,0,0.25)', textShadowRadius: 12 },
  unit: { fontSize: 28 },
  condition: { fontFamily: fonts.semibold, fontSize: 17, color: colors.white, textShadowColor: 'rgba(0,0,0,0.3)', textShadowRadius: 8 },
  days: { gap: 8, paddingHorizontal: 16, alignItems: 'flex-start' },
  dayBtn: { alignItems: 'center', gap: 4, paddingVertical: 10, paddingHorizontal: 14, borderRadius: radius.md, backgroundColor: 'rgba(255,255,255,0.85)', minWidth: 62 },
  dayOn: { backgroundColor: colors.ink900 },
  dayText: { fontFamily: fonts.semibold, fontSize: 12.5, color: colors.text },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  h1: { fontFamily: fonts.display, fontSize: 24, color: colors.text, marginBottom: 4 },
  h2: { fontFamily: fonts.display, fontSize: 22, color: colors.text },
  h3: { fontFamily: fonts.bold, fontSize: 16, color: colors.text, marginTop: 6 },
  skeleton: { height: 150, borderRadius: radius.lg, backgroundColor: colors.cream200 },
  inlineError: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: radius.md, backgroundColor: colors.dangerSoft },
  metrics: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  metric: { flexBasis: '47%', flexGrow: 1, padding: 14, borderRadius: radius.md, backgroundColor: colors.white, ...shadow, shadowOpacity: 0.05 },
  metricTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  metricIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  metricLabel: { fontFamily: fonts.medium, fontSize: 13, color: colors.textMuted },
  metricValue: { fontFamily: fonts.bold, fontSize: 24, color: colors.text },
  metricHint: { fontFamily: fonts.body, fontSize: 12.5, color: colors.textMuted },
  rec: { gap: 10, padding: 16, borderRadius: radius.md, backgroundColor: colors.white },
  recIcon: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#e0f5ee', alignItems: 'center', justifyContent: 'center' },
  recTitle: { fontFamily: fonts.bold, fontSize: 15.5, color: colors.text },
  recWhen: { fontFamily: fonts.medium, fontSize: 12.5, color: colors.primary },
});
