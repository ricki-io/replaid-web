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

test('the 404 provides recovery links and stays out of the sitemap', async () => {
  const error = await readPage('404.html');
  const main = error.match(/<main\b[^>]*>([\s\S]*?)<\/main>/)?.[1];
  assert.ok(main, 'The error page must have a main landmark');
  const recovery = links(main);
  assert.ok(recovery.some(link => link.text === 'Back to homepage' && link.href === '/'));
  assert.ok(recovery.some(link => link.text.startsWith('Open connection guide') && link.href === guidePath));
  assert.ok(recovery.some(link => link.text === 'Contact us' && link.href === '/contact'));
  assert.ok(!(await readPage('sitemap-0.xml')).includes('replaid.pro/404'));
});


test('contact keeps form delivery, spam protection, and the production return address', async () => {
  const contact = await readPage('contact/index.html');
  const form = contact.match(/<form\b([^>]*)>([\s\S]*?)<\/form>/);
  assert.ok(form, 'The contact page must include its native form');
  assert.match(form[1], /action="https:\/\/api.web3forms.com\/submit"/);
  assert.match(form[1], /method="POST"/);
  for (const name of ['name', 'email', 'message']) {
    assert.match(form[2], new RegExp(`<label[^>]*for="${name}"`));
    const field = form[2].match(new RegExp(`<(?:input|textarea)\\b[^>]*name="${name}"[^>]*>`))?.[0];
    assert.ok(field && /\brequired(?:[\s=>])/.test(field), `${name} must remain required`);
  }
  assert.match(form[2], /type="email"[^>]*autocomplete="email"/);
  assert.match(form[2], /name="access_key" value="[^"\s]+"/);
  assert.match(form[2], /name="redirect" value="https:\/\/replaid.pro\/contact\?success=true"/);
  assert.match(form[2], /name="botcheck"/);
  assert.match(form[2], /class="h-captcha" data-captcha="true"/);
  assert.ok(contact.includes('https://web3forms.com/client/script.js'));
  assert.match(contact, /id="success-message"[^>]*role="status"[^>]*hidden/);
  assert.ok(links(contact).some(link => link.href === 'mailto:hi@replaid.pro'));
  assert.ok(!contact.includes('replaid-web.pages.dev'));
});
