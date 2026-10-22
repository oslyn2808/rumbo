import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';
import { usePhoto } from '../hooks/usePhoto';
import { colors } from '../theme';
import Scene from './Scene';

export const sceneVariant = (id) => [...id].reduce((n, c) => n + c.charCodeAt(0), 0) % 3;

// Foto real del destino. Mientras carga muestra un fondo neutro y, si no hay foto, la ilustracion de siempre.
export default function Photo({ destination: d, style, shade = true, fallback, photo: given }) {
  const found = usePhoto(given === undefined ? d?.id : null);
  const photo = given === undefined ? found : given;
  return (
    <View style={[styles.wrap, style]}>
      {photo === null &&
        (fallback ?? <Scene kind={d?.scene ?? 'beach'} condition="sunny" variant={d ? sceneVariant(d.id) : 0} animated={false} style={StyleSheet.absoluteFill} />)}
      {photo && (
        <Image
          source={{ uri: photo.uri }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          transition={350}
          cachePolicy="disk"
          accessibilityLabel={d ? `Foto de ${d.name}` : undefined}
        />
      )}
      {shade && <LinearGradient colors={['rgba(7,17,15,0.35)', 'rgba(7,17,15,0)', 'rgba(7,17,15,0.82)']} locations={[0, 0.38, 1]} style={StyleSheet.absoluteFill} pointerEvents="none" />}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { overflow: 'hidden', backgroundColor: colors.ink700 },
});
