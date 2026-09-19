import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import test from 'node:test';

// Run after the Astro build to check the routes visitors actually receive.
const output = new URL('../../dist/', import.meta.url);
const registerUrl = 'https://app.replaid.pro/register';
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

test('the conversion route offers public registration and a separate setup guide', () => {
  const pageLinks = links(sales.match(/<main\b[^>]*>([\s\S]*?)<\/main>/)?.[1] ?? '');
  assert.equal(pageLinks.filter(link => link.text === 'Create your account' && link.href === registerUrl).length, 2);
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

test('Documentation links on every built page lead to the relocated guide', async () => {
  const pages = (await readdir(output, { recursive: true })).filter(path => path.endsWith('.html') && path !== 'beta/index.html');
  for (const path of pages) {
    const docs = links(await readPage(path)).filter(link => link.text === 'Documentation');
    assert.ok(docs.length > 0, `Missing Documentation navigation: ${path}`);
    for (const link of docs) assert.equal(link.href, guidePath, `Wrong Documentation link: ${path}`);
  }
});

test('current articles link directly to registration and retain setup guidance', async () => {
  const posts = (await readdir(new URL('../content/blog/', import.meta.url))).filter(path => path.endsWith('.md'));
  assert.ok(posts.length > 0);
  for (const post of posts) {
    const source = await readFile(new URL(`../content/blog/${post}`, import.meta.url), 'utf8');
    if (/^draft: true$/m.test(source)) continue;
    const html = await readPage(`${post.slice(0, -3)}/index.html`);
    const article = html.match(/<article\b[^>]*>([\s\S]*?)<\/article>/)?.[1];
    assert.ok(article, `Missing article: ${post}`);
    if (/^historical: true$/m.test(source)) {
      assert.ok(links(article).some(link => link.href === '/get-started/'), `Missing historical link: ${post}`);
      continue;
    }
    assert.ok(links(article).some(link => link.href === registerUrl && link.text === 'Create your account'), `Missing registration link: ${post}`);
    assert.ok(links(article).some(link => link.href === guidePath), `Missing setup guidance: ${post}`);
  }
});

test('the sitemap includes product routes and excludes the old beta redirect', async () => {
  const sitemap = await readPage('sitemap-0.xml');
  assert.match(sitemap, /<loc>https:\/\/replaid.pro\/get-started\/?<\/loc>/);
  assert.match(sitemap, /<loc>https:\/\/replaid.pro\/docs\/connect-your-agent\/?<\/loc>/);
  assert.match(sitemap, /<loc>https:\/\/replaid.pro\/pricing\/?<\/loc>/);
  assert.doesNotMatch(sitemap, /<loc>https:\/\/replaid.pro\/beta\/?<\/loc>/);
});

test('pricing explains the free account before the optional founding offer', async () => {
  const pricing = await readPage('pricing/index.html');
  const main = pricing.match(/<main\b[^>]*>([\s\S]*?)<\/main>/)?.[1] ?? '';
  const text = decodeHtml(main.replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ');
  const pageLinks = links(main);
  assert.match(pricing, /rel="canonical" href="https:\/\/replaid.pro\/pricing\/?"/);
  assert.match(text, /Founding Lifetime/);
  assert.match(text, /Pay the platform once/);
  assert.match(text, /299\s*USD/);
  assert.match(text, /Per team\. Paid once\./);
  assert.match(text, /Includes\s+\$50 usage credit/);
  assert.match(text, /first 5 founding teams/);
  assert.match(text, /No monthly platform fee/);
  assert.ok(!/founding seats|Most common start|Claim Founding Lifetime|\$199|\$79|\$149/.test(text));
  const offerPosition = main.indexOf('class="pricing-ltd-price"');
  const featurePosition = main.indexOf('class="pricing-ltd-copy"');
  assert.ok(offerPosition >= 0 && offerPosition < featurePosition, 'The reading order must put the founding price before its features');
  const registrationLinks = pageLinks.filter(link => link.href === registerUrl);
  assert.equal(registrationLinks.length, 3);
  for (const link of registrationLinks) assert.equal(link.text, 'Create your account');
  assert.ok(main.indexOf('class="pricing-start"') < offerPosition);
  assert.match(text, /Start with a free account/);
  assert.match(text, /Optional purchase in Billing after signup/);
  assert.match(text, /Setup is optional/);
  assert.ok(pageLinks.some(link => link.href === '#pricing-costs'));
  assert.ok(main.includes('id="pricing-costs"'));
  assert.ok(pageLinks.some(link => link.text === 'See the setup guide' && link.href === guidePath));
  assert.match(sales, /No card needed to create an account/);
  assert.match(sales, /Setup is optional/);
  for (const html of [await readPage('index.html'), pricing]) {
    const pricingNav = links(html).filter(link => link.text === 'Pricing');
    assert.ok(pricingNav.length > 0, 'Missing Pricing navigation');
    for (const link of pricingNav) assert.equal(link.href, '/pricing/');
  }
});

test('pricing distinguishes included actions from channel and external AI costs', async () => {
  const pricing = await readPage('pricing/index.html');
  const table = pricing.match(/<table class="pricing-cost-table">([\s\S]*?)<\/table>/)?.[1] ?? '';
  assert.match(table, /<caption/);
  assert.equal((table.match(/scope="col"/g) ?? []).length, 2);
  assert.equal((table.match(/scope="row"/g) ?? []).length, 5);
  assert.match(table, /No usage credit needed/);
  assert.match(table, /same price the provider charges/);
  assert.match(table, /funded by Replaid/);
  assert.match(table, /external provider costs are separate/);
  assert.match(table, /Standard rates are provider cost plus 20%/);
  assert.match(table, /A verified zero-cost operation does not spend credit/);
  for (const channel of ['Instagram', 'Messenger', 'Telegram', 'widget', 'WhatsApp']) assert.ok(table.includes(channel));
  const rateLinks = links(table).filter(link => link.text.endsWith('rates'));
  assert.deepEqual(rateLinks.map(link => link.href), ['https://developers.facebook.com/docs/whatsapp/pricing/']);
  assert.match(pricing, /Optional credit top-ups:/);
  for (const amount of ['$10', '$25', '$50', '$100']) assert.ok(pricing.includes(amount));
  assert.match(pricing, /Applicable tax is calculated at checkout/);
  assert.ok(!pricing.includes('class="pricing-card"'), 'Top-ups should not appear as competing plans');
});

test('pricing provides native FAQ controls and the one-year expiry', async () => {
  const pricing = await readPage('pricing/index.html');
  const faq = pricing.match(/<section class="pricing-faq"[\s\S]*?<\/section>/)?.[0] ?? '';
  const questions = Array.from(faq.matchAll(/<details\b[^>]*>([\s\S]*?)<\/details>/g), match => match[1]);
  assert.equal(questions.length, 8);
  for (const question of questions) {
    assert.match(question, /^\s*<summary>/);
    assert.match(question, /class="pricing-faq-answer"/);
  }
  assert.match(faq, /expires one year after it is added to your account/);
  assert.match(faq, /included \$50 and to credit top-ups/);
  assert.ok(!/do not expire|never expire|guaranteed refund/i.test(faq));
  assert.match(faq, /cannot proceed without enough available balance/);
  assert.match(faq, /one Instagram account, one Facebook Page, one Telegram bot, and one Replaid widget/);
  assert.match(faq, /Refund requests are reviewed/);
  for (const link of links(faq).filter(link => link.href?.startsWith('/') && link.href.includes('#'))) {
    const [route, id] = link.href.split('#');
    const destination = await readPage(`${route.slice(1)}index.html`);
    assert.ok(destination.includes(`id="${id}"`), `Missing FAQ destination: ${link.href}`);
  }
});

test('home and pricing omit software rich results until customer reviews are available', async () => {
  for (const path of ['index.html', 'pricing/index.html']) {
    const html = await readPage(path);
    const items = Array.from(html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g), match => JSON.parse(match[1])).flat();
    assert.ok(!items.some(item => [item['@type']].flat().includes('SoftwareApplication')), `Incomplete software rich result: ${path}`);
    if (path === 'index.html') {
      assert.deepEqual(items.map(item => item['@type']).sort(), ['FAQPage', 'Organization']);
      const organization = items.find(item => item['@type'] === 'Organization');
      assert.equal(organization.name, 'Replaid');
      assert.equal(organization.url, 'https://replaid.pro/');
    }
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
    const recommendations = links(related).filter(link => link.href !== '/blog/');
    const selectedIds = Array.from((source.match(/^relatedPosts:\n((?:  - [^\n]+\n)+)/m)?.[1] ?? '').matchAll(/  - ([^\n]+)/g), match => match[1]);
    assert.deepEqual(recommendations.map(link => link.href), selectedIds.map(id => `/${id}/`), `Editorial recommendation order: ${id}`);
    assert.equal(new Set(selectedIds).size, selectedIds.length, `Duplicate recommendation: ${id}`);
    for (const link of recommendations) {
      assert.notEqual(link.href, `/${id}/`, 'An article must not recommend itself');
      assert.notEqual(link.href, '/introducing-replaid/', 'Historical content must not appear as current guidance');
      assert.ok(posts.includes(`${link.href.slice(1, -1)}.md`), `Invalid related article: ${link.href}`);
    }
  }
});

test('current articles and product pages have incoming links beyond the site navigation and blog index', async () => {
  const posts = (await readdir(new URL('../content/blog/', import.meta.url))).filter(path => path.endsWith('.md'));
  const targets = new Set([
    '/use-cases/customer-support/', '/use-cases/developers/', '/use-cases/creators/', '/use-cases/automation-agencies/',
    '/compare/manychat/', '/compare/respond-io/', '/pricing/', '/setup-service/',
  ]);
  for (const filename of posts) {
    const source = await readFile(new URL(`../content/blog/${filename}`, import.meta.url), 'utf8');
    if (!/^(?:draft|historical): true$/m.test(source)) targets.add(`/${filename.slice(0, -3)}/`);
  }
  const pages = (await readdir(output, { recursive: true })).filter(path => path.endsWith('/index.html') && path !== 'blog/index.html' && path !== 'beta/index.html');
  const incoming = new Set();
  for (const path of pages) {
    const html = await readPage(path);
    const main = (html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/)?.[1] ?? '').replace(/<nav\b[^>]*>[\s\S]*?<\/nav>/g, '');
    for (const link of links(main)) {
      const destination = new URL(link.href, 'https://replaid.pro');
      if (destination.origin === 'https://replaid.pro' && destination.pathname !== `/${path.replace('index.html', '')}`) incoming.add(destination.pathname);
    }
  }
  for (const target of targets) assert.ok(incoming.has(target), `No contextual incoming link: ${target}`);
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

test('form privacy notices describe open registration and preserve the terms version', async () => {
  const privacy = await readPage('privacy/index.html');
  const cookies = await readPage('cookies/index.html');
  const terms = await readPage('terms/index.html');
  assert.match(privacy, /Earlier beta access requests/);
  assert.match(privacy, /app registration does not/);
  assert.match(cookies, /The contact page uses Web3Forms/);
  for (const html of [privacy, cookies]) {
    assert.match(html, /datetime="2026-09-19"/);
    assert.doesNotMatch(html, /contact and beta access (?:forms|pages)/);
  }
  assert.match(terms, /datetime="2026-09-14"/);
});

test('all built routes defer analytics to the consent control and expose a way to change it', async () => {
  const pages = (await readdir(output, { recursive: true })).filter(path => path.endsWith('.html') && path !== 'beta/index.html');
  for (const name of pages) {
    const html = await readPage(name);
    assert.ok(!/<script[^>]+src="https:\/\/www\.googletagmanager\.com/.test(html), `Analytics loaded before consent: ${name}`);
    assert.match(html, /data-cookie-banner/);
    assert.match(html, /data-analytics-enabled="true"/);
    assert.match(html, /data-analytics-choice="rejected"/);
    assert.match(html, /data-analytics-choice="accepted"/);
    const footer = html.match(/<footer\b[^>]*>([\s\S]*?)<\/footer>/)?.[1] ?? '';
    assert.ok(links(footer).some(link => link.text === 'Cookies' && link.href === '/cookies/#preferences'), `Missing settings access: ${name}`);
    assert.doesNotMatch(footer, /data-cookie-settings|<button/);
  }
  const policy = await readPage('cookies/index.html');
  const settings = policy.match(/<section id="preferences">([\s\S]*?)<\/section>/)?.[1] ?? '';
  assert.match(settings, /<h2>Cookie settings<\/h2>/);
  assert.match(settings, /data-analytics-choice="rejected"/);
  assert.match(settings, /data-analytics-choice="accepted"/);
  assert.match(settings, /data-cookie-status/);
  assert.match(settings, /withdraw earlier consent/);
});


test('sharing cards use real landscape PNGs with matching metadata on every page', async () => {
  const posts = (await readdir(new URL('../content/blog/', import.meta.url))).filter(path => path.endsWith('.md')).map(path => path.slice(0, -3));
  const pages = (await readdir(output, { recursive: true })).filter(path => path.endsWith('.html') && path !== 'beta/index.html');
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
  for (const file of (await readdir(output, { recursive: true })).filter(path => path.endsWith('.html') && path !== 'beta/index.html')) {
    const html = await readPage(file);
    assert.match(html, /<html[^>]*data-appearance="light"/);
    assert.match(html, /name="theme-color" content="#ffffff"/);
    assert.match(html, /<a href="#main" class="skip-link">/);
    assert.match(html, /<main[^>]*id="main"/);
    assert.ok(!html.includes("getItem('theme')"), `Old theme logic remains in ${file}`);
  }
});


test('every page includes the CSS reset and hides contact spam and screen-reader controls', async () => {
  const pages = (await readdir(output, { recursive: true })).filter(path => path.endsWith('.html') && path !== 'beta/index.html');
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
  for (const file of files.filter(path => path.endsWith('.html') && path !== 'beta/index.html')) {
    const html = await readPage(file);
    const canonical = html.match(/rel="canonical" href="([^"]+)"/)?.[1];
    if (file === '404.html') {
      assert.equal(canonical, undefined, 'The error page must not declare a canonical URL');
      assert.match(html, /name="robots" content="noindex, follow"/);
      continue;
    }
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
  const redirects = (await readPage('_redirects')).split('\n').map(line => line.trim()).filter(line => line && !line.startsWith('#'));
  for (const rule of redirects) {
    const [source] = rule.split(/\s+/);
    assert.ok(!pages.has(source), `Deployment redirect overrides a published page: ${source}`);
  }
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


test('old beta links redirect directly to registration without collecting another form', async () => {
  const beta = await readPage('beta/index.html');
  assert.match(beta, /http-equiv="refresh"/);
  assert.ok(beta.includes(registerUrl));
  assert.doesNotMatch(beta, /<form|web3forms|h-captcha/);
  const redirects = await readPage('_redirects');
  assert.ok(redirects.includes(`/beta ${registerUrl} 301`));
  assert.ok(redirects.includes(`/beta/ ${registerUrl} 301`));
});

test('every content page offers direct registration without an invitation gate', async () => {
  const pages = (await readdir(output, { recursive: true })).filter(path => path.endsWith('.html') && path !== 'beta/index.html');
  for (const path of pages) {
    const html = await readPage(path);
    const pageLinks = links(html);
    assert.ok(pageLinks.some(link => link.href === registerUrl && link.text === 'Get started'), `Missing registration link: ${path}`);
    assert.ok(!pageLinks.some(link => link.href?.startsWith('/beta')), `Old beta link: ${path}`);
    assert.doesNotMatch(html, /Access is by invitation|Once invited|Request beta access/i, path);
    assert.ok(pageLinks.some(link => link.href === 'https://app.replaid.pro/login'), `Missing login link: ${path}`);
  }
});
