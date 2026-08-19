import { ArrowRight, X, Repeat, Check, Minus } from 'lucide-react';
import Modal from './Modal.jsx';

const kg = (n) => `${n.toFixed(1)} kg`;

export default function PackLightModal({ report, onApply, onClose, applied }) {
  const { before, after, removed, reduced, combined, kept } = report;

  if (report.noop) {
    return (
      <Modal
        title="Already lean"
        subtitle="There is nothing here worth cutting."
        onClose={onClose}
        footer={<button className="btn btn-secondary" onClick={onClose}>Close</button>}
      >
        <p className="muted small">
          Your list is already about as tight as it can be for this trip. Everything left is
          either essential or weighs almost nothing.
        </p>
      </Modal>
    );
  }

  return (
    <Modal
      title="Pack light"
      subtitle="Same trip, less to carry."
      onClose={onClose}
      footer={
        applied ? (
          <button className="btn btn-secondary" onClick={onClose}>Done</button>
        ) : (
          <>
            <button className="btn btn-secondary" onClick={onClose}>Keep full list</button>
            <button className="btn btn-primary" onClick={onApply}>
              Use the lighter list
            </button>
          </>
        )
      }
    >
      <div className="compare">
        <div className="compare-col">
          <div className="lbl">Now</div>
          <div className="val tnum">{before.total}</div>
          <div className="sub tnum">{kg(before.weight)}</div>
        </div>
        <div className="compare-arrow" aria-hidden="true"><ArrowRight /></div>
        <div className="compare-col after">
          <div className="lbl">After</div>
          <div className="val tnum">{after.total}</div>
          <div className="sub tnum">{kg(after.weight)}</div>
        </div>
      </div>

      {removed.length > 0 && (
        <div className="opt-group">
          <h3>We removed</h3>
          {removed.slice(0, 8).map((r) => (
            <div className="opt-row" key={r.id}>
              <X className="ico rm" aria-hidden="true" />
              <span className="txt">
                {r.name}
                <span className="note">{r.why}</span>
              </span>
              <span className="wt">−{kg(r.weight)}</span>
            </div>
          ))}
        </div>
      )}

      {reduced.length > 0 && (
        <div className="opt-group">
          <h3>We cut back</h3>
          {reduced.slice(0, 8).map((r) => (
            <div className="opt-row" key={r.id}>
              <Minus className="ico rm" aria-hidden="true" />
              <span className="txt">
                {r.name}
                <span className="note">
                  {r.from} → {r.to}{r.unit ? ` ${r.to === 1 ? r.unit.replace(/s$/, '') : r.unit}` : ''}
                </span>
              </span>
              <span className="wt">−{kg(r.weight)}</span>
            </div>
          ))}
        </div>
      )}

      {combined.length > 0 && (
        <div className="opt-group">
          <h3>We combined</h3>
          {combined.map((c) => (
            <div className="opt-row" key={c.label}>
              <Repeat className="ico mg" aria-hidden="true" />
              <span className="txt">
                {c.label}
                <span className="note">{c.note}</span>
              </span>
              <span className="wt">−{kg(c.savedWeight)}</span>
            </div>
          ))}
        </div>
      )}

      {kept.length > 0 && (
        <div className="opt-group">
          <h3>We kept</h3>
          <div className="opt-kept-chips">
            {kept.map((k) => (
              <span className="opt-kept-chip" key={k.id}>
                <Check aria-hidden="true" />{k.name}
              </span>
            ))}
          </div>
        </div>
      )}

      <p className="pack-tagline">Save space without compromising your trip.</p>
    </Modal>
  );
}
