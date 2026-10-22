import { Eye, EyeOff, Lock, Mail, User } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { Animated, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { errorMessage, fieldErrors } from '../api/client';
import Contours from '../components/Contours';
import Logo from '../components/Logo';
import { Button, Checkbox, TextField, Title } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { colors, fonts, radius } from '../theme';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function validate(mode, v) {
  const e = {};
  if (mode === 'register' && v.name.trim().length < 2) e.name = 'Escribe tu nombre.';
  if (!EMAIL.test(v.email.trim())) e.email = 'Escribe un correo válido.';
  if (mode === 'register' ? v.password.length < 8 : v.password.length < 1) {
    e.password = mode === 'register' ? 'Usa al menos 8 caracteres.' : 'Escribe tu contraseña.';
  }
  return e;
}

export default function AuthScreen() {
  const { login, register } = useAuth();
  const toast = useToast();
  const insets = useSafeAreaInsets();

  const [mode, setMode] = useState('login');
  const [values, setValues] = useState({ name: '', email: '', password: '' });
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);

  const shake = useRef(new Animated.Value(0)).current;
  const enter = useRef(new Animated.Value(0)).current;
  const emailRef = useRef(null);
  const passwordRef = useRef(null);

  useEffect(() => {
    Animated.spring(enter, { toValue: 1, useNativeDriver: true, friction: 9, tension: 50 }).start();
  }, [enter]);

  const set = (key) => (text) => {
    setValues((v) => ({ ...v, [key]: text }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const switchMode = (next) => {
    setMode(next);
    setErrors({});
    setFormError('');
  };

  const fail = (fields, message = '') => {
    setErrors(fields);
    setFormError(message);
    shake.setValue(0);
    Animated.timing(shake, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  };

  async function onSubmit() {
    const found = validate(mode, values);
    if (Object.keys(found).length) return fail(found);
    setLoading(true);
    setFormError('');
    try {
      const payload = { name: values.name.trim(), email: values.email.trim(), password: values.password, remember };
      if (mode === 'login') await login(payload);
      else await register(payload);
      // La navegacion cambia sola al detectar la sesion.
    } catch (err) {
      const fields = fieldErrors(err);
      fail(fields, Object.keys(fields).length ? '' : errorMessage(err));
      setLoading(false);
    }
  }

  const soon = () => toast.show('Disponible pronto.');
  const isLogin = mode === 'login';
  const shakeX = shake.interpolate({ inputRange: [0, 0.2, 0.4, 0.6, 0.8, 1], outputRange: [0, -9, 9, -6, 6, 0] });

  return (
    <KeyboardAvoidingView style={styles.page} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Contours />
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={[styles.header, { paddingTop: insets.top + 24 }]}>
          <View style={styles.brand}>
            <Logo size={34} />
            <Text style={styles.brandText}>Rumbo</Text>
          </View>
          <Title style={{ marginTop: 28 }}>{isLogin ? 'Qué bueno verte.' : 'Empecemos tu ruta.'}</Title>
          <Text style={styles.sub}>{isLogin ? 'Tus viajes guardados te están esperando.' : 'Crea tu cuenta para guardar viajes y monumentos.'}</Text>
        </View>

        <Animated.View
          style={[
            styles.sheet,
            { paddingBottom: insets.bottom + 28 },
            { opacity: enter, transform: [{ translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [80, 0] }) }, { translateX: shakeX }] },
          ]}
        >
          <View style={styles.tabs}>
            {[
              ['login', 'Entrar'],
              ['register', 'Registro'],
            ].map(([key, label]) => (
              <Pressable key={key} onPress={() => switchMode(key)} style={[styles.tab, mode === key && styles.tabOn]} accessibilityRole="tab" accessibilityState={{ selected: mode === key }}>
                <Text style={[styles.tabText, mode === key && { color: colors.white }]}>{label}</Text>
              </Pressable>
            ))}
          </View>

          <View style={{ gap: 16 }}>
            {!isLogin && (
              <TextField label="Nombre" icon={User} value={values.name} onChangeText={set('name')} error={errors.name} autoComplete="name" textContentType="name" placeholder="Ingresa tu nombre" returnKeyType="next" onSubmitEditing={() => emailRef.current?.focus()} />
            )}
            <TextField
              ref={emailRef}
              label="Correo electrónico"
              icon={Mail}
              value={values.email}
              onChangeText={set('email')}
              error={errors.email}
              autoComplete="email"
              textContentType="emailAddress"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="Ingresa tu correo electrónico"
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()}
            />
            <TextField
              ref={passwordRef}
              label="Contraseña"
              icon={Lock}
              value={values.password}
              onChangeText={set('password')}
              error={errors.password}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoComplete={isLogin ? 'current-password' : 'new-password'}
              textContentType={isLogin ? 'password' : 'newPassword'}
              placeholder={isLogin ? 'Ingresa tu contraseña' : 'Mínimo 8 caracteres'}
              returnKeyType="go"
              onSubmitEditing={onSubmit}
              trailing={
                <Pressable onPress={() => setShowPassword((s) => !s)} hitSlop={10} style={{ paddingHorizontal: 14 }} accessibilityLabel={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}>
                  {showPassword ? <EyeOff size={18} color={colors.textMuted} /> : <Eye size={18} color={colors.textMuted} />}
                </Pressable>
              }
            />

            <View style={styles.row}>
              <Checkbox checked={remember} onChange={setRemember} label="Mantener sesión iniciada" />
              {isLogin && (
                <Pressable onPress={soon} hitSlop={8}>
                  <Text style={styles.link}>¿Olvidaste tu clave?</Text>
                </Pressable>
              )}
            </View>

            {formError ? <Text style={styles.formError}>{formError}</Text> : null}

            <Button block loading={loading} onPress={onSubmit}>
              {isLogin ? 'Iniciar sesión' : 'Crear cuenta'}
            </Button>
          </View>

          <View style={styles.divider}>
            <View style={styles.rule} />
            <Text style={styles.dividerText}>O CONTINÚA CON</Text>
            <View style={styles.rule} />
          </View>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <Button variant="outline" onPress={soon} style={{ flex: 1 }}>
              Google
            </Button>
            <Button variant="outline" onPress={soon} style={{ flex: 1 }}>
              Apple
            </Button>
          </View>

          <View style={styles.switch}>
            <Text style={styles.switchText}>{isLogin ? '¿Primera vez en Rumbo? ' : '¿Ya tienes cuenta? '}</Text>
            <Pressable onPress={() => switchMode(isLogin ? 'register' : 'login')} hitSlop={8}>
              <Text style={styles.link}>{isLogin ? 'Crea una cuenta' : 'Inicia sesión'}</Text>
            </Pressable>
          </View>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.ink900 },
  header: { paddingHorizontal: 24, paddingBottom: 28 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  brandText: { fontFamily: fonts.display, fontSize: 24, color: colors.textOnDark },
  sub: { marginTop: 8, fontFamily: fonts.body, fontSize: 15, color: colors.textOnDarkMuted },
  sheet: {
    flexGrow: 1,
    backgroundColor: colors.cream50,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: 22,
    paddingTop: 22,
    gap: 20,
  },
  tabs: { flexDirection: 'row', backgroundColor: colors.cream200, borderRadius: 999, padding: 4 },
  tab: { flex: 1, paddingVertical: 11, borderRadius: 999, alignItems: 'center' },
  tabOn: { backgroundColor: colors.ink900 },
  tabText: { fontFamily: fonts.semibold, fontSize: 15, color: colors.text },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' },
  link: { fontFamily: fonts.semibold, fontSize: 14, color: colors.primary },
  formError: { fontFamily: fonts.medium, fontSize: 14, color: colors.danger, backgroundColor: colors.dangerSoft, padding: 12, borderRadius: radius.sm, overflow: 'hidden' },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  rule: { flex: 1, height: 1, backgroundColor: colors.cream300 },
  dividerText: { fontFamily: fonts.semibold, fontSize: 11.5, letterSpacing: 1, color: colors.textMuted },
  switch: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap' },
  switchText: { fontFamily: fonts.body, fontSize: 14, color: colors.textMuted },
});
