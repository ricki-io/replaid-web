# Replaid Marketing Website

Landing page for [Replaid](https://replaid.pro) — The AI inbox that turns messages into leads.

## Tech Stack

- **Astro 5** - Static site generator
- **Tailwind CSS** - Styling
- **Cloudflare Pages** - Hosting

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview  # Preview production build
```

## Deploy

Configured for Cloudflare Pages. Connect the repo and set:
- Build command: `npm run build`
- Build output: `dist`

## Structure

```
src/
├── components/     # Astro components
├── layouts/        # Page layouts
├── pages/          # Routes (index.astro)
└── styles/         # Global CSS
```
