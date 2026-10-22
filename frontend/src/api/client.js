import axios from 'axios';

const TOKEN_KEY = 'rumbo.token';

// "Mantener sesion iniciada" guarda el token en localStorage; si no, solo dura mientras la pestana este abierta.
export const tokenStore = {
  get() {
    try {
      return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set(token, remember) {
    this.clear();
    try {
      (remember ? localStorage : sessionStorage).setItem(TOKEN_KEY, token);
    } catch {
      /* almacenamiento bloqueado: la sesion durara solo en memoria */
    }
  },
  clear() {
    try {
      localStorage.removeItem(TOKEN_KEY);
      sessionStorage.removeItem(TOKEN_KEY);
    } catch {
      /* nada que limpiar */
    }
  },
};

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 60000,
});

api.interceptors.request.use((config) => {
  const token = tokenStore.get();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Si el servidor dice que la sesion expiro, la app se entera y manda a iniciar sesion.
let onUnauthorized = () => {};
export const setUnauthorizedHandler = (fn) => {
  onUnauthorized = fn;
};

api.interceptors.response.use(
  (res) => res,
  (error) => {
    const isAuthCall = /\/auth\/(login|register)/.test(error.config?.url ?? '');
    if (error.response?.status === 401 && !isAuthCall) onUnauthorized();
    return Promise.reject(error);
  }
);

export function errorMessage(error, fallback = 'Ocurrió un error. Intenta de nuevo.') {
  if (error?.response?.data?.message) return error.response.data.message;
  if (error?.code === 'ECONNABORTED') return 'La solicitud tardó demasiado. Intenta de nuevo.';
  if (error?.request && !error.response) return 'No se pudo conectar con el servidor. Revisa que el backend esté en marcha.';
  return fallback;
}

export const fieldErrors = (error) => error?.response?.data?.fields ?? {};
