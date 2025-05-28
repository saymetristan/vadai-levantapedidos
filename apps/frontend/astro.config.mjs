// @ts-check
import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import svelte from '@astrojs/svelte';
import tailwind from '@astrojs/tailwind';

// https://astro.build/config
export default defineConfig({
  integrations: [svelte(), tailwind()],
  output: 'hybrid',
  adapter: node({
    mode: 'standalone'
  }),
  srcDir: './src',
  outDir: './dist',
  vite: {
    resolve: {
      alias: {
        '$src': '/src',
        '@': '/src'
      }
    }
  }
});