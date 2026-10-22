import { api } from './client.js';

const data = (res) => res.data;

export const authApi = {
  login: (body) => api.post('/auth/login', body).then(data),
  register: (body) => api.post('/auth/register', body).then(data),
  me: () => api.get('/auth/me').then(data),
};

export const destinationsApi = {
  list: () => api.get('/destinations').then(data),
  get: (id) => api.get(`/destinations/${id}`).then(data),
  weather: (id) => api.get(`/destinations/${id}/weather`).then(data),
  featuredRoute: () => api.get('/destinations/featured-route').then(data),
};

export const tripsApi = {
  generate: (body) => api.post('/trips/generate', body).then(data),
  regenerateDay: (body) => api.post('/trips/regenerate-day', body).then(data),
  save: (body) => api.post('/trips', body).then(data),
  list: () => api.get('/trips').then(data),
  get: (id) => api.get(`/trips/${id}`).then(data),
  remove: (id) => api.delete(`/trips/${id}`),
};

export const monumentsApi = {
  identify: (formData) => api.post('/monuments/identify', formData).then(data),
  save: (body) => api.post('/monuments', body).then(data),
  list: () => api.get('/monuments').then(data),
  remove: (id) => api.delete(`/monuments/${id}`),
};

export const healthApi = { get: () => api.get('/health').then(data) };
