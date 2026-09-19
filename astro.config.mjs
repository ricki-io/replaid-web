// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://replaid.pro',
  integrations: [sitemap({ filter: (page) => !page.includes('/404') && !page.endsWith('/beta/') && !page.endsWith('/beta') })],
  output: 'static',
});
