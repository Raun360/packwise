/**
 * Destination photos, via the Unsplash API.
 *
 * Conditional on `VITE_UNSPLASH_ACCESS_KEY` — with no key, `getDestinationImage`
 * resolves to `null` for everything and the UI falls back to a plain gradient.
 * Never throws: a missing key, a rate limit, or a network failure all degrade
 * to "no photo," never to a broken image or a crashed screen.
 *
 * Results are cached both in memory (for the session) and in sessionStorage
 * (so navigating between screens, or a reload, doesn't re-spend the free
 * tier's 50 requests/hour on the same handful of places).
 */

const ACCESS_KEY = import.meta.env.VITE_UNSPLASH_ACCESS_KEY?.trim();
const DEV = !!import.meta.env.DEV;
const API_URL = 'https://api.unsplash.com/search/photos';
const STORAGE_KEY = 'pw_dest_images_v1';

const memCache = new Map();

function readStorage() {
  try {
    return JSON.parse(sessionStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

function writeStorage(key, value) {
  try {
    const store = readStorage();
    store[key] = value;
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // sessionStorage unavailable (private mode, quota) — memory cache still works
  }
}

const norm = (s) => (s || '').toLowerCase().trim();

/**
 * Look up a representative photo for a place.
 *
 * @param {string} query   place name, e.g. "Ladakh" or "Bali"
 * @returns {Promise<{url: string, thumbUrl: string, alt: string,
 *   credit: {name: string, link: string}} | null>}
 */
export async function getDestinationImage(query) {
  const key = norm(query);
  if (!ACCESS_KEY || !key) return null;

  if (memCache.has(key)) return memCache.get(key);

  const stored = readStorage();
  if (Object.prototype.hasOwnProperty.call(stored, key)) {
    memCache.set(key, stored[key]);
    return stored[key];
  }

  try {
    const url = `${API_URL}?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape&content_filter=high`;
    const res = await fetch(url, {
      headers: { Authorization: `Client-ID ${ACCESS_KEY}` },
    });
    if (!res.ok) throw new Error(`Unsplash HTTP ${res.status}`);
    const data = await res.json();
    const photo = data?.results?.[0];

    const result = photo
      ? {
        url: photo.urls?.regular,
        thumbUrl: photo.urls?.small,
        alt: photo.alt_description || query,
        credit: {
          name: photo.user?.name || 'Unsplash',
          link: photo.user?.links?.html || 'https://unsplash.com',
        },
      }
      : null;

    memCache.set(key, result);
    writeStorage(key, result);
    return result;
  } catch (err) {
    if (DEV) console.warn('[destinationImage] lookup failed:', err);
    memCache.set(key, null);
    return null;
  }
}
