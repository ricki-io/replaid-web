import { readFile } from 'node:fs/promises';
import sharp from 'sharp';

const publicDirectory = new URL('../public/', import.meta.url);
const iconSource = await readFile(new URL('../src/components/ChannelIcon.astro', import.meta.url), 'utf8');
const asset = async name => {
  const png = await sharp(await readFile(new URL(name, publicDirectory)), { density: 288 }).png().toBuffer();
  return `data:image/png;base64,${png.toString('base64')}`;
};
const [sky, logo, messenger, chatgpt, claude, hermes] = await Promise.all(
  ['connector-sky-wisps.webp', 'favicon.svg', 'messenger.svg', 'chatgpt.svg', 'claude.svg', 'hermes-agent-nous.png'].map(asset),
);
const image = (src, x, y, width, height = width) => `<image href="${src}" x="${x}" y="${y}" width="${width}" height="${height}"/>`;
const channel = (name, x, y, color) => {
  const geometry = iconSource.match(new RegExp(`${name}: \\{\\s*viewBox: '([^']+)',\\s*d: '([^']+)'`));
  if (!geometry) throw new Error(`Missing shared channel geometry: ${name}`);
  return `<svg x="${x}" y="${y}" width="38" height="38" viewBox="${geometry[1]}" fill="${color}"><path d="${geometry[2]}"/></svg>`;
};
const tile = (x, y, size, content, radius = size * .26) => `<g><rect x="${x}" y="${y}" width="${size}" height="${size}" rx="${radius}" fill="white" filter="url(#shadow)"/><rect x="${x + .5}" y="${y + .5}" width="${size - 1}" height="${size - 1}" rx="${radius}" fill="url(#glass)" stroke="white"/>${content}</g>`;
const instagram = `<g transform="translate(125 374)"><rect width="36" height="36" rx="10" fill="url(#instagram)"/><g fill="none" stroke="white" stroke-width="2.4"><rect x="8" y="8" width="20" height="20" rx="6"/><circle cx="18" cy="18" r="5"/></g><circle cx="24.6" cy="11.5" r="1.5" fill="white"/></g>`;
const widget = `<g transform="translate(248 504) scale(1.85)"><path d="M7 4h10a4 4 0 0 1 4 4v6a4 4 0 0 1-4 4H9l-6 3V8a4 4 0 0 1 4-4Z" fill="url(#widget)" stroke="#64b5ec" stroke-width=".7"/><path d="M4.1 11V8a2.9 2.9 0 0 1 2.9-2.9h10" fill="none" stroke="white" stroke-width=".9" stroke-linecap="round"/><path d="M8 9h8m-8 4h5" stroke="#236b9e" stroke-width="1.6" stroke-linecap="round"/></g>`;
const paths = ['M298 326C385 326 404 414 506 414', 'M172 390C335 390 393 426 506 426', 'M298 425C390 425 410 438 506 438', 'M172 491C330 491 398 450 506 450', 'M298 524C392 524 407 462 506 462', 'M676 416C776 375 812 416 912 416', 'M912 460C811 460 779 500 676 464'];

const svg = `<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
<defs>
  <radialGradient id="fade"><stop offset="0" stop-color="white"/><stop offset=".5" stop-color="white"/><stop offset="1" stop-color="black"/></radialGradient>
  <clipPath id="hermes-crop"><rect x="1059.5" y="493.5" width="36" height="36" rx="5"/></clipPath>
  <mask id="sky-mask"><ellipse cx="608" cy="440" rx="660" ry="235" fill="url(#fade)"/></mask>
  <linearGradient id="glass" x2=".8" y2="1"><stop stop-color="white"/><stop offset="1" stop-color="#fbfdff"/></linearGradient>
  <linearGradient id="instagram" x1="0" y1="1" x2=".8" y2="0"><stop stop-color="#ffd776"/><stop offset=".35" stop-color="#ff663e"/><stop offset=".62" stop-color="#df2ea8"/><stop offset="1" stop-color="#833de6"/></linearGradient>
  <linearGradient id="widget" x2="1" y2="1"><stop stop-color="#e1f8ff"/><stop offset=".5" stop-color="#8bd6ff"/><stop offset="1" stop-color="#3e9feb"/></linearGradient>
  <filter id="shadow" x="-50%" y="-40%" width="200%" height="220%"><feGaussianBlur in="SourceAlpha" stdDeviation="12"/><feOffset dy="12"/><feColorMatrix values="0 0 0 0 .15 0 0 0 0 .26 0 0 0 0 .35 0 0 0 .16 0"/><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  <filter id="glow"><feGaussianBlur stdDeviation="4"/></filter>
</defs>
<rect width="1200" height="630" fill="white"/>
<g mask="url(#sky-mask)"><image href="${sky}" x="0" y="140" width="1200" height="660" preserveAspectRatio="xMidYMid slice"/></g>
${image(logo, 49, 38, 33, 35)}
<text x="94" y="67" font-family="Arial, Helvetica, sans-serif" font-size="34" font-weight="700" letter-spacing="-1.4" fill="#10161b">Replaid</text>
<text x="1150" y="62" text-anchor="end" font-family="Arial, Helvetica, sans-serif" font-size="22" fill="#617182">replaid.pro</text>
<g text-anchor="middle" fill="#10161b" font-family="Arial, Helvetica, sans-serif" font-weight="700" font-size="57" letter-spacing="-2.1">
  <text x="600" y="169">Let <tspan font-family="Georgia, Times New Roman, serif" font-style="italic" font-weight="400">your AI agent</tspan> read</text>
  <text x="600" y="233">and reply to customer messages.</text>
</g>
<g fill="none" stroke="white" stroke-width="7" opacity=".5" filter="url(#glow)">${paths.map(d => `<path d="${d}"/>`).join('')}</g>
<g fill="none" stroke="white" stroke-width="2.6" stroke-linecap="round">${paths.map(d => `<path d="${d}"/>`).join('')}</g>
${tile(236, 295, 62, channel('whatsapp', 248, 307, '#20bd5a'))}
${tile(110, 359, 62, instagram)}
${tile(236, 394, 62, image(messenger, 249, 407, 36))}
${tile(110, 460, 62, channel('telegram', 122, 472, '#229ed9'))}
${tile(236, 493, 62, widget)}
${tile(506, 358, 170, `${image(logo, 565, 389, 53, 57)}<text x="591" y="489" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="30" font-weight="700" letter-spacing="-1.3" fill="#10161b">Replaid</text>`)}
${tile(912, 382, 125, image(chatgpt, 941, 411, 67))}
${tile(1040, 318, 75, image(claude, 1058, 336, 39))}
${tile(1040, 474, 75, `<g clip-path="url(#hermes-crop)">${image(hermes, 1057, 491, 41)}</g>`)}
</svg>`;

await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toFile(new URL('og-image.png', publicDirectory).pathname);
console.log('Generated public/og-image.png (1200 × 630)');
