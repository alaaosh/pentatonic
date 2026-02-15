import { defineConfig } from 'vitest/config';

export default defineConfig({
  base: './', // Use relative paths for assets
  test: {
    environment: 'jsdom',
    globals: true,
  },
  build: {
    target: 'esnext'
  }
});
