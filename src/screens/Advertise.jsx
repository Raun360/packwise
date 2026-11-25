import { useState } from 'react';
import { ArrowLeft, Check, AlertCircle, Send, Copy } from 'lucide-react';
import { AD_PLANS, AD_INCLUDES, BUSINESS_TYPES, formatPrice } from '../data/adPlans.js';
import { track, EVENTS } from '../lib/analytics.js';

/** WhatsApp number requests are sent to, digits only with country code. */
const CONTACT_WHATSAPP = (import.meta.env.VITE_ADS_WHATSAPP || '').replace(/\D/g, '');

const EMPTY_FORM = {
  type: BUSINESS_TYPES[0],
  businessName: '',
  location: '',
  places: '',
  link: '',
  phone: '',
  offer: '',
  contactName: '',
};

function validate(f) {
  if (!f.businessName.trim()) return 'Add your business name.';
  if (!f.location.trim()) return 'Tell us where you are located.';
  if (!f.places.trim()) return 'Add the places you want your card to appear for.';
  if (!f.link.trim() && !f.phone.trim()) {
    return 'Add a website or social link — or, if you have none, a phone or WhatsApp number.';
  }
  if (!f.contactName.trim()) return 'Add your name so we know who to reply to.';
  return '';
}

function buildMessage(plan, f) {
  return [
    'New Packwise ad request',
    `Plan: ${plan.name} (${formatPrice(plan.price)} / ${plan.period})`,
    `Type: ${f.type}`,
    `Business: ${f.businessName.trim()}`,
    `Located in: ${f.location.trim()}`,
    `Show on trips to: ${f.places.trim()}`,
    `Link: ${f.link.trim() || '—'}`,
    `Phone / WhatsApp: ${f.phone.trim() || '—'}`,
    `Offer line: ${f.offer.trim() || '—'}`,
    `Contact: ${f.contactName.trim()}`,
  ].join('\n');
}

export default function Advertise({ onBack }) {
  const [stage, setStage] = useState('plans'); // plans | form | done
  const [plan, setPlan] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [copied, setCopied] = useState(false);

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setError('');
  };

  const choose = (p) => {
    setPlan(p);
    setStage('form');
    window.scrollTo(0, 0);
    track(EVENTS.AD_PLAN_SELECTED, { plan: p.id });
  };

  const submit = (e) => {
    e.preventDefault();
    const err = validate(form);
    if (err) { setError(err); return; }

    const text = buildMessage(plan, form);
    setMessage(text);
    setStage('done');
    window.scrollTo(0, 0);
    track(EVENTS.AD_REQUEST_SUBMITTED, { plan: plan.id, business_type: form.type });

    if (CONTACT_WHATSAPP) {
      window.open(
        `https://wa.me/${CONTACT_WHATSAPP}?text=${encodeURIComponent(text)}`,
        '_blank',
        'noopener,noreferrer'
      );
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
    } catch {
      /* the text is selectable on screen as a fallback */
    }
  };

  return (
    <div className="advertise">
      <div className="shell-narrow">
        <button
          type="button"
          className="back-btn"
          onClick={stage === 'form' ? () => setStage('plans') : onBack}
        >
          <ArrowLeft aria-hidden="true" />
          {stage === 'form' ? 'Change plan' : 'Back'}
        </button>

        {/* ---------------- 1. Plans ---------------- */}
        {stage === 'plans' && (
          <>
            <div className="step-head">
              <span className="eyebrow">Advertise on Packwise</span>
              <h1 className="h1">Reach travellers while they plan.</h1>
              <p>
                Hotels, homestays, cafes, 4x4, car and bike rentals, tour operators. Your card appears on the
                packing plan of people travelling to the places you serve — not on everyone&apos;s.
              </p>
            </div>

            <div className="plan-grid">
              {AD_PLANS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className="plan-card"
                  onClick={() => choose(p)}
                >
                  {p.badge && <span className="plan-badge">{p.badge}</span>}
                  <span className="plan-name">{p.name}</span>
                  <span className="plan-price">
                    <b className="tnum">{formatPrice(p.price)}</b> / {p.period}
                  </span>
                  <span className="plan-blurb">{p.blurb}</span>
                  <span className="plan-cta">Choose {p.name.toLowerCase()}</span>
                </button>
              ))}
            </div>

            <div className="card card-pad plan-includes">
              <div className="eyebrow">Every plan includes</div>
              <ul>
                {AD_INCLUDES.map((t) => (
                  <li key={t}><Check aria-hidden="true" />{t}</li>
                ))}
              </ul>
              <p className="xs muted">
                No payment now. We review your request first, then send you a payment link.
              </p>
            </div>
          </>
        )}

        {/* ---------------- 2. Form ---------------- */}
        {stage === 'form' && plan && (
          <form onSubmit={submit} noValidate>
            <div className="step-head">
              <span className="eyebrow">{plan.name} plan · {formatPrice(plan.price)} / {plan.period}</span>
              <h1 className="h1">Tell us about your business.</h1>
              <p>We&apos;ll use this to build your card and decide which trips it appears on.</p>
            </div>

            <div className="form-stack">
              <div>
                <label className="label" htmlFor="ad-type">What do you offer?</label>
                <select id="ad-type" className="field" value={form.type} onChange={set('type')}>
                  {BUSINESS_TYPES.map((t) => <option key={t}>{t}</option>)}
                </select>
              </div>

              <div>
                <label className="label" htmlFor="ad-name">Business name</label>
                <input
                  id="ad-name" className="field" value={form.businessName}
                  onChange={set('businessName')} placeholder="e.g. Kaza Mountain Stay"
                />
              </div>

              <div>
                <label className="label" htmlFor="ad-loc">Where are you located?</label>
                <input
                  id="ad-loc" className="field" value={form.location}
                  onChange={set('location')} placeholder="Town or city, state"
                />
              </div>

              <div>
                <label className="label" htmlFor="ad-places">
                  Which trips should show your card?
                </label>
                <input
                  id="ad-places" className="field" value={form.places}
                  onChange={set('places')} placeholder="e.g. Spiti, Kaza, Manali"
                />
                <p className="xs muted form-hint">
                  Places travellers are going to. Separate with commas.
                </p>
              </div>

              <div>
                <label className="label" htmlFor="ad-link">
                  Website or social link <span className="faint">Optional if you add a number</span>
                </label>
                <input
                  id="ad-link" className="field" value={form.link} inputMode="url"
                  onChange={set('link')} placeholder="https://… or instagram.com/…"
                />
              </div>

              <div>
                <label className="label" htmlFor="ad-phone">
                  Phone or WhatsApp number <span className="faint">If you have no link</span>
                </label>
                <input
                  id="ad-phone" className="field" value={form.phone} inputMode="tel"
                  onChange={set('phone')} placeholder="+91 …"
                />
              </div>

              <div>
                <label className="label" htmlFor="ad-offer">
                  One line about your offer <span className="faint">Optional</span>
                </label>
                <input
                  id="ad-offer" className="field" value={form.offer} maxLength={100}
                  onChange={set('offer')} placeholder="e.g. Rooms from ₹1,200 with breakfast"
                />
              </div>

              <div>
                <label className="label" htmlFor="ad-contact">Your name</label>
                <input
                  id="ad-contact" className="field" value={form.contactName}
                  onChange={set('contactName')} placeholder="Who should we reply to?"
                />
              </div>
            </div>

            {error && (
              <p className="validation" role="alert">
                <AlertCircle aria-hidden="true" />{error}
              </p>
            )}

            <button type="submit" className="btn btn-primary btn-lg form-submit">
              <Send size={16} aria-hidden="true" />
              Send request
            </button>
            <p className="xs muted form-hint">
              This doesn&apos;t charge you. We&apos;ll reply with a payment link once we&apos;ve
              checked your request.
            </p>
          </form>
        )}

        {/* ---------------- 3. Done ---------------- */}
        {stage === 'done' && (
          <div className="ad-done">
            <span className="considered-tick ad-done-tick" aria-hidden="true"><Check /></span>
            <h1 className="h1">Request ready.</h1>
            {CONTACT_WHATSAPP ? (
              <p>
                We opened WhatsApp with your request filled in — <b>press send there</b> to
                complete it. We&apos;ll review it and reply with a payment link.
              </p>
            ) : (
              <p>
                Copy this request and send it to us. We&apos;ll review it and reply with a
                payment link.
              </p>
            )}

            <pre className="ad-done-message">{message}</pre>

            <div className="ad-done-actions">
              <button type="button" className="btn btn-secondary" onClick={copy}>
                <Copy size={14} aria-hidden="true" />
                {copied ? 'Copied' : 'Copy request'}
              </button>
              <button type="button" className="btn btn-ghost" onClick={onBack}>
                Back to Packwise
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
