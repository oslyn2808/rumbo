import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { setToken, setUnauthorizedHandler } from '../api/client';
import { authApi } from '../api/endpoints';
import { storage } from '../utils/storage';

const TOKEN_KEY = 'rumbo.token';
const INTRO_KEY = 'rumbo.intro';
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [introSeen, setIntroSeen] = useState(false);
  // "checking" mientras se valida el token guardado al abrir la app.
  const [checking, setChecking] = useState(true);

  const logout = useCallback(() => {
    setToken(null);
    storage.remove(TOKEN_KEY);
    setUser(null);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(logout);
  }, [logout]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [saved, intro] = await Promise.all([storage.get(TOKEN_KEY), storage.get(INTRO_KEY)]);
      if (cancelled) return;
      setIntroSeen(intro === '1');
      if (saved) {
        setToken(saved);
        try {
          const { user: me } = await authApi.me();
          if (!cancelled) setUser(me);
        } catch (err) {
          // Solo se borra el token si el servidor lo rechazo; sin conexion se conserva.
          if (err?.status === 401) {
            setToken(null);
            storage.remove(TOKEN_KEY);
          }
        }
      }
      if (!cancelled) setChecking(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // "Mantener sesion iniciada" guarda el token en el celular; si no, solo dura mientras la app este abierta.
  const finish = useCallback(async ({ user: me, token }, remember) => {
    setToken(token);
    if (remember) await storage.set(TOKEN_KEY, token);
    else await storage.remove(TOKEN_KEY);
    setUser(me);
    return me;
  }, []);

  const login = useCallback(
    async ({ email, password, remember }) => finish(await authApi.login({ email, password, remember }), remember),
    [finish]
  );
  const register = useCallback(
    async ({ name, email, password, remember }) =>
      finish(await authApi.register({ name, email, password, remember }), remember),
    [finish]
  );

  const markIntroSeen = useCallback(() => {
    setIntroSeen(true);
    storage.set(INTRO_KEY, '1');
  }, []);

  const value = useMemo(
    () => ({ user, checking, introSeen, login, register, logout, markIntroSeen }),
    [user, checking, introSeen, login, register, logout, markIntroSeen]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}
