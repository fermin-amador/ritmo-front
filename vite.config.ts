import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: loadEnv(mode, process.cwd(), '').VITE_API_URL || 'https://ritmo-api-ksbf.onrender.com',
        changeOrigin: true,
        proxyTimeout: 60000,
        configure: (proxy) => {
          proxy.on('error', (_error, _request, response) => {
            if ('writeHead' in response && !response.headersSent) {
              response.writeHead(502, { 'Content-Type': 'application/json; charset=utf-8' });
              response.end(JSON.stringify({
                message: 'No se pudo conectar con la API en Render. Espera unos segundos y vuelve a intentarlo.',
              }));
            }
          });
        },
        rewrite: (requestPath) => requestPath.replace(/^\/api(?=\/|$)/, ''),
      },
    },
  },
}));
