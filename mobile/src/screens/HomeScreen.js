import { Camera, Search } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import Animated, { interpolate, useAnimatedScrollHandler, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { destinationsApi } from '../api/endpoints';
import DestinationCard from '../components/DestinationCard';
import { Body, Button, Chip, Empty, IconButton, Screen, Skeleton } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useAsync } from '../hooks/useAsync';
import { colors, fonts, radius } from '../theme';
import { distanceKm, getPosition } from '../utils/device';
import { firstName, initials, normalize } from '../utils/format';

const FILTERS = [
  ['todo', 'Todo'],
  ['playas', 'Playas'],
  ['volcanes', 'Volcanes'],
  ['aventura', 'Aventura'],
  ['naturaleza', 'Naturaleza'],
];

// Carrusel de postales: la tarjeta centrada se ve completa y las de los lados un poco mas pequenas.
function CarouselItem({ index, width, scrollX, children }) {
  const style = useAnimatedStyle(() => {
    const pos = scrollX.value / width;
    return {
      transform: [{ scale: interpolate(pos, [index - 1, index, index + 1], [0.92, 1, 0.92], 'clamp') }],
      opacity: interpolate(pos, [index - 1, index, index + 1], [0.75, 1, 0.75], 'clamp'),
    };
  });
  return <Animated.View style={[{ width }, style]}>{children}</Animated.View>;
}

function Carousel({ items, renderItem }) {
  const { width: screen } = useWindowDimensions();
  const width = Math.round(screen * 0.78);
  const scrollX = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((e) => {
    scrollX.value = e.contentOffset.x;
  });
  return (
    <Animated.ScrollView
      horizontal
      onScroll={onScroll}
      scrollEventThrottle={16}
      showsHorizontalScrollIndicator={false}
      snapToInterval={width}
      decelerationRate="fast"
      style={{ marginHorizontal: -20 }}
      contentContainerStyle={{ paddingHorizontal: (screen - width) / 2 }}
    >
      {items.map((d, i) => (
        <CarouselItem key={d.id} index={i} width={width} scrollX={scrollX}>
          <View style={{ paddingHorizontal: 6 }}>{renderItem(d, i)}</View>
        </CarouselItem>
      ))}
    </Animated.ScrollView>
  );
}

export default function HomeScreen({ navigation }) {
  const { user } = useAuth();
  const destinations = useAsync(() => destinationsApi.list());
  const route = useAsync(() => destinationsApi.featuredRoute());

  const [filter, setFilter] = useState('todo');
  const [query, setQuery] = useState('');
  const [showAll, setShowAll] = useState(false);
  const [here, setHere] = useState(null);

  // Si ya diste permiso de ubicacion, cada tarjeta muestra a cuantos km esta (sin volver a preguntar).
  useEffect(() => {
    getPosition({ ask: false }).then(setHere);
  }, []);

  const items = destinations.data?.items ?? [];
  const filtering = filter !== 'todo' || query.trim() !== '';

  const visible = useMemo(() => {
    const needle = normalize(query.trim());
    const matches = items.filter(
      (d) =>
        (filter === 'todo' || d.categories.includes(filter)) &&
        (!needle || normalize(`${d.name} ${d.region} ${d.tagline}`).includes(needle))
    );
    return matches;
  }, [items, filter, query]);
  // Sin filtros se muestra el carrusel de postales; con filtro o "Ver todo", la lista completa.
  const asList = filtering || showAll;

  const openDestination = (id) => navigation.navigate('Destino', { id });

  return (
    <Screen
      hero={
        <>
          <View style={styles.row}>
            <Pressable onPress={() => navigation.navigate('Perfil')} style={styles.avatar} accessibilityLabel="Ir a mi perfil">
              <Text style={styles.avatarText}>{initials(user?.name)}</Text>
            </Pressable>
            <View style={{ flex: 1 }}>
              <Text style={styles.hello}>Hola, {firstName(user?.name)}</Text>
              <Text style={styles.sub}>¿A dónde vamos hoy?</Text>
            </View>
            <IconButton icon={Camera} label="Escanear un monumento" onPress={() => navigation.navigate('Escanear')} />
          </View>

          <View style={styles.search}>
            <Search size={18} color={colors.textOnDarkMuted} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Buscar destinos"
              placeholderTextColor={colors.textOnDarkMuted}
              style={styles.searchInput}
              returnKeyType="search"
              accessibilityLabel="Buscar destinos"
            />
          </View>

          <View style={[styles.row, { marginTop: 22 }]}>
            <Text style={styles.sectionTitle}>Destinos populares</Text>
            {!filtering && (
              <Pressable onPress={() => setShowAll((s) => !s)} hitSlop={8}>
                <Text style={styles.seeAll}>{showAll ? 'Ver menos' : 'Ver todo'}</Text>
              </Pressable>
            )}
          </View>
        </>
      }
    >
      <View style={styles.chips}>
        {FILTERS.map(([key, label]) => (
          <Chip key={key} pressed={filter === key} onPress={() => setFilter(key)}>
            {label}
          </Chip>
        ))}
      </View>

      {destinations.loading && (
        <View style={{ gap: 16, marginTop: 16 }}>
          {[0, 1].map((i) => (
            <Skeleton key={i} style={styles.skeleton} />
          ))}
        </View>
      )}

      {destinations.error && (
        <Empty action={<Button variant="outline" small onPress={destinations.reload}>Reintentar</Button>}>{destinations.error}</Empty>
      )}

      {!destinations.loading && !destinations.error && (
        <View style={{ gap: 16, marginTop: 16 }}>
          {asList ? (
            visible.map((d, i) => (
              <DestinationCard key={d.id} destination={d} index={i} onPress={() => openDestination(d.id)} distance={here ? distanceKm(here, d) : null} />
            ))
          ) : (
            <Carousel
              items={visible}
              renderItem={(d, i) => <DestinationCard tall destination={d} index={i} onPress={() => openDestination(d.id)} distance={here ? distanceKm(here, d) : null} />}
            />
          )}
          {visible.length === 0 && <Empty>No encontramos destinos con ese filtro.</Empty>}
        </View>
      )}

      {route.data && !filtering && (
        <View style={styles.route}>
          <Text style={styles.routeTitle}>{route.data.title}</Text>
          <Body muted>
            {route.data.label} · {route.data.approxKm} km en línea recta
          </Body>
          <View style={{ gap: 4, marginVertical: 8 }}>
            {route.data.stops.map((s, i) => (
              <Pressable key={s.id} onPress={() => openDestination(s.id)} style={styles.stop}>
                <View style={{ alignItems: 'center' }}>
                  <View style={styles.stopNumber}>
                    <Text style={styles.stopNumberText}>{s.day}</Text>
                  </View>
                  {i < route.data.stops.length - 1 && <View style={styles.stopLine} />}
                </View>
                <View style={{ flex: 1, paddingBottom: 10 }}>
                  <Text style={styles.stopName}>{s.name}</Text>
                  <Text style={styles.stopTheme}>
                    Día {s.day} · {s.theme}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
          <Button
            block
            onPress={() => navigation.navigate('NuevoViaje', { destino: route.data.stops.map((s) => s.name).join(', '), dias: route.data.stops.length })}
          >
            Planear esta ruta
          </Button>
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.mint, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: fonts.bold, fontSize: 16, color: colors.ink900 },
  hello: { fontFamily: fonts.display, fontSize: 24, color: colors.textOnDark },
  sub: { fontFamily: fonts.body, fontSize: 14, color: colors.textOnDarkMuted },
  search: {
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    minHeight: 52,
    borderRadius: radius.md,
    backgroundColor: colors.ink800,
    borderWidth: 1,
    borderColor: colors.ink600,
  },
  searchInput: { flex: 1, fontFamily: fonts.body, fontSize: 15.5, color: colors.textOnDark, paddingVertical: 12 },
  sectionTitle: { fontFamily: fonts.display, fontSize: 22, color: colors.textOnDark },
  seeAll: { fontFamily: fonts.semibold, fontSize: 14, color: colors.mint },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  skeleton: { height: 236, borderRadius: radius.lg },
  route: { marginTop: 28, padding: 20, borderRadius: radius.lg, backgroundColor: colors.white, gap: 6 },
  routeTitle: { fontFamily: fonts.display, fontSize: 22, color: colors.text },
  stop: { flexDirection: 'row', gap: 12 },
  stopNumber: { width: 30, height: 30, borderRadius: 15, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  stopNumberText: { fontFamily: fonts.bold, color: colors.white, fontSize: 14 },
  stopLine: { flex: 1, width: 2, backgroundColor: colors.cream300, marginVertical: 2 },
  stopName: { fontFamily: fonts.bold, fontSize: 15, color: colors.text },
  stopTheme: { fontFamily: fonts.body, fontSize: 13, color: colors.textMuted, fontStyle: 'italic' },
});
