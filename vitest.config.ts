import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['test/setupTests.ts'],
    globals: true,
    css: true,
    server: {
      deps: {
        inline: ['idb-keyval'],
      },
    },
  },
});
