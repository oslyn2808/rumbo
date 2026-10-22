import { useIsFocused } from '@react-navigation/native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { Bookmark, BookmarkCheck, Camera, Image as ImageIcon, Info, ScanLine, SwitchCamera, TriangleAlert, X } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Image, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { errorMessage } from '../api/client';
import { monumentsApi } from '../api/endpoints';
import { Badge, Body, Button, Checkbox, Note, Screen, Title } from '../components/ui';
import { useToast } from '../context/ToastContext';
import { colors, fonts, radius } from '../theme';
import { getPosition, prepareImage } from '../utils/device';

function ScanLineOverlay() {
  const t = useRef(new Animated.Value(0)).current;
  const [h, setH] = useState(0);
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(t, { toValue: 1, duration: 1100, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(t, { toValue: 0, duration: 1100, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [t]);
  return (
    <View style={StyleSheet.absoluteFill} onLayout={(e) => setH(e.nativeEvent.layout.height)} pointerEvents="none">
      <Animated.View style={[styles.scanLine, { transform: [{ translateY: t.interpolate({ inputRange: [0, 1], outputRange: [h * 0.04, h * 0.92] }) }] }]} />
    </View>
  );
}

export default function ScanScreen() {
  const toast = useToast();
  const focused = useIsFocused();
  const cameraRef = useRef(null);
  const [permission, requestPermission] = useCameraPermissions();

  const [cameraOpen, setCameraOpen] = useState(false);
  const [facing, setFacing] = useState('back');
  const [ready, setReady] = useState(false);
  const [photo, setPhoto] = useState(null);
  const [useGps, setUseGps] = useState(true);
  const [busy, setBusy] = useState('');
  const [result, setResult] = useState(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const choose = (picked) => {
    setPhoto(picked);
    setCameraOpen(false);
    setResult(null);
    setSaved(false);
    setError('');
  };

  async function openCamera() {
    setError('');
    const status = permission?.granted ? permission : await requestPermission();
    if (!status.granted) {
      setError(status.canAskAgain ? 'Necesito permiso de cámara para tomar la foto.' : 'El permiso de cámara está bloqueado. Actívalo en los ajustes del celular.');
      return;
    }
    setReady(false);
    setCameraOpen(true);
  }

  async function shoot() {
    if (!cameraRef.current || !ready) return;
    try {
      const pic = await cameraRef.current.takePictureAsync({ quality: 0.8, skipProcessing: false });
      choose({ uri: pic.uri, width: pic.width, height: pic.height });
    } catch {
      toast.show('No se pudo tomar la foto. Intenta de nuevo.', 'error');
    }
  }

  async function pickFromGallery() {
    setError('');
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.9 });
    if (!res.canceled && res.assets?.[0]) {
      const a = res.assets[0];
      choose({ uri: a.uri, width: a.width, height: a.height });
    }
  }

  async function identify() {
    setError('');
    setResult(null);
    setSaved(false);
    try {
      setBusy('Preparando la foto');
      const uri = await prepareImage(photo).catch(() => {
        throw new Error('No se pudo leer esa imagen. Prueba con otra foto.');
      });
      const form = new FormData();
      form.append('photo', { uri, name: 'foto.jpg', type: 'image/jpeg' });
      if (useGps) {
        setBusy('Obteniendo tu ubicación');
        const pos = await getPosition();
        if (pos) {
          form.append('lat', String(pos.lat));
          form.append('lon', String(pos.lon));
        }
      }
      setBusy('Analizando el monumento');
      setResult(await monumentsApi.identify(form));
    } catch (err) {
      setError(err?.status || err?.code ? errorMessage(err) : err.message || errorMessage(err));
    } finally {
      setBusy('');
    }
  }

  async function save() {
    try {
      await monumentsApi.save({ name: result.name, location: result.location, info: result });
      setSaved(true);
      toast.show('Guardado en tu diario.');
    } catch (err) {
      toast.show(errorMessage(err), 'error');
    }
  }

  const reset = () => {
    setPhoto(null);
    setResult(null);
    setError('');
  };

  return (
    <Screen
      hero={
        <>
          <Title>Escanear</Title>
          <Text style={styles.sub}>Toma una foto de un monumento y conoce su historia.</Text>
        </>
      }
    >
      {cameraOpen && focused ? (
        <View style={{ gap: 14 }}>
          <View style={styles.frame}>
            <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing={facing} onCameraReady={() => setReady(true)} />
            <Pressable style={[styles.camBtn, { left: 12 }]} onPress={() => setCameraOpen(false)} accessibilityLabel="Cerrar la cámara">
              <X size={20} color={colors.white} />
            </Pressable>
            <Pressable style={[styles.camBtn, { right: 12 }]} onPress={() => setFacing((f) => (f === 'back' ? 'front' : 'back'))} accessibilityLabel="Cambiar de cámara">
              <SwitchCamera size={20} color={colors.white} />
            </Pressable>
            <Pressable style={[styles.shutterLive, !ready && { opacity: 0.5 }]} onPress={shoot} disabled={!ready} accessibilityLabel="Tomar la foto">
              <View style={styles.shutterInner} />
            </Pressable>
          </View>
          <Button variant="outline" icon={ImageIcon} onPress={pickFromGallery}>
            Elegir de la galería
          </Button>
        </View>
      ) : !photo ? (
        <View style={styles.start}>
          <Pressable onPress={openCamera} style={({ pressed }) => [styles.shutter, pressed && { transform: [{ scale: 0.94 }] }]} accessibilityLabel="Abrir la cámara">
            <View style={styles.ring} />
            <Camera size={38} color={colors.white} />
          </Pressable>
          <Body muted>Toca para abrir la cámara</Body>
          <Button variant="outline" icon={ImageIcon} onPress={pickFromGallery}>
            Elegir de la galería
          </Button>
          {permission && !permission.granted && !permission.canAskAgain && (
            <Button variant="ghost" small onPress={() => Linking.openSettings()}>
              Abrir ajustes del celular
            </Button>
          )}
        </View>
      ) : (
        <View style={{ gap: 16 }}>
          <View style={styles.frame}>
            <Image source={{ uri: photo.uri }} style={StyleSheet.absoluteFill} resizeMode="cover" accessibilityLabel="Foto seleccionada" />
            {busy ? <ScanLineOverlay /> : null}
          </View>

          <View style={styles.switchRow}>
            <Checkbox checked={useGps} onChange={setUseGps} disabled={Boolean(busy)} label="Usar mi ubicación" hint="Ayuda a identificar el lugar con más precisión." />
          </View>

          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Button style={{ flex: 1 }} loading={Boolean(busy)} icon={ScanLine} onPress={identify}>
              {busy || 'Identificar'}
            </Button>
            <Button variant="outline" onPress={reset} disabled={Boolean(busy)}>
              Otra foto
            </Button>
          </View>
        </View>
      )}

      {error ? (
        <View style={styles.error}>
          <TriangleAlert size={18} color={colors.danger} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {result && (
        <View style={styles.result}>
          {result.demo && <Note icon={Info}>Resultado de ejemplo del modo demo. Activa la IA para identificar tus propias fotos.</Note>}

          {!result.identified ? (
            <>
              <Text style={styles.name}>No pude identificar el lugar</Text>
              <Body>{result.summary || 'Prueba con otra foto, más cercana y con buena luz.'}</Body>
            </>
          ) : (
            <>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                <Badge tone={result.confidence === 'alta' ? 'good' : result.confidence === 'baja' ? 'warn' : undefined}>Confianza {result.confidence}</Badge>
                {result.yearBuilt ? <Badge>{result.yearBuilt}</Badge> : null}
                {result.style ? <Badge>{result.style}</Badge> : null}
              </View>
              <Text style={styles.name}>{result.name}</Text>
              {result.location ? <Body muted>{result.location}</Body> : null}
              {result.confidence === 'baja' && <Note icon={TriangleAlert}>No estoy seguro de este resultado. Verifica los datos antes de confiar en ellos.</Note>}
              {result.summary ? <Body>{result.summary}</Body> : null}
              {result.history ? (
                <>
                  <Text style={styles.h3}>Historia</Text>
                  <Body>{result.history}</Body>
                </>
              ) : null}
              {result.funFacts?.length > 0 && (
                <>
                  <Text style={styles.h3}>Datos curiosos</Text>
                  {result.funFacts.map((f) => (
                    <View key={f} style={{ flexDirection: 'row', gap: 8 }}>
                      <Text style={{ color: colors.primary, fontFamily: fonts.bold }}>•</Text>
                      <Body style={{ flex: 1 }}>{f}</Body>
                    </View>
                  ))}
                </>
              )}
              {result.visitTips ? (
                <>
                  <Text style={styles.h3}>Para visitar</Text>
                  <Body>{result.visitTips}</Body>
                </>
              ) : null}
              <Button block variant={saved ? 'outline' : 'primary'} icon={saved ? BookmarkCheck : Bookmark} onPress={save} disabled={saved} style={{ marginTop: 6 }}>
                {saved ? 'Guardado en tu diario' : 'Guardar en mi diario'}
              </Button>
            </>
          )}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  sub: { marginTop: 6, fontFamily: fonts.body, fontSize: 14.5, color: colors.textOnDarkMuted },
  start: { alignItems: 'center', gap: 16, paddingVertical: 28 },
  shutter: { width: 120, height: 120, borderRadius: 60, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  ring: { position: 'absolute', width: 140, height: 140, borderRadius: 70, borderWidth: 2, borderColor: colors.mint, opacity: 0.6 },
  frame: { width: '100%', aspectRatio: 3 / 4, borderRadius: radius.lg, overflow: 'hidden', backgroundColor: colors.ink900 },
  camBtn: { position: 'absolute', top: 12, width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(7,17,15,0.55)', alignItems: 'center', justifyContent: 'center' },
  shutterLive: {
    position: 'absolute',
    bottom: 18,
    alignSelf: 'center',
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    borderColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterInner: { width: 58, height: 58, borderRadius: 29, backgroundColor: colors.white },
  scanLine: { position: 'absolute', left: '4%', right: '4%', height: 3, borderRadius: 2, backgroundColor: colors.mint, shadowColor: colors.mint, shadowOpacity: 0.9, shadowRadius: 10, elevation: 6 },
  switchRow: { padding: 14, borderRadius: radius.md, backgroundColor: colors.white },
  error: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', marginTop: 16, padding: 14, borderRadius: radius.md, backgroundColor: colors.dangerSoft },
  errorText: { flex: 1, fontFamily: fonts.medium, fontSize: 14, lineHeight: 20, color: colors.danger },
  result: { marginTop: 20, gap: 10, padding: 18, borderRadius: radius.lg, backgroundColor: colors.white },
  name: { fontFamily: fonts.display, fontSize: 26, lineHeight: 32, color: colors.text },
  h3: { fontFamily: fonts.bold, fontSize: 16, color: colors.text, marginTop: 6 },
});
