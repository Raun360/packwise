/**
 * Crop a portrait down to a 200×200 avatar.
 *
 * The source is a full-length photo, so a plain centre crop lands on the
 * shirt. This crops a square around the face first, then resizes.
 *
 *   node scripts/make-avatar.mjs <input> [--x 0.55] [--y 0.37] [--size 0.42]
 *
 *   x, y   centre of the face as a fraction of width/height
 *   size   side of the crop square as a fraction of the *shorter* edge
 *
 * Defaults are tuned for a standing portrait with the face in the upper
 * third. Nudge --y down if the crop sits too high, up if too low.
 */
import sharp from 'sharp';
import path from 'node:path';
import fs from 'node:fs';

const OUT = 'public/creator.jpg';
const SIDE = 200;

const args = process.argv.slice(2);
const input = args.find((a) => !a.startsWith('--'));
const flag = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] ? Number(args[i + 1]) : fallback;
};

if (!input) {
  console.error('Usage: node scripts/make-avatar.mjs <input-image> [--x 0.55] [--y 0.37] [--size 0.42]');
  process.exit(1);
}
if (!fs.existsSync(input)) {
  console.error(`Not found: ${input}`);
  process.exit(1);
}

const fx = flag('x', 0.55);
const fy = flag('y', 0.37);
const fsize = flag('size', 0.42);

const image = sharp(input).rotate(); // honour EXIF orientation
const { width, height } = await image.metadata();

// Square side, taken from the shorter edge so it always fits.
let side = Math.round(Math.min(width, height) * fsize);
side = Math.max(80, Math.min(side, width, height));

// Centre it on the face, then pull back inside the frame if it overhangs.
let left = Math.round(width * fx - side / 2);
let top = Math.round(height * fy - side / 2);
left = Math.max(0, Math.min(left, width - side));
top = Math.max(0, Math.min(top, height - side));

fs.mkdirSync(path.dirname(OUT), { recursive: true });

await image
  .extract({ left, top, width: side, height: side })
  .resize(SIDE, SIDE, { fit: 'cover' })
  .jpeg({ quality: 86, mozjpeg: true })
  .toFile(OUT);

const kb = (fs.statSync(OUT).size / 1024).toFixed(1);
console.log(`${input}  ${width}×${height}`);
console.log(`  crop  ${side}×${side} at (${left}, ${top})`);
console.log(`  wrote ${OUT}  ${SIDE}×${SIDE}  ${kb} kB`);
console.log('\nIf the framing is off, re-run with --y (lower = higher up) or --size.');
