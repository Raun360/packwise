import { useState } from 'react';
import { Copy, Printer, Share2, Check } from 'lucide-react';
import Modal from './Modal.jsx';
import { PRIORITY_LABEL } from '../engine/rules.js';
import { track, EVENTS } from '../lib/analytics.js';

/** Plain-text rendering of the list — reads well pasted anywhere. */
export function toPlainText(plan) {
  const { ctx, categories, stats } = plan;
  const lines = [];
  lines.push(`PACKING LIST — ${ctx.destinationName.toUpperCase()}`);
  lines.push(
    [
      ctx.origin ? `${ctx.origin} → ${ctx.destinationName}` : ctx.destinationName,
      `${ctx.days} days · ${ctx.nights} nights`,
      ctx.monthLabel,
    ].join('  ·  ')
  );
  lines.push(`${stats.total} items · about ${stats.weight.toFixed(1)} kg`);
  lines.push('');

  for (const cat of categories) {
    lines.push(cat.label.toUpperCase());
    for (const item of cat.items) {
      const qty = item.quantity > 1 ? ` — ${item.quantity}${item.unit ? ` ${item.unit}` : ''}` : '';
      const mark = item.priority === 'essential' ? '*' : ' ';
      lines.push(`  [${item.packed ? 'x' : ' '}]${mark} ${item.name}${qty}`);
    }
    lines.push('');
  }
  lines.push('* = essential');
  lines.push('Made with Packwise');
  return lines.join('\n');
}

export default function ShareSheet({ plan, onClose, onToast }) {
  const [copied, setCopied] = useState(false);
  const text = toPlainText(plan);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      onToast('Packing list copied');
      setTimeout(() => setCopied(false), 2200);
      track(EVENTS.TRIP_SHARED, { share_method: 'copy' });
    } catch {
      onToast('Could not copy — select the text below instead');
    }
  };

  const nativeShare = async () => {
    try {
      await navigator.share({
        title: `Packing list — ${plan.ctx.destinationName}`,
        text,
      });
      // Only a resolved share() is a completed share — the promise also
      // resolves-to-rejection when the user just closes the OS sheet, which
      // lands in the catch below and correctly reports nothing.
      track(EVENTS.TRIP_SHARED, { share_method: 'native' });
    } catch {
      /* user dismissed the sheet — nothing to report */
    }
  };

  const print = () => {
    track(EVENTS.TRIP_SHARED, { share_method: 'print' });
    onClose();
    // Let the dialog unmount before the print stylesheet takes over.
    setTimeout(() => window.print(), 120);
  };

  return (
    <Modal
      title="Share this list"
      subtitle="Take it with you, or send it to whoever is packing alongside you."
      onClose={onClose}
      footer={<button className="btn btn-secondary" onClick={onClose}>Close</button>}
    >
      <div className="share-actions">
        <button className="share-btn" onClick={copy}>
          <span className="ico">{copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}</span>
          <span className="t">
            <strong>{copied ? 'Copied' : 'Copy as text'}</strong>
            <span>Paste into notes, chat or email</span>
          </span>
        </button>

        {typeof navigator !== 'undefined' && navigator.share && (
          <button className="share-btn" onClick={nativeShare}>
            <span className="ico"><Share2 aria-hidden="true" /></span>
            <span className="t">
              <strong>Share</strong>
              <span>Send via your usual apps</span>
            </span>
          </button>
        )}

        <button className="share-btn" onClick={print}>
          <span className="ico"><Printer aria-hidden="true" /></span>
          <span className="t">
            <strong>Print or save as PDF</strong>
            <span>A clean checklist you can tick with a pen</span>
          </span>
        </button>
      </div>

      <pre className="share-preview" aria-label="Preview of the shareable list">{text}</pre>
    </Modal>
  );
}
