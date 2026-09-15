import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import test from 'node:test';

// Run after the Astro build to check the routes visitors actually receive.
const output = new URL('../../dist/', import.meta.url);
const guidePath = '/docs/connect-your-agent/';
const readPage = path => readFile(new URL(path, output), 'utf8');
const sales = await readPage('get-started/index.html');
const guide = await readPage('docs/connect-your-agent/index.html');

function decodeHtml(value) {
  const entities = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };
  return value.replace(/&#(x[0-9a-f]+|[0-9]+);|&(amp|lt|gt|quot|apos);/gi, (_, number, name) => number
    ? String.fromCodePoint(number[0].toLowerCase() === 'x' ? parseInt(number.slice(1), 16) : Number(number))
    : entities[name.toLowerCase()]);
}


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
  for (const section of ['channel', 'agent', 'draft']) {
    assert.ok(pageLinks.some(link => link.href === `${guidePath}#${section}`), `Missing focused setup link: ${section}`);
    assert.ok(guide.includes(`id="${section}"`), `Missing guide destination: ${section}`);
  }
  assert.ok(sales.indexOf('id="before-you-start"') < sales.indexOf('id="first-reply"'), 'Requirements must come before setup');
  assert.match(sales, /<details class="start-channel-requirements"/);
  assert.match(sales, /allow sending for direct replies, or allow drafts for review/);
  assert.match(sales, /The reply appears in Conversations/);
  assert.ok(pageLinks.some(link => link.text.startsWith('Optional draft setup') && link.href === `${guidePath}#draft`));
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
    assert.ok(links(article).some(link => link.href === '/get-started/'), `Missing conversion link: ${post}`);
  }
});

test('the sitemap includes both destinations', async () => {
  const sitemap = await readPage('sitemap-0.xml');
  assert.match(sitemap, /<loc>https:\/\/replaid.pro\/get-started\/?<\/loc>/);
  assert.match(sitemap, /<loc>https:\/\/replaid.pro\/docs\/connect-your-agent\/?<\/loc>/);
  assert.match(sitemap, /<loc>https:\/\/replaid.pro\/pricing\/?<\/loc>/);
});

test('pricing explains prepaid credits without subscription tiers', async () => {
  const pricing = await readPage('pricing/index.html');
  const pageLinks = links(pricing);
  assert.match(pricing, /rel="canonical" href="https:\/\/replaid.pro\/pricing\/?"/);
  assert.match(pricing, /There is no subscription/);
  assert.match(pricing, /provider cost plus a 20% markup/);
  assert.ok(!/\$79|\$149|\$299|€29|€79|€149|€299/.test(pricing), 'Old subscription prices must stay gone');
  assert.ok(!/per month|\/mo\b|monthly plan/i.test(pricing), 'Subscription billing language must stay gone');
  assert.match(pricing, /does not sell Starter, Pro, or Agency subscriptions/);
  for (const amount of ['$10', '$25', '$50', '$100']) {
    assert.ok(pricing.includes(amount), `Missing credit package: ${amount}`);
  }
  assert.ok(pageLinks.some(link => link.text === 'Create your free account' && link.href === 'https://app.replaid.pro/register'));
  assert.ok(pageLinks.some(link => link.text.startsWith('See how to get started') && link.href === '/get-started/'));
  for (const html of [await readPage('index.html'), pricing]) {
    const pricingNav = links(html).filter(link => link.text === 'Pricing');
    assert.ok(pricingNav.length > 0, 'Missing Pricing navigation');
    for (const link of pricingNav) assert.equal(link.href, '/pricing/', `Wrong Pricing link: ${link.href}`);
  }
});

test('the 404 provides recovery links and stays out of the sitemap', async () => {
  const error = await readPage('404.html');
  const main = error.match(/<main\b[^>]*>([\s\S]*?)<\/main>/)?.[1];
  assert.ok(main, 'The error page must have a main landmark');
  const recovery = links(main);
  assert.ok(recovery.some(link => link.text === 'Back to homepage' && link.href === '/'));
  assert.ok(recovery.some(link => link.text.startsWith('Open connection guide') && link.href === guidePath));
  assert.ok(recovery.some(link => link.text === 'Contact us' && link.href === '/contact/'));
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
  assert.match(form[2], /name="redirect" value="https:\/\/replaid.pro\/contact\/\?success=true"/);
  assert.match(form[2], /name="botcheck"/);
  assert.match(form[2], /class="h-captcha" data-captcha="true"/);
  assert.ok(contact.includes('https://web3forms.com/client/script.js'));
  assert.match(contact, /id="success-message"[^>]*role="status"[^>]*hidden/);
  assert.ok(links(contact).some(link => link.href === 'mailto:hi@replaid.pro'));
  assert.ok(!contact.includes('replaid-web.pages.dev'));
});

test('the blog lists every published article once with its original route', async () => {
  const index = await readPage('blog/index.html');
  const posts = (await readdir(new URL('../content/blog/', import.meta.url))).filter(path => path.endsWith('.md'));
  const published = [];
  for (const filename of posts) {
    const source = await readFile(new URL(`../content/blog/${filename}`, import.meta.url), 'utf8');
    if (/^draft: true$/m.test(source)) continue;
    published.push({ id: filename.slice(0, -3), category: source.match(/^category: "(.+)"$/m)?.[1] });
  }
  assert.equal((index.match(/data-blog-post(?:[\s=>])/g) ?? []).length, published.length);
  for (const post of published) {
    assert.equal(links(index).filter(link => link.href === `/${post.id}/`).length, 1, `Duplicate or missing article: ${post.id}`);
    assert.ok(index.includes(`data-blog-filter="${post.category}"`), `Missing topic filter: ${post.category}`);
  }
  assert.match(index, /data-blog-filter="all" aria-pressed="true" aria-controls="blog-list"/);
  assert.match(index, /id="blog-count"[^>]*role="status"/);
  assert.match(index, /rel="canonical" href="https:\/\/replaid.pro\/blog\/?"/);
});

test('article navigation and search metadata match the published content', async () => {
  const posts = (await readdir(new URL('../content/blog/', import.meta.url))).filter(path => path.endsWith('.md'));
  for (const filename of posts) {
    const source = await readFile(new URL(`../content/blog/${filename}`, import.meta.url), 'utf8');
    if (/^draft: true$/m.test(source)) continue;
    const id = filename.slice(0, -3);
    const html = await readPage(`${id}/index.html`);
    const data = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)?.[1] ?? '[]');
    const article = data.find(item => item['@type'] === 'BlogPosting');
    assert.ok(article, `Missing article metadata: ${id}`);
    const title = source.match(/^title: "(.+)"$/m)?.[1];
    const seoTitle = source.match(/^seoTitle: "(.+)"$/m)?.[1] ?? title;
    assert.equal(article.headline, title);
    assert.equal(decodeHtml(html.match(/<h1>(.*?)<\/h1>/s)?.[1] ?? ''), title, `Original article heading: ${id}`);
    assert.equal(decodeHtml(html.match(/<title>(.*?)<\/title>/s)?.[1] ?? ''), `${seoTitle} — Replaid Blog`, `Search title: ${id}`);
    for (const key of ['og:title', 'twitter:title']) {
      const socialTitle = html.match(new RegExp(`${key}" content="([^"]*)"`))?.[1] ?? '';
      assert.equal(decodeHtml(socialTitle), `${seoTitle} — Replaid Blog`, `Social title: ${id}`);
    }
    assert.equal(article.description, source.match(/^description: "(.+)"$/m)?.[1]);
    assert.equal(article.author.name, source.match(/^author: "(.+)"$/m)?.[1]);
    const publishedDate = source.match(/^date: (.+)$/m)?.[1];
    const updatedDate = source.match(/^updatedDate: (.+)$/m)?.[1];
    assert.equal(article.datePublished, new Date(publishedDate).toISOString());
    assert.equal(article.dateModified, new Date(updatedDate ?? publishedDate).toISOString());
    const byline = html.match(/<div class="article-byline">([\s\S]*?)<\/div>/)?.[1];
    assert.ok(byline?.includes(`datetime="${article.datePublished}"`), `Missing original visible date: ${id}`);
    if (updatedDate) {
      assert.ok(byline?.includes(`datetime="${article.dateModified}"`), `Missing visible update date: ${id}`);
      assert.ok(byline.includes(/^historical: true$/m.test(source) ? 'Notice added ' : 'Updated '));
    }
    assert.equal(article.mainEntityOfPage['@id'], `https://replaid.pro/${id}/`);
    const canonical = html.match(/rel="canonical" href="([^"]+)"/)?.[1];
    assert.equal(canonical, `https://replaid.pro/${id}/`);
    const sectionLinks = links(html).filter(link => link.href?.startsWith('#') && link.href !== '#main');
    assert.ok(sectionLinks.length > 0, `Missing article contents: ${id}`);
    for (const link of sectionLinks) assert.ok(html.includes(`id="${link.href.slice(1)}"`), `Broken section link: ${id}${link.href}`);
    assert.ok(links(html).some(link => link.href === '/blog/' && link.text.startsWith('All articles')));
    const related = html.match(/<section class="article-related"[\s\S]*?<\/section>/)?.[0];
    assert.ok(related, `Missing related articles: ${id}`);
    for (const link of links(related).filter(link => link.href !== '/blog/')) {
      assert.notEqual(link.href, `/${id}/`, 'An article must not recommend itself');
      assert.notEqual(link.href, '/introducing-replaid/', 'Historical content must not appear as current guidance');
      assert.ok(posts.includes(`${link.href.slice(1, -1)}.md`), `Invalid related article: ${link.href}`);
    }
  }
});


test('every article links its author to the same public profile used in search metadata', async () => {
  const posts = (await readdir(new URL('../content/blog/', import.meta.url))).filter(path => path.endsWith('.md'));
  for (const filename of posts) {
    const source = await readFile(new URL(`../content/blog/${filename}`, import.meta.url), 'utf8');
    if (/^draft: true$/m.test(source)) continue;
    const id = filename.slice(0, -3);
    const html = await readPage(`${id}/index.html`);
    const json = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)?.[1] ?? '[]');
    const author = json.find(item => item['@type'] === 'BlogPosting')?.author;
    assert.deepEqual(author, { '@type': 'Person', name: 'Ricard Pons', url: 'https://rickimakes.com/' }, id);
    const byline = html.match(/<div class="article-byline">([\s\S]*?)<\/div>/)?.[1] ?? '';
    assert.ok(decodeHtml(byline.replace(/<[^>]*>/g, '')).includes(`By ${author.name}`), `Readable author byline: ${id}`);
    const profileLinks = links(byline);
    assert.equal(profileLinks.length, 1, `One author profile link: ${id}`);
    assert.equal(profileLinks[0].href, author.url, id);
    assert.equal(decodeHtml(profileLinks[0].text), author.name, id);
    assert.match(byline, /<a\b[^>]*rel="author"/, id);
  }
});

test('the pivot article is featured and all previous URLs still serve articles', async () => {
  const index = await readPage('blog/index.html');
  const pivot = '/replaid-connects-your-ai-agent-to-your-customers/';
  const featured = index.match(/<article class="blog-post blog-post-featured"[\s\S]*?<\/article>/)?.[0];
  assert.ok(featured, 'The blog must have a featured article');
  assert.equal(links(featured)[0]?.href, pivot);
  const sitemap = await readPage('sitemap-0.xml');
  for (const route of [pivot, '/introducing-replaid/', '/replaid-ai-assistant-turns-messages-into-leads/', '/three-workflows-small-business-should-automate/', '/centralize-your-messages-with-ai/', '/why-youre-losing-leads-in-your-dms/']) {
    const html = await readPage(`${route.slice(1)}index.html`);
    assert.match(html, /<h1>/);
    assert.ok(sitemap.includes(`https://replaid.pro${route}<`), `Missing preserved sitemap route: ${route}`);
    assert.ok(!html.includes('http-equiv="refresh"'), `Article was replaced by a redirect: ${route}`);
  }
});

test('the old launch is clearly historical and updated guides explain the product change', async () => {
  const pivot = '/replaid-connects-your-ai-agent-to-your-customers/';
  const historical = await readPage('introducing-replaid/index.html');
  const notice = historical.match(/<aside class="article-history"[\s\S]*?<\/aside>/)?.[0];
  assert.ok(notice, 'The original launch needs a visible historical notice');
  assert.ok(historical.indexOf(notice) < historical.indexOf('class="article-prose"'));
  assert.ok(links(notice).some(link => link.href === pivot));
  assert.match(historical, /datetime="2025-10-15T00:00:00.000Z"/);
  assert.match(historical, /<title>[^<]*2025 Launch Archive[^<]*<\/title>/);
  const index = await readPage('blog/index.html');
  const oldCard = index.match(/<article[^>]*data-blog-post[^>]*>[\s\S]*?<\/article>/g)?.find(card => links(card)[0]?.href === '/introducing-replaid/');
  assert.ok(oldCard?.includes('Historical'), 'The archive must be labelled before opening it');
  assert.match(oldCard, /aria-labelledby="post-introducing-replaid post-introducing-replaid-status"/);
  assert.match(oldCard, /id="post-introducing-replaid-status"/);
  for (const id of ['replaid-ai-assistant-turns-messages-into-leads', 'three-workflows-small-business-should-automate', 'centralize-your-messages-with-ai', 'why-youre-losing-leads-in-your-dms']) {
    const html = await readPage(`${id}/index.html`);
    const prose = html.match(/<div class="article-prose">([\s\S]*?)<\/div>/)?.[1];
    assert.ok(prose && links(prose).some(link => link.href === pivot), `Missing product update link: ${id}`);
    assert.ok(!html.includes('class="article-history"'), `Current guide incorrectly archived: ${id}`);
  }
});

test('all legal routes use the new design and preserve legal and contact navigation', async () => {
  for (const name of ['privacy', 'terms', 'cookies']) {
    const html = await readPage(`${name}/index.html`);
    assert.match(html, /class="sky-landing legal-page"/);
    assert.match(html, /class="sky-header"/);
    assert.match(html, /class="sky-footer"/);
    assert.match(html, /data-appearance="light"/);
    assert.ok(!html.includes('mobile-menu-btn'));
    assert.ok(!html.includes('12345678'));
    assert.equal(html.match(/rel="canonical" href="([^"]+)"/)?.[1], `https://replaid.pro/${name}/`);
    assert.match(html, new RegExp(`href="/${name}/" aria-current="page"`));
    for (const link of links(html).filter(link => link.href?.startsWith('#'))) {
      assert.ok(html.includes(`id="${link.href.slice(1)}"`), `Broken legal section link: ${name}${link.href}`);
    }
    for (const route of ['/privacy/', '/terms/', '/cookies/', '/contact/', 'mailto:hi@replaid.pro']) assert.ok(links(html).some(link => link.href === route));
  }
});

test('all built routes defer analytics to the consent control and expose a way to change it', async () => {
  const pages = (await readdir(output, { recursive: true })).filter(path => path.endsWith('.html'));
  for (const name of pages) {
    const html = await readPage(name);
    assert.ok(!/<script[^>]+src="https:\/\/www\.googletagmanager\.com/.test(html), `Analytics loaded before consent: ${name}`);
    assert.match(html, /data-cookie-banner/);
    assert.match(html, /data-analytics-enabled="true"/);
    assert.match(html, /data-analytics-choice="rejected"/);
    assert.match(html, /data-analytics-choice="accepted"/);
    assert.match(html, /data-cookie-settings/);
  }
});


test('sharing cards use real landscape PNGs with matching metadata on every page', async () => {
  const posts = (await readdir(new URL('../content/blog/', import.meta.url))).filter(path => path.endsWith('.md')).map(path => path.slice(0, -3));
  const pages = (await readdir(output, { recursive: true })).filter(path => path.endsWith('.html'));
  for (const path of pages) {
    const html = await readPage(path);
    const id = path.replace(/\/index\.html$/, '');
    const expectedImage = posts.includes(id) ? `/og-${id}.png` : '/og-image.png';
    const png = await readFile(new URL(expectedImage.slice(1), output));
    assert.deepEqual([...png.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10], expectedImage);
    assert.equal(png.readUInt32BE(16), 1200, expectedImage);
    assert.equal(png.readUInt32BE(20), 630, expectedImage);
    assert.ok(png.length < 1_000_000, `The social image should stay below 1 MB: ${expectedImage}`);
    for (const key of ['og:image', 'twitter:image']) {
      const image = html.match(new RegExp(`(?:property|name)="${key}" content="([^"]+)"`))?.[1];
      assert.equal(image, `https://replaid.pro${expectedImage}`, `${path}: ${key}`);
    }
    assert.match(html, /property="og:image:width" content="1200"/);
    assert.match(html, /property="og:image:height" content="630"/);
    assert.match(html, /property="og:image:type" content="image\/png"/);
    for (const key of ['og:image:alt', 'twitter:image:alt']) {
      assert.match(html, new RegExp(`(?:property|name)="${key}" content="[^"<>]+"`), path);
    }
    assert.match(html, /name="twitter:card" content="summary_large_image"/);
  }
});

test('each article has a distinct sharing image and consistent Article image metadata', async () => {
  const posts = (await readdir(new URL('../content/blog/', import.meta.url))).filter(path => path.endsWith('.md'));
  const imageContents = new Set();
  for (const filename of posts) {
    const source = await readFile(new URL(`../content/blog/${filename}`, import.meta.url), 'utf8');
    if (/^draft: true$/m.test(source)) continue;
    const id = filename.slice(0, -3);
    const html = await readPage(`${id}/index.html`);
    const json = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)?.[1] ?? '[]');
    const image = json.find(item => item['@type'] === 'BlogPosting')?.image;
    const alt = JSON.parse(source.match(/^  alt: (".+")$/m)?.[1] ?? '""');
    assert.ok(alt, `Missing image description: ${id}`);
    assert.deepEqual(image, {
      '@type': 'ImageObject',
      url: `https://replaid.pro/og-${id}.png`,
      width: 1200,
      height: 630,
      caption: alt,
    }, id);
    for (const key of ['og:image:alt', 'twitter:image:alt']) {
      assert.equal(decodeHtml(html.match(new RegExp(`(?:property|name)="${key}" content="([^"]+)"`))?.[1] ?? ''), alt, `${id}: ${key}`);
    }
    const binary = (await readFile(new URL(`og-${id}.png`, output))).toString('base64');
    assert.ok(!imageContents.has(binary), `Sharing images must differ: ${id}`);
    imageContents.add(binary);
  }
});

test('every local image, script, stylesheet, and CSS asset exists after cleanup', async () => {
  const files = await readdir(output, { recursive: true });
  const check = async (reference, source) => {
    if (!reference || /^(?:https?:|data:|#|\/\/)/.test(reference)) return;
    const target = new URL(reference, new URL(source, 'https://replaid.pro/'));
    const relativePath = decodeURIComponent(target.pathname.slice(1));
    assert.ok(files.includes(relativePath), `Missing asset ${reference} from ${source}`);
  };
  for (const file of files.filter(path => /\.(html|css)$/.test(path))) {
    const text = await readPage(file);
    if (file.endsWith('.html')) {
      for (const match of text.matchAll(/<(?:img|script|link)\b[^>]*>/g)) {
        const tag = match[0];
        if (tag.startsWith('<link') && !/rel="(?:stylesheet|icon|preload|modulepreload)"/.test(tag)) continue;
        await check(tag.match(/\b(?:src|href)="([^"]+)"/)?.[1], file);
      }
    }
    for (const match of text.matchAll(/url\(["']?([^\s"')]+)["']?\)/g)) await check(match[1], file);
  }
});

test('every page keeps the shared light design and accessible skip navigation', async () => {
  for (const file of (await readdir(output, { recursive: true })).filter(path => path.endsWith('.html'))) {
    const html = await readPage(file);
    assert.match(html, /<html[^>]*data-appearance="light"/);
    assert.match(html, /name="theme-color" content="#ffffff"/);
    assert.match(html, /<a href="#main" class="skip-link">/);
    assert.match(html, /<main[^>]*id="main"/);
    assert.ok(!html.includes("getItem('theme')"), `Old theme logic remains in ${file}`);
  }
});


test('every page includes the CSS reset and hides contact spam and screen-reader controls', async () => {
  const pages = (await readdir(output, { recursive: true })).filter(path => path.endsWith('.html'));
  for (const page of pages) {
    const html = await readPage(page);
    const styles = Array.from(html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/g), match => match[1]);
    for (const match of html.matchAll(/<link\b[^>]*>/g)) {
      if (!/rel="stylesheet"/.test(match[0])) continue;
      const href = match[0].match(/href="([^"]+)"/)?.[1];
      if (!href?.startsWith('/')) continue;
      styles.push(await readPage(href.slice(1)));
    }
    const css = styles.join('\n');
    assert.doesNotMatch(css, /@tailwind\b/, `Uncompiled Tailwind CSS: ${page}`);
    assert.match(css, /box-sizing:\s*border-box/, `Missing layout reset: ${page}`);
    assert.match(css, /\.hidden\s*\{\s*display:\s*none\s*;?\s*\}/, `Missing spam control style: ${page}`);
    assert.match(css, /\.sr-only\s*\{[^}]*clip:\s*rect\(0,\s*0,\s*0,\s*0\)/, `Missing screen-reader style: ${page}`);
  }
});


test('internal links and structured URLs match canonical pages and keep valid fragments', async () => {
  const files = await readdir(output, { recursive: true });
  const pages = new Map();
  for (const file of files.filter(path => path.endsWith('.html'))) {
    const html = await readPage(file);
    const canonical = html.match(/rel="canonical" href="([^"]+)"/)?.[1];
    assert.ok(canonical, `Missing canonical: ${file}`);
    const url = new URL(canonical);
    assert.equal(url.search, '', `Query in canonical: ${file}`);
    assert.equal(url.hash, '', `Fragment in canonical: ${file}`);
    if (file !== '404.html') assert.ok(url.pathname.endsWith('/'), `Missing canonical slash: ${file}`);
    pages.set(url.pathname, { file, html, canonical });
  }
  const check = (reference, source) => {
    const url = new URL(decodeHtml(reference), source.canonical);
    if (url.origin !== 'https://replaid.pro') return;
    if (files.includes(decodeURIComponent(url.pathname.slice(1))) && !url.pathname.endsWith('.html')) return;
    const destination = pages.get(url.pathname);
    assert.ok(destination, `Noncanonical or missing internal destination ${reference} in ${source.file}`);
    assert.equal(`${url.origin}${url.pathname}`, destination.canonical);
    if (url.hash) assert.ok(destination.html.includes(`id="${decodeURIComponent(url.hash.slice(1))}"`), `Broken fragment ${reference} in ${source.file}`);
  };
  const checkStructured = (value, source) => {
    if (typeof value === 'string' && value.startsWith('https://replaid.pro')) check(value, source);
    else if (value && typeof value === 'object') Object.values(value).forEach(item => checkStructured(item, source));
  };
  for (const page of pages.values()) {
    for (const link of links(page.html)) if (link.href) check(link.href, page);
    for (const match of page.html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) checkStructured(JSON.parse(match[1]), page);
    const ogUrl = page.html.match(/property="og:url" content="([^"]+)"/)?.[1];
    assert.equal(ogUrl, page.canonical, `Sharing URL differs from canonical: ${page.file}`);
  }
  const sitemap = await readPage('sitemap-0.xml');
  const sitemapUrls = Array.from(sitemap.matchAll(/<loc>(.*?)<\/loc>/g), match => match[1]);
  const canonicalUrls = [...pages.values()].filter(page => page.file !== '404.html').map(page => page.canonical);
  assert.deepEqual(sitemapUrls.sort(), canonicalUrls.sort());
});

test('FAQ search answers match the visible answers on both landing pages', async () => {
  const normalize = value => decodeHtml(value.replace(/<[^>]*>/g, '')).replace(/\s+/g, ' ').trim();
  for (const html of [await readPage('index.html'), sales]) {
    const data = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)?.[1] ?? '[]');
    const faq = data.find(item => item['@type'] === 'FAQPage');
    assert.ok(faq, 'Missing FAQ search data');
    const visible = Array.from(html.matchAll(/<details\b[^>]*class="sky-faq-item"[^>]*>\s*<summary>([\s\S]*?)<\/summary>\s*<p>([\s\S]*?)<\/p>\s*<\/details>/g), match => ({ question: normalize(match[1]), answer: normalize(match[2]) }));
    assert.deepEqual(faq.mainEntity.map(item => ({ question: item.name, answer: item.acceptedAnswer.text })), visible);
    const requiredQuestions = html === sales
      ? ['Are there account or message limits?', 'Can I import past conversations?', 'Does connecting MCP turn on automatic replies?', 'What does Replaid cost?']
      : ['Which channels can I connect?', 'What do I need to connect a channel?', 'Are there account or message limits?'];
    for (const question of requiredQuestions) {
      assert.ok(visible.some(item => item.question === question), `Missing separate FAQ answer: ${question}`);
    }
  }
});
