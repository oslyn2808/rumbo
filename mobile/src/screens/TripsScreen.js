import { useFocusEffect } from '@react-navigation/native';
import { Plus } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeOut, LinearTransition } from 'react-native-reanimated';
import { errorMessage } from '../api/client';
import { destinationsApi, tripsApi } from '../api/endpoints';
import Logo from '../components/Logo';
import Photo from '../components/Photo';
import { Body, Button, Empty, IconButton, Screen, Title } from '../components/ui';
import { useToast } from '../context/ToastContext';
import { useAsync } from '../hooks/useAsync';
import { colors, fonts, radius, shadow } from '../theme';
import { normalize, shortDate } from '../utils/format';

const savedOn = (iso) => shortDate(new Date(`${iso.replace(' ', 'T')}Z`));

// La portada de cada viaje es la foto del primer destino del catalogo que aparece en su ruta.
function coverFor(trip, destinations) {
  const text = normalize([...(trip.plan.route?.places ?? []), trip.destination, trip.plan.title].join(' '));
  let best = null;
  for (const d of destinations) {
    const at = text.indexOf(normalize(d.name));
    if (at >= 0 && (!best || at < best.at)) best = { d, at };
  }
  return best?.d ?? null;
}

export default function TripsScreen({ navigation }) {
  const toast = useToast();
  const { data, loading, error, reload } = useAsync(() => tripsApi.list());
  const catalog = useAsync(() => destinationsApi.list());
  const destinations = catalog.data?.items ?? [];
  const [confirming, setConfirming] = useState(null);

  // Al volver a esta pestana se recarga, por si guardaste un viaje nuevo.
  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  async function remove(id) {
    try {
      await tripsApi.remove(id);
      setConfirming(null);
      reload();
      toast.show('Viaje eliminado.');
    } catch (err) {
      toast.show(errorMessage(err), 'error');
    }
  }

  const trips = data ?? [];
  const newTrip = () => navigation.navigate('NuevoViaje');

  return (
    <Screen
      hero={
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Title>Mis viajes</Title>
            <Text style={styles.sub}>Tus rutas guardadas.</Text>
          </View>
          <IconButton icon={Plus} label="Planear un viaje nuevo" onPress={newTrip} />
        </View>
      }
    >
      {loading && !data && <Empty>Cargando tus viajes</Empty>}
      {error && (
        <Empty
          action={
            <Button variant="outline" small onPress={reload}>
              Reintentar
            </Button>
          }
        >
          {error}
        </Empty>
      )}

      {!loading && !error && trips.length === 0 && (
        <View style={styles.emptyState}>
          <View style={styles.emptyLogo}>
            <Logo size={64} color={colors.primary} />
          </View>
          <Text style={styles.emptyTitle}>Aún no tienes viajes</Text>
          <Body muted>Crea tu primera ruta y guárdala aquí.</Body>
          <Button icon={Plus} onPress={newTrip} style={{ marginTop: 8 }}>
            Planear un viaje
          </Button>
        </View>
      )}

      <View style={{ gap: 16 }}>
        {trips.map((t, i) => {
          const cover = coverFor(t, destinations);
          return (
            <Animated.View
              key={t.id}
              entering={FadeInDown.springify()
                .damping(18)
                .delay(Math.min(i, 6) * 60)}
              exiting={FadeOut.duration(200)}
              layout={LinearTransition.springify().damping(18)}
              style={styles.card}
            >
              <View style={styles.cover}>
                <Photo
                  destination={cover}
                  photo={cover ? undefined : null}
                  style={StyleSheet.absoluteFill}
                  fallback={<View style={[StyleSheet.absoluteFill, { backgroundColor: colors.ink700 }]} />}
                />
                <View style={styles.stamp}>
                  <Text style={styles.stampDays}>{t.days}</Text>
                  <Text style={styles.stampLabel}>{t.days === 1 ? 'día' : 'días'}</Text>
                </View>
                <Text style={styles.title} numberOfLines={2}>
                  {t.plan.title}
                </Text>
              </View>
              <View style={styles.body}>
                <Body muted style={{ fontSize: 13.5, lineHeight: 19 }}>
                  {t.plan.route?.places?.length ? t.plan.route.places.join(' → ') : t.destination}
                  {t.plan.route?.approxKm ? ` · ${t.plan.route.approxKm} km en línea recta` : ''}
                </Body>
                <View style={styles.meta}>
                  <Body muted style={{ fontSize: 13 }}>
                    Guardado el {savedOn(t.createdAt)}
                  </Body>
                </View>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {confirming === t.id ? (
                    <>
                      <Button variant="danger" small onPress={() => remove(t.id)}>
                        Sí, eliminar
                      </Button>
                      <Button variant="ghost" small onPress={() => setConfirming(null)}>
                        Cancelar
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button small onPress={() => navigation.navigate('Viaje', { id: t.id })}>
                        Abrir
                      </Button>
                      <Button variant="ghostDanger" small onPress={() => setConfirming(t.id)}>
                        Eliminar
                      </Button>
                    </>
                  )}
                </View>
              </View>
            </Animated.View>
          );
        })}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  sub: { marginTop: 6, fontFamily: fonts.body, fontSize: 14.5, color: colors.textOnDarkMuted },
  emptyState: { alignItems: 'center', gap: 8, paddingVertical: 40 },
  emptyLogo: { width: 110, height: 110, borderRadius: 55, backgroundColor: colors.cream200, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  emptyTitle: { fontFamily: fonts.display, fontSize: 24, color: colors.text },
  card: { borderRadius: radius.lg, backgroundColor: colors.white, overflow: 'hidden', ...shadow, shadowOpacity: 0.08 },
  cover: { height: 170, justifyContent: 'flex-end', padding: 16 },
  stamp: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.white,
    backgroundColor: 'rgba(7,17,15,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '-8deg' }],
  },
  stampDays: { fontFamily: fonts.bold, fontSize: 20, lineHeight: 22, color: colors.white },
  stampLabel: { fontFamily: fonts.semibold, fontSize: 10.5, color: colors.white, textTransform: 'uppercase', letterSpacing: 0.5 },
  title: { fontFamily: fonts.display, fontSize: 24, lineHeight: 29, color: colors.white },
  body: { gap: 12, padding: 16 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
});
