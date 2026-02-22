// @ts-check
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

/** Injects <link rel="modulepreload"> for the hero-scene chunk into index.html */
function heroPreload() {
  return /** @type {import('astro').AstroIntegration} */ ({
    name: 'hero-preload',
    hooks: {
      'astro:build:done': ({ dir }) => {
        const distDir = fileURLToPath(dir);
        const astroDir = join(distDir, '_astro');
        const chunk = readdirSync(astroDir).find(f => f.startsWith('hero-scene') && f.endsWith('.js'));
        if (!chunk) return;

        const indexPath = join(distDir, 'index.html');
        const html = readFileSync(indexPath, 'utf-8');
        writeFileSync(indexPath, html.replace(
          '</head>',
          `<link rel="modulepreload" href="/_astro/${chunk}">\n</head>`
        ));
      },
    },
  });
}

// https://astro.build/config
export default defineConfig({
  site: 'https://replaid.pro',
  integrations: [tailwind(), sitemap(), heroPreload()],
  output: 'static',
  vite: {
    build: {
      rollupOptions: {
        output: {
          manualChunks: { 'hero-scene': ['./src/scripts/hero-scene.ts'] },
        },
      },
    },
  },
});
