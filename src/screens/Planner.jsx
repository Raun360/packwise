import { useState, useEffect, useRef } from 'react';
import {
  ArrowRight, ArrowLeft, AlertCircle, Wand2, MapPin, Navigation, Info,
} from 'lucide-react';
import PlaceSearch from '../components/PlaceSearch.jsx';
import RouteBuilder from '../components/RouteBuilder.jsx';
import SightseeingPicker from '../components/SightseeingPicker.jsx';
import DateSelector from '../components/DateSelector.jsx';
import ActivitySelector from '../components/ActivitySelector.jsx';
import TravelPreferenceSelector from '../components/TravelPreferenceSelector.jsx';
import { createStop, destinationsOf } from '../data/trip.js';
import { dayCount } from '../engine/context.js';
import { track, EVENTS } from '../lib/analytics.js';

const TOTAL_STEPS = 5;

const STEP_META = [
  {
    title: 'Where are you going?',
    sub: 'Tell us where your adventure starts and where you’re headed.',
  },
  {
    title: 'How long are you staying?',
    sub: 'Quantities are sized to the number of days, so this matters more than it looks.',
  },
  {
    title: 'Where else are you going?',
    sub: 'Add the other stops on your trip so we can understand the whole journey.',
  },
  {
    title: 'What are you planning to do?',
    sub: 'Your activities and the places you’ll see help us build a smarter list.',
  },
  {
    title: 'How do you like to travel?',
    sub: 'The same trip looks different depending on how much margin you want.',
  },
];

/** Compact display of a place the traveller has already chosen. */
function ChosenPlace({ stop, label, icon: Icon, onClear }) {
  return (
    <div className="chosen-place">
      <Icon aria-hidden="true" />
      <span className="chosen-place-body">
        <span className="chosen-place-name">{stop.name}</span>
        <span className="chosen-place-sub">
          {[stop.region, stop.country].filter(Boolean).join(', ') || label}
          {stop.elevation != null && stop.elevation >= 800 && ` · ${stop.elevation.toLocaleString()} m`}
        </span>
      </span>
      <button type="button" onClick={onClear}>Change</button>
    </div>
  );
}

export default function Planner({ trip, onChange, onSubmit, onExit, prefilled = false }) {
  const [step, setStep] = useState(0);
  const [noteDismissed, setNoteDismissed] = useState(false);
  const [error, setError] = useState('');
  const headingRef = useRef(null);
  const firstRender = useRef(true);

  // Move focus to the new question so the flow works by keyboard and screen reader.
  useEffect(() => {
    if (firstRender.current) { firstRender.current = false; return; }
    headingRef.current?.focus();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step]);

  const set = (patch) => { onChange(patch); setError(''); };
  const destinations = destinationsOf(trip);

  const validate = () => {
    if (step === 0) {
      if (!destinations.length) return 'Search for where you’re going and pick it from the list.';
      return '';
    }
    if (step === 1) {
      if (!trip.startDate || !trip.endDate) return 'Pick both dates so we can size quantities.';
      const d = dayCount(trip.startDate, trip.endDate);
      if (d < 1) return 'Your return date needs to be on or after your departure.';
      if (d > 90) return 'That is a long trip — try 90 days or fewer for now.';
      return '';
    }
    if (step === 3) {
      if (!trip.activities.length) return 'Pick at least one activity — this is what makes the list specific.';
      return '';
    }
    return '';
  };

  const next = () => {
    const err = validate();
    if (err) { setError(err); return; }
    if (step === 1) {
      track(EVENTS.DATES_COMPLETED, { trip_days: dayCount(trip.startDate, trip.endDate) });
    }
    if (step === TOTAL_STEPS - 1) { onSubmit(); return; }
    setStep((s) => s + 1);
  };

  const back = () => {
    setError('');
    if (step === 0) { onExit(); return; }
    setStep((s) => s - 1);
  };

  const meta = STEP_META[step];
  const firstDestination = destinations[0];

  return (
    <div className="planner">
      <div className="step-progress" role="group" aria-label={`Step ${step + 1} of ${TOTAL_STEPS}`}>
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
          <div
            key={i}
            className={`step-progress-seg${i < step ? ' done' : ''}${i === step ? ' active' : ''}`}
          >
            <span />
          </div>
        ))}
      </div>

      <div className="step-body">
        <div className="shell-narrow">
          {prefilled && !noteDismissed && step === 0 && (
            <div className="prefill-note" role="status">
              <Wand2 aria-hidden="true" />
              <span>
                We&apos;ve filled this in with an example journey
                {destinations[0] ? ` — ${destinations[0].name}` : ''}. Change anything you like as
                you go.
              </span>
              <button type="button" onClick={() => setNoteDismissed(true)}>Got it</button>
            </div>
          )}

          <span className="step-count">Step {step + 1} of {TOTAL_STEPS}</span>
          <div className="step-head">
            <h2 className="h1" tabIndex={-1} ref={headingRef}>{meta.title}</h2>
            <p>{meta.sub}</p>
          </div>

          {/* ---------- 1. Origin and first destination ---------- */}
          {step === 0 && (
            <>
              <div className="step-section">
                <label className="label" htmlFor="destination">Destination</label>
                {firstDestination ? (
                  <ChosenPlace
                    stop={firstDestination}
                    label="Destination"
                    icon={MapPin}
                    onClear={() => set({
                      stops: trip.stops.filter(
                        (s) => s.id !== firstDestination.id && s.parentId !== firstDestination.id
                      ),
                    })}
                  />
                ) : (
                  <PlaceSearch
                    id="destination"
                    placeholder="Search destination…"
                    autoFocus
                    invalid={!!error}
                    onSelect={(place) => {
                      set({ stops: [...trip.stops, createStop(place, { type: 'destination' })] });
                      track(EVENTS.DESTINATION_SELECTED, {
                        destination_kind: place.kind || 'unknown',
                        destination_source: place.source || 'unknown',
                      });
                    }}
                  />
                )}
                <p className="xs muted" style={{ marginTop: 'var(--s-3)' }}>
                  We look up the real place, so we know its elevation and climate rather than
                  guessing from the name.
                </p>
              </div>

              <div className="step-section">
                <label className="label" htmlFor="origin">
                  Starting from <span className="faint" style={{ fontWeight: 400 }}>Optional</span>
                </label>
                {trip.origin ? (
                  <ChosenPlace
                    stop={trip.origin}
                    label="Starting point"
                    icon={Navigation}
                    onClear={() => set({ origin: null })}
                  />
                ) : (
                  <PlaceSearch
                    id="origin"
                    placeholder="Kolkata"
                    icon="nav"
                    onSelect={(place) => set({ origin: createStop(place, { type: 'destination' }) })}
                  />
                )}
                <p className="xs muted" style={{ marginTop: 'var(--s-3)' }}>
                  Used for the journey itself — distance, altitude gain and how long you&apos;ll be
                  travelling. We never pack for your own city.
                </p>
              </div>
            </>
          )}

          {/* ---------- 2. Dates ---------- */}
          {step === 1 && (
            <div className="step-section">
              <DateSelector
                startDate={trip.startDate}
                endDate={trip.endDate}
                onChange={(v) => set(v)}
              />
            </div>
          )}

          {/* ---------- 3. The rest of the route ---------- */}
          {step === 2 && (
            <div className="step-section">
              <RouteBuilder trip={trip} onChange={set} />
              <p className="skip-hint">
                <Info aria-hidden="true" />
                <span>
                  Staying in one place? Just continue — this step is optional. Adding stops lets us
                  account for transfers, changing altitude and the conditions at every base.
                </span>
              </p>
            </div>
          )}

          {/* ---------- 4. Activities and sights ---------- */}
          {step === 3 && (
            <>
              <div className="step-section">
                <h3 className="label" style={{ marginBottom: 'var(--s-3)' }}>
                  Activities <span className="faint" style={{ fontWeight: 400 }}>Pick as many as apply</span>
                </h3>
                <ActivitySelector
                  selected={trip.activities}
                  onToggle={(id) => {
                    // The state update derives `next` from the trip passed into
                    // the updater, not the `trip` prop closed over at render
                    // time — two chips clicked quickly land in the same state
                    // batch, and reading the prop for the ACTUAL update would
                    // compute both from the same stale array, silently losing
                    // whichever applied first. The updater is otherwise kept
                    // pure: React can invoke a setState updater more than once
                    // per call (StrictMode does this on purpose in development
                    // to catch exactly this), so track() lives outside it —
                    // placed inside, it would either double-fire or, read back
                    // from a closure variable, never fire at all.
                    const has = trip.activities.includes(id);
                    if (!has) {
                      track(EVENTS.ACTIVITY_SELECTED, {
                        activity: id,
                        activity_count: trip.activities.length + 1,
                      });
                    }
                    set((t) => ({
                      activities: t.activities.includes(id)
                        ? t.activities.filter((a) => a !== id)
                        : [...t.activities, id],
                    }));
                  }}
                />
              </div>

              <div className="step-section">
                <h3 className="label" style={{ marginBottom: 'var(--s-3)' }}>
                  Sightseeing <span className="faint" style={{ fontWeight: 400 }}>Optional</span>
                </h3>
                <SightseeingPicker trip={trip} onChange={set} />
              </div>
            </>
          )}

          {/* ---------- 5. Preferences ---------- */}
          {step === 4 && (
            <TravelPreferenceSelector
              travelStyle={trip.travelStyle}
              luggageType={trip.luggageType}
              notes={trip.notes}
              onChange={set}
            />
          )}

          {error && (
            <p className="validation" role="alert">
              <AlertCircle aria-hidden="true" />{error}
            </p>
          )}
        </div>
      </div>

      <div className="step-actions">
        <div className="step-actions-inner">
          <button type="button" className="back-btn" onClick={back}>
            <ArrowLeft aria-hidden="true" />
            {step === 0 ? 'Home' : 'Back'}
          </button>
          <div style={{ flex: 1 }} />
          <button type="button" className="btn btn-primary btn-lg" onClick={next}>
            {step === TOTAL_STEPS - 1 ? 'Create my packing plan' : 'Continue'}
            <ArrowRight size={16} aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
