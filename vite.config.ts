import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const proxy = {
    '/api': { target: env.API_PROXY_TARGET || 'http://localhost:5080', changeOrigin: true },
  };
  return {
    plugins: [react()],
    server: {
      port: 5173,
      strictPort: true,
      proxy,
      // Visual Studio holds exclusive locks on its index files.
      watch: { ignored: ['**/.vs/**', '**/.git/**', '**/test-results/**', '**/playwright-report/**'] },
    },
    preview: { port: 4173, strictPort: true, proxy },
  };
});
