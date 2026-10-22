import { CircleAlert } from 'lucide-react-native';
import { forwardRef, useEffect } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, radius } from '../theme';
import PressableScale from './PressableScale';

/* ---------- Texto ---------- */

export function Title({ style, dark, children, ...rest }) {
  return (
    <Text style={[styles.title, dark && { color: colors.text }, style]} {...rest}>
      {children}
    </Text>
  );
}

export function Body({ style, muted, children, ...rest }) {
  return (
    <Text style={[styles.body, muted && styles.muted, style]} {...rest}>
      {children}
    </Text>
  );
}

/* ---------- Botones ---------- */

const VARIANTS = {
  primary: { bg: colors.primary, fg: colors.white, border: colors.primary },
  mint: { bg: colors.mint, fg: colors.ink900, border: colors.mint },
  outline: { bg: 'transparent', fg: colors.text, border: colors.cream300 },
  outlineDark: { bg: 'transparent', fg: colors.textOnDark, border: colors.ink600 },
  ghost: { bg: 'transparent', fg: colors.primary, border: 'transparent' },
  danger: { bg: colors.danger, fg: colors.white, border: colors.danger },
  ghostDanger: { bg: 'transparent', fg: colors.danger, border: 'transparent' },
};

export function Button({ variant = 'primary', small, block, loading, disabled, icon: Icon, onPress, children, style }) {
  const v = VARIANTS[variant] ?? VARIANTS.primary;
  const off = disabled || loading;
  return (
    <View style={[block && { alignSelf: 'stretch' }, style]}>
      <PressableScale
        to={0.96}
        onPress={onPress}
        disabled={off}
        accessibilityRole="button"
        accessibilityState={{ disabled: off, busy: loading }}
        style={[
          styles.button,
          small && styles.buttonSmall,
          { backgroundColor: v.bg, borderColor: v.border, opacity: disabled && !loading ? 0.5 : 1 },
        ]}
      >
        {loading ? <ActivityIndicator size="small" color={v.fg} /> : Icon ? <Icon size={18} color={v.fg} /> : null}
        <Text style={[styles.buttonText, small && { fontSize: 14 }, { color: v.fg }]} numberOfLines={1}>
          {children}
        </Text>
      </PressableScale>
    </View>
  );
}

export function IconButton({ icon: Icon, onPress, light, label, size = 48, disabled }) {
  return (
    <PressableScale
      to={0.92}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={6}
      style={[
        styles.iconButton,
        { width: size, height: size, borderRadius: size / 2 },
        light && { backgroundColor: 'rgba(255,255,255,0.9)', borderColor: 'transparent' },
        disabled && { opacity: 0.5 },
      ]}
    >
      <Icon size={20} color={light ? colors.text : colors.textOnDark} />
    </PressableScale>
  );
}

export function Chip({ pressed, onPress, children, dark }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: pressed }}
      style={[styles.chip, dark && styles.chipDark, pressed && styles.chipOn]}
    >
      <Text style={[styles.chipText, dark && { color: colors.textOnDark }, pressed && { color: colors.white }]}>{children}</Text>
    </Pressable>
  );
}

// Bloque de carga que "respira" mientras llega el contenido.
export function Skeleton({ style, dark }) {
  const o = useSharedValue(0.55);
  useEffect(() => {
    o.value = withRepeat(withSequence(withTiming(1, { duration: 700, easing: Easing.inOut(Easing.quad) }), withTiming(0.55, { duration: 700, easing: Easing.inOut(Easing.quad) })), -1);
  }, [o]);
  const animated = useAnimatedStyle(() => ({ opacity: o.value }));
  return <Animated.View style={[{ backgroundColor: dark ? colors.ink700 : colors.cream200, borderRadius: radius.md }, style, animated]} />;
}

/* ---------- Formularios ---------- */

export const TextField = forwardRef(function TextField({ label, icon: Icon, error, trailing, style, ...rest }, ref) {
  return (
    <View style={[styles.field, style]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={[styles.control, error && { borderColor: colors.danger }]}>
        {Icon && <Icon size={18} color={colors.textMuted} style={{ marginLeft: 14 }} />}
        <TextInput ref={ref} style={styles.input} placeholderTextColor="#8a9893" {...rest} />
        {trailing}
      </View>
      {error ? (
        <View style={styles.errorRow}>
          <CircleAlert size={14} color={colors.danger} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}
    </View>
  );
});

export function Segmented({ label, options, value, onChange }) {
  return (
    <View style={{ gap: 8 }}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.segmented}>
        {options.map((o) => {
          const on = o === value;
          return (
            <Pressable key={o} onPress={() => onChange(o)} style={[styles.segment, on && styles.segmentOn]} accessibilityState={{ selected: on }}>
              <Text style={[styles.segmentText, on && { color: colors.white }]} numberOfLines={1}>
                {o}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

/* ---------- Estructura ---------- */

// Pantalla comun: encabezado oscuro arriba y una hoja clara que ocupa el resto.
export function Screen({ hero, children, scrollRef, contentStyle, footer }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.screen}>
      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.hero, { paddingTop: Math.max(insets.top, 12) + 10 }]}>{hero}</View>
        <Sheet style={contentStyle}>{children}</Sheet>
      </ScrollView>
      {footer}
    </View>
  );
}

export function Sheet({ style, children }) {
  return <View style={[styles.sheet, style]}>{children}</View>;
}

export function Badge({ tone, children }) {
  const t = tone === 'good' ? styles.badgeGood : tone === 'warn' ? styles.badgeWarn : null;
  return (
    <View style={[styles.badge, t]}>
      <Text style={[styles.badgeText, tone === 'good' && { color: colors.primaryStrong }, tone === 'warn' && { color: '#8a5a12' }]}>{children}</Text>
    </View>
  );
}

export function Note({ icon: Icon, children }) {
  return (
    <View style={styles.note}>
      {Icon && <Icon size={18} color="#6b4e16" style={{ marginTop: 1 }} />}
      <Text style={styles.noteText}>{children}</Text>
    </View>
  );
}

export function Empty({ children, action }) {
  return (
    <View style={{ paddingVertical: 36, paddingHorizontal: 16, alignItems: 'center', gap: 12 }}>
      <Body muted style={{ textAlign: 'center' }}>
        {children}
      </Body>
      {action}
    </View>
  );
}

export function Checkbox({ checked, onChange, label, hint, disabled }) {
  return (
    <Pressable
      onPress={() => !disabled && onChange(!checked)}
      accessibilityRole="checkbox"
      accessibilityState={{ checked, disabled }}
      style={[{ flexDirection: 'row', alignItems: 'center', gap: 10, flexShrink: 1 }, disabled && { opacity: 0.6 }]}
    >
      <View style={[styles.box, checked && styles.boxOn]}>{checked && <View style={styles.tick} />}</View>
      <View style={{ flexShrink: 1 }}>
        <Text style={[styles.body, { fontFamily: hint ? fonts.semibold : fonts.body, fontSize: 14 }]}>{label}</Text>
        {hint ? <Text style={[styles.muted, { fontSize: 12.5, fontFamily: fonts.body }]}>{hint}</Text> : null}
      </View>
    </Pressable>
  );
}

export const styles = StyleSheet.create({
  title: { fontFamily: fonts.display, fontSize: 32, lineHeight: 38, color: colors.textOnDark },
  body: { fontFamily: fonts.body, fontSize: 15, lineHeight: 22, color: colors.text },
  muted: { color: colors.textMuted },

  button: {
    minHeight: 52,
    paddingHorizontal: 20,
    borderRadius: 999,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  buttonSmall: { minHeight: 40, paddingHorizontal: 16 },
  buttonText: { fontFamily: fonts.semibold, fontSize: 15.5 },

  iconButton: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.ink600,
    backgroundColor: colors.ink800,
  },

  chip: {
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.cream300,
    backgroundColor: colors.white,
  },
  chipDark: { backgroundColor: colors.ink800, borderColor: colors.ink600 },
  chipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontFamily: fonts.medium, fontSize: 14, color: colors.text },

  field: { gap: 8 },
  label: { fontFamily: fonts.semibold, fontSize: 14, color: colors.text },
  control: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 52,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.cream300,
    backgroundColor: colors.white,
  },
  input: { flex: 1, paddingHorizontal: 12, paddingVertical: 12, fontFamily: fonts.body, fontSize: 15.5, color: colors.text },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  errorText: { fontFamily: fonts.medium, fontSize: 13, color: colors.danger },

  segmented: { flexDirection: 'row', backgroundColor: colors.cream200, borderRadius: 999, padding: 4, gap: 4 },
  segment: { flex: 1, paddingVertical: 10, paddingHorizontal: 4, borderRadius: 999, alignItems: 'center' },
  segmentOn: { backgroundColor: colors.primary },
  segmentText: { fontFamily: fonts.medium, fontSize: 13, color: colors.text },

  screen: { flex: 1, backgroundColor: colors.ink900 },
  hero: { paddingHorizontal: 20, paddingBottom: 22 },
  sheet: {
    flexGrow: 1,
    backgroundColor: colors.cream100,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
  },

  badge: { alignSelf: 'flex-start', paddingVertical: 4, paddingHorizontal: 10, borderRadius: 999, backgroundColor: colors.cream200 },
  badgeGood: { backgroundColor: '#dff3ea' },
  badgeWarn: { backgroundColor: '#fbecd2' },
  badgeText: { fontFamily: fonts.semibold, fontSize: 12, color: colors.text },

  note: { flexDirection: 'row', gap: 10, padding: 14, borderRadius: radius.md, backgroundColor: '#fbf0d9' },
  noteText: { flex: 1, fontFamily: fonts.body, fontSize: 14, lineHeight: 20, color: '#6b4e16' },

  box: {
    width: 22,
    height: 22,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: colors.cream300,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  tick: { width: 10, height: 10, borderRadius: 3, backgroundColor: colors.white },
});
