import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

const apiProxyTarget = process.env.API_PROXY_TARGET ?? 'http://localhost:4000';

const apiProxy = {
  '/api': {
    target: apiProxyTarget,
    changeOrigin: true,
  },
} as const;

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    proxy: apiProxy,
  },
  preview: {
    port: 3000,
    proxy: apiProxy,
  },
});
