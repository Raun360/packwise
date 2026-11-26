import { useEffect, useRef } from 'react';
import { ArrowUpRight } from 'lucide-react';
import DestinationImage from './DestinationImage.jsx';
import POPULAR_TRIP_IMAGES from '../data/popularTripImages.json';
import { trackAdViewed, track, EVENTS } from '../lib/analytics.js';

/**
 * A sponsored card. Always labelled. Reports `ad_viewed` once, when at least
 * half of it is actually on screen, and `ad_clicked` on the button — the two
 * numbers a partner will ask for.
 */
export default function AdCard({ ad, placement, preview = false }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    // A preview (the Advertise page's example) is not a real impression.
    if (preview || !el || typeof IntersectionObserver === 'undefined') return undefined;
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        trackAdViewed({ ad_unit: ad.id, placement });
        io.disconnect();
      }
    }, { threshold: 0.5 });
    io.observe(el);
    return () => io.disconnect();
  }, [ad.id, placement, preview]);

  const image = ad.imageId ? POPULAR_TRIP_IMAGES[ad.imageId] : null;

  return (
    <aside className="ad-card no-print" ref={ref} aria-label="Sponsored">
      {image && <DestinationImage image={image} className="ad-card-image" />}
      <div className="ad-card-body">
        <span className="ad-card-label">Sponsored · {ad.partner}</span>
        <h3 className="ad-card-title">{ad.title}</h3>
        <p className="ad-card-detail">{ad.detail}</p>
        {preview ? (
          <span className="btn btn-secondary btn-sm ad-card-cta" aria-hidden="true">
            {ad.cta}
            <ArrowUpRight size={14} aria-hidden="true" />
          </span>
        ) : (
          <a
            className="btn btn-secondary btn-sm ad-card-cta"
            href={ad.url}
            target="_blank"
            rel="sponsored noopener noreferrer"
            onClick={() => track(EVENTS.AD_CLICKED, { ad_unit: ad.id, placement })}
          >
            {ad.cta}
            <ArrowUpRight size={14} aria-hidden="true" />
          </a>
        )}
      </div>
    </aside>
  );
}
