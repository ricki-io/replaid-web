import assert from 'node:assert/strict';
import { access, readFile, readdir } from 'node:fs/promises';
import test from 'node:test';
import worker from '../error-page-worker.mjs';

const output = new URL('../../dist/', import.meta.url);
const files = (await readdir(output, { recursive: true })).filter(path => path.endsWith('.html'));
const pages = await Promise.all(files.map(async path => ({ path, html: await readFile(new URL(path, output), 'utf8') })));
const sitemap = await readFile(new URL('sitemap-0.xml', output), 'utf8');
const locations = Array.from(sitemap.matchAll(/<loc>([^<]+)<\/loc>/g), match => match[1]);
const pageUrl = path => `https://replaid.pro/${path === 'index.html' ? '' : path.replace(/index\.html$/, '')}`;
const publicPages = pages.filter(page => page.path !== '404.html');

function tags(html, name) {
  return Array.from(html.matchAll(new RegExp(`<${name}\\b([^>]*)>`, 'g')), match =>
    Object.fromEntries(Array.from(match[1].matchAll(/([\w-]+)="([^"]*)"/g), attribute => [attribute[1], attribute[2]])));
}

function meta(html, name) {
  return tags(html, 'meta').find(tag => tag.name === name)?.content;
}

function decodeText(value) {
  const entities = { amp: '&', quot: '"', apos: "'", lt: '<', gt: '>' };
  return value?.replace(/&(#x[\da-f]+|#\d+|amp|quot|apos|lt|gt);/gi, (_, entity) => {
    if (entity.startsWith('#')) {
      return String.fromCodePoint(entity[1].toLowerCase() === 'x' ? parseInt(entity.slice(2), 16) : Number(entity.slice(1)));
    }
    return entities[entity.toLowerCase()];
  });
}

const newLandingRoutes = [
  '/use-cases/automation-agencies/',
  '/use-cases/developers/',
  '/use-cases/creators/',
  '/use-cases/customer-support/',
  '/setup-service/',
];

test('new landing pages have complete social previews and appear in discovery files', async () => {
  const llms = await readFile(new URL('llms.txt', output), 'utf8');
  for (const route of newLandingRoutes) {
    const canonical = `https://replaid.pro${route}`;
    const page = publicPages.find(page => pageUrl(page.path) === canonical);
    assert.ok(page, `Missing landing page: ${route}`);
    assert.equal(locations.filter(location => location === canonical).length, 1);
    assert.ok(llms.includes(canonical), `Missing source link: ${route}`);
    const { html } = page;
    const title = decodeText(html.match(/<title>([^<]+)<\/title>/)?.[1]);
    const og = name => tags(html, 'meta').find(tag => tag.property === `og:${name}`)?.content;
    assert.equal(decodeText(og('title')), title);
    assert.equal(og('description'), meta(html, 'description'));
    assert.equal(og('url'), canonical);
    assert.equal(og('type'), 'website');
    assert.equal(decodeText(meta(html, 'twitter:title')), title);
    assert.equal(meta(html, 'twitter:description'), meta(html, 'description'));
    assert.equal(meta(html, 'twitter:card'), 'summary_large_image');
    assert.equal(meta(html, 'twitter:image'), og('image'));
    assert.ok(og('image:alt'));
    assert.equal(meta(html, 'twitter:image:alt'), og('image:alt'));
    const image = new URL(og('image'));
    assert.equal(image.origin, 'https://replaid.pro');
    await access(new URL(image.pathname.slice(1), output));
    assert.match(html, /<html\b[^>]*lang="en"/);
    assert.match(meta(html, 'viewport'), /width=device-width/);
  }
});

test('new landing pages have no broken internal page or asset links', async () => {
  for (const route of newLandingRoutes) {
    const page = publicPages.find(page => pageUrl(page.path) === `https://replaid.pro${route}`);
    assert.ok(page, `Missing landing page: ${route}`);
    for (const link of tags(page.html, 'a')) {
      if (!link.href) continue;
      const url = new URL(link.href, pageUrl(page.path));
      if (url.origin !== 'https://replaid.pro') continue;
      const path = url.pathname.endsWith('/') ? `${url.pathname}index.html` : url.pathname;
      await assert.doesNotReject(access(new URL(path.slice(1), output)), `${route} -> ${link.href}`);
    }
  }
});

test('every public page has unique metadata, one H1, and its own indexable canonical', () => {
  const titles = new Set();
  const descriptions = new Set();
  for (const { path, html } of publicPages) {
    const title = html.match(/<title>([^<]+)<\/title>/)?.[1];
    const description = meta(html, 'description');
    assert.ok(title, `Missing title: ${path}`);
    assert.ok(description, `Missing description: ${path}`);
    assert.ok(!titles.has(title), `Duplicate title: ${path}`);
    assert.ok(!descriptions.has(description), `Duplicate description: ${path}`);
    titles.add(title);
    descriptions.add(description);
    assert.equal((html.match(/<h1\b/g) ?? []).length, 1, `H1 count: ${path}`);
    assert.equal(meta(html, 'robots'), 'index, follow', `Index rule: ${path}`);
    assert.deepEqual(tags(html, 'link').filter(tag => tag.rel === 'canonical').map(tag => tag.href), [pageUrl(path)], `Canonical: ${path}`);
  }
});

test('the sitemap contains exactly the public canonical pages', async () => {
  assert.deepEqual([...locations].sort(), publicPages.map(page => pageUrl(page.path)).sort());
  const robots = await readFile(new URL('robots.txt', output), 'utf8');
  assert.match(robots, /Sitemap: https:\/\/replaid\.pro\/sitemap-index\.xml/);
  const index = await readFile(new URL('sitemap-index.xml', output), 'utf8');
  assert.match(index, /<loc>https:\/\/replaid\.pro\/sitemap-0\.xml<\/loc>/);
});

test('the error page cannot be indexed and has no canonical', () => {
  const error = pages.find(page => page.path === '404.html');
  assert.ok(error);
  assert.equal(meta(error.html, 'robots'), 'noindex, follow');
  assert.equal(tags(error.html, 'link').filter(tag => tag.rel === 'canonical').length, 0);
});

test('internal section links resolve to real page sections', () => {
  for (const page of pages) {
    for (const link of tags(page.html, 'a')) {
      if (!link.href) continue;
      const url = new URL(link.href, pageUrl(page.path));
      if (url.origin !== 'https://replaid.pro' || !url.hash || url.hash === '#') continue;
      const path = url.pathname.endsWith('.html') ? url.pathname.slice(1) : url.pathname === '/' ? 'index.html' : `${url.pathname.replace(/^\//, '').replace(/\/$/, '')}/index.html`;
      const target = pages.find(candidate => candidate.path === path);
      assert.ok(target, `Missing section page: ${page.path} -> ${link.href}`);
      assert.ok(target.html.includes(`id="${decodeURIComponent(url.hash.slice(1))}"`), `Missing section: ${page.path} -> ${link.href}`);
    }
  }
});

test('main content headings do not skip levels', () => {
  for (const { path, html } of pages) {
    const main = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/)?.[1] ?? '';
    let previous = 0;
    for (const heading of main.matchAll(/<h([1-6])\b/g)) {
      const level = Number(heading[1]);
      assert.ok(level <= previous + 1, `Skipped H${previous} to H${level}: ${path}`);
      previous = level;
    }
  }
});

for (const path of ['/404', '/404/', '/404.html', '/404?source=test']) {
  test(`the error route returns 404 with its HTML: ${path}`, async () => {
    const response = await worker.fetch(new Request(`https://replaid.pro${path}`, {
      headers: { 'If-None-Match': 'old', 'If-Modified-Since': 'yesterday', Range: 'bytes=0-10' },
    }), { ASSETS: { async fetch(request) {
      assert.equal(new URL(request.url).pathname, '/404');
      assert.equal(new URL(request.url).search, '');
      assert.equal(request.headers.get('If-None-Match'), null);
      assert.equal(request.headers.get('If-Modified-Since'), null);
      assert.equal(request.headers.get('Range'), null);
      return new Response('<h1>Not found</h1>', { headers: { 'Content-Type': 'text/html' } });
    } } });
    assert.equal(response.status, 404);
    assert.equal(response.headers.get('X-Robots-Tag'), 'noindex, follow');
    assert.equal(response.headers.get('Content-Type'), 'text/html');
    assert.equal(await response.text(), '<h1>Not found</h1>');
  });
}

test('HEAD error responses have no body', async () => {
  const response = await worker.fetch(new Request('https://replaid.pro/404', { method: 'HEAD' }), {
    ASSETS: { async fetch(request) { assert.equal(request.method, 'HEAD'); return new Response(null); } },
  });
  assert.equal(response.status, 404);
  assert.equal(await response.text(), '');
});

test('normal assets keep their status and remain indexable', async () => {
  const asset = new Response('Home');
  const response = await worker.fetch(new Request('https://replaid.pro/'), { ASSETS: { async fetch() { return asset; } } });
  assert.equal(response, asset);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('X-Robots-Tag'), null);
});

test('missing assets retain 404 and cannot be indexed', async () => {
  const response = await worker.fetch(new Request('https://replaid.pro/missing'), {
    ASSETS: { async fetch() { return new Response('Not found', { status: 404 }); } },
  });
  assert.equal(response.status, 404);
  assert.equal(response.headers.get('X-Robots-Tag'), 'noindex, follow');
});
