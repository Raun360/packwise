import { useState, useEffect, useCallback, useRef } from 'react';
import {
  ArrowRight, Sparkles, Lock, HelpCircle, Route as RouteIcon,
  Feather, X, Minus, Repeat, Check, Mountain, Plane, Waypoints,
} from 'lucide-react';
import { buildPlan } from '../engine/plan.js';
import { optimise } from '../engine/optimize.js';
import { createEmptyTrip, createStop } from '../data/trip.js';
import { searchPlaces } from '../engine/geocode.js';
import { getRouteClimate } from '../engine/weather.js';
import { monthsSpanned } from '../engine/context.js';
import { POPULAR_TRIPS } from '../data/popularTrips.js';
import POPULAR_TRIP_IMAGES from '../data/popularTripImages.json';
import DestinationImage from '../components/DestinationImage.jsx';

/** Next occurrence of a month/day pair, so examples never read as past trips. */
function nextDates(month, day, nights) {
  const now = new Date();
  let year = now.getFullYear();
  if (now.getMonth() > month - 1) year += 1;
  const start = new Date(Date.UTC(year, month - 1, day));
  const end = new Date(start.getTime() + nights * 86400000);
  return { startDate: start.toISOString().slice(0, 10), endDate: end.toISOString().slice(0, 10) };
}

/**
 * Three journeys chosen to be genuinely unalike: a high-altitude domestic
 * run, an international tropical one, and a multi-stop route. Each builds a
 * real plan — the differences on screen are the engine's actual output.
 */
export const EXAMPLES = [
  {
    id: 'ladakh',
    tab: 'Delhi → Ladakh',
    kind: 'Domestic',
    icon: Mountain,
    origin: 'Delhi',
    destinations: ['Leh'],
    pois: { Leh: ['Khardung La'] },
    activities: ['roadtrip', 'sightseeing', 'hiking'],
    dates: nextDates(9, 12, 6),
    blurb: 'High-altitude cold desert',
  },
  {
    id: 'bali',
    tab: 'Mumbai → Bali',
    kind: 'International',
    icon: Plane,
    origin: 'Mumbai',
    destinations: ['Bali'],
    pois: { Bali: ['Ubud'] },
    activities: ['beach', 'sightseeing', 'food'],
    dates: nextDates(7, 10, 7),
    blurb: 'Tropical, humid, international',
  },
  {
    id: 'sikkim',
    tab: 'Kolkata → Sikkim',
    kind: 'Multi-stop',
    icon: Waypoints,
    origin: 'Kolkata',
    destinations: ['Darjeeling', 'Pelling', 'Gangtok'],
    pois: { Gangtok: ['Tsomgo Lake', 'Nathula Pass'] },
    activities: ['sightseeing', 'photography', 'food'],
    dates: nextDates(12, 12, 5),
    blurb: 'Three bases, two transfers',
  },
];

/** The multi-stop journey is what "See how it works" loads into the planner. */
export const DEMO_ROUTE = EXAMPLES[2];

/** Build a trip from an example spec, using real geocoded places. */
export async function buildExampleTrip(spec) {
  const trip = {
    ...createEmptyTrip(),
    ...spec.dates,
    activities: [...spec.activities],
  };
  const first = async (q) => (await searchPlaces(q)).results[0];

  const originPlace = await first(spec.origin);
  if (originPlace) trip.origin = createStop(originPlace, { type: 'destination' });

  for (const name of spec.destinations) {
    const place = await first(name);
    if (!place) continue;
    const stop = createStop(place, { type: 'destination' });
    trip.stops.push(stop);
    for (const poiName of spec.pois?.[name] || []) {
      const poi = await first(poiName);
      if (poi) trip.stops.push(createStop(poi, { type: 'point_of_interest', parentId: stop.id }));
    }
  }
  return trip;
}

export const buildDemoTrip = () => buildExampleTrip(DEMO_ROUTE);

const STEPS = [
  {
    n: '01',
    title: 'Add every stop',
    body: 'Search each place you’ll sleep. We look up its real coordinates and elevation, so a village at 3,800 m is never mistaken for a city at sea level. Day trips get listed separately — they shape the list without becoming another transfer.',
  },
  {
    n: '02',
    title: 'Set your dates and plans',
    body: 'Pick when you’re travelling and what you intend to do. We read the conditions actually recorded at every stop on those dates, then work out the distance, the transfers and how far the ground rises between them.',
  },
  {
    n: '03',
    title: 'Pack from the list',
    body: 'Categorised, prioritised, sized to your days — with a plain answer to “why is this here?” on every item. Tick things off as they go in the bag; it remembers where you got to.',
  },
];

/** Path the creator photo is served from. Drop the file at public/creator.jpg. */
const CREATOR_PHOTO = '/creator.jpg';

/**
 * Avatar with a monogram fallback, so a missing or broken image degrades to
 * something deliberate rather than a broken-image icon.
 */
function CreatorAvatar() {
  const [failed, setFailed] = useState(false);
  if (failed) return <span className="maker-avatar is-fallback" aria-hidden="true">R</span>;
  return (
    <img
      className="maker-avatar"
      src={CREATOR_PHOTO}
      alt="Raunak, the creator of Packwise"
      width="56"
      height="56"
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
}

export default function Landing({ onStart, onDemo, onExampleTrip, onAdvertise }) {
  const [active, setActive] = useState(0);
  const [plans, setPlans] = useState({});
  const loading = useRef(new Set());

  /** Examples load on demand so the page does not fetch three trips at once. */
  const load = useCallback(async (idx) => {
    const spec = EXAMPLES[idx];
    if (plans[spec.id] || loading.current.has(spec.id)) return;
    loading.current.add(spec.id);
    try {
      const trip = await buildExampleTrip(spec);
      const months = monthsSpanned(trip.startDate, trip.endDate);
      const stops = [trip.origin, ...trip.stops].filter(Boolean);
      const climates = await getRouteClimate(stops, trip.startDate, trip.endDate, months);
      const plan = buildPlan(trip, climates);
      setPlans((p) => ({ ...p, [spec.id]: { plan, report: optimise(plan) } }));
    } catch {
      /* the page works without it */
    } finally {
      loading.current.delete(spec.id);
    }
  }, [plans]);

  useEffect(() => { load(active); }, [active, load]);

  const spec = EXAMPLES[active];
  const current = plans[spec.id];
  const plan = current?.plan;
  const report = current?.report;

  const pick = (catId, n) =>
    plan?.categories.find((c) => c.id === catId)?.items.slice(0, n) || [];
  const hasRoute = pick('route', 1).length > 0;
  const headline = hasRoute ? pick('route', 3) : pick('destination', 3);
  const secondary = hasRoute ? pick('destination', 2) : pick('clothing', 2);
  const headlineLabel = hasRoute ? 'Based on your route' : 'Destination-specific';
  const secondaryLabel = hasRoute ? 'Destination-specific' : 'Clothing';
  const why = headline.find((i) => i.reason)?.reason;

  return (
    <>
      {/* ---------------------------- Hero ---------------------------- */}
      <section className="hero">
        <div className="shell">
          <div className="hero-grid">
            <div>
              <span className="hero-tag">
                <Sparkles aria-hidden="true" />
                Built around your whole route, not one destination
              </span>

              <h1 className="display">
                Pack smarter.<br />Travel <em>lighter.</em>
              </h1>

              <p className="lede hero-lede">
                Tell us every stop on your trip, what you're doing and how long you're staying.
                We'll work out the distance, the altitude and the conditions at each one — then
                build a packing list for that journey, and explain every recommendation.
              </p>

              <div className="hero-cta">
                <button className="btn btn-primary btn-lg" onClick={onStart}>
                  Plan my packing
                  <ArrowRight size={16} aria-hidden="true" />
                </button>
                <button className="btn btn-secondary btn-lg" onClick={onDemo}>
                  See how it works
                </button>
              </div>

              <p className="hero-note">
                <Lock aria-hidden="true" />
                No account, no email. Everything stays on your device.
              </p>
            </div>

            {/* ---- Live examples ---- */}
            <div>
              <div className="ex-tabs" role="tablist" aria-label="Example trips">
                {EXAMPLES.map((e, i) => {
                  const Icon = e.icon;
                  return (
                    <button
                      key={e.id}
                      role="tab"
                      aria-selected={i === active}
                      className="ex-tab"
                      onClick={() => setActive(i)}
                    >
                      <Icon aria-hidden="true" />
                      <span className="ex-tab-label">{e.tab}</span>
                      <span className="ex-tab-kind">{e.kind}</span>
                    </button>
                  );
                })}
              </div>

              <div className="preview" aria-live="polite">
                <DestinationImage
                  key={spec.id}
                  query={spec.destinations[0]}
                  className="preview-image"
                />
                <div className="preview-top">
                  <span className="preview-route">
                    <RouteIcon aria-hidden="true" />
                    {plan ? plan.ctx.routeLabel : spec.tab}
                  </span>
                  {plan && (
                    <span className="preview-meta tnum">
                      {plan.ctx.days}d · {plan.stats.total} items
                    </span>
                  )}
                </div>

                <div className="preview-body">
                  {plan ? (
                    <>
                      <div className="preview-cat">
                        <div className="preview-cat-label">{headlineLabel}</div>
                        {headline.map((i, idx) => (
                          <div key={i.id} className={`preview-row${idx === 0 ? ' done' : ''}`}>
                            <span className="preview-box" aria-hidden="true" />
                            <span className="preview-name">{i.name}</span>
                            <span className="preview-qty">{i.quantity > 1 ? `×${i.quantity}` : ''}</span>
                          </div>
                        ))}
                        {why && (
                          <div className="preview-why">
                            <HelpCircle aria-hidden="true" />
                            <span>{why}</span>
                          </div>
                        )}
                      </div>

                      {secondary.length > 0 && (
                        <div className="preview-cat">
                          <div className="preview-cat-label">{secondaryLabel}</div>
                          {secondary.map((i) => (
                            <div key={i.id} className="preview-row">
                              <span className="preview-box" aria-hidden="true" />
                              <span className="preview-name">{i.name}</span>
                              <span className="preview-qty">{i.quantity > 1 ? `×${i.quantity}` : ''}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="preview-loading" aria-hidden="true">
                      {[0, 1, 2, 3, 4].map((i) => <span key={i} className="skeleton-row" />)}
                    </div>
                  )}
                </div>
              </div>

              <p className="ex-note">
                {plan
                  ? `${spec.blurb} — generated just now, not a mock-up.`
                  : 'Building this example…'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------- Popular trips ------------------------- */}
      <section className="popular-section" id="popular" aria-labelledby="popular-h">
        <div className="shell">
          <div className="section-head">
            <span className="eyebrow">Popular trips</span>
            <h2 className="h1" id="popular-h" style={{ maxWidth: '20ch' }}>
              Already know where you're going?
            </h2>
          </div>

          <div className="popular-grid">
            {POPULAR_TRIPS.map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  type="button"
                  className="popular-card"
                  onClick={() => onExampleTrip(t)}
                >
                  <DestinationImage
                    image={POPULAR_TRIP_IMAGES[t.id]}
                    className="popular-card-image"
                  >
                    <span className="popular-card-tag">
                      <Icon aria-hidden="true" />
                      {t.name}
                    </span>
                  </DestinationImage>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ------------------------- How to use ------------------------- */}
      <section className="how" id="how" aria-labelledby="how-h">
        <div className="shell">
          <div className="section-head">
            <span className="eyebrow">How to use it</span>
            <h2 className="h1" id="how-h" style={{ maxWidth: '18ch' }}>
              Three questions. One list that fits.
            </h2>
          </div>

          <div className="how-grid">
            {STEPS.map((s) => (
              <div className="how-step" key={s.n}>
                <span className="how-step-n">{s.n}</span>
                <h3>{s.title}</h3>
                <p>{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------- Pack light ------------------------- */}
      <section className="packlight-section" id="pack-light" aria-labelledby="pl-h">
        <div className="shell">
          <div className="pl-grid">
            <div className="pl-copy">
              <span className="pl-eyebrow">
                <Feather aria-hidden="true" />Pack light
              </span>
              <h2 className="h1" id="pl-h">
                Everything you'd carry, minus what you wouldn't miss.
              </h2>
              <p className="pl-lede">
                One tap re-plans the whole list at its leanest, then tells you exactly what
                changed and why. It never touches an essential — it drops what isn't earning
                its space, cuts quantities back to what you'll really wear, and merges the
                things that quietly do each other's job.
              </p>

              <div className="pl-cta">
                <button className="btn btn-lg pl-btn" onClick={onDemo}>
                  Try it on an example trip
                  <ArrowRight size={16} aria-hidden="true" />
                </button>
              </div>
            </div>

            <div className="pl-panel">
              {report ? (
                <>
                  <div className="pl-compare">
                    <div className="pl-col">
                      <span className="pl-lbl">Full list</span>
                      <span className="pl-val tnum">{report.before.total}</span>
                      <span className="pl-sub tnum">{report.before.weight.toFixed(1)} kg</span>
                    </div>
                    <ArrowRight className="pl-arrow" aria-hidden="true" />
                    <div className="pl-col hi">
                      <span className="pl-lbl">Packed light</span>
                      <span className="pl-val tnum">{report.after.total}</span>
                      <span className="pl-sub tnum">{report.after.weight.toFixed(1)} kg</span>
                    </div>
                  </div>

                  <p className="pl-saving tnum">
                    {report.savedWeight.toFixed(1)} kg lighter · {report.savedItems} fewer things to carry
                  </p>

                  <ul className="pl-changes">
                    {report.removed.slice(0, 1).map((x) => (
                      <li key={x.id}>
                        <X className="rm" aria-hidden="true" />
                        <span><b>Removed</b> {x.name} — {x.why.toLowerCase()}</span>
                      </li>
                    ))}
                    {report.reduced.slice(0, 1).map((x) => (
                      <li key={x.id}>
                        <Minus className="rm" aria-hidden="true" />
                        <span><b>Cut back</b> {x.name}, {x.from} → {x.to}</span>
                      </li>
                    ))}
                    {report.combined.slice(0, 1).map((x) => (
                      <li key={x.label}>
                        <Repeat className="mg" aria-hidden="true" />
                        <span><b>Combined</b> {x.label.toLowerCase()}</span>
                      </li>
                    ))}
                    {report.kept.slice(0, 1).map((x) => (
                      <li key={x.id}>
                        <Check className="kp" aria-hidden="true" />
                        <span><b>Kept</b> {x.name}, and every other essential</span>
                      </li>
                    ))}
                  </ul>

                  <p className="pl-foot">
                    Real figures from the {spec.tab} example above — switch it and these change.
                  </p>
                </>
              ) : (
                <div className="preview-loading" aria-hidden="true">
                  {[0, 1, 2, 3, 4, 5].map((i) => <span key={i} className="skeleton-row dark" />)}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="shell">
        <footer className="site-footer">
          <div className="footer-top">
            <div className="footer-brand">
              <img className="footer-logo" src="/logo.png" alt="Packwise" width="141" height="32" loading="lazy" decoding="async" />
              <p>
                Packing lists built around your whole route — every stop, how high it sits and
                the weather on your dates.
              </p>
              <div className="footer-social">
                <a href="https://x.com/Skirook" target="_blank" rel="noopener noreferrer" aria-label="Packwise creator on X">
                  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </a>
                <a href="https://www.linkedin.com/in/raunak360" target="_blank" rel="noopener noreferrer" aria-label="Packwise creator on LinkedIn">
                  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05a3.74 3.74 0 0 1 3.37-1.85c3.6 0 4.27 2.37 4.27 5.46zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13M7.12 20.45H3.56V9h3.56zM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0" />
                  </svg>
                </a>
              </div>
            </div>

            <nav className="footer-col" aria-label="Product">
              <h2 className="footer-heading">Product</h2>
              <button type="button" onClick={onStart}>Plan a trip</button>
              <a href="#popular">Popular trips</a>
              <a href="#how">How it works</a>
              <a href="#pack-light">Pack light</a>
            </nav>

            <nav className="footer-col" aria-label="For business">
              <h2 className="footer-heading">For business</h2>
              <button type="button" onClick={onAdvertise}>Advertise on Packwise</button>
            </nav>

            <div className="footer-col">
              <h2 className="footer-heading">Made by</h2>
              <div className="maker-identity">
                <CreatorAvatar />
                <p className="maker-name">Raunak</p>
              </div>
              <p className="footer-note">A traveller who got tired of packing lists that ignore where you&apos;re going.</p>
            </div>
          </div>

          <div className="footer-bottom">
            <span>© {new Date().getFullYear()} Packwise</span>
            <span>Places and weather from Open-Meteo · Photos from Unsplash</span>
          </div>
        </footer>
      </div>
    </>
  );
}
