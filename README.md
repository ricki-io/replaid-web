# Replaid Marketing Website

The public website for [Replaid](https://replaid.pro). Replaid connects customer messages to the AI agent you use, with permissions for reading, drafting, and replying.

## Development

This is an Astro 6 static site with Tailwind CSS 3, Inter, and page-specific CSS. The Laravel application is maintained in a separate repository.

```bash
npm install
npm run dev
```

## Build and checks

```bash
npm run build
npm test
npm run preview
```

Run the build before the tests. Route tests inspect the generated pages in `dist/`. Other tests cover connection settings and analytics consent.

## Social sharing image

```bash
npm run og
```

`scripts/generate-og.mjs` renders the shared 1200 × 630 PNG at `public/og-image.png`. It uses the current logo, channel geometry, agent icons, and cloud image. The output is checked into Git. Run the build and tests after changing it.

## Source structure

- `src/pages/`: public routes, including `/get-started`, `/docs/connect-your-agent`, legal pages, and blog pages.
- `src/layouts/Layout.astro`: document metadata, the shared light design, and analytics consent.
- `src/layouts/LegalLayout.astro`: legal navigation and text layout.
- `src/components/`: active page components and shared product text.
- `src/content/blog/`: Markdown articles. Their existing root-level URLs are preserved.
- `src/content.config.ts`: article schema, dates, and historical-article links.
- `src/styles/`: base styles and page styles.
- `public/`: files used by the site, crawler files, and redirects.

## Hosting

`wrangler.jsonc` configures Cloudflare Workers to serve `dist/`, with the custom 404 page. Build the site before a deployment. A local build does not publish changes.
