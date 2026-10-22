import { api } from './client';

export const authApi = {
  login: (body) => api.post('/auth/login', body),
  register: (body) => api.post('/auth/register', body),
  me: () => api.get('/auth/me'),
};

export const destinationsApi = {
  list: () => api.get('/destinations'),
  get: (id) => api.get(`/destinations/${encodeURIComponent(id)}`),
  weather: (id) => api.get(`/destinations/${encodeURIComponent(id)}/weather`),
  featuredRoute: () => api.get('/destinations/featured-route'),
};

export const tripsApi = {
  generate: (body) => api.post('/trips/generate', body, { timeout: 240000 }),
  regenerateDay: (body) => api.post('/trips/regenerate-day', body, { timeout: 120000 }),
  save: (body) => api.post('/trips', body),
  list: () => api.get('/trips'),
  get: (id) => api.get(`/trips/${id}`),
  remove: (id) => api.delete(`/trips/${id}`),
};

export const monumentsApi = {
  identify: (form) => api.upload('/monuments/identify', form, { timeout: 120000 }),
  save: (body) => api.post('/monuments', body),
  list: () => api.get('/monuments'),
  remove: (id) => api.delete(`/monuments/${id}`),
};

export const healthApi = { get: () => api.get('/health', { timeout: 8000 }) };
