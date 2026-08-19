/**
 * Pack Light.
 *
 * Rather than trimming the finished list arbitrarily, this regenerates the plan
 * as if the traveller had chosen the leanest style, then applies two further
 * passes: drop optional weight that is not pulling its own, and merge items
 * that genuinely do each other's job.
 *
 * The result is a coherent list, plus an honest account of what changed.
 */

import { buildContext } from './context.js';
import { generateItems } from './rules.js';
import { groupByCategory, summarise } from './plan.js';
import { CATALOG } from '../data/catalog.js';

/**
 * Optional items lighter than this stay — they cost essentially nothing and
 * removing them would be theatre rather than saving.
 */
const KEEP_IF_LIGHTER_THAN = 0.03; // kg

/**
 * Merge groups. If every `from` id is present, they collapse into `to`.
 * `when` gates the merge on trip context.
 */
const MERGES = [
  {
    from: ['fleece', 'warm-jacket'],
    to: 'warm-jacket',
    label: 'Fleece + insulated jacket → one insulated jacket',
    note: 'Worn over a thermal base layer, the jacket alone covers the same range.',
    when: (ctx) => ctx.tempMin > -2 && !ctx.goesHigh,
  },
  {
    from: ['warm-jacket', 'heavy-parka'],
    to: 'heavy-parka',
    label: 'Insulated jacket + parka → one parka',
    note: 'The parka does everything the lighter jacket does.',
  },
  {
    from: ['rain-jacket', 'windcheater'],
    to: 'rain-jacket',
    label: 'Rain jacket + windproof shell → one rain jacket',
    note: 'A rain shell blocks wind just as well.',
  },
  {
    from: ['walking-shoes', 'trekking-shoes'],
    to: 'trekking-shoes',
    label: 'Walking shoes + trekking shoes → one pair of trekking shoes',
    note: 'Shoes are the heaviest thing in most bags. Trekking shoes handle streets too.',
    when: (ctx) => ctx.demands.has('trail'),
  },
  {
    from: ['walking-shoes', 'winter-boots'],
    to: 'winter-boots',
    label: 'Walking shoes + boots → one pair of boots',
    note: 'Wear the boots in transit. They are the heaviest item either way.',
  },
  {
    from: ['jeans', 'trekking-pants'],
    to: 'trekking-pants',
    label: 'Jeans + quick-dry trousers → quick-dry trousers only',
    note: 'Jeans are the heaviest thing you can pack and take two days to dry. Quick-dry trousers do both jobs.',
    when: (ctx) => ctx.demands.has('trail'),
  },
  {
    from: ['sandals', 'flip-flops'],
    to: 'flip-flops',
    label: 'Sandals + flip-flops → one pair',
    note: 'Two open-toe options is one more than the trip needs.',
  },
  {
    from: ['slippers', 'flip-flops'],
    to: 'flip-flops',
    label: 'Slippers + flip-flops → one pair',
    note: 'Flip-flops cover the room and the beach.',
  },
  {
    from: ['soap', 'shampoo'],
    to: 'soap',
    label: 'Soap + shampoo → one combined wash',
    note: 'A single 2-in-1 bottle, or whatever the hotel provides.',
  },
  {
    from: ['moisturiser', 'heavy-moisturiser'],
    to: 'heavy-moisturiser',
    label: 'Two moisturisers → one',
    note: 'The richer one covers both jobs.',
  },
  {
    from: ['sunscreen', 'reef-safe-sunscreen'],
    to: 'reef-safe-sunscreen',
    label: 'Two sunscreens → one reef-safe bottle',
    note: 'Reef-safe works everywhere; the reverse is not true.',
  },
  {
    from: ['quick-dry-towel', 'sarong'],
    to: 'sarong',
    label: 'Towel + sarong → one sarong',
    note: 'A sarong dries you, covers you and doubles as a beach mat.',
  },
  {
    from: ['umbrella', 'rain-jacket'],
    to: 'rain-jacket',
    label: 'Umbrella + rain jacket → one rain jacket',
    note: 'Hands free, and nothing to leave behind in a café.',
    when: (ctx) => ctx.demands.has('trail') || ctx.luggage === 'backpack',
  },
  {
    from: ['insulated-flask', 'reusable-bottle'],
    to: 'insulated-flask',
    label: 'Flask + bottle → one insulated flask',
    note: 'It holds cold water just as well as hot.',
  },
];

const byId = (items) => new Map(items.map((i) => [i.id, i]));

/**
 * @param {object} plan  the current plan
 * @returns {object} optimisation report
 */
export function optimise(plan) {
  const { ctx } = plan;
  const before = summarise(plan.items);
  const originals = byId(plan.items);

  // Pass 1 — regenerate at the leanest style, keeping every other input.
  const leanCtx = buildContext({ ...ctx.trip, travelStyle: 'minimal' }, ctx.climates);
  let items = generateItems(leanCtx).map((i) => {
    const prev = originals.get(i.id);
    // Preserve what the traveller has already ticked off.
    return prev ? { ...i, packed: prev.packed } : i;
  });

  // Pass 2 — drop optional items that cost real space.
  const dropped = [];
  items = items.filter((i) => {
    if (i.priority !== 'optional') return true;
    if (i.weight < KEEP_IF_LIGHTER_THAN) return true;
    if (i.packed) return true; // already in the bag; leave the decision alone
    dropped.push(i);
    return false;
  });

  // Pass 3 — merge overlapping items.
  const combined = [];
  const map = byId(items);
  for (const merge of MERGES) {
    if (merge.when && !merge.when(leanCtx)) continue;
    const present = merge.from.filter((id) => map.has(id));
    if (present.length < 2 || !map.has(merge.to)) continue;

    const losers = present.filter((id) => id !== merge.to);
    if (!losers.length) continue;
    // Never silently discard something the traveller has already packed.
    if (losers.some((id) => map.get(id).packed)) continue;

    losers.forEach((id) => map.delete(id));
    combined.push({
      label: merge.label,
      note: merge.note,
      keptId: merge.to,
      removedIds: losers,
      savedWeight: losers.reduce((w, id) => w + (CATALOG[id]?.w || 0), 0),
    });
  }
  items = [...map.values()];

  /* ---------------- Build the report ---------------- */
  const finalIds = new Set(items.map((i) => i.id));
  const mergedAway = new Set(combined.flatMap((c) => c.removedIds));

  const removed = [];
  const reduced = [];

  for (const orig of plan.items) {
    if (mergedAway.has(orig.id)) continue; // reported under "combined"
    if (!finalIds.has(orig.id)) {
      removed.push({
        id: orig.id,
        name: orig.name,
        quantity: orig.quantity,
        weight: orig.weight * orig.quantity,
        why: orig.priority === 'optional' ? 'Optional, and it takes real space.' : 'Not needed at this pack level.',
      });
    } else {
      const now = items.find((i) => i.id === orig.id);
      if (now && now.quantity < orig.quantity) {
        reduced.push({
          id: orig.id,
          name: orig.name,
          from: orig.quantity,
          to: now.quantity,
          unit: orig.unit,
          weight: (orig.quantity - now.quantity) * orig.weight,
        });
      }
    }
  }

  removed.sort((a, b) => b.weight - a.weight);
  reduced.sort((a, b) => b.weight - a.weight);

  const kept = items
    .filter((i) => i.priority === 'essential')
    .sort((a, b) => b.weight * b.quantity - a.weight * a.quantity)
    .slice(0, 6)
    .map((i) => ({ id: i.id, name: i.name, quantity: i.quantity }));

  const after = summarise(items);

  return {
    items,
    categories: groupByCategory(items),
    stats: after,
    before,
    after,
    removed,
    reduced,
    combined,
    kept,
    savedWeight: Math.max(0, before.weight - after.weight),
    savedItems: Math.max(0, before.total - after.total),
    /** True when there was genuinely nothing worth trimming. */
    noop: before.total === after.total && Math.abs(before.weight - after.weight) < 0.05,
  };
}
