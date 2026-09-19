import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import test from 'node:test';
import { setRequestSource } from './request-source.mjs';

const output = new URL('../../dist/', import.meta.url);
const readPage = path => readFile(new URL(path, output), 'utf8');
const routes = ['/use-cases/automation-agencies/', '/use-cases/developers/', '/use-cases/creators/', '/use-cases/customer-support/'];
const anchors = html => Array.from(html.matchAll(/<a\b[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g), match => ({ href: match[1], text: match[2].replace(/<[^>]*>/g, '').trim() }));

test('every page exposes all four use cases in desktop, mobile, and footer navigation', async () => {
  for (const file of (await readdir(output, { recursive: true })).filter(file => file.endsWith('.html') && file !== 'beta/index.html')) {
    const html = await readPage(file);
    const desktop = html.match(/<details\b[^>]*class="sky-use-cases"[^>]*>([\s\S]*?)<\/details>/)?.[1] ?? '';
    assert.match(desktop, /<summary\b[^>]*>Use Cases/);
    const mobile = html.match(/<nav\b[^>]*aria-label="Mobile navigation"[^>]*>([\s\S]*?)<\/nav>/)?.[1] ?? '';
    const footer = html.match(/<footer\b[^>]*>([\s\S]*?)<\/footer>/)?.[1] ?? '';
    for (const [name, content] of [['desktop', desktop], ['mobile', mobile], ['footer', footer]]) {
      for (const route of routes) assert.ok(anchors(content).some(link => link.href === route), `${file}: ${name} is missing ${route}`);
    }
    assert.ok(anchors(footer).some(link => link.href === '/setup-service/?from=footer'));
  }
});

test('the home places setup help before the FAQ and the final CTA after it', async () => {
  const html = await readPage('index.html');
  const main = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/)?.[1] ?? '';
  const workflow = main.indexOf('id="how-it-works"');
  const service = main.indexOf('href="/setup-service/?from=home"');
  const example = main.indexOf('A customer asks.');
  const audiences = main.indexOf('id="use-cases-heading"');
  const faq = main.indexOf('id="faq"');
  const finalCta = main.indexOf('class="sky-section sky-final-cta"');
  const footer = main.indexOf('<footer');
  assert.ok(workflow > 0 && workflow < example && example < audiences);
  assert.ok(audiences < service && service < faq && faq < finalCta && finalCta < footer);
  assert.equal((main.match(/href="\/setup-service\/\?from=home"/g) ?? []).length, 1);
  assert.ok(anchors(main).some(link => link.href === '/setup-service/?from=faq'));
  for (const route of routes) assert.ok(anchors(main.slice(audiences)).some(link => link.href === route));
});

test('each audience gets a distinct example, conversion path, and optional setup help', async () => {
  for (const [path, source, primaryLabel, exampleLabel] of [
    ['use-cases/automation-agencies/index.html', 'agencies', 'Create your account', 'Example client workflow'],
    ['use-cases/developers/index.html', 'developers', 'Explore the integration', 'Agent integration model'],
    ['use-cases/creators/index.html', 'creators', 'Create your account', 'Example creator inbox review'],
    ['use-cases/customer-support/index.html', 'customer-support', 'Create your account', 'Example website widget support conversation'],
  ]) {
    const html = await readPage(path);
    const main = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/)?.[1] ?? '';
    assert.equal((main.match(/<h1\b/g) ?? []).length, 1);
    assert.ok(anchors(main).some(link => link.text === primaryLabel));
    assert.ok(anchors(main).some(link => link.href === `https://app.replaid.pro/register?from=${source}`));
    assert.ok(anchors(main).some(link => link.href === `/setup-service/?from=${source}`));
    assert.ok(main.includes(exampleLabel));
    assert.match(main, /sending disabled|sending is enabled/);
    assert.match(main, /external|runtime/);
  }
});

test('service requests use the existing inbox with accessible fields and spam protection', async () => {
  const html = await readPage('setup-service/index.html');
  const contact = await readPage('contact/index.html');
  const form = html.match(/<form\b([^>]*)>([\s\S]*?)<\/form>/);
  assert.ok(form);
  assert.match(form[1], /action="https:\/\/api.web3forms.com\/submit"/);
  assert.match(form[1], /method="POST"/);
  const key = text => text.match(/name="access_key" value="([^"]+)"/)?.[1];
  assert.ok(key(contact));
  assert.equal(key(form[2]), key(contact));
  for (const [name, id] of [['email', 'setup-email'], ['channel', 'setup-channel'], ['message', 'setup-message']]) {
    assert.match(form[2], new RegExp(`<label\\b[^>]*for="${id}"`));
    const field = form[2].match(new RegExp(`<(?:input|select|textarea)\\b[^>]*name="${name}"[^>]*>`))?.[0] ?? '';
    assert.match(field, /\brequired(?:[\s=>])/);
  }
  assert.match(form[2], /type="url" name="website"/);
  assert.match(form[2], /name="source" value="direct"/);
  assert.match(form[2], /name="subject" value="Paid setup service request/);
  assert.match(form[2], /name="redirect" value="https:\/\/replaid.pro\/setup-service\/\?success=true"/);
  assert.match(form[2], /name="botcheck"[^>]*aria-hidden="true"/);
  assert.match(form[2], /class="h-captcha" data-captcha="true"/);
  assert.match(form[2], /id="setup-form-error"[^>]*role="alert"[^>]*hidden/);
  assert.match(html, /id="setup-success"[^>]*role="status"[^>]*hidden/);
  assert.ok(anchors(form[2]).some(link => link.href === '/privacy/'));
  assert.match(html, /Setup has a one-time fee/);
  assert.match(html, /separate monthly fee and an agreed scope/);
  assert.match(html, /Replaid access, paid channel usage, and external AI costs are separate/);
});

test('the developer REST entry explains token access and links to its setup instructions', async () => {
  const page = await readPage('use-cases/developers/index.html');
  const api = page.match(/<article>\s*<h3>Integrate through REST<\/h3>([\s\S]*?)<\/article>/)?.[1] ?? '';
  assert.match(api, /team agent token/);
  assert.match(api, /\/api\/v1/);
  assert.ok(anchors(api).some(link => link.href === '/docs/connect-your-agent/#agent'));
  const guide = await readPage('docs/connect-your-agent/index.html');
  assert.match(guide, /Authorization: Bearer/);
});

test('pricing offers setup separately without changing the platform purchase path', async () => {
  const html = await readPage('pricing/index.html');
  const offer = html.indexOf('class="pricing-ltd"');
  const service = html.indexOf('href="/setup-service/?from=pricing"');
  const costs = html.indexOf('id="pricing-costs"');
  assert.ok(offer > 0 && offer < service && service < costs);
  assert.match(html, /Optional paid service/);
  assert.match(html, /quoted separately from Replaid access and usage/);
  assert.ok(anchors(html).some(link => link.href === 'https://app.replaid.pro/register'));
});

test('request attribution keeps known entry points and ignores arbitrary query values', () => {
  const field = { value: '' };
  const form = { querySelector: () => field };
  for (const source of ['home', 'pricing', 'pricing-faq', 'faq', 'footer', 'agencies', 'developers', 'creators', 'customer-support']) {
    setRequestSource(form, `?from=${source}`);
    assert.equal(field.value, source);
  }
  for (const query of ['', '?from=unknown', '?from=https://example.com/private', '?from=%3Cscript%3E']) {
    setRequestSource(form, query);
    assert.equal(field.value, 'direct');
  }
  assert.doesNotThrow(() => setRequestSource({ querySelector: () => null }, '?from=home'));
});


test('every page groups News & articles and Documentation under Resources in desktop and mobile navigation', async () => {
  for (const file of (await readdir(output, { recursive: true })).filter(file => file.endsWith('.html') && file !== 'beta/index.html')) {
    const html = await readPage(file);
    const desktop = html.match(/<details\b[^>]*class="sky-resources"[^>]*>([\s\S]*?)<\/details>/)?.[1] ?? '';
    assert.match(desktop, /<summary\b[^>]*>Resources/);
    const mobile = html.match(/<div\b[^>]*aria-label="Resources"[^>]*>([\s\S]*?)<\/div>/)?.[1] ?? '';
    for (const content of [desktop, mobile]) {
      assert.ok(anchors(content).some(link => link.href === '/blog/' && link.text.replaceAll('&amp;', '&').startsWith('News & articles')), `${file}: missing News & articles resource`);
      assert.ok(anchors(content).some(link => link.href === '/docs/connect-your-agent/' && link.text.startsWith('Documentation')), `${file}: missing Documentation resource`);
    }
    const nav = html.match(/<nav\b[^>]*aria-label="Main navigation"[^>]*>([\s\S]*?)<\/nav>/)?.[1] ?? '';
    const topLevel = nav.replace(/<details\b[^>]*>[\s\S]*?<\/details>/g, '');
    assert.deepEqual(anchors(topLevel).map(link => link.text), ['How it works', 'Pricing']);
  }
});


test('creator and support landing pages have distinct metadata and appear in the sitemap', async () => {
  const sitemap = await readPage('sitemap-0.xml');
  const titles = [];
  for (const slug of ['creators', 'customer-support']) {
    const html = await readPage(`use-cases/${slug}/index.html`);
    const canonical = `https://replaid.pro/use-cases/${slug}/`;
    assert.ok(html.includes(`rel="canonical" href="${canonical}"`));
    assert.ok(sitemap.includes(`<loc>${canonical}</loc>`));
    titles.push(html.match(/<title>(.*?)<\/title>/)?.[1]);
    assert.match(html, /<meta name="description" content="[^"]+"/);
    assert.match(html, /<h1[^>]*>[\s\S]*?class="hero-highlight"/);
  }
  assert.ok(titles.every(Boolean));
  assert.equal(new Set(titles).size, 2);
});

test('support presents the website widget with installation steps and accurate agent boundaries', async () => {
  const html = await readPage('use-cases/customer-support/index.html');
  const main = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/)?.[1] ?? '';
  assert.match(main, /Replaid website widget/);
  assert.match(main, /install script/);
  assert.match(main, /allowed websites/);
  assert.match(main, /attachments are not supported/);
  assert.match(main, /You connect your own agent/);
  assert.ok(anchors(main).some(link => link.href === '/docs/connect-your-agent/#channel'));
  const guide = await readPage('docs/connect-your-agent/index.html');
  assert.match(guide, /id="channel"/);
  assert.match(guide, /Website widget/);
});

test('creator workflow keeps decisions with the creator and explains scheduled review requirements', async () => {
  const html = await readPage('use-cases/creators/index.html');
  assert.match(html, /Instagram Business or Creator account/);
  assert.match(html, /sending disabled/);
  assert.match(html, /does not include a built-in daily digest/);
  assert.match(html, /Keep partnership terms and final decisions for your review/);
  assert.match(html, /qualify the contact/);
});
