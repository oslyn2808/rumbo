import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { destinationsApi } from '../api/endpoints';
import { sceneVariant } from '../components/DestinationCard';
import Scene from '../components/Scene';
import { Button, Title } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useAsync } from '../hooks/useAsync';
import { colors, fonts, radius } from '../theme';

function Column({ items, index }) {
  const t = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const dur = (22 + index * 5) * 500;
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(t, { toValue: 1, duration: dur, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(t, { toValue: 0, duration: dur, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [t, index]);
  const range = index === 1 ? [-40, -150] : [0, -110];
  return (
    <Animated.View style={[styles.column, { transform: [{ translateY: t.interpolate({ inputRange: [0, 1], outputRange: range }) }] }]}>
      {[...items, ...items].map((d, i) => (
        <View key={`${d.id}-${i}`} style={styles.tile}>
          <Scene kind={d.scene} condition="sunny" variant={sceneVariant(d.id)} animated={false} style={StyleSheet.absoluteFill} />
        </View>
      ))}
    </Animated.View>
  );
}

export default function IntroScreen() {
  const { markIntroSeen } = useAuth();
  const insets = useSafeAreaInsets();
  const { data } = useAsync(() => destinationsApi.list());
  const items = data?.items ?? [];
  const columns = [0, 1, 2].map((c) => items.filter((_, i) => i % 3 === c));
  const enter = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(enter, { toValue: 1, duration: 700, delay: 200, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [enter]);

  return (
    <View style={styles.page}>
      <View style={styles.collage} pointerEvents="none">
        {columns.map((col, c) => (
          <Column key={c} items={col} index={c} />
        ))}
      </View>
      <View style={styles.fade} pointerEvents="none">
        <Svg style={{ flex: 1 }} viewBox="0 0 1 1" preserveAspectRatio="none">
          <Defs>
            <LinearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={colors.ink900} stopOpacity="0" />
              <Stop offset="1" stopColor={colors.ink900} stopOpacity="1" />
            </LinearGradient>
          </Defs>
          <Rect x="0" y="0" width="1" height="1" fill="url(#fade)" />
        </Svg>
        <View style={{ height: '42%', backgroundColor: colors.ink900 }} />
      </View>

      <Animated.View
        style={[
          styles.content,
          { paddingBottom: insets.bottom + 28 },
          { opacity: enter, transform: [{ translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) }] },
        ]}
      >
        <Title style={{ fontSize: 36, lineHeight: 42 }}>Tu próxima aventura, a un toque.</Title>
        <Text style={styles.text}>Playas, volcanes y rutas pensadas para tu estilo, para que planees menos y vivas más.</Text>
        <Button variant="mint" block onPress={markIntroSeen}>
          Comenzar
        </Button>
        <Text style={styles.foot}>{data ? `${data.total} destinos` : 'Destinos de Costa Rica'} · itinerarios con IA · reconoce monumentos</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.ink900 },
  collage: { position: 'absolute', top: -20, left: -30, right: -30, flexDirection: 'row', gap: 12, transform: [{ rotate: '-6deg' }] },
  column: { flex: 1, gap: 12 },
  tile: { height: 190, borderRadius: radius.lg, overflow: 'hidden' },
  fade: { position: 'absolute', left: 0, right: 0, top: '22%', bottom: 0 },
  content: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 24, gap: 18 },
  text: { fontFamily: fonts.body, fontSize: 16, lineHeight: 24, color: colors.textOnDarkMuted },
  foot: { fontFamily: fonts.medium, fontSize: 12.5, color: colors.textOnDarkMuted, textAlign: 'center' },
});
