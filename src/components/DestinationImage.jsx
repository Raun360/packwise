import { useState, useEffect } from 'react';
import { getDestinationImage } from '../lib/destinationImage.js';

/**
 * A photo for a place, with a plain gradient fallback — no key configured, no
 * match found, or the lookup failed all look the same to the traveller:
 * deliberate, not broken. `children` renders on top either way, so callers
 * can lay a label over the image without knowing whether it loaded.
 *
 * Pass `image` directly for a place from a fixed, known list (see
 * data/popularTripImages.json) to skip the live lookup entirely — Unsplash's
 * free tier is a shared 50 requests/hour across every visitor, and a landing
 * page rendering dozens of cards on every load would exhaust that on its own.
 * `query` is only used for the live per-trip lookup (results page, route
 * builder) where the place isn't known ahead of time.
 */
export default function DestinationImage({
  query, image: staticImage, className = '', children,
}) {
  const [fetched, setFetched] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setFetched(null);
    if (staticImage || !query) return undefined;
    getDestinationImage(query).then((result) => {
      if (!cancelled) setFetched(result);
    });
    return () => { cancelled = true; };
  }, [query, staticImage]);

  const img = staticImage || fetched;

  return (
    <div className={`dest-image${img ? '' : ' dest-image-empty'}${className ? ` ${className}` : ''}`}>
      {img && <img src={img.url} alt={img.alt} loading="lazy" decoding="async" />}
      <div className="dest-image-scrim" aria-hidden="true" />
      {children}
    </div>
  );
}
