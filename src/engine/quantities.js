/**
 * Quantity math.
 *
 * Guiding line: enough to stay comfortable, not enough to fill the suitcase.
 *
 * Nothing here is keyed to a destination. Counts fall out of days of wear,
 * how much the climate makes you change, whether laundry is possible, how much
 * margin the traveller asked for, and how much the trip moves around.
 *
 * The bias is deliberately toward packing less. A five-day trip needs four or
 * five pairs of underwear, not seven; two pairs of trousers, not five.
 */

export const STYLE_FACTOR = {
  minimal: 0.75,
  balanced: 1,
  prepared: 1.2,
};

export const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));

/**
 * Total tops per day — t-shirts and long-sleeved shirts combined.
 * Below 1.0 because outer layers get re-worn; only the layer against your
 * skin needs changing daily, and in the cold even that stretches.
 */
function topsPerDay(ctx) {
  const byThermal = {
    freezing: 0.75,
    cold: 0.9,
    cool: 0.9,
    mild: 0.95,
    warm: 1,
    hot: 1.1,
  };
  let rate = byThermal[ctx.thermal] ?? 0.7;
  if (ctx.zones?.has('wet') || ctx.zones?.has('tropical')) rate += 0.1;
  if (ctx.demands?.has('exertion')) rate += 0.05;
  if (ctx.noteSignals?.heatSensitive) rate += 0.1;
  return rate;
}

/** Share of the tops budget that should be long-sleeved. */
const LONG_SLEEVE_SHARE = {
  freezing: 0.55, cold: 0.5, cool: 0.4, mild: 0.25, warm: 0.15, hot: 0.15,
};

const styled = (n, ctx, { min = 1, max = 99 } = {}) =>
  clamp(Math.round(n * STYLE_FACTOR[ctx.style]), min, max);

/* ------------------------------------------------------------------ */

export const qty = {
  /**
   * Underwear.
   *
   * Minimal assumes rinsing a pair through; balanced carries one fewer than
   * the number of days, which is what most people actually do; prepared adds
   * a single spare. A five-day trip lands on 4 / 4 / 6 — never 7.
   */
  underwear(ctx) {
    const d = ctx.wearDays;
    if (ctx.style === 'minimal') return clamp(Math.ceil(d * 0.7), 3, 6);
    if (ctx.style === 'prepared') return clamp(d + 1, 3, 9);
    return clamp(d <= 2 ? d : d - 1, 3, 7);
  },

  /**
   * Socks track underwear, then take account of the things that actually ruin
   * a pair: walking all day, cold, and wet ground.
   */
  socks(ctx) {
    let n = qty.underwear(ctx);
    if (ctx.demands?.has('trail') || ctx.demands?.has('long-walking')) n += 1;
    // Moving between bases means travel days in shoes for hours at a stretch.
    if (ctx.intensity === 'high') n += 1;
    if (ctx.rainIntensity === 'heavy' || ctx.rainIntensity === 'extreme') n += 1;
    if (ctx.style === 'minimal') n -= 1;
    // Never more than a couple of spare pairs beyond the underwear count.
    return clamp(Math.min(n, qty.underwear(ctx) + 2), 3, 7);
  },

  /** Tops budgeted as one total, then split by climate. */
  topSplit(ctx) {
    const total = styled(Math.round(ctx.wearDays * topsPerDay(ctx)), ctx, { min: 2, max: 7 });
    const share = LONG_SLEEVE_SHARE[ctx.thermal] ?? 0.3;
    const longSleeve = Math.round(total * share);
    return { tshirts: Math.max(1, total - longSleeve), longSleeve, total };
  },

  /**
   * Bottoms are re-worn for days at a time — never one pair per day.
   * Three is plenty for almost any trip.
   */
  bottoms(ctx) {
    const base = ctx.wearDays <= 3 ? 1 : ctx.wearDays <= 7 ? 2 : 3;
    const n = ctx.style === 'prepared' ? base + 1 : base;
    return clamp(n, 1, 3);
  },

  shorts(ctx) {
    const base = ctx.wearDays <= 3 ? 1 : ctx.wearDays <= 6 ? 2 : 3;
    return clamp(ctx.style === 'minimal' ? base - 1 : base, 1, 3);
  },

  /**
   * Insulating mid-layers, driven by the conditions you live in rather than a
   * short stop at a pass. One versatile layer covers most trips.
   */
  midLayers(ctx) {
    const base = ctx.tempMin;
    let n = base <= 0 ? 2 : base <= 12 ? 1 : base <= 17 ? 1 : 0;
    // A cold excursion adds one layer, not a second wardrobe.
    if (ctx.goesHigh && ctx.highPointTempMin <= 0 && n < 2) n += 1;
    if (ctx.style === 'minimal' && n > 1) n -= 1;
    if (ctx.noteSignals?.coldSensitive && base <= 15) n += 1;
    // Carrying bulk repeatedly is its own cost.
    if (ctx.intensity === 'high' && n > 1 && ctx.style !== 'prepared') n -= 1;
    return clamp(n, 0, 2);
  },

  /** One thermal set covers a cold excursion; sustained cold justifies two. */
  thermals(ctx) {
    const base = ctx.tempMin;
    const peak = ctx.goesHigh ? ctx.highPointTempMin : base;
    if (base > 12 && peak > 0) return 0;
    if (base > 0) return 1;
    return ctx.wearDays >= 5 ? 2 : 1;
  },

  woolSocks(ctx) {
    const base = ctx.thermal === 'freezing' ? 2 : 1;
    return clamp(ctx.style === 'prepared' ? base + 1 : base, 1, 3);
  },

  nightwear(ctx) {
    return ctx.wearDays <= 5 ? 1 : 2;
  },

  swimwear(ctx) {
    return ctx.wearDays >= 4 && ctx.style !== 'minimal' ? 2 : 1;
  },

  dresses(ctx) {
    return styled(Math.ceil(ctx.wearDays * 0.35), ctx, { min: 1, max: 3 });
  },

  /** Days of medication, with a margin for delayed travel. */
  medicationDays(ctx) {
    return ctx.days + (ctx.style === 'minimal' ? 1 : 2);
  },
};

/** Rough weight of the packed bag, for the estimate we show. */
export function estimateWeight(items) {
  return items.reduce((sum, i) => sum + (i.weight || 0) * (i.quantity || 1), 0);
}

export const LUGGAGE_LIMITS = {
  backpack: { label: 'Backpack', comfortable: 8, max: 11 },
  cabin: { label: 'Cabin bag', comfortable: 7, max: 10 },
  suitcase: { label: 'Suitcase', comfortable: 15, max: 23 },
};
