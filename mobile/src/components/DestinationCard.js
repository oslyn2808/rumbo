import { MapPin } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { colors, fonts, radius, shadow } from '../theme';
import Photo from './Photo';
import PressableScale from './PressableScale';

export { sceneVariant } from './Photo';

export const CATEGORY_LABEL = {
  playas: 'Playas',
  volcanes: 'Volcanes',
  aventura: 'Aventura',
  naturaleza: 'Naturaleza',
};

// Tarjeta "postal": la foto ocupa toda la tarjeta y el texto va encima, sobre un degradado.
export default function DestinationCard({ destination: d, index = 0, onPress, distance, tall }) {
  return (
    <Animated.View entering={FadeInDown.springify().damping(18).delay(Math.min(index, 6) * 60)}>
      <PressableScale onPress={onPress} accessibilityRole="button" accessibilityLabel={`${d.name}, ${d.tagline}`} style={[styles.card, tall && styles.tall]}>
        <Photo destination={d} style={StyleSheet.absoluteFill} />
        <View style={styles.top}>
          <View style={styles.pill}>
            <MapPin size={12} color={colors.text} />
            <Text style={styles.pillText}>{d.region}</Text>
          </View>
          {distance != null && (
            <View style={styles.pill}>
              <Text style={styles.pillText}>a {Math.round(distance)} km</Text>
            </View>
          )}
        </View>
        <View style={styles.bottom}>
          <Text style={styles.name} numberOfLines={1}>
            {d.name}
          </Text>
          <Text style={styles.tag} numberOfLines={1}>
            {d.tagline}
          </Text>
          <View style={styles.cats}>
            {d.categories.map((c) => (
              <Text key={c} style={styles.cat}>
                {CATEGORY_LABEL[c] ?? c}
              </Text>
            ))}
          </View>
        </View>
      </PressableScale>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: { height: 236, borderRadius: radius.lg, overflow: 'hidden', backgroundColor: colors.ink700, justifyContent: 'space-between', ...shadow, shadowOpacity: 0.18 },
  tall: { height: 340 },
  top: { flexDirection: 'row', justifyContent: 'space-between', padding: 12 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.92)',
  },
  pillText: { fontFamily: fonts.semibold, fontSize: 12, color: colors.text },
  bottom: { padding: 18, gap: 2 },
  name: { fontFamily: fonts.display, fontSize: 28, lineHeight: 34, color: colors.white },
  tag: { fontFamily: fonts.medium, fontSize: 14.5, color: 'rgba(255,255,255,0.88)' },
  cats: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  cat: {
    fontFamily: fonts.semibold,
    fontSize: 11.5,
    letterSpacing: 0.3,
    color: colors.white,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.55)',
    paddingVertical: 3,
    paddingHorizontal: 9,
    borderRadius: 999,
    overflow: 'hidden',
  },
});
