// @ts-check
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://replaid.pro',
  integrations: [tailwind(), sitemap({ filter: (page) => !page.includes('/404') })],
  output: 'static',
});
