import { useState, useMemo, useEffect, useRef } from 'react';
import {
  Feather, Share2, Printer, Pencil, PartyPopper, RotateCcw, SlidersHorizontal, Check,
  ArrowRight,
} from 'lucide-react';
import PackingCategory from '../components/PackingCategory.jsx';
import PackingProgress from '../components/PackingProgress.jsx';
import TripSummary from '../components/TripSummary.jsx';
import PackLightModal from '../components/PackLightModal.jsx';
import ShareSheet from '../components/ShareSheet.jsx';
import ForgotItems from '../components/ForgotItems.jsx';
import { optimise } from '../engine/optimize.js';
import { rebuild } from '../engine/plan.js';
import { CATEGORY_ORDER } from '../data/catalog.js';
import PlanInsights from '../components/PlanInsights.jsx';
import RouteSummary from '../components/RouteSummary.jsx';
import TripConsidered from '../components/TripConsidered.jsx';
import useMediaQuery from '../hooks/useMediaQuery.js';
import DestinationImage from '../components/DestinationImage.jsx';
import { track, EVENTS } from '../lib/analytics.js';

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'essential', label: 'Essential' },
  { id: 'todo', label: 'Not packed' },
];

export default function Results({ plan, setPlan, onEdit, onRestart, onToast }) {
  const { ctx, stats, items } = plan;

  const [openCats, setOpenCats] = useState(() => new Set(CATEGORY_ORDER));
  const [filter, setFilter] = useState('all');
  const [showPackLight, setShowPackLight] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [optimised, setOptimised] = useState(false);
  const [targetId, setTargetId] = useState(null);
  const fullPlanRef = useRef(null);
  const isDesktop = useMediaQuery('(min-width: 1000px)');

  const packedCount = items.filter((i) => i.packed).length;
  const allPacked = items.length > 0 && packedCount === items.length;

  const report = useMemo(() => optimise(plan), [plan]);

  // Functional update: ticking several items in quick succession must not drop
  // any of them to a stale closure. The updater itself stays pure — no side
  // effects inside it — because React's setState updaters can run more than
  // once for the same call (StrictMode double-invokes them in development
  // specifically to catch this), so a track() call placed inside one either
  // double-fires or, if it instead writes to a captured variable read right
  // after setPlan() returns, never fires at all: the updater does not run
  // synchronously within the setPlan() call, so that variable is still its
  // initial value by the time it's checked. Reading the pre-click state from
  // the item id here, before the update is queued, sidesteps both problems.
  const toggleItem = (id) => {
    const current = items.find((i) => i.id === id);
    setPlan((prev) =>
      rebuild(prev, prev.items.map((i) => (i.id === id ? { ...i, packed: !i.packed } : i)))
    );
    // Id/category/priority all come from the static catalog, not user input.
    if (current) {
      track(EVENTS.PACKING_ITEM_CHECKED, {
        item_id: current.id,
        category: current.category,
        priority: current.priority,
        checked: !current.packed,
      });
    }
  };

  const applyOptimisation = () => {
    fullPlanRef.current = plan;
    setPlan((prev) => rebuild(prev, report.items));
    setOptimised(true);
    setShowPackLight(false);
    onToast(`Trimmed to ${report.after.total} items · ${report.after.weight.toFixed(1)} kg`);
    track(EVENTS.PACK_LIGHT_USED, {
      items_before: report.before.total,
      items_after: report.after.total,
      items_removed: Math.max(0, report.before.total - report.after.total),
      weight_saved_kg: Math.round((report.before.weight - report.after.weight) * 10) / 10,
    });
  };

  const revert = () => {
    if (!fullPlanRef.current) return;
    setPlan(fullPlanRef.current);
    setOptimised(false);
    onToast('Full list restored');
  };

  /** Jump to an item, opening its category and flagging it briefly. */
  const jumpTo = (item) => {
    setFilter('all');
    setOpenCats((prev) => new Set(prev).add(item.category));
    setTargetId(item.id);
    requestAnimationFrame(() => {
      const el = document.getElementById(`item-${item.id}`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  };

  useEffect(() => {
    if (!targetId) return;
    const t = setTimeout(() => setTargetId(null), 1600);
    return () => clearTimeout(t);
  }, [targetId]);

  const visibleCategories = useMemo(() => {
    if (filter === 'all') return plan.categories;
    return plan.categories
      .map((c) => ({
        ...c,
        items: c.items.filter((i) =>
          filter === 'essential' ? i.priority === 'essential' : !i.packed
        ),
      }))
      .filter((c) => c.items.length > 0);
  }, [plan.categories, filter]);

  const toggleCat = (id) => {
    setOpenCats((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const monthAndPlace = [
    `${ctx.days} ${ctx.days === 1 ? 'day' : 'days'}`,
    ctx.route.multiStop
      ? `${ctx.route.destinationCount} destinations`
      : ctx.destinationName,
    ctx.monthLabel,
  ].join(' · ');

  /**
   * Cards that belong beside the list on desktop but below it on a phone —
   * "what am I forgetting" only makes sense once you have worked through it.
   */
  const PackLightCard = () => (
    <div className="card packlight-card">
      {optimised && (
        <span className="packlight-active">
          <Check aria-hidden="true" />Lighter list active
        </span>
      )}
      <h3><Feather aria-hidden="true" />Pack light</h3>

      {optimised || report.noop ? (
        <div className="packlight-weight">
          <span className="n">{stats.weight.toFixed(1)}</span>
          <span className="u">kg estimated</span>
        </div>
      ) : (
        <div className="packlight-swap">
          <span className="pw-now tnum">{report.before.weight.toFixed(1)}</span>
          <ArrowRight className="pw-arrow" aria-hidden="true" />
          <span className="pw-after tnum">{report.after.weight.toFixed(1)}</span>
          <span className="pw-unit">kg</span>
        </div>
      )}

      <p>
        {optimised
          ? 'You are on the trimmed list. You can go back to the full one any time.'
          : report.noop
            ? 'Your list is already about as lean as this trip allows.'
            : `Drop ${report.savedWeight.toFixed(1)} kg and ${report.savedItems} ${report.savedItems === 1 ? 'item' : 'items'} without losing an essential. We'll show you exactly what changed.`}
      </p>
      <button className="btn" onClick={() => setShowPackLight(true)}>
        {optimised ? 'Review the changes' : 'Optimise my bag'}
      </button>
    </div>
  );

  const RailSecondary = () => (
    <>
      <ForgotItems items={items} onJump={jumpTo} />
      <div className="card card-pad">
        <div className="eyebrow" style={{ marginBottom: 'var(--s-3)' }}>This list</div>
        <p className="small muted" style={{ marginBottom: 'var(--s-4)' }}>
          {stats.total} items across {plan.categories.length} categories, weighing about{' '}
          {stats.weight.toFixed(1)} kg packed.
        </p>
        <button className="btn btn-secondary btn-block btn-sm" onClick={() => window.print()}>
          <Printer size={14} aria-hidden="true" />Print or save as PDF
        </button>
        <button
          className="btn btn-ghost btn-block btn-sm"
          style={{ marginTop: 'var(--s-2)' }}
          onClick={onRestart}
        >
          Plan a different trip
        </button>
      </div>
    </>
  );

  return (
    <div className="results has-mobile-bar">
      <div className="shell">
        {/* Print-only header — the screen header is hidden on paper */}
        <div className="print-only print-head">
          <div className="brandline">Packwise</div>
          <h1>{ctx.route.multiStop ? ctx.routeLabel : ctx.destinationName}</h1>
          <div className="meta">
            {ctx.origin && !ctx.route.multiStop && <span>{ctx.origin} → {ctx.destinationName}</span>}
            <span>{ctx.days} days · {ctx.nights} nights</span>
            <span>{ctx.monthLabel}</span>
            <span>{stats.total} items</span>
            <span>~{stats.weight.toFixed(1)} kg</span>
          </div>
        </div>

        <DestinationImage
          query={ctx.primary?.name}
          className="results-hero no-print"
          showCredit
        />

        <header className="results-head no-print">
          <h1 className="h1">Your packing plan is ready.</h1>
          <p className="results-sub">{monthAndPlace}</p>

          <div className="summary-strip">
            <div className="summary-figure">
              <span className="n tnum">{stats.total}</span>
              <span className="l">items</span>
            </div>
            <div className="summary-figure">
              <span className="n tnum">{stats.weight.toFixed(1)}</span>
              <span className="l">kg estimated</span>
            </div>
            <div className="summary-breakdown">
              <span><span className="dot essential" aria-hidden="true" /><b className="tnum">{stats.essential}</b> essential</span>
              <span><span className="dot recommended" aria-hidden="true" /><b className="tnum">{stats.recommended}</b> recommended</span>
              <span><span className="dot optional" aria-hidden="true" /><b className="tnum">{stats.optional}</b> optional</span>
            </div>
          </div>
        </header>

        <TripConsidered ctx={ctx} />

        <PlanInsights ctx={ctx} />

        <div className="results-toolbar no-print">
          <div className="filter-group" role="group" aria-label="Filter items">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                className="filter-btn"
                aria-pressed={filter === f.id}
                onClick={() => setFilter(f.id)}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="toolbar-spacer" />
          {optimised && (
            <button className="btn btn-sm btn-ghost" onClick={revert}>
              <RotateCcw size={14} aria-hidden="true" />Full list
            </button>
          )}
          <button className="btn btn-sm btn-secondary" onClick={onEdit}>
            <Pencil size={14} aria-hidden="true" />Edit trip
          </button>
          <button className="btn btn-sm btn-secondary" onClick={() => setShowShare(true)}>
            <Share2 size={14} aria-hidden="true" />Share
          </button>
        </div>

        <div className="results-layout">
          <aside className="rail no-print">
            {isDesktop && <RouteSummary ctx={ctx} />}
            {isDesktop && <TripSummary ctx={ctx} />}
            <PackingProgress stats={stats} packedCount={packedCount} />

            {/* On a phone the sticky bar already carries Pack Light, so the card
                and the secondary cards move below the list. */}
            {isDesktop && (
              <>
                <PackLightCard />
                <RailSecondary />
              </>
            )}
          </aside>

          <main className="list-col">
            {allPacked && (
              <div className="done-banner no-print">
                <PartyPopper aria-hidden="true" />
                <div>
                  <strong>Everything is packed.</strong>
                  <span>{stats.total} items · about {stats.weight.toFixed(1)} kg. Have a good trip.</span>
                </div>
              </div>
            )}

            <div className="category-stack">
              {visibleCategories.map((cat) => (
                <PackingCategory
                  key={cat.id}
                  category={cat}
                  open={openCats.has(cat.id) || filter !== 'all'}
                  onToggleOpen={() => toggleCat(cat.id)}
                  onToggleItem={toggleItem}
                  targetId={targetId}
                />
              ))}
            </div>

            {visibleCategories.length === 0 && (
              <div className="card filter-empty">
                <SlidersHorizontal aria-hidden="true" />
                <p>
                  {filter === 'todo'
                    ? 'Nothing left unpacked — that is the whole list ticked off.'
                    : 'Nothing matches this filter.'}
                </p>
                <button className="btn btn-secondary btn-sm" onClick={() => setFilter('all')}>
                  Show everything
                </button>
              </div>
            )}

            <div className="print-only print-foot">
              Generated by Packwise · {stats.essential} essential, {stats.recommended} recommended,{' '}
              {stats.optional} optional · estimated {stats.weight.toFixed(1)} kg
            </div>

            {!isDesktop && (
              <div className="rail-after no-print">
                <PackLightCard />
                <RouteSummary ctx={ctx} />
                <TripSummary ctx={ctx} />
                <RailSecondary />
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Mobile summary bar */}
      <div className="mobile-bar no-print">
        <div className="mobile-bar-progress">
          <div className="mobile-bar-top">
            <span className="mobile-bar-count tnum">{packedCount}/{stats.total} packed</span>
            <span className="mobile-bar-weight tnum">~{stats.weight.toFixed(1)} kg</span>
          </div>
          <div className="progress-track">
            <div
              className={`progress-fill${allPacked ? ' complete' : ''}`}
              style={{ width: `${stats.total ? (packedCount / stats.total) * 100 : 0}%` }}
            />
          </div>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowPackLight(true)}>
          <Feather size={14} aria-hidden="true" />Pack light
        </button>
      </div>

      {showPackLight && (
        <PackLightModal
          report={report}
          applied={optimised}
          onApply={applyOptimisation}
          onClose={() => setShowPackLight(false)}
        />
      )}

      {showShare && (
        <ShareSheet plan={plan} onClose={() => setShowShare(false)} onToast={onToast} />
      )}
    </div>
  );
}
