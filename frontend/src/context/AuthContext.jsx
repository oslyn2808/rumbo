import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authApi } from '../api/endpoints.js';
import { setUnauthorizedHandler, tokenStore } from '../api/client.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // "checking" mientras se valida el token guardado al abrir la app.
  const [checking, setChecking] = useState(() => Boolean(tokenStore.get()));

  const logout = useCallback(() => {
    tokenStore.clear();
    setUser(null);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(logout);
  }, [logout]);

  useEffect(() => {
    if (!tokenStore.get()) return undefined;
    let cancelled = false;
    authApi
      .me()
      .then(({ user: me }) => !cancelled && setUser(me))
      // Solo un 401 significa sesion vencida; si el servidor no responde, el token se conserva para el proximo intento.
      .catch((err) => !cancelled && err?.response?.status === 401 && tokenStore.clear())
      .finally(() => !cancelled && setChecking(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const finish = useCallback(({ user: me, token }, remember) => {
    tokenStore.set(token, remember);
    setUser(me);
    return me;
  }, []);

  // beforeEnter (opcional) corre con las credenciales ya aceptadas y antes de abrir la sesion:
  // la pantalla de acceso lo usa para mostrar la animacion de exito antes de navegar.
  const login = useCallback(
    async ({ email, password, remember }, { beforeEnter } = {}) => {
      const res = await authApi.login({ email, password, remember });
      await beforeEnter?.();
      return finish(res, remember);
    },
    [finish]
  );
  const register = useCallback(
    async ({ name, email, password, remember }, { beforeEnter } = {}) => {
      const res = await authApi.register({ name, email, password, remember });
      await beforeEnter?.();
      return finish(res, remember);
    },
    [finish]
  );

  const value = useMemo(
    () => ({ user, checking, login, register, logout }),
    [user, checking, login, register, logout]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}
