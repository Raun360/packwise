import { useState, useEffect } from 'react';
import { getDestinationImage } from '../lib/destinationImage.js';

/**
 * A photo for a place, with a plain gradient fallback — no key configured, no
 * match found, or the lookup failed all look the same to the traveller:
 * deliberate, not broken. `children` renders on top either way, so callers
 * can lay a label over the image without knowing whether it loaded.
 */
export default function DestinationImage({ query, className = '', showCredit = false, children }) {
  const [img, setImg] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setImg(null);
    if (!query) return undefined;
    getDestinationImage(query).then((result) => {
      if (!cancelled) setImg(result);
    });
    return () => { cancelled = true; };
  }, [query]);

  return (
    <div className={`dest-image${img ? '' : ' dest-image-empty'}${className ? ` ${className}` : ''}`}>
      {img && <img src={img.url} alt={img.alt} loading="lazy" decoding="async" />}
      <div className="dest-image-scrim" aria-hidden="true" />
      {children}
      {img && showCredit && (
        <a
          className="dest-image-credit"
          href={`${img.credit.link}?utm_source=packwise&utm_medium=referral`}
          target="_blank"
          rel="noopener noreferrer"
        >
          Photo: {img.credit.name}
        </a>
      )}
    </div>
  );
}
