import { useState, useRef, useEffect, useId, useCallback } from 'react';
import { Search, MapPin, X, Navigation, Loader2, Mountain, Waves, Landmark, Building2 } from 'lucide-react';
import { searchPlaces, kindLabel } from '../engine/geocode.js';

const KIND_ICON = {
  lake: Waves, coast: Waves, beach: Waves, island: Waves,
  mountain: Mountain, peak: Mountain, pass: Mountain, glacier: Mountain, valley: Mountain,
  landmark: Landmark, park: Landmark, waterfall: Landmark, cave: Landmark, spring: Landmark,
  city: Building2, town: Building2, village: Building2, region: Building2,
};

/**
 * Real place search.
 *
 * Results carry coordinates and elevation, which is the whole point: a typed
 * string cannot tell us that Pelling is at 2,150 m and Kaza at 3,800 m, and
 * every distance, climate and altitude judgement downstream depends on it.
 */
export default function PlaceSearch({
  onSelect,
  placeholder = 'Search for a place…',
  icon = 'search',
  autoFocus = false,
  value: controlledValue,
  onTextChange,
  size = 'lg',
  id: idProp,
  describedBy,
  invalid = false,
}) {
  const reactId = useId();
  const id = idProp || reactId;

  const [query, setQuery] = useState(controlledValue ?? '');
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [offline, setOffline] = useState(false);

  const wrapRef = useRef(null);
  const inputRef = useRef(null);
  const debounce = useRef(null);
  const requestSeq = useRef(0);

  useEffect(() => {
    if (controlledValue != null) setQuery(controlledValue);
  }, [controlledValue]);

  useEffect(() => {
    const onDocDown = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocDown);
    return () => document.removeEventListener('mousedown', onDocDown);
  }, []);

  const run = useCallback(async (q) => {
    const seq = ++requestSeq.current;
    setLoading(true);
    const { results: hits, remote } = await searchPlaces(q);
    // Ignore anything that came back out of order.
    if (seq !== requestSeq.current) return;
    setResults(hits);
    setOffline(!remote);
    setOpen(true);
    setActive(-1);
    setLoading(false);
  }, []);

  const handleChange = (e) => {
    const v = e.target.value;
    setQuery(v);
    onTextChange?.(v);
    clearTimeout(debounce.current);
    if (v.trim().length < 2) {
      setResults([]);
      setOpen(false);
      setLoading(false);
      return;
    }
    debounce.current = setTimeout(() => run(v), 260);
  };

  const pick = (place) => {
    onSelect(place);
    setQuery('');
    setResults([]);
    setOpen(false);
    setActive(-1);
    onTextChange?.('');
    inputRef.current?.focus();
  };

  const onKeyDown = (e) => {
    if (e.key === 'Escape') { setOpen(false); return; }
    if (!open || !results.length) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((i) => (i + 1) % results.length); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((i) => (i - 1 + results.length) % results.length); }
    else if (e.key === 'Enter' && active >= 0) { e.preventDefault(); pick(results[active]); }
  };

  const Icon = icon === 'pin' ? MapPin : icon === 'nav' ? Navigation : Search;
  const listId = `${id}-list`;

  return (
    <div className="combo" ref={wrapRef}>
      <div className="combo-field-wrap">
        <Icon className="combo-icon" aria-hidden="true" />
        <input
          ref={inputRef}
          id={id}
          className={`field${size === 'lg' ? ' field-lg' : ''}`}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={active >= 0 ? `${id}-opt-${active}` : undefined}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          autoComplete="off"
          spellCheck="false"
          placeholder={placeholder}
          value={query}
          onChange={handleChange}
          onKeyDown={onKeyDown}
          onFocus={() => { if (results.length) setOpen(true); }}
          autoFocus={autoFocus}
        />
        {loading && <Loader2 className="combo-spinner" aria-hidden="true" />}
        {!loading && query && (
          <button
            type="button"
            className="combo-clear"
            onClick={() => { setQuery(''); setResults([]); setOpen(false); onTextChange?.(''); inputRef.current?.focus(); }}
            aria-label="Clear"
          >
            <X aria-hidden="true" />
          </button>
        )}
      </div>

      {open && (
        <ul className="combo-list" id={listId} role="listbox">
          {results.map((r, i) => {
            const KindIcon = KIND_ICON[r.kind] || MapPin;
            return (
              <li key={r.id} role="none">
                <button
                  type="button"
                  id={`${id}-opt-${i}`}
                  role="option"
                  aria-selected={i === active}
                  className="combo-opt"
                  onMouseEnter={() => setActive(i)}
                  onClick={() => pick(r)}
                >
                  <KindIcon className="combo-opt-icon" aria-hidden="true" />
                  <span className="combo-opt-main">
                    <span className="combo-opt-name">{r.name}</span>
                    <span className="combo-opt-sub">
                      {[r.region, r.country].filter(Boolean).join(', ') || kindLabel(r.kind)}
                    </span>
                  </span>
                  <span className="combo-opt-meta">
                    {r.elevation != null && r.elevation >= 800 && (
                      <span className="combo-opt-hint tnum">{r.elevation.toLocaleString()} m</span>
                    )}
                    <span className="combo-opt-kind">{kindLabel(r.kind)}</span>
                  </span>
                </button>
              </li>
            );
          })}

          {!results.length && !loading && (
            <li className="combo-empty">
              No places found for “{query}”.
              {offline && ' The lookup service is unreachable — check your connection.'}
            </li>
          )}
          {offline && results.length > 0 && (
            <li className="combo-note">
              Showing places we know offline — the lookup service is unreachable.
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
