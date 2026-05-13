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
      dsn: process.env.PUBLIC_SENTRY_DSN,
      project: "kiorapp-frontend",
      org: "kiora-bv",
      authToken: process.env.SENTRY_AUTH_TOKEN,
    })
  ],

  vite: {
    plugins: [tailwindcss()],
    build: {
      // Mapas ocultos: útiles para Sentry sin exponer `sourceMappingURL` en el bundle público.
      sourcemap: process.env.SENTRY_AUTH_TOKEN ? 'hidden' : false,
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