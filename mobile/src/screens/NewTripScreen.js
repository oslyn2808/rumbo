import { ArrowLeft, Bookmark, BookmarkCheck, MapPin, Minus, Plus, Sparkles } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { Animated, BackHandler, Easing, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { errorMessage } from '../api/client';
import { destinationsApi, tripsApi } from '../api/endpoints';
import Logo from '../components/Logo';
import PlanView from '../components/PlanView';
import { Button, Chip, IconButton, Screen, Segmented, TextField, Title } from '../components/ui';
import { useToast } from '../context/ToastContext';
import { colors, fonts, radius } from '../theme';

const INTERESTS = ['Playa', 'Surf', 'Naturaleza', 'Historia', 'Gastronomía', 'Aventura', 'Fotografía', 'Tranquilidad', 'Vida nocturna', 'Cultura local', 'Senderismo', 'Aguas termales'];

function Loading() {
  const t = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(t, { toValue: 1, duration: 800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(t, { toValue: -1, duration: 1000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(t, { toValue: 0, duration: 600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [t]);
  return (
    <View style={styles.loading}>
      <Animated.View style={{ transform: [{ rotate: t.interpolate({ inputRange: [-1, 1], outputRange: ['-10deg', '14deg'] }) }] }}>
        <Logo size={88} />
      </Animated.View>
      <Text style={styles.loadingTitle}>Armando tu ruta…</Text>
      <Text style={styles.loadingSub}>Esto puede tardar unos segundos.</Text>
    </View>
  );
}

export default function NewTripScreen({ navigation, route }) {
  const toast = useToast();
  const params = route.params ?? {};
  const scrollRef = useRef(null);

  const [destination, setDestination] = useState(params.destino ?? '');
  const [days, setDays] = useState(Math.min(14, Math.max(1, Number(params.dias) || 3)));
  const [interests, setInterests] = useState([]);
  const [budget, setBudget] = useState('Medio');
  const [travelers, setTravelers] = useState('Solo');
  const [pace, setPace] = useState('Relajado');

  const [suggestions, setSuggestions] = useState([]);
  const [plan, setPlan] = useState(null);
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(false);
  const [regenerating, setRegenerating] = useState(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    destinationsApi
      .list()
      .then(({ items }) => setSuggestions(items.slice(0, 8).map((d) => d.name)))
      .catch(() => {});
  }, []);

  // Con un plan en pantalla, "atras" vuelve al formulario en vez de salir.
  useEffect(() => {
    if (!plan) return undefined;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      setPlan(null);
      return true;
    });
    return () => sub.remove();
  }, [plan]);

  const toggleInterest = (name) => setInterests((list) => (list.includes(name) ? list.filter((i) => i !== name) : [...list, name]));

  async function submit() {
    if (destination.trim().length < 2) return setError('Escribe un destino.');
    setError('');
    setLoading(true);
    const body = { destination: destination.trim(), days, interests, budget: budget.toLowerCase(), travelers: travelers.toLowerCase(), pace: pace.toLowerCase() };
    try {
      setPlan(await tripsApi.generate(body));
      setRequest(body);
      setSaved(false);
      scrollRef.current?.scrollTo({ y: 0, animated: false });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function regenerate(day, instruction) {
    setRegenerating(day);
    try {
      setPlan(await tripsApi.regenerateDay({ request, plan, day, instruction }));
      setSaved(false);
    } catch (err) {
      toast.show(errorMessage(err), 'error');
    } finally {
      setRegenerating(null);
    }
  }

  async function save() {
    try {
      await tripsApi.save({ request, plan });
      setSaved(true);
      toast.show('Viaje guardado.');
    } catch (err) {
      toast.show(errorMessage(err), 'error');
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.ink900 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen
        scrollRef={scrollRef}
        footer={loading ? <Loading /> : null}
        hero={
          <>
            <IconButton icon={ArrowLeft} label={plan ? 'Editar los datos del viaje' : 'Volver'} onPress={() => (plan ? setPlan(null) : navigation.goBack())} />
            <Title style={{ marginTop: 16 }}>{plan ? 'Tu ruta' : 'Planear viaje'}</Title>
            <Text style={styles.sub}>{plan ? 'Ajusta cada día a tu gusto y guárdalo.' : 'Cuéntanos qué te gusta y armamos el itinerario.'}</Text>
          </>
        }
      >
        {plan ? (
          <View style={{ gap: 16 }}>
            <PlanView plan={plan} onRegenerate={regenerate} regenerating={regenerating} />
            <Button block variant={saved ? 'outline' : 'primary'} icon={saved ? BookmarkCheck : Bookmark} onPress={save} disabled={saved}>
              {saved ? 'Viaje guardado' : 'Guardar viaje'}
            </Button>
            {saved && (
              <Button block variant="ghost" onPress={() => navigation.navigate('Tabs', { screen: 'Viajes' })}>
                Ver mis viajes
              </Button>
            )}
          </View>
        ) : (
          <View style={{ gap: 22 }}>
            <View style={{ gap: 10 }}>
              <TextField label="Destino" icon={MapPin} value={destination} onChangeText={setDestination} placeholder="Ej: Santa Teresa" maxLength={100} returnKeyType="done" />
              {suggestions.length > 0 && (
                <View style={styles.wrap}>
                  {suggestions.map((s) => (
                    <Chip key={s} pressed={destination.trim() === s} onPress={() => setDestination(s)}>
                      {s}
                    </Chip>
                  ))}
                </View>
              )}
            </View>

            <View style={styles.stepper}>
              <Text style={styles.label}>Número de días</Text>
              <View style={styles.stepControl}>
                <Pressable onPress={() => setDays((d) => Math.max(1, d - 1))} disabled={days <= 1} style={[styles.stepBtn, days <= 1 && { opacity: 0.4 }]} accessibilityLabel="Menos días">
                  <Minus size={18} color={colors.text} />
                </Pressable>
                <Text style={styles.stepValue}>{days}</Text>
                <Pressable onPress={() => setDays((d) => Math.min(14, d + 1))} disabled={days >= 14} style={[styles.stepBtn, days >= 14 && { opacity: 0.4 }]} accessibilityLabel="Más días">
                  <Plus size={18} color={colors.text} />
                </Pressable>
              </View>
            </View>

            <View style={{ gap: 10 }}>
              <Text style={styles.label}>¿Qué te gusta?</Text>
              <View style={styles.wrap}>
                {INTERESTS.map((i) => (
                  <Chip key={i} pressed={interests.includes(i)} onPress={() => toggleInterest(i)}>
                    {i}
                  </Chip>
                ))}
              </View>
            </View>

            <Segmented label="Presupuesto" options={['Económico', 'Medio', 'Alto']} value={budget} onChange={setBudget} />
            <Segmented label="Viajo" options={['Solo', 'En pareja', 'En familia', 'Con amigos']} value={travelers} onChange={setTravelers} />
            <Segmented label="Ritmo" options={['Relajado', 'Moderado', 'Intenso']} value={pace} onChange={setPace} />

            {error ? <Text style={styles.error}>{error}</Text> : null}
            <Button block loading={loading} icon={Sparkles} onPress={submit}>
              Crear itinerario
            </Button>
          </View>
        )}
      </Screen>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  sub: { marginTop: 6, fontFamily: fonts.body, fontSize: 14.5, color: colors.textOnDarkMuted },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  label: { fontFamily: fonts.semibold, fontSize: 14, color: colors.text },
  stepper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, borderRadius: radius.md, backgroundColor: colors.white },
  stepControl: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  stepBtn: { width: 40, height: 40, borderRadius: 20, borderWidth: 1.5, borderColor: colors.cream300, alignItems: 'center', justifyContent: 'center' },
  stepValue: { fontFamily: fonts.bold, fontSize: 20, color: colors.text, minWidth: 26, textAlign: 'center' },
  error: { fontFamily: fonts.medium, fontSize: 14, color: colors.danger, backgroundColor: colors.dangerSoft, padding: 12, borderRadius: radius.sm, overflow: 'hidden' },
  loading: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(11,23,20,0.94)', alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingTitle: { fontFamily: fonts.display, fontSize: 24, color: colors.textOnDark, marginTop: 8 },
  loadingSub: { fontFamily: fonts.body, fontSize: 14, color: colors.textOnDarkMuted },
});
