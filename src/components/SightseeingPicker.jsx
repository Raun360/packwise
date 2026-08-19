import { X, MapPin, CornerDownRight, Mountain } from 'lucide-react';
import PlaceSearch from './PlaceSearch.jsx';
import { createStop, createTextStop, destinationsOf, poisFor } from '../data/trip.js';
import { PLACE_SUGGESTIONS } from '../data/activities.js';

/**
 * Places visited *from* a base.
 *
 * Each destination gets its own list, so it is always clear that Tsomgo Lake
 * is a day out from Gangtok rather than another stop on the route. That is the
 * difference between a trip with one transfer and a trip with three.
 */
export default function SightseeingPicker({ trip, onChange }) {
  const destinations = destinationsOf(trip);

  // Function-form patches: two sights added back to back (or an add and a
  // remove in quick succession) land in the same React batch, and reading
  // `trip.stops` from this closure for both would let the second overwrite
  // the first. Deriving from the trip the updater receives avoids that.
  const addPoi = (place, parentId) => {
    onChange((t) => ({
      stops: [...t.stops, createStop(place, { type: 'point_of_interest', parentId })],
    }));
  };

  const addSuggestion = (name, parentId) => {
    onChange((t) => {
      if (t.stops.some((s) => s.name.toLowerCase() === name.toLowerCase())) return {};
      return {
        stops: [...t.stops, createTextStop(name, { type: 'point_of_interest', parentId, kind: 'landmark' })],
      };
    });
  };

  const remove = (id) => onChange((t) => ({ stops: t.stops.filter((s) => s.id !== id) }));

  if (!destinations.length) {
    return <p className="empty-hint">Add a destination first and you can list what you'll see there.</p>;
  }

  return (
    <div className="sightseeing">
      {destinations.map((d) => {
        const pois = poisFor(trip, d.id);
        const key = d.profileId && PLACE_SUGGESTIONS[d.profileId] ? d.profileId : null;
        const suggestions = (key ? PLACE_SUGGESTIONS[key] : [])
          .filter((s) => !trip.stops.some((x) => x.name.toLowerCase() === s.toLowerCase()))
          .slice(0, 4);

        return (
          <section className="sight-group" key={d.id}>
            <header className="sight-head">
              <MapPin aria-hidden="true" />
              <div>
                <h4>What will you see around {d.name}?</h4>
                <p>Day trips and sights — these stay attached to {d.name}, not added to your route.</p>
              </div>
            </header>

            <PlaceSearch
              placeholder={`Search a place near ${d.name}…`}
              size="md"
              onSelect={(place) => addPoi(place, d.id)}
            />

            {pois.length > 0 && (
              <ul className="sight-list">
                {pois.map((p) => (
                  <li key={p.id} className="sight-tag">
                    <CornerDownRight aria-hidden="true" />
                    <span className="sight-tag-name">{p.name}</span>
                    {p.elevation != null && p.elevation >= 2500 && (
                      <span className="sight-tag-elev tnum">
                        <Mountain aria-hidden="true" />{p.elevation.toLocaleString()} m
                      </span>
                    )}
                    {p.permit && <span className="sight-tag-flag">Permit</span>}
                    <button type="button" onClick={() => remove(p.id)} aria-label={`Remove ${p.name}`}>
                      <X aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {suggestions.length > 0 && (
              <div className="chip-row">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    className="chip-suggest"
                    onClick={() => addSuggestion(s, d.id)}
                  >
                    + {s}
                  </button>
                ))}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
