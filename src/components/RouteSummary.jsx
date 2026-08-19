import { useState } from 'react';
import {
  Home, MapPin, ChevronDown, Mountain, Moon, Thermometer, CloudRain,
  CornerDownRight, Gauge, Route as RouteIcon, Milestone,
} from 'lucide-react';
import { ACTIVITY_MAP } from '../data/activities.js';

const INTENSITY_CLASS = { low: 'low', moderate: 'mod', high: 'high' };

/**
 * The route on the results page — compact, and expandable one stop at a time.
 * Deliberately not a map: the traveller needs to see that the whole journey
 * was understood, not to navigate it.
 */
export default function RouteSummary({ ctx }) {
  const { route } = ctx;
  const [openId, setOpenId] = useState(null);

  const climateFor = (stopId) => ctx.climateByStop?.get(stopId);

  return (
    <div className="card route-card">
      <div className="eyebrow" style={{ marginBottom: 'var(--s-4)' }}>Your route</div>

      <ol className="route-list compact">
        {ctx.trip.origin && (
          <li className="route-node origin">
            <span className="route-dot" aria-hidden="true"><Home /></span>
            <div className="route-node-body">
              <span className="route-node-name">{ctx.trip.origin.name}</span>
              <span className="route-node-sub">Starting point</span>
            </div>
          </li>
        )}

        {route.destinations.map((d) => {
          const open = openId === d.id;
          const climate = climateFor(d.id);
          const activities = (d.activities || []).map((a) => ACTIVITY_MAP[a]?.label).filter(Boolean);

          return (
            <li className={`route-node clickable${open ? ' open' : ''}`} key={d.id}>
              <span className="route-dot" aria-hidden="true"><MapPin /></span>
              <div className="route-node-body">
                <button
                  type="button"
                  className="route-node-trigger"
                  aria-expanded={open}
                  onClick={() => setOpenId(open ? null : d.id)}
                >
                  <span className="route-node-name">{d.name}</span>
                  <span className="route-node-sub">
                    {d.nights > 0 && `${d.nights} ${d.nights === 1 ? 'night' : 'nights'}`}
                    {d.elevation != null && d.elevation >= 800 && (
                      <span className="route-node-elev tnum">
                        <Mountain aria-hidden="true" />{d.elevation.toLocaleString()} m
                      </span>
                    )}
                    {d.pois.length > 0 && (
                      <span className="route-node-poi-count">
                        {d.pois.length} {d.pois.length === 1 ? 'sight' : 'sights'}
                      </span>
                    )}
                  </span>
                  <ChevronDown className="route-node-chev" aria-hidden="true" />
                </button>

                {open && (
                  <div className="route-detail">
                    <dl className="route-detail-grid">
                      {[d.region, d.country].filter(Boolean).length > 0 && (
                        <div>
                          <dt>Location</dt>
                          <dd>{[d.region, d.country].filter(Boolean).join(', ')}</dd>
                        </div>
                      )}
                      {d.elevation != null && (
                        <div>
                          <dt><Mountain aria-hidden="true" />Elevation</dt>
                          <dd className="tnum">{d.elevation.toLocaleString()} m</dd>
                        </div>
                      )}
                      <div>
                        <dt><Moon aria-hidden="true" />Stay</dt>
                        <dd>{d.nights} {d.nights === 1 ? 'night' : 'nights'}</dd>
                      </div>
                      {climate && (
                        <div>
                          <dt><Thermometer aria-hidden="true" />Conditions</dt>
                          <dd className="tnum">
                            {Math.round(climate.tempMin)}° to {Math.round(climate.tempMax)}°C
                          </dd>
                        </div>
                      )}
                      {climate?.precipMmPerDay != null && (
                        <div>
                          <dt><CloudRain aria-hidden="true" />Rain</dt>
                          <dd className="tnum">
                            {climate.precipMmPerDay < 0.6
                              ? 'Dry'
                              : `~${climate.precipMmPerDay} mm/day`}
                          </dd>
                        </div>
                      )}
                      {climate?.environment && (
                        <div>
                          <dt>Environment</dt>
                          <dd>{climate.environment.label}</dd>
                        </div>
                      )}
                    </dl>

                    {d.pois.length > 0 && (
                      <ul className="route-poi-list">
                        {d.pois.map((p) => (
                          <li key={p.id} className="route-poi">
                            <CornerDownRight aria-hidden="true" />
                            <span>{p.name}</span>
                            {p.elevation != null && p.elevation >= 2500 && (
                              <span className="route-poi-elev tnum">
                                {p.elevation.toLocaleString()} m
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}

                    {activities.length > 0 && (
                      <p className="route-detail-note">{activities.join(' · ')}</p>
                    )}
                  </div>
                )}
              </div>
            </li>
          );
        })}

        {ctx.trip.origin && ctx.trip.returnToOrigin && route.destinationCount > 0 && (
          <li className="route-node origin muted-node">
            <span className="route-dot" aria-hidden="true"><Home /></span>
            <div className="route-node-body">
              <span className="route-node-name">{ctx.trip.origin.name}</span>
              <span className="route-node-sub">Back home</span>
            </div>
          </li>
        )}
      </ol>

      <div className="route-facts">
        <div className="route-fact">
          <RouteIcon aria-hidden="true" />
          <span>
            <b className="tnum">{route.destinationCount}</b>{' '}
            {route.destinationCount === 1 ? 'destination' : 'destinations'}
          </span>
        </div>
        {route.totalKm && (
          <div className="route-fact">
            <Milestone aria-hidden="true" />
            <span>~<b className="tnum">{route.totalKm.toLocaleString()}</b> km</span>
          </div>
        )}
        {route.elevationRange >= 300 && (
          <div className="route-fact">
            <Mountain aria-hidden="true" />
            <span className="tnum">
              {route.minElevation.toLocaleString()}–{route.maxElevation.toLocaleString()} m
            </span>
          </div>
        )}
        <div className={`route-fact intensity ${INTENSITY_CLASS[route.intensity.id]}`}>
          <Gauge aria-hidden="true" />
          <span><b>{route.intensity.label}</b> travel intensity</span>
        </div>
      </div>
    </div>
  );
}
