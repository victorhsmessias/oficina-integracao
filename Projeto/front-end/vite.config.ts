import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

const minimumCoverage = { statements: 80, branches: 80, functions: 80, lines: 80 };

export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 1000,
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/tests/setup.ts'],
    env: {
      VITE_USE_MOCK_API: 'true',
      VITE_API_URL: '',
      VITE_GOOGLE_CLIENT_ID: '',
    },
    include: ['src/tests/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/tests/**', 'src/main.tsx', 'src/vite-env.d.ts'],
      thresholds: {
        'src/ast/**': minimumCoverage,
        'src/generators/**': minimumCoverage,
      },
    },
  },
});
