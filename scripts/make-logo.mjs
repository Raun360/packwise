/**
 * Turn the supplied logo into web assets.
 *
 * The source is a JPEG on a white background. The site header is translucent
 * and floats over a deep teal section, so an opaque white rectangle would show
 * as a patch — the background has to become transparent.
 *
 *   node scripts/make-logo.mjs [input]
 *
 * Produces:
 *   public/logo.png       full lockup, trimmed, transparent, 2× header height
 *   public/logo-mark.png  just the suitcase mark, square, for the favicon
 */
import sharp from 'sharp';
import fs from 'node:fs';

const input = process.argv[2] || 'public/packwise logo.jpeg';
if (!fs.existsSync(input)) {
  console.error(`Not found: ${input}`);
  process.exit(1);
}

/** Near-white pixels become transparent; everything else keeps full alpha. */
async function withTransparency(pipeline, threshold = 232) {
  const { data, info } = await pipeline
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    if (r >= threshold && g >= threshold && b >= threshold) {
      data[i + 3] = 0;
    } else if (r >= threshold - 26 && g >= threshold - 26 && b >= threshold - 26) {
      // Feather the anti-aliased edge so the artwork keeps a clean outline
      // instead of a hard, jagged cut.
      const light = (r + g + b) / 3;
      data[i + 3] = Math.round(255 * Math.max(0, (threshold - light) / 26));
    }
  }

  return sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } });
}

const src = sharp(input).rotate();
const meta = await src.metadata();
console.log(`${input}  ${meta.width}×${meta.height}`);

/* ---- Full lockup ----
   Trim the white margin first so the logo sits tight in the header. Held as a
   buffer rather than a pipeline: withTransparency() sets raw output on the
   pipeline it is given, so a clone taken afterwards would emit headerless
   pixels that sharp cannot read back. */
const trimmedBuf = await src.clone().trim({ threshold: 18 }).png().toBuffer();
const tMeta = await sharp(trimmedBuf).metadata();

const HEADER_H = 64; // 2× a 32px header logo
await (await withTransparency(sharp(trimmedBuf)))
  .resize({ height: HEADER_H })
  .png({ compressionLevel: 9 })
  .toFile('public/logo.png');

/* ---- Mark only, for the favicon ----
   The mark is the left square-ish portion of the lockup. */
const markW = Math.round(tMeta.height * 1.02);
const markBuf = await sharp(trimmedBuf)
  .extract({ left: 0, top: 0, width: Math.min(markW, tMeta.width), height: tMeta.height })
  .png()
  .toBuffer();

await (await withTransparency(sharp(markBuf)))
  .resize(128, 128, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .png({ compressionLevel: 9 })
  .toFile('public/logo-mark.png');

const kb = (f) => (fs.statSync(f).size / 1024).toFixed(1);
const lm = await sharp('public/logo.png').metadata();
console.log(`  trimmed to ${tMeta.width}×${tMeta.height}`);
console.log(`  wrote public/logo.png       ${lm.width}×${lm.height}  ${kb('public/logo.png')} kB`);
console.log(`  wrote public/logo-mark.png  128×128  ${kb('public/logo-mark.png')} kB`);
