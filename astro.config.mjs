// @ts-check
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import sentry from '@sentry/astro';

// https://astro.build/config
export default defineConfig({
  output: 'static',
  server: {
    port: 8080,
  },
  integrations: [
    react(),
    sentry({
      project: "kiorapp-frontend",
      org: "kiora-bv",
      authToken: process.env.SENTRY_AUTH_TOKEN,
      telemetry: false,
    })
  ],

  vite: {
    plugins: [tailwindcss()],
    build: {
      // Usar 'hidden' para que los sourcemaps se generen pero no se referencien en el JS público
      sourcemap: 'hidden',
      cssMinify: true,
      minify: 'esbuild',
    },
    server: {
      proxy: {
        '/api': {
          target: 'http://localhost:3000',
          changeOrigin: true,
          secure: false,
        },
        '/uploads': {
          target: 'http://localhost:3000',
          changeOrigin: true,
          secure: false,
        }
      }
    }
  }
});