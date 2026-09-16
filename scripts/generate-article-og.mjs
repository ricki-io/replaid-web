import { readFile } from 'node:fs/promises';
import sharp from 'sharp';

// Build first so the cards reuse the exact article titles and artwork on the blog.
const output = new URL('../dist/', import.meta.url);
const publicDirectory = new URL('../public/', import.meta.url);
const blog = await readFile(new URL('blog/index.html', output), 'utf8');
const cards = [...blog.matchAll(/<article\b[^>]*data-blog-post[^>]*>[\s\S]*?<\/article>/g)];
if (!cards.length) throw new Error('Build the blog before generating its sharing images.');
const escape = text => text.replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[character]);
const decode = text => text.replace(/&#(x[0-9a-f]+|[0-9]+);|&(amp|lt|gt|quot|apos);/gi, (_, number, name) => number
  ? String.fromCodePoint(number[0].toLowerCase() === 'x' ? parseInt(number.slice(1), 16) : Number(number))
  : ({ amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" })[name.toLowerCase()]);
const asset = async name => `data:image/png;base64,${(await sharp(new URL(name, publicDirectory).pathname).png().toBuffer()).toString('base64')}`;
const logo = await asset('favicon.svg');
const sky = await asset('connector-sky-wisps.webp');

for (const [card] of cards) {
  const id = card.match(/class="blog-post-link" href="\/([^/]+)\/"/)?.[1];
  const originalArtwork = card.match(/class="blog-artwork[^>]*>\s*(<svg\b[\s\S]*?<\/svg>)/)?.[1];
  if (!id || !originalArtwork) throw new Error('Every article needs its shared BlogArtwork to generate a sharing image.');
  const article = await readFile(new URL(`${id}/index.html`, output), 'utf8');
  const title = decode(article.match(/<title>(.*?)<\/title>/s)?.[1] ?? '').replace(/ — Replaid Blog$/, '');
  if (!title) throw new Error(`Missing sharing title: ${id}`);
  const historical = card.includes('blog-history-label');
  const category = historical ? '2025 LAUNCH ARCHIVE' : decode(card.match(/class="blog-category">([^<]+)</)?.[1] ?? 'GUIDE').toUpperCase();
  const headline = await sharp({ text: { text: `<span foreground="#10151b" weight="bold">${escape(title)}</span>`, font: 'Arial 50', width: 550, spacing: 8, rgba: true, dpi: 72 } }).png().toBuffer({ resolveWithObject: true });
  if (headline.info.height > 300) throw new Error(`Sharing title is too tall: ${id}`);
  const titleY = 205 + (270 - headline.info.height) / 2;
  const art = originalArtwork.replace('<svg ', '<svg x="655" y="165" width="500" height="364" font-family="Arial, Helvetica, sans-serif" ').replaceAll('href="/favicon.svg"', `href="${logo}"`);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
<defs><linearGradient id="cloud-fade" x1="0" y1="0" x2="1" y2="1"><stop stop-color="black"/><stop offset=".4" stop-color="white"/><stop offset=".8" stop-color="white"/><stop offset="1" stop-color="black"/></linearGradient><mask id="cloud-mask"><rect x="630" y="155" width="525" height="375" rx="40" fill="url(#cloud-fade)"/></mask></defs>
<rect width="1200" height="630" fill="white"/>
<image href="${logo}" x="56" y="44" width="31" height="34"/>
<text x="99" y="72" fill="#10151b" font-family="Arial, Helvetica, sans-serif" font-size="34" font-weight="700" letter-spacing="-1.3">Replaid</text>
<text x="1144" y="68" text-anchor="end" fill="#667786" font-family="Arial, Helvetica, sans-serif" font-size="19">${historical ? 'Product history' : 'From the Replaid blog'}</text>
<text x="56" y="177" fill="#356184" font-family="Arial, Helvetica, sans-serif" font-size="17" font-weight="600" letter-spacing="1.5">${escape(category)}</text>
<image href="data:image/png;base64,${headline.data.toString('base64')}" x="56" y="${titleY}" width="${headline.info.width}" height="${headline.info.height}"/>
<rect x="645" y="148" width="510" height="390" rx="42" fill="${historical ? '#f0f6ec' : '#edf6fc'}"/>
<image href="${sky}" x="630" y="155" width="540" height="405" preserveAspectRatio="xMidYMid slice" opacity=".26" mask="url(#cloud-mask)"/>
${art}
<text x="56" y="586" fill="#667786" font-family="Arial, Helvetica, sans-serif" font-size="19">${historical ? 'The original launch, preserved as history.' : 'Customer messages. Your AI agent.'}</text>
<text x="1144" y="586" text-anchor="end" fill="#526878" font-family="Arial, Helvetica, sans-serif" font-size="20">replaid.pro</text>
</svg>`;
  const filename = `og-${id}.png`;
  await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toFile(new URL(filename, publicDirectory).pathname);
  console.log(`Generated public/${filename} (1200 × 630)`);
}
