import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import test from 'node:test';
import { setRequestSource } from './request-source.mjs';

const output = new URL('../../dist/', import.meta.url);
const route = '/compare/manychat/';
const page = await readFile(new URL('compare/manychat/index.html', output), 'utf8');
const main = page.match(/<main\b[^>]*>([\s\S]*?)<\/main>/)?.[1] ?? '';

test('the comparison is reachable from Resources and the footer on every page', async () => {
  for (const file of (await readdir(output, { recursive: true })).filter(file => file.endsWith('.html'))) {
    const html = await readFile(new URL(file, output), 'utf8');
    const desktop = html.match(/<details\b[^>]*class="sky-resources"[^>]*>([\s\S]*?)<\/details>/)?.[1] ?? '';
    const mobile = html.match(/<div\b[^>]*aria-label="Resources"[^>]*>([\s\S]*?)<\/div>/)?.[1] ?? '';
    const footer = html.match(/<footer\b[^>]*>([\s\S]*?)<\/footer>/)?.[1] ?? '';
    for (const content of [desktop, mobile, footer]) assert.ok(content.includes(`href="${route}"`), file);
  }
});

test('the comparison states product limits and provides official Manychat sources', () => {
  for (const copy of ['Manychat documents AI features', 'Public API', 'Beta access is by invitation', 'does not start replies', 'Active Contacts', 'No performance benchmark or ranking is claimed']) {
    assert.ok(main.includes(copy), `Missing qualification: ${copy}`);
  }
  const links = Array.from(main.matchAll(/href="(https:\/\/(?:help\.)?manychat\.com\/[^\"]+)"/g), match => match[1]);
  assert.ok(new Set(links).size >= 4);
  assert.match(main, /<time datetime="2026-09-17"/);
  assert.match(main, /<th scope="col"[^>]*>Replaid<\/th>/);
  assert.match(main, /<th scope="col"[^>]*>Manychat<\/th>/);
  assert.equal((main.match(/scope="row"/g) ?? []).length, 6);
});

test('the comparison has valid page and breadcrumb data without product ratings', () => {
  const data = JSON.parse(page.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)?.[1] ?? 'null');
  const webpage = data.find(item => item['@type'] === 'WebPage');
  assert.equal(webpage.url, `https://replaid.pro${route}`);
  const breadcrumb = data.find(item => item['@type'] === 'BreadcrumbList');
  assert.deepEqual(breadcrumb.itemListElement.map(item => item.item), ['https://replaid.pro/', webpage.url]);
  assert.doesNotMatch(JSON.stringify(data), /aggregateRating|SoftwareApplication/);
});

test('comparison beta and setup requests preserve source attribution', () => {
  for (const target of ['beta', 'setup-service']) assert.ok(main.includes(`href="/${target}/?from=compare-manychat"`));
  const field = { value: 'direct' };
  setRequestSource({ querySelector: () => field }, '?from=compare-manychat');
  assert.equal(field.value, 'compare-manychat');
});


const respondRoute = '/compare/respond-io/';
const respondPage = await readFile(new URL('compare/respond-io/index.html', output), 'utf8');
const respondMain = respondPage.match(/<main\b[^>]*>([\s\S]*?)<\/main>/)?.[1] ?? '';

test('respond.io is linked from desktop and mobile Resources and the Compare footer', async () => {
  for (const file of (await readdir(output, { recursive: true })).filter(file => file.endsWith('.html'))) {
    const html = await readFile(new URL(file, output), 'utf8');
    for (const pattern of [
      /<details\b[^>]*class="sky-resources"[^>]*>([\s\S]*?)<\/details>/,
      /<div\b[^>]*aria-label="Resources"[^>]*>([\s\S]*?)<\/div>/,
      /<nav\b[^>]*aria-label="Compare"[^>]*>([\s\S]*?)<\/nav>/,
    ]) assert.ok(html.match(pattern)?.[1].includes('href="' + respondRoute + '"'), file);
  }
});

test('respond.io comparison qualifies MCP, prices, credits, and product limits', () => {
  for (const copy of ['hosted MCP server with OAuth', 'does not clearly state a minimum plan', 'first 5 founding teams', 'Annual totals are billed yearly', 'exceeding the allowance automatically', 'is not a bundle of AI replies', 'no manual reply composer', 'No performance benchmark or ranking is claimed']) {
    assert.ok(respondMain.includes(copy), 'Missing qualification: ' + copy);
  }
  assert.doesNotMatch(respondMain, /zero markup|no markup|unlimited AI|only Replaid supports MCP/i);
  assert.equal((respondMain.match(/scope="row"/g) ?? []).length, 8);
  assert.match(respondMain, /<th scope="col"[^>]*>respond.io<\/th>/);
  const links = Array.from(respondMain.matchAll(/href="(https:\/\/respond\.io\/[^"]+)"/g), match => match[1]);
  assert.ok(new Set(links).size >= 8);
});

test('respond.io has its own page data and request attribution', () => {
  const data = JSON.parse(respondPage.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)?.[1] ?? 'null');
  const webpage = data.find(item => item['@type'] === 'WebPage');
  assert.equal(webpage.url, 'https://replaid.pro' + respondRoute);
  assert.equal(webpage.dateModified, '2026-09-17');
  const breadcrumb = data.find(item => item['@type'] === 'BreadcrumbList');
  assert.deepEqual(breadcrumb.itemListElement.map(item => item.item), ['https://replaid.pro/', webpage.url]);
  assert.doesNotMatch(JSON.stringify(data), /aggregateRating|SoftwareApplication/);
  for (const target of ['beta', 'setup-service']) assert.ok(respondMain.includes('href="/' + target + '/?from=compare-respond-io"'));
  const field = { value: 'direct' };
  setRequestSource({ querySelector: () => field }, '?from=compare-respond-io');
  assert.equal(field.value, 'compare-respond-io');
});
