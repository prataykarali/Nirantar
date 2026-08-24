import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const root = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(root, 'src'),
      '@app': resolve(root, 'src'),
      '@modules': resolve(root, '../modules'),
      'react': resolve(root, 'node_modules/react'),
      'react-dom': resolve(root, 'node_modules/react-dom'),
      'lucide-react': resolve(root, 'node_modules/lucide-react'),
    },
  },
  build: {
    chunkSizeWarningLimit: 600,
    target: 'es2020',
    cssCodeSplit: true,
  },
  server: {
    port: 5173,
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/ws': {
        target: 'ws://localhost:8000',
        ws: true,
      },
    },
  },
});
