import { useState, useEffect, useCallback, useRef } from 'react';
import { Check } from 'lucide-react';
import Landing, { buildDemoTrip } from './screens/Landing.jsx';
import Planner from './screens/Planner.jsx';
import Results from './screens/Results.jsx';
import PlanningLoader from './components/PlanningLoader.jsx';
import { buildPlan, rebuild } from './engine/plan.js';
import { getRouteClimate } from './engine/weather.js';
import { monthsSpanned } from './engine/context.js';
import { createEmptyTrip, migrateTrip, destinationsOf } from './data/trip.js';
import { track, EVENTS } from './lib/analytics.js';

const STORAGE_KEY = 'packwise:v1';

function loadSaved() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    // Saved V1 trips carried a single destination string; bring them forward.
    const trip = migrateTrip(data?.trip);
    if (!trip || !destinationsOf(trip).length) return null;
    return { ...data, trip };
  } catch {
    return null;
  }
}

export default function App() {
  const [view, setView] = useState('landing'); // landing | planner | loading | results
  const [trip, setTrip] = useState(createEmptyTrip);
  const [plan, setPlan] = useState(null);
  const [toast, setToast] = useState('');
  const [stuck, setStuck] = useState(false);
  const [loaderDone, setLoaderDone] = useState(false);
  const [prefilled, setPrefilled] = useState(false);
  const weatherRef = useRef(null);
  // Tracks which plan (by its generatedAt stamp) has already fired trip_saved,
  // so the persist effect — which also runs on every checkbox toggle and Pack
  // Light apply — reports a save once per plan rather than once per click.
  const savedPlanRef = useRef(null);

  /* ---- Restore an in-progress list ---- */
  useEffect(() => {
    const saved = loadSaved();
    if (!saved) return;
    try {
      const fresh = buildPlan(saved.trip, saved.climates || null);
      const packedIds = new Set(saved.packed || []);
      const items = fresh.items.map((i) => ({ ...i, packed: packedIds.has(i.id) }));
      weatherRef.current = saved.climates || null;
      setTrip(saved.trip);
      setPlan(rebuild(fresh, items));
      setView('results');
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  /* ---- Leave the planning screen only once both the animation has finished
          and the plan actually exists. Weather may still be in flight. ---- */
  useEffect(() => {
    if (view !== 'loading' || !loaderDone || !plan) return;
    setView('results');
    setLoaderDone(false);
    window.scrollTo(0, 0);
  }, [view, loaderDone, plan]);

  /* ---- Persist progress ---- */
  useEffect(() => {
    if (!plan || view !== 'results') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        trip,
        climates: weatherRef.current,
        packed: plan.items.filter((i) => i.packed).map((i) => i.id),
      }));
      // This effect re-runs on every checkbox toggle and Pack Light apply —
      // both call rebuild(), which keeps the original generatedAt. Only a
      // freshly generated plan gets a new one, so this fires trip_saved once
      // per plan rather than once per interaction.
      if (plan.generatedAt && savedPlanRef.current !== plan.generatedAt) {
        savedPlanRef.current = plan.generatedAt;
        track(EVENTS.TRIP_SAVED, {
          destination_count: plan.ctx.route.destinationCount,
          trip_days: plan.ctx.days,
        });
      }
    } catch { /* storage may be unavailable — progress is still fine in memory */ }
  }, [plan, trip, view]);

  /* ---- Sticky header shadow ---- */
  useEffect(() => {
    const onScroll = () => setStuck(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const showToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2800);
  }, []);

  // `patch` may be a plain object, or a function of the previous trip. The
  // function form matters when a caller derives the patch from trip state
  // (e.g. toggling one activity into the existing list): reading `trip` from
  // a closure goes stale if two such updates land in the same React batch —
  // a normal outcome of two quick clicks — silently dropping one of them.
  // Deriving inside the updater reads the real, just-committed state instead.
  const updateTrip = useCallback((patch) => {
    setTrip((t) => ({ ...t, ...(typeof patch === 'function' ? patch(t) : patch) }));
  }, []);

  /* ---- Generate ---- */
  const generate = useCallback(async () => {
    setPlan(null);
    setLoaderDone(false);
    setView('loading');
    // Read conditions at every stop alongside the planning animation. If the
    // network is slow or unavailable the plan still builds — from curated
    // normals, or from elevation and latitude as a last resort.
    const months = monthsSpanned(trip.startDate, trip.endDate);
    const stops = [trip.origin, ...trip.stops].filter(Boolean);
    let climates = null;
    try {
      climates = await getRouteClimate(stops, trip.startDate, trip.endDate, months);
    } catch {
      climates = null;
    }
    weatherRef.current = climates;
    const built = buildPlan(trip, climates);
    setPlan(built);
    track(EVENTS.PACKING_PLAN_GENERATED, {
      destination_count: built.ctx.route.destinationCount,
      trip_days: built.ctx.days,
      activity_count: built.ctx.activities.length,
      travel_intensity: built.ctx.intensity,
    });
  }, [trip]);

  const startFresh = () => {
    setTrip(createEmptyTrip());
    setPlan(null);
    setPrefilled(false);
    setView('planner');
    window.scrollTo(0, 0);
    track(EVENTS.TRIP_STARTED, { entry_point: 'fresh' });
  };

  const startDemo = async () => {
    setPrefilled(true);
    setView('planner');
    window.scrollTo(0, 0);
    track(EVENTS.TRIP_STARTED, { entry_point: 'demo' });
    // Built from real geocoded places, so the example carries genuine
    // coordinates and elevations rather than bare strings.
    try {
      setTrip(await buildDemoTrip());
    } catch {
      setTrip(createEmptyTrip());
    }
  };

  const goHome = () => {
    setView(plan ? 'results' : 'landing');
    window.scrollTo(0, 0);
  };

  const restart = () => {
    localStorage.removeItem(STORAGE_KEY);
    setTrip(createEmptyTrip());
    setPlan(null);
    setPrefilled(false);
    setView('planner');
    window.scrollTo(0, 0);
    savedPlanRef.current = null;
    track(EVENTS.TRIP_STARTED, { entry_point: 'restart' });
  };

  return (
    <>
      <a className="sr-only" href="#main">Skip to content</a>

      <header className={`site-header no-print${stuck ? ' is-stuck' : ''}`}>
        <div className="inner">
          <button
            className="brand"
            onClick={() => { setView(plan ? 'results' : 'landing'); window.scrollTo(0, 0); }}
            aria-label="Packwise home"
          >
            <img
              className="brand-logo"
              src="/logo.png"
              alt="Packwise"
              width="141"
              height="32"
              decoding="async"
            />
          </button>

          <div className="header-actions">
            {view === 'landing' && (
              <button className="btn btn-primary btn-sm" onClick={startFresh}>
                Plan my packing
              </button>
            )}
            {view === 'results' && (
              <button className="btn btn-secondary btn-sm" onClick={restart}>
                New trip
              </button>
            )}
            {view === 'planner' && plan && (
              <button className="btn btn-ghost btn-sm" onClick={goHome}>
                Back to my list
              </button>
            )}
          </div>
        </div>
      </header>

      <main id="main">
        {view === 'landing' && <Landing onStart={startFresh} onDemo={startDemo} />}

        {view === 'planner' && (
          <Planner
            trip={trip}
            onChange={updateTrip}
            onSubmit={generate}
            onExit={goHome}
            prefilled={prefilled}
          />
        )}

        {view === 'loading' && (
          <PlanningLoader trip={trip} onDone={() => setLoaderDone(true)} />
        )}

        {view === 'results' && plan && (
          <Results
            plan={plan}
            setPlan={setPlan}
            onEdit={() => { setView('planner'); window.scrollTo(0, 0); }}
            onRestart={restart}
            onToast={showToast}
          />
        )}
      </main>

      {toast && (
        <div className="toast" role="status">
          <Check aria-hidden="true" />{toast}
        </div>
      )}
    </>
  );
}
