import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  return {
    server: {
      port: 5173,
      host: '0.0.0.0',
      // Proxy API requests to local API server during development
      proxy: {
        '/api': {
          target: 'http://localhost:3001',
          changeOrigin: true,
          secure: false,
        },
      },
    },
    plugins: [react()],
    esbuild: {
      // Strip noisy logs from the production client bundle. Error/warn are kept
      // so real failures still surface in Sentry/analytics.
      drop: mode === 'production' ? ['debugger'] : [],
      pure: mode === 'production' ? ['console.log', 'console.debug'] : [],
    },
    build: {
      target: 'es2020',
      manifest: true,
      cssCodeSplit: true,
      reportCompressedSize: false,
      // Optimize chunking for caching and parallel downloads.
      rollupOptions: {
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            'framer': ['framer-motion'],
          },
        },
      },
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});
