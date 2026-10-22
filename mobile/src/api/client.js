import Constants from 'expo-constants';

// Direccion del backend. En el celular "localhost" es el propio telefono, asi que:
// 1) si defines EXPO_PUBLIC_API_URL (archivo mobile/.env), se usa esa;
// 2) si no, se toma la IP de la computadora que corre "npx expo start" y se usa el puerto 4000.
function resolveBaseUrl() {
  const fromEnv = (process.env.EXPO_PUBLIC_API_URL || '').trim();
  if (fromEnv) return fromEnv.replace(/\/+$/, '');
  const host = Constants.expoConfig?.hostUri?.split(':')[0];
  return host ? `http://${host}:4000/api` : 'http://localhost:4000/api';
}

export const API_URL = resolveBaseUrl();

let token = null;
export const setToken = (value) => {
  token = value;
};
export const getToken = () => token;

// Si el servidor dice que la sesion expiro, la app se entera y manda a iniciar sesion.
let onUnauthorized = () => {};
export const setUnauthorizedHandler = (fn) => {
  onUnauthorized = fn;
};

export class ApiError extends Error {
  constructor(message, { status, data, code } = {}) {
    super(message);
    this.status = status;
    this.data = data;
    this.code = code;
  }
}

async function request(method, path, { body, form, timeout = 60000 } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  const headers = { Accept: 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  let res;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: form ?? (body !== undefined ? JSON.stringify(body) : undefined),
      signal: controller.signal,
    });
  } catch (err) {
    throw new ApiError(err?.name === 'AbortError' ? 'timeout' : 'network', {
      code: err?.name === 'AbortError' ? 'timeout' : 'network',
    });
  } finally {
    clearTimeout(timer);
  }

  if (res.status === 204) return null;
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }

  if (!res.ok) {
    const isAuthCall = /\/auth\/(login|register)/.test(path);
    if (res.status === 401 && !isAuthCall) onUnauthorized();
    throw new ApiError(data?.message || `HTTP ${res.status}`, { status: res.status, data, code: data?.code });
  }
  return data;
}

export const api = {
  get: (path, opts) => request('GET', path, opts),
  post: (path, body, opts) => request('POST', path, { ...opts, body }),
  upload: (path, form, opts) => request('POST', path, { ...opts, form }),
  delete: (path, opts) => request('DELETE', path, opts),
};

export function errorMessage(error, fallback = 'Ocurrió un error. Intenta de nuevo.') {
  if (error?.data?.message) return error.data.message;
  if (error?.code === 'timeout') return 'La solicitud tardó demasiado. Intenta de nuevo.';
  if (error?.code === 'network') {
    return `No se pudo conectar con el servidor (${API_URL}). Revisa que el backend esté en marcha y que el celular esté en la misma red Wi-Fi.`;
  }
  return fallback;
}

export const fieldErrors = (error) => error?.data?.fields ?? {};
