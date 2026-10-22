import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, radius } from '../theme';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);
  const anim = useRef(new Animated.Value(0)).current;
  const timer = useRef(null);
  const insets = useSafeAreaInsets();

  const show = useCallback(
    (message, tone = 'info') => {
      clearTimeout(timer.current);
      setToast({ message, tone, key: Date.now() });
      Animated.spring(anim, { toValue: 1, useNativeDriver: true, friction: 8 }).start();
      timer.current = setTimeout(() => {
        Animated.timing(anim, { toValue: 0, duration: 220, useNativeDriver: true }).start(() => setToast(null));
      }, 2800);
    },
    [anim]
  );

  useEffect(() => () => clearTimeout(timer.current), []);
  const value = useMemo(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.toast,
            toast.tone === 'error' && styles.error,
            {
              top: insets.top + 10,
              opacity: anim,
              transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }],
            },
          ]}
        >
          <Text style={styles.text}>{toast.message}</Text>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast debe usarse dentro de ToastProvider');
  return ctx;
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    left: 20,
    right: 20,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: radius.md,
    backgroundColor: colors.ink800,
    borderWidth: 1,
    borderColor: colors.ink600,
    zIndex: 1000,
    elevation: 10,
  },
  error: { backgroundColor: colors.danger, borderColor: colors.danger },
  text: { color: colors.textOnDark, fontFamily: fonts.medium, fontSize: 14, textAlign: 'center' },
});
