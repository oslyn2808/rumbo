import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// En desarrollo, las llamadas a /api se reenvian al backend (puerto 4000),
// asi el navegador solo habla con un origen y no hace falta configurar CORS.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': { target: process.env.VITE_API_TARGET || 'http://localhost:4000', changeOrigin: true },
    },
  },
});
