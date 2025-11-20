import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  
  // 1. TOP-LEVEL PLUGINS BLOCK (Correctly handled JSX files during HMR)
  plugins: [
    react({
      include: '**/*.{js,jsx,ts,tsx}',
    }),
  ],

  // 2. TOP-LEVEL ESBUILD BLOCK (Fixes the compilation error for .js files)
  esbuild: {
    loader: 'jsx',
    include: /src\/.*\.js$/,
    exclude: [],
  },

  // 3. TOP-LEVEL SERVER BLOCK (Now clean, only handles port/proxy)
  server: {
    port: 5173,
    strictPort: true,
    // If your FastAPI backend is on 8000, you will likely need a proxy:
    // proxy: {
    //   '/api': {
    //     target: 'http://localhost:8000',
    //     changeOrigin: true,
    //     rewrite: (path) => path.replace(/^\/api/, '')
    //   },
    // }
  }
});