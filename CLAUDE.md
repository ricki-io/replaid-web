# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Marketing website for **Replaid** — an AI inbox that turns messages into leads. Built as a static site.

## Commands

- `npm run dev` — Start dev server
- `npm run build` — Build for production (output: `dist/`)
- `npm run preview` — Preview production build locally

No test runner or linter is configured.

## Tech Stack

- **Astro 5** (static output mode) with **Tailwind CSS 3**
- **Cloudflare Workers** for hosting (configured via `wrangler.jsonc`, serves from `dist/`)
- **TypeScript** (strict mode, extends `astro/tsconfigs/strict`)

## Architecture

### Pages & Routing

All pages are in `src/pages/`. The landing page (`index.astro`) composes section components in order: Header → Hero → Channels → Features → Stats → HowItWorks → Pricing → Testimonials → FAQ → CTA → Footer.

Other pages: `contact.astro`, `privacy.astro`, `terms.astro`, `cookies.astro`, and a blog section (`blog/index.astro`, `blog/[...slug].astro`).

### Layout

Single layout in `src/layouts/Layout.astro`. Provides HTML boilerplate, Google Fonts loading (Inter, Space Grotesk, JetBrains Mono), global styles, and an IntersectionObserver for `.fade-in-up` scroll animations.

### Blog Content

Blog posts are Markdown files in `src/content/blog/`. Schema defined in `src/content/config.ts` with fields: `title`, `description`, `author`, `date`, `category`, `image`, `draft`. Draft posts are filtered out on the blog index.

### Design System

Defined in `tailwind.config.mjs`:
- **Colors**: `ink-*` scale (grayscale from black), `accent` (#93e85f green)
- **Fonts**: `font-display` (Space Grotesk for headings), `font-sans` (Inter for body), `font-mono` (JetBrains Mono for labels)
- **Display sizes**: `text-display-xl` through `text-display-sm` using `clamp()` for responsive scaling

Global CSS classes in `Layout.astro`: `.btn-type`, `.btn-type-outline` (buttons), `.mono-label` (uppercase monospace labels), `.fade-in-up` (scroll animation), `.bg-text` (decorative background text).

### Contact Form

Uses Web3Forms API for submission with hCaptcha spam protection.
