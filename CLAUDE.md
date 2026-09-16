# Project guidance

## Product and stack

This repository contains Replaid's public website. Replaid connects customer channels to an external AI agent, with permissions for reading messages, creating drafts, and sending replies. The Laravel application is in a separate repository.

Use the installed Astro 6 and Tailwind CSS 3 versions. Do not change dependencies without approval. The site uses static output and Cloudflare Workers assets, configured in `wrangler.jsonc`.

## Commands

- `npm run dev`: start the development server; reuse an existing server when available.
- `npm run build`: generate the site in `dist/`.
- `npm test`: run the Node tests. Build first because route tests inspect `dist/`.
- `npm run og`: regenerate `public/og-image.png` from the current brand assets.
- `npm run preview`: inspect the production build locally.

## Pages and components

`src/pages/index.astro` uses Hero, the agent workflow, ConversationExample, FAQ content, and SkyFooter. Hero contains SkyHeader and ConnectorGraphic.

`/get-started` is the conversion page. `/docs/connect-your-agent` is the setup guide. Keep article conversion links and guide links separate.

The blog index is `/blog`. `src/pages/[...slug].astro` renders articles at their existing root-level URLs. Markdown content lives in `src/content/blog/`, with the collection schema in `src/content.config.ts`. Preserve publication dates. Historical articles must link to a published current article through `supersededBy`.

`src/components/product-copy.ts` contains shared product facts. Keep channel availability, action permissions, and billing statements consistent with the application.

## Design

The site uses the light design, Inter, white backgrounds, soft cloud artwork, and rounded controls. The homepage uses a restrained italic serif treatment in its heading. Reuse SkyHeader, SkyFooter, BrandLogo, and the existing page styles.

`src/layouts/Layout.astro` owns document metadata, the global stylesheet, skip navigation, and CookieConsent. `LegalLayout.astro` provides legal page navigation and text layout. All public pages use the same light design; there is no theme toggle.

Only used files belong in `public/`; every file there is copied into the production build. Keep rejected image drafts outside the repository.

## Integrations and verification

The contact page posts to Web3Forms with hCaptcha. Preserve the field names, spam controls, and production return address. Do not send test messages without approval.

Google Analytics loads only after consent and only in production builds. Preserve rejection, withdrawal, expiry, and blocked-storage behavior. Every footer has a Cookie settings control.

Run the relevant tests and check desktop and mobile layouts after visual changes. Do not publish, push, or commit unless requested.
