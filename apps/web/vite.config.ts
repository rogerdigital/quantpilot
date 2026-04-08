import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin';
import path from 'node:path';

const appRoot = new URL('./', import.meta.url).pathname;
const sharedTypesRoot = new URL('../../packages/shared-types/src/', import.meta.url).pathname;
const veMock = path.resolve(new URL('./src/test-mocks/vanilla-extract-css.ts', import.meta.url).pathname);

export default defineConfig({
  root: appRoot,
  plugins: [react(), vanillaExtractPlugin()],
  resolve: {
    alias: {
      '@shared-types': sharedTypesRoot,
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8787',
        changeOrigin: true,
      },
    },
  },
  test: {
    alias: {
      '@vanilla-extract/css': veMock,
    },
  },
});
