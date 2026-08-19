/**
 * Recommendation rules.
 *
 * Each rule looks at the trip context and adds items with a quantity, a
 * priority and — crucially — a reason written in terms of that specific trip.
 * Rules run generic-to-specific; a later rule may raise an item's priority,
 * increase its quantity, or replace its reason with a more specific one.
 *
 * This is deliberately a pure function of context. Swapping it for an LLM call
 * later means producing the same `PackingItem[]` shape — nothing else changes.
 */

import { CATALOG } from '../data/catalog.js';
import { qty } from './quantities.js';

export const PRIORITY = { essential: 3, recommended: 2, optional: 1 };
export const PRIORITY_LABEL = { essential: 'Essential', recommended: 'Recommended', optional: 'Optional' };

/* ------------------------------ helpers ------------------------------ */

const listNames = (arr) => {
  const a = arr.filter(Boolean);
  if (!a.length) return '';
  if (a.length === 1) return a[0];
  if (a.length === 2) return `${a[0]} and ${a[1]}`;
  return `${a.slice(0, -1).join(', ')} and ${a[a.length - 1]}`;
};

const round = (n) => Math.round(n);

/** The named high-altitude places on this trip, for use in reasons. */
const highPlaces = (ctx) => ctx.places.filter((p) => p.altitude && p.altitude > 2500).map((p) => p.name);

/** Whether the destination or the named places expect covered shoulders/knees. */
const modestExpected = (ctx) =>
  ctx.tags.has('temple-etiquette') || ctx.demands.has('modest-dress')
  || ctx.tags.has('modest-dress-public') || ctx.tags.has('modest-dress-local-islands');

/** The stop on the route that sees the most rain, for use in reasons. */
const wettestName = (ctx) => ctx.contrast?.wettest?.stopName || ctx.destinationName;

/** A phrase describing where the cold actually bites. */
function coldestPlacePhrase(ctx) {
  const hp = highPlaces(ctx);
  if (hp.length && ctx.goesHigh) {
    return `${listNames(hp)} ${hp.length > 1 ? 'sit' : 'sits'} around ${ctx.highPoint.toLocaleString()} m, where daytime highs fall to roughly ${round(ctx.highPointTempMax)}°C`;
  }
  if (ctx.goesHigh) {
    return `your day trips climb to about ${ctx.highPoint.toLocaleString()} m, far colder than ${ctx.destinationName} itself`;
  }
  return `${ctx.destinationName} drops to about ${round(ctx.tempMin)}°C at night in ${ctx.monthLabel}`;
}

class Collector {
  constructor(ctx) {
    this.ctx = ctx;
    this.map = new Map();
  }

  /**
   * @param {string} id       catalog id
   * @param {object} opts     { qty, priority, reason, category, note }
   */
  add(id, opts = {}) {
    const base = CATALOG[id];
    if (!base) {
      if (import.meta.env?.DEV) console.warn('[rules] unknown item id:', id);
      return;
    }
    const quantity = Math.max(0, Math.round(opts.qty ?? 1));
    if (quantity === 0) return;

    const priority = opts.priority || 'recommended';
    const existing = this.map.get(id);

    if (!existing) {
      this.map.set(id, {
        id,
        name: base.name,
        category: opts.category || base.category,
        quantity,
        unit: base.unit || null,
        priority,
        reason: opts.reason || null,
        weight: base.w,
        bulk: !!base.bulk,
        compressible: !!base.compressible,
        wearable: !!base.wearable,
        virtual: !!base.virtual,
        packed: false,
      });
      return;
    }

    // Merge: highest priority wins, largest sensible quantity wins, and the
    // more specific (later, at least as urgent) reason replaces the earlier one.
    const higher = PRIORITY[priority] > PRIORITY[existing.priority];
    if (higher) existing.priority = priority;
    if (quantity > existing.quantity) existing.quantity = quantity;
    if (opts.reason && (higher || PRIORITY[priority] === PRIORITY[existing.priority])) {
      existing.reason = opts.reason;
    }
    if (opts.category) existing.category = opts.category;
  }

  finish() {
    return [...this.map.values()];
  }
}

/* ==================================================================== */
/*  Rules                                                               */
/* ==================================================================== */

export function generateItems(ctx) {
  const c = new Collector(ctx);
  const add = (id, opts) => c.add(id, opts);
  const { style, luggage, demands, tags, terrain, noteSignals } = ctx;

  const prepared = style === 'prepared';
  const minimal = style === 'minimal';

  // Sustained conditions — what you live in — are kept separate from excursion
  // conditions — a few hours at a mountain pass. Conflating them is how a
  // July trip to Ladakh ends up recommending a heavy winter parka.
  const sleepsHigh = ctx.baseElevation >= 2800;
  // Thin air and wind make a night at 3,500 m feel far colder than the same
  // reading at sea level, so the cold threshold rises with elevation.
  const baseCold = ctx.tempMin <= 8 || (sleepsHigh && ctx.tempMin <= 12);
  const excursionCold = ctx.goesHigh && ctx.highPointTempMin <= 5;
  const excursionFreezing = ctx.goesHigh && ctx.highPointTempMin <= -2;

  const cold = baseCold || excursionCold;
  /** Sustained sub-zero — the only thing that justifies genuine winter kit. */
  const deepCold = ctx.tempMin <= 0 || (sleepsHigh && ctx.tempMin <= 3);
  const freezing = deepCold || excursionFreezing;
  const hot = ctx.tempMax >= 32;
  const intensity = ctx.intensity;
  const humid = tags.has('humid') || tags.has('tropical');
  const highUV = tags.has('high-uv') || tags.has('intense-uv') || ctx.goesHigh
    || terrain.has('beach') || terrain.has('desert') || terrain.has('snow');

  /* ---------------------- 1. Documents, money, keys ------------------- */

  add('id-card', {
    qty: 1, priority: 'essential',
    reason: 'Needed at check-in, for domestic flights and for most hotel registrations.',
  });
  add('wallet', { qty: 1, priority: 'essential' });
  add('phone', { qty: 1, priority: 'essential' });
  add('house-keys', { qty: 1, priority: 'essential', reason: 'Easy to leave behind on the way out.' });
  add('cards', { qty: 1, priority: 'essential' });
  add('tickets', {
    qty: 1, priority: 'essential',
    reason: ctx.route.multiStop
      ? `${ctx.route.destinationCount} destinations means several bookings — keep every leg saved offline as well as printed.`
      : ctx.origin
        ? `Your ${ctx.origin} → ${ctx.destinationName} tickets, saved offline as well as printed.`
        : 'Saved offline as well as printed.',
  });
  add('booking-confirmations', {
    qty: 1, priority: 'essential',
    reason: ctx.route.multiStop
      ? `${ctx.route.destinationCount} separate stays over ${ctx.nights} nights — keep every confirmation reachable without signal.`
      : `${ctx.nights} ${ctx.nights === 1 ? 'night' : 'nights'} of stay — keep confirmations reachable without signal.`,
  });

  if (ctx.international) {
    add('passport', { qty: 1, priority: 'essential', reason: `${ctx.foreignCountry || 'This'} is an international trip — check your passport has at least six months' validity.` });
    add('visa-docs', { qty: 1, priority: 'essential', reason: `Carry your visa or entry approval for ${ctx.foreignCountry || 'your destination'}.` });
    add('forex', { qty: 1, priority: 'essential', reason: 'Some local cash for arrival, before you find a good rate.' });
    add('travel-insurance', { qty: 1, priority: 'recommended', reason: 'Worth having the policy number reachable offline.' });
    add('universal-adapter', {
      qty: 1, priority: 'essential', category: 'destination',
      reason: `${ctx.foreignCountry || 'Your destination'} uses different sockets — one adapter covers every device.`,
    });
  }

  // Cash matters far more in some places than others.
  const cashCritical = tags.has('limited-atms') || tags.has('patchy-signal') || tags.has('remote') || tags.has('cash-still-useful');
  add('cash', {
    qty: 1,
    priority: cashCritical ? 'essential' : 'recommended',
    reason: cashCritical
      ? `Card acceptance is unreliable around ${ctx.destinationName} — carry enough cash for the whole trip.`
      : 'For small vendors, tips and transport that will not take a card.',
  });

  if (ctx.placeSignals.has('permit-required')) {
    const permitPlaces = [
      ...ctx.route.permitStops.map((s) => s.name),
      ...ctx.places.filter((p) => p.permit).map((p) => p.name),
    ].filter((v, i, a) => a.indexOf(v) === i);
    add('permit-docs', {
      qty: 1, priority: 'essential', category: 'destination',
      reason: permitPlaces.length
        ? `${listNames(permitPlaces)} ${permitPlaces.length === 1 ? 'requires' : 'require'} a protected-area permit — carry printed ID copies.`
        : 'Parts of your route sit in protected areas that require permits — carry printed ID copies.',
    });
    add('passport-photos', {
      qty: 2, priority: 'optional', category: 'destination',
      reason: 'Permit offices still ask for physical passport photos.',
    });
  }

  /* --------------------------- 2. Tech & power ------------------------ */

  add('phone-charger', { qty: 1, priority: 'essential' });
  add('power-bank', {
    qty: 1,
    priority: (demands.has('long-transit') || demands.has('remote') || ctx.days >= 4) ? 'essential' : 'recommended',
    reason: demands.has('remote')
      ? 'Long stretches without a socket — a power bank is the difference between having maps and not.'
      : demands.has('long-transit')
        ? 'Long travel days with limited charging along the way.'
        : 'Useful during long travel days.',
  });
  add('earphones', { qty: 1, priority: 'recommended' });
  if (prepared) add('cable-pouch', { qty: 1, priority: 'optional', reason: 'Keeps cables from knotting through the bag.' });
  add('offline-maps', {
    qty: 1,
    priority: (demands.has('remote') || tags.has('patchy-signal')) ? 'essential' : 'recommended',
    category: 'tech',
    reason: tags.has('patchy-signal')
      ? `Signal is patchy around ${ctx.destinationName} — download maps before you leave.`
      : demands.has('remote')
        ? 'Parts of this route run well outside reliable coverage — download the area first.'
        : 'Download the area before you go; roaming data is rarely reliable on the move.',
  });

  if (demands.has('gear') || noteSignals.photography) {
    add('camera', { qty: 1, priority: 'recommended', reason: 'You listed photography as part of this trip.' });
    add('memory-cards', { qty: prepared ? 2 : 1, priority: 'recommended' });
    add('camera-batteries', {
      qty: cold ? 3 : 2, priority: cold ? 'essential' : 'recommended',
      reason: cold
        ? `Battery life falls sharply in the cold — at ${round(ctx.goesHigh ? ctx.highPointTempMin : ctx.tempMin)}°C expect noticeably fewer shots per charge.`
        : 'Spares cost little space and save a day of shooting.',
    });
    if (prepared || tags.has('dusty') || terrain.has('desert')) {
      add('camera-cleaning', { qty: 1, priority: 'optional' });
    }
    if (prepared && demands.has('early-starts')) {
      add('tripod', { qty: 1, priority: 'optional', reason: 'Worth the weight only if you plan to shoot at dawn or after dark.' });
    }
  }

  if (demands.has('workspace')) {
    add('laptop', { qty: 1, priority: 'essential', reason: 'You are planning to work during this trip.' });
    add('multi-charger', { qty: 1, priority: 'recommended', reason: 'One brick for laptop, phone and power bank.' });
  }

  /* ---------------------------- 3. Clothing --------------------------- */

  add('underwear', { qty: qty.underwear(ctx), priority: 'essential' });
  add('socks', { qty: qty.socks(ctx), priority: 'essential' });
  add('nightwear', { qty: qty.nightwear(ctx), priority: 'essential' });

  const tops = qty.topSplit(ctx);
  add('tshirts', {
    qty: tops.tshirts, priority: 'essential',
    reason: ctx.laundryAvailable
      ? `${ctx.days} days, but laundry mid-trip means you only need to carry about a week's worth.`
      : `Part of ${tops.total} tops for ${ctx.days} ${ctx.days === 1 ? 'day' : 'days'} without laundry.`,
  });

  if (tops.longSleeve > 0 && (!hot || cold || modestExpected(ctx))) {
    add('shirts-full', {
      qty: tops.longSleeve,
      priority: cold ? 'essential' : 'recommended',
      reason: cold
        ? 'Layers work better than one thick garment — these sit between your base layer and your jacket.'
        : 'Useful for cooler evenings and for covering up at religious sites.',
    });
  }

  add('jeans', {
    qty: qty.bottoms(ctx),
    priority: 'essential',
    reason: hot && !cold
      ? 'One pair for travel days and evenings; shorts will do the rest.'
      : `Enough to rotate across ${ctx.days} ${ctx.days === 1 ? 'day' : 'days'}.`,
  });

  if (hot || terrain.has('beach') || demands.has('swim')) {
    add('shorts', {
      qty: qty.shorts(ctx), priority: hot ? 'essential' : 'recommended',
      reason: `Daytime highs around ${round(ctx.tempMax)}°C in ${ctx.monthLabel}.`,
    });
  }

  // --- Cold-weather layering -----------------------------------------
  const thermalCount = qty.thermals(ctx);
  if (thermalCount > 0) {
    add('base-layer-top', {
      qty: thermalCount, priority: 'essential', category: 'destination',
      reason: `${coldestPlacePhrase(ctx)}. A thermal base layer does more for warmth than another sweater.`,
    });
    add('base-layer-bottom', {
      qty: thermalCount,
      priority: freezing ? 'essential' : 'recommended',
      category: 'destination',
      reason: freezing
        ? 'Below freezing, unprotected legs are the first thing to give out.'
        : 'Worth having for early mornings and open vehicles.',
    });
  }

  const mids = qty.midLayers(ctx);
  if (mids > 0) {
    add('fleece', {
      qty: mids,
      priority: cold ? 'essential' : 'recommended',
      reason: mids > 1
        ? 'Two thinner layers adapt better than one thick one across a big temperature swing.'
        : 'A mid layer you can add or drop as the day warms up.',
    });
  }

  // A parka is only justified by cold you actually live in, not by one
  // afternoon at a pass — a good jacket over thermals covers the excursion.
  if (deepCold) {
    add('heavy-parka', {
      qty: 1, priority: 'essential', category: 'destination',
      reason: `${coldestPlacePhrase(ctx)} — this is sustained sub-zero territory, not just chilly.`,
    });
  } else if (cold) {
    add('warm-jacket', {
      qty: 1, priority: 'essential', category: 'destination',
      reason: sleepsHigh && ctx.tempMin > 8
        ? `You are staying at ${ctx.baseElevation.toLocaleString()} m. Thin air and evening wind make ${round(ctx.tempMin)}°C feel considerably colder than the same reading at sea level.`
        : `${coldestPlacePhrase(ctx)}.`,
    });
  } else if (ctx.tempMin <= 16 || tags.has('evening-chill') || tags.has('strong-aircon')) {
    add('light-jacket', {
      qty: 1,
      priority: tags.has('strong-aircon') ? 'recommended' : 'recommended',
      reason: tags.has('strong-aircon')
        ? 'Indoor air-conditioning in this part of the world runs genuinely cold.'
        : `Evenings settle around ${round(ctx.tempMin)}°C.`,
    });
  }

  if (cold) {
    add('wool-cap', {
      qty: 1,
      priority: freezing || ctx.goesHigh ? 'essential' : 'recommended',
      category: 'destination',
      reason: ctx.goesHigh
        ? `Most of your heat leaves through your head — and ${listNames(highPlaces(ctx)) || 'the high sections'} will be far colder than ${ctx.destinationName}.`
        : `Useful once the temperature drops toward ${round(ctx.tempMin)}°C.`,
    });
    add('thermal-gloves', {
      qty: 1,
      priority: freezing || ctx.goesHigh ? 'essential' : 'recommended',
      category: 'destination',
      reason: ctx.demands.has('gear')
        ? 'Cold hands make a camera almost unusable — thin liner gloves let you keep shooting.'
        : 'Hands lose heat fastest, especially in wind.',
    });
    add('wool-socks', {
      qty: qty.woolSocks(ctx),
      priority: freezing ? 'essential' : 'recommended',
      category: 'destination',
      reason: 'Cold feet end a day out faster than anything else.',
    });
    add('neck-gaiter', {
      qty: 1,
      priority: ctx.goesHigh || tags.has('severe-wind') ? 'recommended' : 'optional',
      category: 'destination',
      reason: 'Blocks wind at the collar — the gap that makes a good jacket feel useless.',
    });
  }

  if (tags.has('severe-wind') || demands.has('wind-exposure') || ctx.goesHigh) {
    add('windcheater', {
      qty: 1,
      priority: tags.has('severe-wind') ? 'essential' : 'recommended',
      category: 'destination',
      reason: tags.has('severe-wind')
        ? `Wind is the real challenge in ${ctx.destinationName} — windproof matters more than thick.`
        : 'Exposed viewpoints and open vehicles are much colder than the forecast suggests.',
    });
  }

  /* --------------------------- 4. Rain --------------------------- */

  if (ctx.rainLikely) {
    const extreme = ctx.rainIntensity === 'extreme';
    const heavy = ctx.rainIntensity === 'heavy' || extreme;
    add('rain-jacket', {
      qty: 1,
      priority: heavy ? 'essential' : 'recommended',
      category: 'destination',
      reason: extreme
        ? `The records for your dates show around ${ctx.precipMmPerDay} mm of rain a day at ${wettestName(ctx)} — sustained rain, not passing showers.`
        : heavy
          ? `${wettestName(ctx)} averages about ${ctx.precipMmPerDay} mm a day over your dates.`
          : `Rain is likely somewhere on your route during these dates.`,
    });
    add('umbrella', {
      qty: 1,
      priority: heavy ? 'recommended' : 'recommended',
      category: 'destination',
      reason: tags.has('drizzle')
        ? 'Rain here is light but frequent — an umbrella beats a heavy waterproof.'
        : 'Faster to deploy than a jacket for short bursts.',
    });
    if (heavy || luggage === 'backpack') {
      add('rain-cover', {
        qty: 1, priority: heavy ? 'essential' : 'recommended', category: 'destination',
        reason: 'Keeps the bag itself dry — most bags are only water-resistant at the seams.',
      });
    }
    if (extreme || demands.has('water') || prepared) add('dry-bag', {
      qty: 1, priority: extreme || demands.has('water') ? 'recommended' : 'optional', category: 'destination',
      reason: 'Somewhere genuinely dry for your phone, documents and cash.',
    });
    add('zip-bags', { qty: 1, priority: 'optional', reason: 'For wet clothes on the way home.' });
  }

  /* --------------------------- 5. Sun & UV --------------------------- */

  if (highUV) {
    const altitudeUV = ctx.goesHigh && ctx.highPoint >= 3000;
    add('sunscreen', {
      qty: 1, priority: 'essential', category: 'destination',
      reason: altitudeUV
        ? `UV rises roughly 10% per 1,000 m — at ${ctx.highPoint.toLocaleString()} m the sun burns much faster than it feels, even in the cold.`
        : terrain.has('beach')
          ? 'Sand and water reflect sunlight back at you, roughly doubling exposure.'
          : `Long hours outdoors under a strong ${ctx.monthLabel} sun.`,
    });
    add(tags.has('snorkelling') || terrain.has('island') ? 'reef-safe-sunscreen' : 'sunscreen', {
      qty: 1, priority: 'essential', category: 'destination',
      ...(tags.has('snorkelling') || terrain.has('island')
        ? { reason: 'Reef-safe formulations are required at many sites here — ordinary sunscreen damages coral.' }
        : {}),
    });
    add('uv-sunglasses', {
      qty: 1,
      priority: altitudeUV || demands.has('snow') || demands.has('snow-underfoot') ? 'essential' : 'recommended',
      category: 'destination',
      reason: altitudeUV || demands.has('snow') || demands.has('snow-underfoot')
        ? 'Snow and thin air together produce glare strong enough to cause genuine eye strain.'
        : 'Long days in open sun.',
    });
    if (!cold) add('sun-hat', {
      qty: 1,
      priority: hot || terrain.has('desert') ? 'recommended' : 'optional',
      category: 'destination',
      reason: terrain.has('desert')
        ? 'Almost no natural shade out here.'
        : 'Shade you carry with you.',
    });
    add('lip-balm', {
      qty: 1,
      priority: altitudeUV || cold ? 'essential' : 'recommended',
      category: altitudeUV || cold ? 'destination' : 'personalCare',
      reason: altitudeUV
        ? 'Cold, dry, high-altitude air cracks lips within a day — this is the single most-forgotten item on mountain trips.'
        : cold ? 'Dry cold air is hard on lips.' : 'Sun and wind exposure.',
    });
  }

  /* ------------------------- 6. Altitude ----------------------------- */

  if (ctx.highPoint >= 3000) {
    const extremeAlt = ctx.highPoint >= 4000;
    const sleepsHigh = ctx.baseElevation >= 3000;
    // Deliberately no medication recommendation here — that is a conversation
    // with a doctor, not a checklist item. The results page carries a short
    // note pointing to official guidance instead.
    add('ors', {
      qty: extremeAlt ? 6 : 4, priority: 'recommended', category: 'destination',
      reason: 'Dehydration at altitude is quick and makes altitude sickness worse.',
    });
    if (extremeAlt) add('insulated-flask', {
      qty: 1,
      priority: 'recommended',
      category: 'destination',
      reason: 'Nothing warm is sold at the top, and drinking constantly is how you stay ahead of altitude.',
    });
    if (extremeAlt) {
      if (prepared) add('hand-warmers', {
        qty: ctx.days >= 4 ? 4 : 2, priority: 'optional', category: 'destination',
        reason: 'Small, light, and disproportionately good at fixing a bad half-hour outdoors.',
      });
    }
  }

  /* --------------------- 7. Terrain & destination texture ------------- */

  if (tags.has('dusty') || terrain.has('desert') || tags.has('air-quality')) {
    add('dust-mask', {
      qty: prepared ? 2 : 1,
      priority: tags.has('air-quality') ? 'recommended' : 'optional',
      category: 'destination',
      reason: terrain.has('desert')
        ? 'Blown sand is constant here, especially in open vehicles.'
        : tags.has('air-quality')
          ? `Air quality in ${ctx.destinationName} dips sharply in ${ctx.monthLabel}.`
          : 'Dust on the roads is relentless.',
    });
    if (demands.has('gear')) {
      if (prepared) add('anti-humidity-pouch', {
        qty: 1, priority: 'optional', category: 'destination',
        reason: 'Fine dust and grit are the main threat to a camera here.',
      });
    }
  }

  if (humid) {
    if (hot && ctx.days >= 3) add('talcum', {
      qty: 1, priority: 'optional', category: 'destination',
      reason: 'Humidity plus long walking days causes chafing surprisingly fast.',
    });
    add('quick-dry-towel', {
      qty: 1, priority: 'recommended', category: 'destination',
      reason: 'Cotton barely dries in this humidity.',
    });
  }

  if (tags.has('mosquitoes') || demands.has('insects') || (humid && terrain.has('forest'))) {
    add('mosquito-repellent', {
      qty: 1, priority: 'essential', category: 'destination',
      reason: tags.has('mosquitoes')
        ? `Mosquitoes are constant around the ${terrain.has('backwater') ? 'backwaters' : 'water and greenery'} here, particularly at dusk.`
        : 'Wooded, humid areas mean biting insects from late afternoon onwards.',
    });
    add('insect-bite-cream', { qty: 1, priority: 'recommended', category: 'health' });
  }

  if (terrain.has('beach') || demands.has('swim') || demands.has('water')) {
    add('swimwear', {
      qty: qty.swimwear(ctx), priority: 'essential',
      reason: `You have ${terrain.has('beach') ? 'beach time' : 'water activities'} planned.`,
    });
    add('flip-flops', { qty: 1, priority: 'essential', reason: 'Hot sand, wet floors and casual evenings.' });
    add('cover-up', { qty: 1, priority: minimal ? 'optional' : 'recommended', reason: 'For walking between the beach and everywhere else.' });
    add('waterproof-phone-pouch', {
      qty: 1, priority: 'recommended', category: 'destination',
      reason: 'Sand and salt water end phones more often than theft does.',
    });
    if (prepared) add('salt-rinse-cloth', { qty: 1, priority: 'optional', category: 'destination' });
    if (demands.has('swim') && !minimal) {
      add('quick-dry-towel', { qty: 1, priority: 'recommended' });
    }
  }

  if (tags.has('geothermal-pools')) {
    add('swimwear', {
      qty: qty.swimwear(ctx), priority: 'essential', category: 'destination',
      reason: 'Geothermal pools are part of ordinary daily life here — you will want this more than once.',
    });
  }

  if (tags.has('saltwater')) {
    add('zip-bags', { qty: 1, priority: 'optional', reason: 'Salt and sand get into everything otherwise.' });
  }

  if (ctx.diurnalSwing >= 15 || tags.has('huge-diurnal-swing')) {
    add('fleece', {
      qty: Math.max(1, mids), priority: 'essential',
      reason: `Temperatures here swing about ${round(ctx.diurnalSwing)}°C between day and night — layers are the only sensible answer.`,
    });
  }

  /* ------------------------- 8. Culture & etiquette ------------------- */

  const modest = tags.has('temple-etiquette') || demands.has('modest-dress')
    || tags.has('modest-dress-public') || tags.has('modest-dress-local-islands');
  if (modest) {
    const placeRef = ctx.places.find((p) => p.signals.includes('modest-dress'))?.name;
    add('modest-layer', {
      qty: 1, priority: 'recommended', category: 'destination',
      reason: placeRef
        ? `${placeRef} and similar sites expect covered shoulders and knees — a scarf handles it without changing outfits.`
        : `Religious sites around ${ctx.destinationName} expect covered shoulders and knees.`,
    });
    if (terrain.has('island') || terrain.has('beach')) {
      add('sarong', { qty: 1, priority: 'recommended', category: 'destination', reason: 'Doubles as a cover-up, a towel and a temple wrap.' });
    }
  }

  if (demands.has('shoes-off') || tags.has('shoes-off-indoors') || tags.has('barefoot-zones')) {
    add('socks', { qty: qty.socks(ctx) + 1, priority: 'essential' });
    add('slippers', {
      qty: 1, priority: 'recommended', category: 'destination',
      reason: tags.has('barefoot-zones')
        ? 'Shoes come off constantly at the ghats and temples — slip-ons save real time.'
        : 'Shoes come off often indoors here.',
    });
  }

  /* ---------------------------- 9. Footwear --------------------------- */

  add('walking-shoes', {
    qty: 1, priority: 'essential',
    reason: tags.has('steep-streets')
      ? `${ctx.destinationName} is built on a slope — you will be walking uphill more than you expect.`
      : tags.has('walking-city')
        ? `${ctx.destinationName} is a walking city; long days on hard pavement are the norm.`
        : demands.has('long-walking')
          ? 'Your plans involve a lot of walking.'
          : 'The one thing worth getting right — break them in before you travel.',
  });

  // Exactly one sturdy pair. Shoes are the heaviest thing in most bags, so the
  // choice is either insulated or grippy — carrying both is the classic mistake.
  const needsSturdyPair = demands.has('trail') || demands.has('exertion')
    || terrain.has('mountain') || demands.has('snow-underfoot');

  if (needsSturdyPair) {
    const snowUnderfoot = demands.has('snow-underfoot') || demands.has('snow');
    const wantsInsulated = deepCold || (excursionFreezing && snowUnderfoot);

    if (wantsInsulated) {
      add('winter-boots', {
        qty: 1,
        priority: deepCold ? 'essential' : 'recommended',
        category: 'destination',
        reason: `Snow and slush are likely at ${listNames(highPlaces(ctx)) || `${ctx.highPoint.toLocaleString()} m`}, and the ground is uneven — wet feet in sub-zero conditions is the fastest way to cut a day short.`,
      });
    } else {
      const serious = demands.has('trail') && (demands.has('exertion') || ctx.highPoint > 3000);
      add('trekking-shoes', {
        qty: 1,
        priority: serious ? 'essential' : 'recommended',
        category: 'destination',
        reason: serious
          ? 'Ankle support and grip on loose, uneven ground — ordinary trainers slide.'
          : 'Useful for uneven ground and wet stone steps.',
      });
    }

    if (demands.has('trail')) {
      add('blister-plasters', {
        qty: 1, priority: 'recommended', category: 'health',
        reason: 'Long descents cause more blisters than climbs do.',
      });
    }
  }

  if (hot || terrain.has('beach') || humid) {
    add('sandals', { qty: 1, priority: humid ? 'recommended' : 'optional', reason: 'Something breathable for the end of the day.' });
  }
  if (intensity !== 'high' || prepared) {
    add('slippers', { qty: 1, priority: 'optional', reason: 'For the room, and for shared bathrooms.' });
  }

  if (demands.has('dress-up') || demands.has('evening-social')) {
    add('going-out-outfit', { qty: minimal ? 1 : 2, priority: 'recommended', reason: 'You have nightlife planned — one outfit that is not travel-worn.' });
    if (prepared) add('dress-shoes', { qty: 1, priority: 'optional', reason: 'Only if the places you have in mind expect it.' });
  }

  /* -------------------------- 10. Personal care ----------------------- */

  add('toothbrush', { qty: 1, priority: 'essential' });
  add('toothpaste', { qty: 1, priority: 'essential' });
  add('face-wash', { qty: 1, priority: 'recommended' });
  add('soap', { qty: 1, priority: minimal ? 'optional' : 'recommended', reason: minimal ? 'Most hotels provide this.' : undefined });
  if (ctx.days >= 3) add('shampoo', { qty: 1, priority: 'recommended' });
  add('deodorant', { qty: 1, priority: 'recommended' });
  add('hand-sanitiser', { qty: 1, priority: 'recommended' });
  add('tissues', { qty: 1, priority: 'recommended' });
  if (demands.has('long-transit') || prepared) {
    add('wet-wipes', { qty: 1, priority: demands.has('long-transit') ? 'recommended' : 'optional', reason: demands.has('long-transit') ? 'Long road days with few clean stops.' : undefined });
  }
  add('comb', { qty: 1, priority: 'optional' });
  if (prepared || ctx.days >= 5) add('razor', { qty: 1, priority: 'optional' });
  if (prepared) add('nail-clipper', { qty: 1, priority: 'optional' });
  add('toiletry-bag', { qty: 1, priority: 'recommended', reason: 'Keeps liquids away from clothes if something opens in transit.' });

  add(cold || ctx.goesHigh || terrain.has('desert') ? 'heavy-moisturiser' : 'moisturiser', {
    qty: 1,
    priority: cold || ctx.goesHigh ? 'recommended' : 'optional',
    reason: cold || ctx.goesHigh
      ? 'Cold, dry air at altitude strips skin much faster than you would expect.'
      : terrain.has('desert') ? 'Dry desert air is hard on skin.' : undefined,
  });

  if (!highUV) add('lip-balm', { qty: 1, priority: cold ? 'recommended' : 'optional' });

  if (ctx.days >= 6 || ctx.laundryAvailable) {
    add('laundry-soap', {
      qty: 1, priority: 'optional',
      reason: `Over ${ctx.days} days, rinsing a few things extends what you carry.`,
    });
    if (prepared) add('laundry-bag', { qty: 1, priority: 'optional' });
  }

  if (noteSignals.contactLenses) {
    add('contact-supplies', { qty: 1, priority: 'essential', reason: 'You mentioned lenses — carry spares and solution, plus a backup pair of glasses.' });
  }
  if (noteSignals.period) {
    add('menstrual-supplies', { qty: 1, priority: 'essential', reason: 'Your preferred brand may not be available locally.' });
  }

  /* ---------------------------- 11. Health ---------------------------- */

  add('prescription-meds', {
    qty: 1, priority: 'essential',
    reason: noteSignals.medication
      ? `You mentioned medication — carry ${qty.medicationDays(ctx)} days' worth in your hand luggage, plus the prescription.`
      : `Carry ${qty.medicationDays(ctx)} days' worth — a couple of days more than the trip, in case of delays.`,
  });
  add('painkillers', { qty: 1, priority: 'recommended' });
  add('band-aids', { qty: 1, priority: 'recommended' });
  add('stomach-meds', {
    qty: 1,
    priority: demands.has('casual-social') || ctx.international || tags.has('street-food') ? 'essential' : 'recommended',
    reason: tags.has('street-food') || demands.has('casual-social')
      ? 'New food, new water — the most common way a trip gets derailed.'
      : 'Worth having before you need it.',
  });
  add('cold-meds', { qty: 1, priority: cold ? 'recommended' : 'optional', reason: cold ? 'Temperature swings and cold wind make a sore throat likely.' : undefined });

  if (demands.has('long-transit') || terrain.has('mountain') || demands.has('vehicle') || demands.has('boat-travel')) {
    add('motion-sickness', {
      qty: 1, priority: terrain.has('mountain') ? 'recommended' : 'optional', category: 'health',
      reason: terrain.has('mountain')
        ? `The roads to ${listNames(highPlaces(ctx)) || ctx.destinationName} are steep and full of switchbacks.`
        : 'Long journeys on unfamiliar transport.',
    });
  }

  if (prepared || demands.has('remote')) {
    add('first-aid-kit', {
      qty: 1, priority: demands.has('remote') ? 'recommended' : 'optional',
      reason: demands.has('remote') ? 'Help is a long way off on parts of this route.' : undefined,
    });
  }
  if (cold && prepared) add('throat-lozenges', { qty: 1, priority: 'optional' });

  /* --------------------------- 12. Activity gear ---------------------- */

  add('daypack', {
    qty: 1,
    priority: demands.has('long-walking') || demands.has('trail') ? 'essential' : 'recommended',
    reason: demands.has('trail')
      ? 'Somewhere for water, layers and a camera while the main bag stays behind.'
      : 'For daily outings, so the main bag stays at the hotel.',
  });

  // Skip the bottle entirely where the insulated flask already covers it.
  if (ctx.highPoint < 4000) add('reusable-bottle', {
    qty: 1,
    priority: demands.has('trail') || hot || ctx.highPoint >= 3000 ? 'essential' : 'recommended',
    category: 'destination',
    reason: ctx.highPoint >= 3000
      ? 'Staying hydrated is the single best defence against altitude sickness.'
      : hot ? `Daytime highs near ${round(ctx.tempMax)}°C — you will drink more than you think.`
        : tags.has('expensive-water') ? 'Bottled water here is genuinely expensive; tap water is safe.'
          : 'Cheaper and less wasteful than buying bottles all day.',
  });

  if (demands.has('trail')) {
    add('trekking-poles', {
      qty: prepared ? 1 : 0, priority: 'optional',
      reason: 'Mostly worth it for long descents, which is where knees suffer.',
    });
    add('headlamp', {
      qty: 1, priority: demands.has('outdoor-overnight') ? 'essential' : 'recommended',
      reason: demands.has('outdoor-overnight') ? 'Non-negotiable once you are sleeping outdoors.' : 'Trails run out of light faster than cities do.',
    });
    add('trekking-pants', { qty: Math.max(1, Math.ceil(ctx.wearDays / 4)), priority: 'recommended', reason: 'Dries in hours, not days.' });
    if (demands.has('remote')) {
      add('snacks', { qty: 1, priority: 'recommended', category: 'destination', reason: 'Long stretches between anywhere selling food.' });
    }
  }

  if (demands.has('outdoor-overnight')) {
    add('sleeping-bag', { qty: 1, priority: 'essential', reason: `Rated for at least ${round(Math.min(ctx.tempMin, ctx.highPointTempMin))}°C, which is what nights here actually reach.` });
    add('camp-mat', { qty: 1, priority: 'recommended' });
    add('camp-cutlery', { qty: 1, priority: 'recommended' });
    add('water-purification', { qty: 1, priority: 'recommended', category: 'destination' });
  }

  if (demands.has('vehicle') || tags.has('scooter-country')) {
    add('driving-licence', {
      qty: 1, priority: 'essential', category: 'essentials',
      reason: tags.has('scooter-country')
        ? `Getting around ${ctx.destinationName} usually means renting a two-wheeler — carry your licence${ctx.international ? ' and an International Driving Permit' : ''}.`
        : 'Carry the physical licence, not just a photo of it.',
    });
    if (prepared) add('helmet', {
      qty: 1, priority: 'optional', category: 'activity',
      reason: 'Rental helmets are often poor — bring your own if you have one and space allows.',
    });
    if (cold || demands.has('wind-exposure')) {
      add('riding-gloves', { qty: 1, priority: 'recommended', reason: 'Wind chill on an open vehicle is brutal on hands.' });
    }
  }

  if (demands.has('swim') && (tags.has('snorkelling') || demands.has('water'))) {
    if (prepared) {
      add('snorkel-mask', { qty: 1, priority: 'optional', reason: 'Rentals are common, but a mask that fits your face is worth carrying.' });
      add('water-shoes', { qty: 1, priority: 'optional', category: 'activity', reason: 'Coral and rocky entries are sharper than they look.' });
    }
  }

  if (demands.has('snow')) {
    add('snow-pants', { qty: 1, priority: 'recommended', category: 'activity' });
    add('ski-goggles', { qty: 1, priority: 'recommended', category: 'activity', reason: 'Glare off snow is severe, and goggles beat sunglasses in wind.' });
  }

  if (demands.has('insects')) {
    add('binoculars', { qty: 1, priority: 'optional', category: 'activity', reason: 'Most wildlife stays further away than photographs suggest.' });
  }

  if (demands.has('downtime')) {
    add('book', { qty: 1, priority: 'optional', reason: 'You said you want to slow down — worth protecting that.' });
  }
  if (prepared && (demands.has('comfort') || demands.has('exertion'))) {
    add('gym-wear', { qty: 1, priority: 'optional' });
  }

  /* ------------------------ 12b. The journey itself -------------------- */

  const { route } = ctx;
  const transfers = route.destinationChanges;

  if (route.multiStop) {
    add('daypack', {
      qty: 1, priority: 'essential', category: 'route',
      reason: `You change base ${transfers} ${transfers === 1 ? 'time' : 'times'} — a small bag keeps what you need for the day reachable while the main luggage is packed away.`,
    });
    add('transit-pouch', {
      qty: 1, priority: 'recommended', category: 'route',
      reason: 'Documents, cash, charger and medication in one place, so travel days do not mean unpacking everything.',
    });
    add('packing-cubes', {
      qty: 1, priority: 'recommended', category: 'route',
      reason: `Repacking ${transfers + 1} times is far quicker when things stay grouped.`,
    });
    add('luggage-tag', {
      qty: 1, priority: 'optional', category: 'route',
      reason: 'Bags change hands more often on a multi-stop trip.',
    });
  }

  if (intensity === 'high') {
    add('travel-outfit', {
      qty: 1, priority: 'recommended', category: 'route',
      reason: `${route.travelDays >= 2 ? `Roughly ${route.travelDays} of your ${ctx.days} days` : 'A large share of this trip'} is spent in transit. One comfortable outfit you are happy to travel in saves the rest from getting worn out.`,
    });
    add('trekking-pants', {
      qty: Math.max(1, Math.ceil(ctx.wearDays / 4)), priority: 'recommended', category: 'route',
      reason: 'Quick-dry trousers wash in a sink and dry overnight — worth more than a second heavy pair when you are moving every day or two.',
    });
    add('compression-sack', {
      qty: 1, priority: 'optional', category: 'route',
      reason: 'Bulk is the real enemy when the bag is loaded and unloaded repeatedly.',
    });
  }

  if (route.legs.some((l) => l.band?.id === 'long' || l.band?.id === 'full')) {
    const longest = route.longestLeg;
    add('layer-access-bag', {
      qty: 1, priority: 'recommended', category: 'route',
      reason: longest
        ? `${longest.from.name} to ${longest.to.name} is ${longest.band.label}${longest.band.mode === 'air' ? ' — cabins run cold, so keep a warm layer out of the hold' : ' on the road — keep a warm layer where you can reach it without stopping'}.`
        : 'Keep a warm layer reachable without opening the main bag.',
    });
    add('snacks', {
      qty: 1, priority: 'recommended', category: 'route',
      reason: route.legs.some((l) => l.band?.mode === 'air')
        ? 'Long transits rarely line up with mealtimes.'
        : 'Long road stages rarely line up with mealtimes.',
    });
    add('motion-sickness', {
      qty: 1, priority: 'recommended', category: 'health',
      reason: route.legs.some((l) => Math.abs(l.climb) > 1000 && l.band?.mode === 'road')
        ? 'Mountain roads on this route climb steeply and switch back constantly.'
        : 'Long journeys on unfamiliar transport.',
    });
  }

  // A route that crosses genuinely different environments is the case where
  // layering stops being advice and becomes the only workable answer.
  if (ctx.contrast?.mixedEnvironments || (ctx.contrast?.tempSpread ?? 0) >= 14) {
    const c = ctx.contrast;
    add('fleece', {
      qty: Math.max(1, mids), priority: 'essential', category: 'route',
      reason: c.coldest && c.hottest && c.coldest.stopName !== c.hottest.stopName
        ? `${c.hottest.stopName} reaches ${Math.round(c.hottest.tempMax)}°C while ${c.coldest.stopName} drops to ${Math.round(c.coldest.tempMin)}°C. One route, ${Math.round(c.tempSpread)}°C of range — layers are the only way to cover both.`
        : `Your route spans about ${Math.round(c.tempSpread)}°C between its warmest and coldest points.`,
    });
    add('spare-mask-buff', {
      qty: 1, priority: 'optional', category: 'route',
      reason: 'Weighs nothing and covers sun, dust and cold wind as conditions change along the way.',
    });
  }

  if (route.elevationRange >= 1500 && route.highest) {
    add('reusable-bottle', {
      qty: 1, priority: 'essential', category: 'route',
      reason: `Your route climbs from ${route.minElevation.toLocaleString()} m to ${route.maxElevation.toLocaleString()} m at ${route.highest.name}. Drinking steadily is the simplest thing that helps as you gain height.`,
    });
  }

  /* ---------------------------- 13. Extras ---------------------------- */

  add('foldable-tote', {
    qty: 1,
    priority: demands.has('carry-capacity') ? 'recommended' : 'optional',
    reason: demands.has('carry-capacity')
      ? 'You have shopping planned — this is what everything comes home in.'
      : 'Weighs nothing, solves the return journey.',
  });
  add('pen', { qty: 1, priority: ctx.international ? 'recommended' : 'optional', reason: ctx.international ? 'Immigration forms, always.' : undefined });

  if (luggage === 'backpack' || luggage === 'cabin') {
    add('packing-cubes', {
      qty: 1, priority: 'recommended',
      reason: `A ${luggage === 'backpack' ? 'backpack' : 'cabin bag'} only stays organised if things stay in groups.`,
    });
  }
  if (luggage === 'cabin') {
    add('zip-bags', { qty: 1, priority: 'recommended', reason: 'Cabin liquids need to come out at security — keep them together.' });
  }
  if (prepared && luggage !== 'backpack') {
    add('daybag-lock', { qty: 1, priority: 'optional' });
  }

  if (demands.has('long-transit')) {
    add('neck-pillow', {
      qty: 1, priority: 'recommended',
      reason: 'Long road hours are the main comfort problem on this trip.',
    });
  }
  if (demands.has('late-nights')) {
    add('eye-mask', { qty: 1, priority: 'recommended', reason: 'Late nights and early check-outs rarely agree.' });
  }

  return c.finish();
}
