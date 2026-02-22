import sharp from 'sharp';
import { writeFileSync } from 'fs';

const svg = `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <rect width="1200" height="630" fill="#000000"/>
  <text x="100" y="260" font-family="Arial, Helvetica, sans-serif" font-weight="700" font-size="92" fill="#ffffff" letter-spacing="-3">Money is in</text>
  <text x="100" y="370" font-family="Arial, Helvetica, sans-serif" font-weight="700" font-size="92" fill="#ffffff" letter-spacing="-3">your <tspan fill="#93e85f">inbox</tspan><tspan fill="#404040">.</tspan></text>
  <text x="100" y="440" font-family="Arial, Helvetica, sans-serif" font-weight="400" font-size="30" fill="#999999">AI-powered inbox that qualifies leads and triggers automations 24/7</text>
  <text x="100" y="560" font-family="Arial, Helvetica, sans-serif" font-weight="700" font-size="38" fill="#ffffff" letter-spacing="-1">Replaid</text>
  <text x="226" y="560" font-family="Arial, Helvetica, sans-serif" font-weight="700" font-size="38" fill="#93e85f">.</text>
  <text x="260" y="556" font-family="monospace" font-weight="400" font-size="18" fill="#666666" letter-spacing="3">REPLAID.PRO</text>
</svg>`;

await sharp(Buffer.from(svg)).png({ compressionLevel: 9, palette: true }).toFile('public/og-image.png');
console.log('Generated public/og-image.png');
