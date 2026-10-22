import { useFocusEffect } from '@react-navigation/native';
import { Landmark, LogOut, Trash2 } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { API_URL, errorMessage } from '../api/client';
import { healthApi, monumentsApi, tripsApi } from '../api/endpoints';
import { Badge, Body, Button, Empty, Note, Screen } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useAsync } from '../hooks/useAsync';
import { colors, fonts, radius } from '../theme';
import { initials } from '../utils/format';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const toast = useToast();
  const trips = useAsync(() => tripsApi.list());
  const monuments = useAsync(() => monumentsApi.list());
  const health = useAsync(() => healthApi.get());
  const [confirming, setConfirming] = useState(null);

  useFocusEffect(
    useCallback(() => {
      trips.reload();
      monuments.reload();
    }, [trips.reload, monuments.reload]) // eslint-disable-line react-hooks/exhaustive-deps
  );

  async function removeMonument(id) {
    try {
      await monumentsApi.remove(id);
      setConfirming(null);
      monuments.reload();
      toast.show('Monumento eliminado del diario.');
    } catch (err) {
      toast.show(errorMessage(err), 'error');
    }
  }

  const list = monuments.data ?? [];

  return (
    <Screen
      hero={
        <View style={{ alignItems: 'center', gap: 6 }}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials(user?.name)}</Text>
          </View>
          <Text style={styles.name}>{user?.name}</Text>
          <Text style={styles.email}>{user?.email}</Text>
        </View>
      }
    >
      <View style={styles.stats}>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Viajes guardados</Text>
          <Text style={styles.statValue}>{trips.data?.length ?? '–'}</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Monumentos</Text>
          <Text style={styles.statValue}>{monuments.data?.length ?? '–'}</Text>
        </View>
      </View>

      <Text style={styles.section}>Mi diario de monumentos</Text>
      {monuments.loading && !monuments.data && <Empty>Cargando</Empty>}
      {monuments.error && <Empty>{monuments.error}</Empty>}
      {!monuments.loading && !monuments.error && list.length === 0 && <Empty>Aún no has guardado monumentos. Escanea uno para empezar.</Empty>}
      <View style={{ gap: 10 }}>
        {list.map((m) => (
          <View key={m.id} style={styles.item}>
            <View style={styles.itemIcon}>
              <Landmark size={20} color={colors.primary} />
            </View>
            <View style={{ flex: 1, gap: 3 }}>
              <Text style={styles.itemName}>{m.name}</Text>
              {m.location ? <Body muted style={{ fontSize: 13 }}>{m.location}</Body> : null}
              {m.info?.demo && <Badge tone="warn">Ejemplo</Badge>}
            </View>
            {confirming === m.id ? (
              <View style={{ gap: 6 }}>
                <Button variant="danger" small onPress={() => removeMonument(m.id)}>
                  Eliminar
                </Button>
                <Button variant="ghost" small onPress={() => setConfirming(null)}>
                  Cancelar
                </Button>
              </View>
            ) : (
              <Pressable onPress={() => setConfirming(m.id)} hitSlop={10} style={{ padding: 6 }} accessibilityLabel={`Eliminar ${m.name}`}>
                <Trash2 size={18} color={colors.textMuted} />
              </Pressable>
            )}
          </View>
        ))}
      </View>

      {health.data?.demoMode && (
        <View style={{ marginTop: 24 }}>
          <Note>La IA está en modo demo: los itinerarios y la identificación de monumentos usan ejemplos. Agrega tu clave en el archivo .env del backend para activarla.</Note>
        </View>
      )}

      <Button variant="outline" block icon={LogOut} onPress={logout} style={{ marginTop: 28 }}>
        Cerrar sesión
      </Button>
      <Text style={styles.server}>Servidor: {API_URL}</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  avatar: { width: 84, height: 84, borderRadius: 42, backgroundColor: colors.mint, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  avatarText: { fontFamily: fonts.bold, fontSize: 28, color: colors.ink900 },
  name: { fontFamily: fonts.display, fontSize: 28, color: colors.textOnDark, textAlign: 'center' },
  email: { fontFamily: fonts.body, fontSize: 14.5, color: colors.textOnDarkMuted },
  stats: { flexDirection: 'row', gap: 12 },
  stat: { flex: 1, padding: 16, borderRadius: radius.md, backgroundColor: colors.white },
  statLabel: { fontFamily: fonts.medium, fontSize: 13, color: colors.textMuted },
  statValue: { fontFamily: fonts.bold, fontSize: 28, color: colors.text, marginTop: 2 },
  section: { fontFamily: fonts.display, fontSize: 22, color: colors.text, marginTop: 28, marginBottom: 12 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: radius.md, backgroundColor: colors.white },
  itemIcon: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#e0f5ee', alignItems: 'center', justifyContent: 'center' },
  itemName: { fontFamily: fonts.bold, fontSize: 15, color: colors.text },
  server: { marginTop: 16, fontFamily: fonts.body, fontSize: 12, color: colors.textMuted, textAlign: 'center' },
});
