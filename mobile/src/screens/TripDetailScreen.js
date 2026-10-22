import { ArrowLeft, Trash2 } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { errorMessage } from '../api/client';
import { tripsApi } from '../api/endpoints';
import PlanView from '../components/PlanView';
import { Button, Empty, IconButton, Screen, Title } from '../components/ui';
import { useToast } from '../context/ToastContext';
import { useAsync } from '../hooks/useAsync';
import { colors, fonts } from '../theme';

export default function TripDetailScreen({ navigation, route }) {
  const { id } = route.params;
  const toast = useToast();
  const { data, loading, error } = useAsync(() => tripsApi.get(id), [id]);
  const [confirming, setConfirming] = useState(false);

  async function remove() {
    try {
      await tripsApi.remove(id);
      toast.show('Viaje eliminado.');
      navigation.goBack();
    } catch (err) {
      toast.show(errorMessage(err), 'error');
    }
  }

  return (
    <Screen
      hero={
        <>
          <IconButton icon={ArrowLeft} label="Volver a mis viajes" onPress={() => navigation.goBack()} />
          <Title style={{ marginTop: 16 }}>Viaje guardado</Title>
          {data && (
            <Text style={styles.sub}>
              {data.destination} · {data.days} {data.days === 1 ? 'día' : 'días'}
            </Text>
          )}
        </>
      }
    >
      {loading && <Empty>Cargando el viaje</Empty>}
      {error && <Empty action={<Button variant="outline" small onPress={() => navigation.goBack()}>Volver a mis viajes</Button>}>{error}</Empty>}
      {data && (
        <View style={{ gap: 16 }}>
          <PlanView plan={data.plan} />
          {confirming ? (
            <>
              <Button variant="danger" block onPress={remove}>
                Sí, eliminar este viaje
              </Button>
              <Button variant="ghost" block onPress={() => setConfirming(false)}>
                Cancelar
              </Button>
            </>
          ) : (
            <Button variant="outline" block icon={Trash2} onPress={() => setConfirming(true)}>
              Eliminar viaje
            </Button>
          )}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  sub: { marginTop: 6, fontFamily: fonts.body, fontSize: 14.5, color: colors.textOnDarkMuted },
});
