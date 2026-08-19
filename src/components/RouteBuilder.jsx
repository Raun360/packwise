import { MapPin, X, ChevronUp, ChevronDown, Home, CornerDownRight, Mountain } from 'lucide-react';
import PlaceSearch from './PlaceSearch.jsx';
import { createStop, destinationsOf, poisFor } from '../data/trip.js';
import { track, EVENTS } from '../lib/analytics.js';

/**
 * The route, shown as one connected journey.
 *
 * Destinations are places you sleep; the points of interest listed under each
 * one are visited from it. Keeping that distinction explicit is what stops
 * "Tsomgo Lake" from being treated as a fourth base with its own transfer.
 */
export default function RouteBuilder({ trip, onChange, showPois = false }) {
  const destinations = destinationsOf(trip);

  // Every mutation here derives its result from the trip passed into the
  // updater, not the `trip` prop closed over at render time. Two of these
  // firing in the same React batch — a quick add-then-reorder, or two remove
  // clicks in a row — would otherwise both compute from the same stale
  // `trip.stops`, and the second write would silently overwrite the first.
  //
  // The updaters stay pure — no track() inside them. React can invoke a
  // setState updater more than once for one call (StrictMode does this
  // deliberately in development), so a side effect placed inside either
  // double-fires or, read back from a closure variable right after the call,
  // never fires at all, since the updater doesn't run synchronously within
  // it. destination_count is instead read from the current `destinations`
  // computed at render time, before the change is queued.
  const addDestination = (place) => {
    track(EVENTS.DESTINATION_ADDED, {
      destination_count: destinations.length + 1,
      destination_kind: place.kind || 'unknown',
      destination_source: place.source || 'unknown',
    });
    onChange((t) => ({ stops: [...t.stops, createStop(place, { type: 'destination' })] }));
  };

  const remove = (id) => {
    onChange((t) => ({ stops: t.stops.filter((s) => s.id !== id && s.parentId !== id) }));
  };

  const move = (id, direction) => {
    onChange((t) => {
      const dests = destinationsOf(t);
      const order = dests.map((d) => d.id);
      const idx = order.indexOf(id);
      const target = idx + direction;
      if (idx < 0 || target < 0 || target >= order.length) return {};
      [order[idx], order[target]] = [order[target], order[idx]];

      const rebuilt = [];
      for (const destId of order) {
        rebuilt.push(t.stops.find((s) => s.id === destId));
        rebuilt.push(...poisFor(t, destId));
      }
      const placed = new Set(rebuilt.map((s) => s.id));
      rebuilt.push(...t.stops.filter((s) => !placed.has(s.id)));
      return { stops: rebuilt };
    });
  };

  return (
    <div className="route-builder">
      <ol className="route-list">
        {trip.origin && (
          <li className="route-node origin">
            <span className="route-dot" aria-hidden="true"><Home /></span>
            <div className="route-node-body">
              <span className="route-node-name">{trip.origin.name}</span>
              <span className="route-node-sub">Starting point</span>
            </div>
          </li>
        )}

        {destinations.map((d, i) => {
          const pois = poisFor(trip, d.id);
          return (
            <li className="route-node" key={d.id}>
              <span className="route-dot" aria-hidden="true"><MapPin /></span>
              <div className="route-node-body">
                <span className="route-node-name">{d.name}</span>
                <span className="route-node-sub">
                  {[d.region, d.country].filter(Boolean).join(', ')}
                  {d.elevation != null && d.elevation >= 800 && (
                    <span className="route-node-elev tnum">
                      <Mountain aria-hidden="true" />{d.elevation.toLocaleString()} m
                    </span>
                  )}
                </span>

                {showPois && pois.length > 0 && (
                  <ul className="route-poi-list">
                    {pois.map((p) => (
                      <li key={p.id} className="route-poi">
                        <CornerDownRight aria-hidden="true" />
                        <span>{p.name}</span>
                        {p.elevation != null && p.elevation >= 2500 && (
                          <span className="route-poi-elev tnum">{p.elevation.toLocaleString()} m</span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="route-node-actions">
                <button
                  type="button"
                  className="route-icon-btn"
                  onClick={() => move(d.id, -1)}
                  disabled={i === 0}
                  aria-label={`Move ${d.name} earlier`}
                >
                  <ChevronUp aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className="route-icon-btn"
                  onClick={() => move(d.id, 1)}
                  disabled={i === destinations.length - 1}
                  aria-label={`Move ${d.name} later`}
                >
                  <ChevronDown aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className="route-icon-btn danger"
                  onClick={() => remove(d.id)}
                  aria-label={`Remove ${d.name}`}
                >
                  <X aria-hidden="true" />
                </button>
              </div>
            </li>
          );
        })}

        {trip.origin && trip.returnToOrigin && destinations.length > 0 && (
          <li className="route-node origin muted-node">
            <span className="route-dot" aria-hidden="true"><Home /></span>
            <div className="route-node-body">
              <span className="route-node-name">{trip.origin.name}</span>
              <span className="route-node-sub">Back home</span>
            </div>
          </li>
        )}
      </ol>

      <div className="route-add">
        <PlaceSearch
          placeholder="Add another destination…"
          icon="pin"
          size="md"
          onSelect={addDestination}
        />
        <p className="xs muted" style={{ marginTop: 'var(--s-3)' }}>
          Add the places you'll actually stay. Day trips and sights come next —
          they don't need to be listed here.
        </p>
      </div>
    </div>
  );
}
