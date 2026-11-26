/**
 * GA4 analytics.
 *
 * Loading is conditional on `VITE_GA_MEASUREMENT_ID` being set — with no ID,
 * `init()` is a no-op and `track()` calls are silently swallowed. Nothing here
 * can throw into a caller: a blocked script, a missing `window`, or a bad
 * param object degrades to "the event didn't send," never to a broken screen.
 *
 * No personally identifying values are ever sent — no destination names,
 * no free-text notes, no place-search queries. Every parameter below is a
 * count, a rounded number, a boolean, or a value from a fixed enum (activity
 * ids, priority levels, travel-intensity bands). See EVENTS for the exact
 * shape of each event this app sends.
 */

const MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID?.trim();
const DEV = !!import.meta.env.DEV;

let initialised = false;

/** The GA4 DebugView flag. Opt-in per page load via ?ga_debug=1 — never
 * persisted, so a developer's browser cannot get stuck excluding real events
 * from standard reports (debug_mode events are DebugView-only in GA4). */
function debugRequested() {
  if (typeof window === 'undefined') return false;
  try {
    return new URLSearchParams(window.location.search).get('ga_debug') === '1';
  } catch {
    return false;
  }
}

/**
 * Boot GA4. Safe to call more than once — every call after the first is a
 * no-op. Safe to call with no measurement ID configured — logs once in dev
 * and does nothing in production.
 */
export function initAnalytics() {
  if (initialised || typeof window === 'undefined') return;
  initialised = true;

  if (!MEASUREMENT_ID) {
    if (DEV) {
      console.info(
        '[analytics] VITE_GA_MEASUREMENT_ID is not set — GA4 will not load. '
        + 'Add it to .env.local to enable tracking. See .env.example.'
      );
    }
    return;
  }

  // Standard gtag.js bootstrap. The dataLayer array and gtag() function are
  // defined synchronously, so track() calls made before the external script
  // finishes loading (or if it never does, e.g. an ad blocker) still queue
  // safely instead of throwing.
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() { window.dataLayer.push(arguments); };
  window.gtag('js', new Date());
  window.gtag('config', MEASUREMENT_ID, {
    debug_mode: debugRequested() || undefined,
    // This is a client-only SPA with one URL — page_path stays constant,
    // and our funnel events carry the real signal.
    send_page_view: true,
  });

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(MEASUREMENT_ID)}`;
  document.head.appendChild(script);

  if (DEV) console.info(`[analytics] GA4 initialised (${MEASUREMENT_ID})`);
}

/**
 * Send a custom event. Never throws — a malformed params object or a GA4
 * script that failed to load both degrade to "nothing sent," logged in dev.
 *
 * @param {string} name    one of EVENTS below
 * @param {object} [params] flat, non-PII, JSON-serialisable values
 */
export function track(name, params = {}) {
  if (DEV) console.debug('[analytics]', name, params);
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return;

  try {
    // Drop undefined/null so GA4 doesn't receive empty params, and guard
    // against accidentally passing something non-serialisable (a DOM node,
    // a React element) ending up in a network payload.
    const clean = {};
    for (const [k, v] of Object.entries(params)) {
      if (v === undefined || v === null) continue;
      const t = typeof v;
      if (t === 'string' || t === 'number' || t === 'boolean') clean[k] = v;
      else if (DEV) console.warn(`[analytics] dropping non-primitive param "${k}" on "${name}"`, v);
    }
    window.gtag('event', name, clean);
  } catch (err) {
    if (DEV) console.warn('[analytics] track() failed:', err);
  }
}

/**
 * The Packwise funnel. Kept as a single source of truth so every call site
 * uses the same event name — a typo here is a compile error at the import,
 * not a silent gap in a GA4 report six months from now.
 */
export const EVENTS = {
  TRIP_STARTED: 'trip_started',
  DESTINATION_SELECTED: 'destination_selected',
  DESTINATION_ADDED: 'destination_added',
  DATES_COMPLETED: 'dates_completed',
  ACTIVITY_SELECTED: 'activity_selected',
  PACKING_PLAN_GENERATED: 'packing_plan_generated',
  PACKING_ITEM_CHECKED: 'packing_item_checked',
  PACK_LIGHT_USED: 'pack_light_used',
  TRIP_SAVED: 'trip_saved',
  TRIP_SHARED: 'trip_shared',
  AD_VIEWED: 'ad_viewed',
  AD_CLICKED: 'ad_clicked',
  AD_PLAN_SELECTED: 'ad_plan_selected',
  AD_REQUEST_SUBMITTED: 'ad_request_submitted',
  POPULAR_TRIP_CLICKED: 'popular_trip_clicked',
  NAV_CLICKED: 'nav_clicked',
  ADVERTISE_CLICKED: 'advertise_clicked',
  CTA_CLICKED: 'cta_clicked',
  SOCIAL_CLICKED: 'social_clicked',
  CONTACT_OPENED: 'contact_opened',
  CONTACT_SENT: 'contact_sent',
};

/**
 * Fires when an ad unit actually enters the viewport — not just when it
 * mounts. There is no ad placement in the app yet, so nothing calls this;
 * it exists so wiring one in later is a single call, e.g. from an
 * IntersectionObserver on the ad slot:
 *
 *   useEffect(() => {
 *     const el = adRef.current;
 *     if (!el) return;
 *     const io = new IntersectionObserver(([entry]) => {
 *       if (entry.isIntersecting) { trackAdViewed({ ad_unit: 'results-rail' }); io.disconnect(); }
 *     }, { threshold: 0.5 });
 *     io.observe(el);
 *     return () => io.disconnect();
 *   }, []);
 *
 * @param {{ad_unit: string, ad_provider?: string}} params
 */
export function trackAdViewed(params) {
  track(EVENTS.AD_VIEWED, params);
}
