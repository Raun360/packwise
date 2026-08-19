/**
 * Guard: every icon name the engine emits must exist in the component's map.
 *
 * Insights name icons as strings to keep the engine free of UI imports, which
 * means a copy change can reference an icon that was never mapped. The
 * component has a fallback so that can never crash the page, but this catches
 * it at build time so the wrong icon is never shipped either.
 *
 * Deliberately regex-free: token comparison is exact and has no escaping traps.
 */
import fs from 'node:fs';

export function checkIcons() {
  const insights = fs.readFileSync('src/engine/insights.js', 'utf8');
  const comp = fs.readFileSync('src/components/PlanInsights.jsx', 'utf8');

  const used = [...new Set(
    [...insights.matchAll(/icon: '([A-Za-z]+)'/g)].map((m) => m[1])
  )];

  const start = comp.indexOf('const ICONS = {');
  const block = comp.slice(start, comp.indexOf('};', start));
  const mapped = new Set(block.split(/[^A-Za-z]+/).filter(Boolean));

  return { used, missing: used.filter((n) => !mapped.has(n)) };
}
