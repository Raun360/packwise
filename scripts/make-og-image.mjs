/**
 * Social share image (1200×630) — deep teal ground, the logo lockup,
 * and the tagline, so a link shared to WhatsApp/X/Slack shows the brand
 * rather than a blank card.
 *
 * Run after make-logo.mjs, since it composites public/logo.png.
 */
import sharp from 'sharp';
import fs from 'node:fs';

const W = 1200, H = 630;
const LOGO = 'public/logo.png';

if (!fs.existsSync(LOGO)) {
  console.error('Run `npm run logo` first — public/logo.png is missing.');
  process.exit(1);
}

// The lockup is dark-on-transparent (deep teal mark, deep teal "Pack"),
// which disappears on a deep teal card. Recolour it to the light ink used
// on dark surfaces elsewhere in the app, keeping the bright green accent.
const logoBuf = await sharp(LOGO).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const { data, info } = logoBuf;
for (let i = 0; i < data.length; i += 4) {
  const isGreen = data[i + 1] > data[i] + 20 && data[i + 1] > data[i + 2] + 10;
  if (!isGreen) { data[i] = 234; data[i + 1] = 246; data[i + 2] = 231; } // --deep-ink
}
const lightLogo = await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } })
  .png()
  .toBuffer();
const logoMeta = await sharp(lightLogo).metadata();
const logoW = 320;
const logoH = Math.round(logoMeta.height * (logoW / logoMeta.width));

const svg = `
<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="g" cx="22%" cy="18%" r="85%">
      <stop offset="0%" stop-color="#164e4b"/>
      <stop offset="100%" stop-color="#0c3230"/>
    </radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#g)"/>
  <circle cx="1080" cy="540" r="260" fill="#8ADE7C" opacity="0.08"/>
  <circle cx="60" cy="60" r="160" fill="#8ADE7C" opacity="0.06"/>
  <text x="90" y="400" font-family="Arial, sans-serif" font-size="46" font-weight="500"
        fill="#EAF6E7" opacity="0.92">Pack smarter. Travel lighter.</text>
  <text x="90" y="452" font-family="Arial, sans-serif" font-size="24"
        fill="#EAF6E7" opacity="0.62">Built around your whole route, not one destination.</text>
</svg>`;

await sharp({ create: { width: W, height: H, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
  .composite([
    { input: Buffer.from(svg) },
    { input: await sharp(lightLogo).resize(logoW, logoH).toBuffer(), left: 90, top: 120 },
  ])
  .flatten({ background: '#11413F' })
  .jpeg({ quality: 88, mozjpeg: true })
  .toFile('public/og-image.jpg');

const kb = (fs.statSync('public/og-image.jpg').size / 1024).toFixed(0);
console.log(`wrote public/og-image.jpg  ${W}×${H}  ${kb} kB`);
