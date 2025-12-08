import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
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
    build: {
      // Optimize chunking for caching
      rollupOptions: {
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            'three-vendor': ['three', '@react-three/fiber', '@react-three/drei'],
            'framer': ['framer-motion'],
            'ai': ['@google/genai']
          }
        }
      }
    },
    define: {
      'process.env.GEMINI_API_KEYS': JSON.stringify([
        env.GEMINI_API_KEY,
        env.GEMINI_API_KEY_1,
        env.GEMINI_API_KEY_2,
        env.GEMINI_API_KEY_3,
        env.GEMINI_API_KEY_4,
        env.GEMINI_API_KEY_5,
      ].filter(Boolean)),
      'process.env.GEMINI_KEY_COOLDOWN_MINUTES': JSON.stringify(env.GEMINI_KEY_COOLDOWN_MINUTES ?? '15'),
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY ?? ''),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY ?? '')
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});