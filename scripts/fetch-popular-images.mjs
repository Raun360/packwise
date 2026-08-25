/**
 * One-time fetch of a photo for each Popular Trip, run manually whenever the
 * list in data/popularTrips.js changes. Writes data/popularTripImages.json,
 * which the app reads statically at runtime instead of calling the Unsplash
 * API per visitor — Unsplash's free tier is a shared 50 requests/hour across
 * every visitor combined, so a fixed, known list of destinations should be
 * resolved once, not on every landing page load.
 *
 * Usage: node scripts/fetch-popular-images.mjs
 * Reads VITE_UNSPLASH_ACCESS_KEY from .env.local.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { POPULAR_TRIPS } from '../src/data/popularTrips.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

function readEnvLocal() {
  const p = path.join(root, '.env.local');
  if (!fs.existsSync(p)) return {};
  const out = {};
  for (const line of fs.readFileSync(p, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) out[m[1]] = m[2].trim();
  }
  return out;
}

const ACCESS_KEY = process.env.VITE_UNSPLASH_ACCESS_KEY || readEnvLocal().VITE_UNSPLASH_ACCESS_KEY;
if (!ACCESS_KEY) {
  console.error('VITE_UNSPLASH_ACCESS_KEY not found in .env.local or the environment.');
  process.exit(1);
}

async function fetchOne(query) {
  const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape&content_filter=high`;
  const res = await fetch(url, { headers: { Authorization: `Client-ID ${ACCESS_KEY}` } });
  if (!res.ok) throw new Error(`${query}: HTTP ${res.status}`);
  const data = await res.json();
  const photo = data?.results?.[0];
  if (!photo) return null;
  return {
    url: photo.urls?.regular,
    thumbUrl: photo.urls?.small,
    alt: photo.alt_description || query,
    credit: {
      name: photo.user?.name || 'Unsplash',
      link: photo.user?.links?.html || 'https://unsplash.com',
    },
  };
}

const out = {};
for (const trip of POPULAR_TRIPS) {
  try {
    out[trip.id] = await fetchOne(trip.name);
    console.log(`${out[trip.id] ? 'OK  ' : 'NONE'} ${trip.id}`);
  } catch (err) {
    console.warn(`FAIL ${trip.id}: ${err.message}`);
    out[trip.id] = null;
  }
  // Unsplash's free tier is 50 requests/hour — a small gap keeps this run
  // well clear of any per-second burst limit on top of that.
  await new Promise((r) => setTimeout(r, 250));
}

const outPath = path.join(root, 'src/data/popularTripImages.json');
fs.writeFileSync(outPath, JSON.stringify(out, null, 2) + '\n');
console.log(`\nWrote ${Object.keys(out).length} entries to ${path.relative(root, outPath)}`);
