// @ts-check
import { defineConfig } from 'astro/config';
import svelte from '@astrojs/svelte';
import tailwind from '@astrojs/tailwind';

// https://astro.build/config
export default defineConfig({
  integrations: [svelte(), tailwind()],
  output: 'static',
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