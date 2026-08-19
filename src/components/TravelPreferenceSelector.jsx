import { Backpack, Briefcase, Luggage } from 'lucide-react';

export const STYLES = [
  { id: 'minimal', title: 'Minimal', desc: "I'd rather pack less." },
  { id: 'balanced', title: 'Balanced', desc: 'Enough for comfort without overpacking.' },
  { id: 'prepared', title: 'Prepared', desc: "I'd rather carry a little extra than miss something." },
];

export const LUGGAGE = [
  { id: 'backpack', name: 'Backpack', cap: '~8 kg', Icon: Backpack },
  { id: 'cabin', name: 'Cabin bag', cap: '~7 kg', Icon: Briefcase },
  { id: 'suitcase', name: 'Suitcase', cap: '~15 kg', Icon: Luggage },
];

export default function TravelPreferenceSelector({
  travelStyle, luggageType, notes, onChange,
}) {
  return (
    <>
      <div className="step-section">
        <div className="pref-stack" role="group" aria-label="Packing style">
          {STYLES.map((s) => (
            <button
              key={s.id}
              type="button"
              className="pref-card"
              aria-pressed={travelStyle === s.id}
              onClick={() => onChange({ travelStyle: s.id })}
            >
              <span className="pref-radio" aria-hidden="true" />
              <span>
                <span className="pref-title">{s.title}</span>
                <span className="pref-desc">{s.desc}</span>
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="step-section">
        <h3 className="label" style={{ marginBottom: 'var(--s-3)' }}>What are you carrying?</h3>
        <div className="luggage-row" role="group" aria-label="Luggage type">
          {LUGGAGE.map(({ id, name, cap, Icon }) => (
            <button
              key={id}
              type="button"
              className="luggage-card"
              aria-pressed={luggageType === id}
              onClick={() => onChange({ luggageType: id })}
            >
              <Icon aria-hidden="true" strokeWidth={1.6} />
              <span className="name">{name}</span>
              <span className="cap">{cap}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="step-section">
        <label className="label" htmlFor="notes">
          Anything else we should know? <span className="faint" style={{ fontWeight: 400 }}>Optional</span>
        </label>
        <textarea
          id="notes"
          className="field"
          maxLength={280}
          value={notes}
          placeholder="I don't like carrying heavy clothes, and I'll have laundry at the hotel…"
          onChange={(e) => onChange({ notes: e.target.value })}
        />
        <div className="char-count">{notes.length}/280</div>
      </div>
    </>
  );
}
