import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import reportAccess from './server/report-access.mjs';

export default defineConfig({
  plugins: [reportAccess(), react()],
  cacheDir: '.cache/vite',
  server: { host: '127.0.0.1', port: 5183, strictPort: true },
  build: { target: 'es2022' },
});
