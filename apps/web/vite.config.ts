import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin';

const appRoot = new URL('./', import.meta.url).pathname;
const sharedTypesRoot = new URL('../../packages/shared-types/src/', import.meta.url).pathname;

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
});
