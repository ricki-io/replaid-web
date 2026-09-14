import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import test from 'node:test';

// Run after the Astro build to check the routes visitors actually receive.
const output = new URL('../../dist/', import.meta.url);
const guidePath = '/docs/connect-your-agent';
const readPage = path => readFile(new URL(path, output), 'utf8');
const sales = await readPage('get-started/index.html');
const guide = await readPage('docs/connect-your-agent/index.html');

function links(html) {
  return Array.from(html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/g), match => ({
    href: match[1].match(/\bhref="([^"]+)"/)?.[1],
    text: match[2].replace(/<[^>]*>/g, '').trim(),
  }));
}

test('the conversion route offers registration and a separate setup guide', () => {
  const pageLinks = links(sales);
  assert.equal(pageLinks.filter(link => link.text === 'Create your free account' && link.href === 'https://app.replaid.pro/register').length, 2);
  assert.ok(pageLinks.some(link => link.text.startsWith('See the setup guide') && link.href === guidePath));
  assert.ok(!sales.includes('id="guide-mcp-url"'));
  assert.match(sales, /rel="canonical" href="https:\/\/replaid.pro\/get-started\/?"/);
});

test('the guide route preserves the setup controls and has its own canonical URL', () => {
  for (const id of ['account', 'channel', 'agent', 'draft', 'guide-mcp-url', 'codex-config', 'client-chatgpt', 'client-claude', 'client-hermes']) {
    assert.ok(guide.includes(`id="${id}"`), `Missing guide control: ${id}`);
  }
  assert.match(guide, /rel="canonical" href="https:\/\/replaid.pro\/docs\/connect-your-agent\/?"/);
  assert.ok(guide.includes('Do not send the reply.'));
});

test('Docs links on every built page lead to the relocated guide', async () => {
  const pages = (await readdir(output, { recursive: true })).filter(path => path.endsWith('.html'));
  for (const path of pages) {
    const docs = links(await readPage(path)).filter(link => link.text === 'Docs');
    assert.ok(docs.length > 0, `Missing Docs navigation: ${path}`);
    for (const link of docs) assert.equal(link.href, guidePath, `Wrong Docs link: ${path}`);
  }
});

test('existing article conversion links still lead to the sales page', async () => {
  const posts = (await readdir(new URL('../content/blog/', import.meta.url))).filter(path => path.endsWith('.md'));
  assert.ok(posts.length > 0);
  for (const post of posts) {
    const html = await readPage(`${post.slice(0, -3)}/index.html`);
    const article = html.match(/<article\b[^>]*>([\s\S]*?)<\/article>/)?.[1];
    assert.ok(article, `Missing article: ${post}`);
    assert.ok(links(article).some(link => link.href === '/get-started'), `Missing conversion link: ${post}`);
  }
});

test('the sitemap includes both destinations', async () => {
  const sitemap = await readPage('sitemap-0.xml');
  assert.match(sitemap, /<loc>https:\/\/replaid.pro\/get-started\/?<\/loc>/);
  assert.match(sitemap, /<loc>https:\/\/replaid.pro\/docs\/connect-your-agent\/?<\/loc>/);
});
