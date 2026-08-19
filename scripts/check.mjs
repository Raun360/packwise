/**
 * V1.1 quality bar — the four scenarios in the brief, plus regression checks
 * on quantities, the route model and graceful degradation.
 */
import { searchPlaces } from '../src/engine/geocode.js';
import { getRouteClimate } from '../src/engine/weather.js';
import { buildPlan } from '../src/engine/plan.js';
import { optimise } from '../src/engine/optimize.js';
import { createStop, createEmptyTrip, createTextStop, migrateTrip, destinationsOf } from '../src/data/trip.js';
import { monthsSpanned } from '../src/engine/context.js';
import { deriveInsights, altitudeNotice } from '../src/engine/insights.js';
import { checkIcons } from './t-icons.mjs';

let fails = 0;
const check = (label, cond, detail = '') => {
  if (!cond) { fails++; console.log(`  FAIL  ${label} ${detail}`); }
  else console.log(`  ok    ${label}`);
};

const find = async (q) => (await searchPlaces(q)).results[0];

async function makeTrip({ origin, destinations = [], pois = {}, start, end, activities = [], style = 'balanced', luggage = 'suitcase', notes = '' }) {
  const trip = { ...createEmptyTrip(), startDate: start, endDate: end, activities, travelStyle: style, luggageType: luggage, notes };
  if (origin) {
    const o = await find(origin);
    trip.origin = o ? createStop(o, { type: 'destination' }) : createTextStop(origin);
  }
  for (const d of destinations) {
    const place = await find(d);
    const stop = place ? createStop(place, { type: 'destination' }) : createTextStop(d, { type: 'destination' });
    trip.stops.push(stop);
    for (const poiName of pois[d] || []) {
      const poi = await find(poiName);
      trip.stops.push(poi
        ? createStop(poi, { type: 'point_of_interest', parentId: stop.id })
        : createTextStop(poiName, { type: 'point_of_interest', parentId: stop.id }));
    }
  }
  return trip;
}

async function planFor(spec) {
  const trip = await makeTrip(spec);
  const months = monthsSpanned(trip.startDate, trip.endDate);
  const stops = [trip.origin, ...trip.stops].filter(Boolean);
  const climates = await getRouteClimate(stops, trip.startDate, trip.endDate, months);
  return buildPlan(trip, climates);
}

const has = (plan, id) => plan.items.some((i) => i.id === id);
const qtyOf = (plan, id) => plan.items.find((i) => i.id === id)?.quantity;
const catOf = (plan, id) => plan.items.find((i) => i.id === id)?.category;

/* ================================================================== */
console.log('\n=== TEST 1 — Kolkata → Gangtok, 5 days, sightseeing ===');
const t1 = await planFor({
  origin: 'Kolkata', destinations: ['Gangtok'],
  start: '2026-11-05', end: '2026-11-09', activities: ['sightseeing'],
});
console.log(`  ${t1.ctx.routeLabel} | intensity ${t1.ctx.route.intensity.label} | ${t1.stats.total} items, ${t1.stats.weight.toFixed(1)}kg`);
check('single destination', t1.ctx.route.destinationCount === 1);
check('travel intensity is Low', t1.ctx.route.intensity.id === 'low');
check('no transfer-driven route items', !has(t1, 'transit-pouch') && !has(t1, 'compression-sack'));
check('stays a simple list (< 70 items)', t1.stats.total < 70, `(${t1.stats.total})`);
check('5-day balanced underwear is 4', qtyOf(t1, 'underwear') === 4, `(got ${qtyOf(t1, 'underwear')})`);
check('bottoms are not one per day', qtyOf(t1, 'jeans') <= 2, `(got ${qtyOf(t1, 'jeans')})`);

console.log('\n=== TEST 2 — Kolkata → Darjeeling → Pelling → Gangtok ===');
const t2 = await planFor({
  origin: 'Kolkata', destinations: ['Darjeeling', 'Pelling', 'Gangtok'],
  pois: { Gangtok: ['Tsomgo Lake'] },
  start: '2026-11-05', end: '2026-11-09', activities: ['sightseeing', 'photography'],
});
console.log(`  ${t2.ctx.routeLabel} | intensity ${t2.ctx.route.intensity.label} (${t2.ctx.route.intensityScore}) | ${t2.stats.total} items`);
check('three destinations', t2.ctx.route.destinationCount === 3);
check('two changes of base', t2.ctx.route.destinationChanges === 2);
check('travel intensity is High', t2.ctx.route.intensity.id === 'high');
check('the sight is not a destination', t2.ctx.route.poiCount === 1 && t2.ctx.route.destinationCount === 3);
check('has a "Based on your route" category', t2.categories.some((c) => c.id === 'route'));
check('daypack driven by transfers', catOf(t2, 'daypack') === 'route');
check('travel outfit for transit days', has(t2, 'travel-outfit'));
check('packing cubes for repacking', has(t2, 'packing-cubes'));
check('quick-dry trousers over a second heavy pair', has(t2, 'trekking-pants'));
check('more items than the single-stop version', t2.stats.total > t1.stats.total, `(${t2.stats.total} vs ${t1.stats.total})`);

console.log('\n=== TEST 3 — Delhi → Manali → Kaza → Tabo, 7 days ===');
const t3 = await planFor({
  origin: 'Delhi', destinations: ['Manali', 'Kaza', 'Tabo'],
  start: '2026-09-05', end: '2026-09-11', activities: ['roadtrip', 'hiking', 'photography'],
});
const r3 = t3.ctx.route;
console.log(`  ${t3.ctx.routeLabel} | intensity ${r3.intensity.label} | ${r3.minElevation}-${r3.maxElevation}m | ${t3.ctx.tempMin}..${t3.ctx.tempMax}C`);
check('travel intensity is High', r3.intensity.id === 'high');
check('real elevation change captured', r3.elevationRange >= 1500, `(${r3.elevationRange}m)`);
check('Kaza resolved to Spiti, not Kazan', r3.destinations.some((d) => d.name === 'Kaza' && d.elevation > 3000));
check('Tabo resolved to Himachal', r3.destinations.some((d) => d.name === 'Tabo' && d.country === 'India'));
check('variable temperatures across route', (t3.ctx.contrast?.tempSpread ?? 0) >= 8, `(${Math.round(t3.ctx.contrast?.tempSpread ?? 0)}C)`);
check('layering driven by the route', catOf(t3, 'fleece') === 'route');
check('high-altitude safety note present', !!altitudeNotice(t3.ctx));

console.log('\n=== TEST 4 — Ladakh, 5 days, August ===');
const t4 = await planFor({
  origin: 'Delhi', destinations: ['Leh'],
  start: '2026-08-05', end: '2026-08-09',
  activities: ['roadtrip', 'sightseeing', 'hiking'],
});
console.log(`  ${t4.ctx.destinationName} | ${t4.ctx.precipMmPerDay}mm/day | ${[...t4.ctx.zones].join(', ')}`);
check('classified as a cold desert', t4.ctx.zones.has('cold-desert'));
check('recognised as arid', t4.ctx.zones.has('arid'));
check('August is NOT treated as monsoon', t4.ctx.rainIntensity === 'none', `(got ${t4.ctx.rainIntensity})`);
check('no rain jacket', !has(t4, 'rain-jacket'));
check('no umbrella', !has(t4, 'umbrella'));
check('sun protection is essential', t4.items.find((i) => i.id === 'sunscreen')?.priority === 'essential');
check('UV sunglasses recommended', has(t4, 'uv-sunglasses'));
check('lip protection included', has(t4, 'lip-balm'));
check('layers for the temperature swing', has(t4, 'fleece') || has(t4, 'warm-jacket'));
check('hydration included', has(t4, 'reusable-bottle') || has(t4, 'insulated-flask'));

/* ---------------- No medical advice ---------------- */
console.log('\n=== SAFETY ===');
const allText = [t1, t2, t3, t4]
  .flatMap((p) => p.items.map((i) => `${i.name} ${i.reason || ''}`))
  .join(' ')
  .toLowerCase();
check('no medication is recommended by name', !/diamox|acetazolamide|ibuprofen|paracetamol/.test(allText));
check('no altitude-sickness drug item', ![t1, t2, t3, t4].some((p) => has(p, 'altitude-meds')));
const notice = altitudeNotice(t4.ctx);
check('altitude note points to official guidance', /official|local guidance/i.test(notice?.action || ''));

/* ---------------- Quantity discipline ---------------- */
console.log('\n=== QUANTITIES ===');
for (const [days, expect] of [[3, 3], [5, 4], [7, 6]]) {
  // Built in UTC so the local timezone cannot shift the window by a day.
  const end = new Date(Date.UTC(2026, 10, 5) + (days - 1) * 86400000)
    .toISOString().slice(0, 10);
  const p = await planFor({
    origin: 'Kolkata', destinations: ['Gangtok'],
    start: '2026-11-05', end, activities: ['sightseeing'],
  });
  check(`${days}-day balanced underwear = ${expect}`, qtyOf(p, 'underwear') === expect, `(got ${qtyOf(p, 'underwear')})`);
  check(`${days}-day bottoms <= 2`, qtyOf(p, 'jeans') <= 2, `(got ${qtyOf(p, 'jeans')})`);
}
const heavyJackets = t3.items.filter((i) => ['heavy-parka', 'warm-jacket'].includes(i.id));
check('at most one heavy outer layer', heavyJackets.length <= 1, `(${heavyJackets.map((i) => i.name).join(', ')})`);

/* ---------------- Route model ---------------- */
console.log('\n=== ROUTE MODEL ===');
const migrated = migrateTrip({
  destination: 'Gangtok', origin: 'Kolkata', places: ['Nathula Pass', 'MG Marg'],
  startDate: '2026-11-05', endDate: '2026-11-09', activities: ['sightseeing'],
  travelStyle: 'balanced', luggageType: 'suitcase', notes: '',
});
check('V1 saved trips migrate', destinationsOf(migrated).length === 1 && migrated.stops.length === 3);
check('migrated places become points of interest',
  migrated.stops.filter((s) => s.type === 'point_of_interest').length === 2);

/* ---------------- Graceful degradation ---------------- */
console.log('\n=== DEGRADATION ===');
const noCoords = { ...createEmptyTrip(), startDate: '2026-11-05', endDate: '2026-11-09', activities: ['sightseeing'] };
noCoords.stops.push(createTextStop('Somewhere Unmapped', { type: 'destination' }));
let offlinePlan = null;
try { offlinePlan = buildPlan(noCoords, null); } catch (e) { console.log('  threw:', e.message); }
check('builds a plan with no coordinates and no network', !!offlinePlan && offlinePlan.items.length > 15,
  `(${offlinePlan?.items.length} items)`);
check('pack light still works there', !!offlinePlan && optimise(offlinePlan).items.length > 0);

const emptyish = buildPlan({ ...createEmptyTrip(), startDate: '', endDate: '' }, null);
check('survives an empty trip', emptyish.items.length > 0);

/* ---------------- Pack Light ---------------- */
console.log('\n=== PACK LIGHT ===');
for (const [name, plan] of [['test 2', t2], ['test 3', t3], ['test 4', t4]]) {
  const o = optimise(plan);
  check(`${name}: reduces weight`, o.after.weight < o.before.weight,
    `(${o.before.weight.toFixed(1)} → ${o.after.weight.toFixed(1)}kg)`);
  check(`${name}: keeps essentials`, o.items.filter((i) => i.priority === 'essential').length > 10);
}

/* ---------------- Insights ---------------- */
console.log('\n=== INSIGHTS ===');
check('multi-stop trip leads with the journey', deriveInsights(t2.ctx)[0]?.icon === 'Route');
check('cold desert is called out explicitly',
  deriveInsights(t4.ctx).some((i) => /cold desert/i.test(i.title)));
const icons = checkIcons();
check('every insight icon is mapped to a component', icons.missing.length === 0,
  icons.missing.join(', '));
check('every insight has a body', [t1, t2, t3, t4].every((p) => deriveInsights(p.ctx).every((i) => i.body?.length > 20)));

console.log(fails === 0 ? '\nALL CHECKS PASSED' : `\n${fails} CHECK(S) FAILED`);
process.exit(fails === 0 ? 0 : 1);
