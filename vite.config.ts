import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
  appType: 'mpa',
  build: {
    target: 'es2022',
    rollupOptions: {
      input: {
        landing: resolve(__dirname, 'index.html'),
        game: resolve(__dirname, 'game.html'),
      },
    },
  },
});
