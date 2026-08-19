# Packwise

**Tell us your whole trip. We'll tell you what to pack.**

A packing planner that understands a journey rather than a pin on a map.
Every stop, its real elevation and the conditions actually recorded there go in;
a categorised, prioritised, explained packing plan comes out.

```bash
npm install
npm run dev      # http://localhost:5173
```

Other commands:

```bash
npm run build    # production build
npm test         # quality-bar checks on the engine
```

---

## The idea

Two things make one packing list different from another, and V1.1 takes both seriously.

**Where you go.** Not the name you typed — the actual place. Pelling is at 2,150 m;
Kaza is a village in Spiti at 3,800 m, not the city in Tatarstan a geocoder ranks first.
Elevation, latitude and recorded rainfall decide the list, so Leh in August comes out
as the cold desert it is (0.4 mm of rain a day) rather than "India in August, therefore
monsoon".

**How much you move.** A week in one place and a week across four places need different
bags even in identical weather. Every item on a multi-stop trip gets carried, loaded and
unloaded repeatedly, so versatility starts beating variety.

---

## Architecture

```
src/
├── data/
│   ├── trip.js           The route model: origin + ordered typed stops.
│   ├── places.js         Gazetteer of travel places geocoders rank poorly.
│   ├── destinations.js   34 researched profiles: normals, terrain, local notes.
│   ├── activities.js     Activities → abstract "demands".
│   └── catalog.js        ~160 items: name, category, unit weight, bulk hints.
│
├── engine/               Pure functions. No React, no DOM.
│   ├── geocode.js          Real place search; distance and leg bands.
│   ├── climate.js          Environment classification from physical facts.
│   ├── weather.js          Forecast → historical records → normals → estimate.
│   ├── route.js            Legs, transfers, elevation, travel intensity.
│   ├── context.js          Everything above → the facts rules reason about.
│   ├── quantities.js       Counts from days, climate, laundry, style, intensity.
│   ├── rules.js            The recommendation rules.
│   ├── insights.js         "What shaped this list" + the altitude safety note.
│   ├── plan.js             Assembly, grouping, statistics.
│   └── optimize.js         Pack Light.
│
├── components/           Presentational pieces
├── screens/              Landing · Planner (5 steps) · Results
└── styles/               tokens · base · app · route · print
```

### The trip model

```js
Trip = { origin, stops[], startDate, endDate, activities, travelStyle, luggageType, notes }

Stop = {
  name, latitude, longitude, elevation, region, country,
  type: 'destination' | 'point_of_interest',
  parentId,        // for a sight: the base it is visited from
  nights, activities, kind, permit
}
```

The `type` field is the heart of it. "Gangtok plus Tsomgo Lake" is one base and one
day trip; "Darjeeling then Pelling then Gangtok" is three bases and two transfers.
Those are different journeys and they need different bags — so the app asks, rather
than guessing from a flat list of place names.

Saved V1 trips (a single `destination` string plus `places[]`) migrate automatically.

### Climate, from facts rather than the calendar

`classifyEnvironment()` labels a place from elevation, latitude, temperature and
measured precipitation: *cold desert, high altitude, mountain, arid, tropical, wet,
coastal, temperate*. Nothing keys off "it is August in India".

Observations come in preference order:

1. **Live forecast** when the dates are inside the horizon.
2. **Historical records for the same calendar window**, averaged over three years —
   far better than a monthly mean, and the reason Leh reads dry in August while
   Kolkata reads at 13.6 mm/day.
3. Curated normals, then an estimate from elevation and latitude.

The network is never on the critical path; nothing here throws.

The origin is fetched but deliberately **excluded** from what you pack for. Including
it made every trip look like a climate swing and had a Leh trip packing rain gear for
Delhi's monsoon.

### Travel intensity

Scored from changes of base, the effort of the legs *between* bases, how much churn
that is per day, and elevation range. Getting there and home again is excluded — that
is unavoidable on any trip.

| Trip | Result |
|---|---|
| Kolkata → Gangtok | **Low** — one base, unpack once |
| Kolkata → Darjeeling → Pelling → Gangtok | **High** — 3 bases, 2 transfers in 5 days |
| Delhi → Manali → Kaza → Tabo | **High** — plus 1,750 m of elevation range |

High intensity earns its own category, *Based on your route*: a daypack, a grab pouch
for travel days, packing cubes, quick-dry trousers over a second heavy pair, and a
warm layer kept reachable on the longest leg.

### Quantities

*Enough to stay comfortable, not enough to fill the suitcase.* A 5-day trip gets four
pairs of underwear, not seven; two pairs of trousers, never one per day; one versatile
outer layer plus light layers rather than two heavy jackets.

| Days | Minimal | Balanced | Prepared |
|---|---|---|---|
| 3 | 3 | 3 | 4 |
| 5 | 4 | 4 | 6 |
| 7 | 5 | 6 | 8 |

Tops are budgeted as one total then split between t-shirts and long-sleeved shirts —
budgeting them separately is what makes cold-weather lists accumulate two wardrobes.

### On health

The app does not give medical advice. Where a route goes above 3,000 m it shows a
short note saying so and points to official and local guidance — it does not name
medication or tell anyone how to acclimatise.

---

## Extending it

**A new destination** — nothing required. Any place the geocoder returns works, with
real coordinates and elevation. Add an entry to `DESTINATIONS` only to attach
researched local knowledge (steep streets, patchy signal, temple etiquette).

**A place geocoders rank badly** — add it to `CURATED_PLACES` with real coordinates.

**A new activity** — add it to `ACTIVITIES` with the abstract `demands` it creates.
Rules read demands, not activity ids, so most need no edit.

**Swapping in an LLM** — `generateItems(ctx)` is a pure function returning
`PackingItem[]`. Replace its body with a model call returning the same shape and
nothing else changes. The context object is already the prompt payload: route,
per-stop climate, environment zones, intensity, demands and preferences.

---

## Notes on scope

No accounts, no backend, no booking. Progress is saved to `localStorage`, so a
half-packed list survives a refresh.

Distances are estimates — straight-line separation with a terrain correction that
decays over distance, fitted against known routes. Good enough to describe a journey,
and never presented as exact. Travel time is given as a band ("half a day on the road")
rather than a figure, because an hours number would imply precision we do not have.
