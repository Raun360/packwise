/**
 * Plan assembly.
 *
 * Turns a trip + optional weather reading into the object the UI renders:
 * context, flat item list, grouped categories and summary statistics.
 */

import { buildContext } from './context.js';
import { generateItems, PRIORITY } from './rules.js';
import { CATEGORY_ORDER, CATEGORY_MAP } from '../data/catalog.js';
import { estimateWeight } from './quantities.js';

export function summarise(items) {
  const counts = { essential: 0, recommended: 0, optional: 0 };
  for (const i of items) counts[i.priority] = (counts[i.priority] || 0) + 1;
  return {
    total: items.length,
    ...counts,
    weight: estimateWeight(items),
    units: items.reduce((n, i) => n + (i.quantity || 1), 0),
  };
}

export function groupByCategory(items) {
  const groups = new Map();
  for (const item of items) {
    if (!groups.has(item.category)) groups.set(item.category, []);
    groups.get(item.category).push(item);
  }
  return CATEGORY_ORDER
    .filter((id) => groups.has(id))
    .map((id) => {
      const list = groups.get(id).slice().sort((a, b) => {
        const p = PRIORITY[b.priority] - PRIORITY[a.priority];
        return p !== 0 ? p : a.name.localeCompare(b.name);
      });
      return {
        id,
        label: CATEGORY_MAP[id].label,
        blurb: CATEGORY_MAP[id].blurb,
        items: list,
        stats: summarise(list),
      };
    });
}

/**
 * @param {object} trip      raw form state
 * @param {object} [weather] optional live weather reading
 */
export function buildPlan(trip, stopClimates = null) {
  const ctx = buildContext(trip, stopClimates);
  const items = generateItems(ctx);
  return {
    ctx,
    items,
    categories: groupByCategory(items),
    stats: summarise(items),
    generatedAt: new Date().toISOString(),
  };
}

/** Re-derive groups + stats after items change (checking, optimising). */
export function rebuild(plan, items) {
  return {
    ...plan,
    items,
    categories: groupByCategory(items),
    stats: summarise(items),
  };
}
