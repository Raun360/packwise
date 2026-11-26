import { useState } from 'react';
import { ArrowLeft, Check, AlertCircle, Send, Copy } from 'lucide-react';
import {
  AD_PLANS, AD_INCLUDES, AD_TERMS, AD_STEPS, AD_FAQ, EXAMPLE_AD, BUSINESS_TYPES, formatPrice,
} from '../data/adPlans.js';
import AdCard from '../components/AdCard.jsx';
import { track, EVENTS } from '../lib/analytics.js';
import { FORM_KEY, CONTACT_WHATSAPP, whatsappUrl, sendForm } from '../lib/sendForm.js';

const EMPTY_FORM = {
  type: BUSINESS_TYPES[0],
  businessName: '',
  location: '',
  places: '',
  link: '',
  phone: '',
  offer: '',
  contactName: '',
  website: '', // honeypot: real visitors never see or fill this
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
  const [sending, setSending] = useState(false);
  const [delivered, setDelivered] = useState(false);

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

  const submit = async (e) => {
    e.preventDefault();
    if (sending) return;
    const err = validate(form);
    if (err) { setError(err); return; }

    const text = buildMessage(plan, form);
    setMessage(text);
    track(EVENTS.AD_REQUEST_SUBMITTED, { plan: plan.id, business_type: form.type });

    // A filled honeypot is a bot: look successful, send nothing.
    if (form.website) {
      setDelivered(true);
      setStage('done');
      return;
    }

    if (FORM_KEY) {
      setSending(true);
      const ok = await sendForm(
        `Packwise ad request: ${form.businessName.trim()} (${plan.name})`,
        {
          plan: `${plan.name} (${formatPrice(plan.price)} / ${plan.period})`,
          business_type: form.type,
          business_name: form.businessName.trim(),
          located_in: form.location.trim(),
          show_on_trips_to: form.places.trim(),
          link: form.link.trim(),
          phone_or_whatsapp: form.phone.trim(),
          offer_line: form.offer.trim(),
          contact_name: form.contactName.trim(),
          message: text,
        }
      );
      setSending(false);
      setDelivered(ok);
      setStage('done');
      window.scrollTo(0, 0);
      return;
    }

    // No form key configured: hand the request to WhatsApp if we can.
    setDelivered(false);
    setStage('done');
    window.scrollTo(0, 0);
    if (CONTACT_WHATSAPP) window.open(whatsappUrl(text), '_blank', 'noopener,noreferrer');
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

        {/* ---------------- 1. Pitch + plans ---------------- */}
        {stage === 'plans' && (
          <>
            {/* Hero */}
            <section className="adv-hero">
              <span className="eyebrow">Advertise on Packwise</span>
              <h1 className="h1">Be in front of travellers the moment they plan a trip to your area.</h1>
              <p className="adv-lede">
                Hotels, homestays, cafes, 4x4, car and bike rentals, tour operators. Your card appears
                on the packing plan of people travelling to the places you serve, not on everyone&apos;s.
              </p>
              <div className="adv-hero-cta">
                <a href="#plans" className="btn btn-primary btn-lg">Start your free week</a>
              </div>
              <ul className="adv-terms">
                {AD_TERMS.map((t) => <li key={t}><Check aria-hidden="true" />{t}</li>)}
              </ul>
            </section>

            {/* What the ad looks like */}
            <section className="adv-section adv-preview">
              <div>
                <span className="eyebrow">What travellers see</span>
                <h2 className="h2">A card on their packing plan, with a direct line to you.</h2>
                <p>
                  Someone plans a trip to Spiti. Next to their list, they see your card: your
                  photo, your offer, and a button that opens a WhatsApp chat with you. No booking
                  site in between, no commission.
                </p>
              </div>
              <div className="adv-preview-card">
                <span className="adv-example-tag">Example</span>
                <AdCard ad={EXAMPLE_AD} placement="advertise-preview" preview />
              </div>
            </section>

            {/* Why it works */}
            <section className="adv-section">
              <span className="eyebrow">Why it works</span>
              <h2 className="h2">The right people, at the right moment.</h2>
              <div className="adv-why">
                <div>
                  <h3>They&apos;re already going</h3>
                  <p>Everyone who sees your card has just planned a trip with real dates. They
                    still need somewhere to stay, a vehicle, a place to eat.</p>
                </div>
                <div>
                  <h3>Only your area</h3>
                  <p>Your card only shows on trips that include the places you serve. A Goa
                    traveller never sees a Spiti homestay.</p>
                </div>
                <div>
                  <h3>They reach you directly</h3>
                  <p>One tap opens WhatsApp or your link. You talk to them yourself, and you keep
                    everything you earn.</p>
                </div>
              </div>
              <div className="adv-stats">
                <div><b>100K+</b><span>views on our travel videos in two days</span></div>
                <div><b>96%</b><span>of visitors are from India</span></div>
                <div><b>95%</b><span>plan on their phone</span></div>
                <div><b>3 max</b><span>ads on any plan</span></div>
              </div>
            </section>

            {/* How it works */}
            <section className="adv-section">
              <span className="eyebrow">How it works</span>
              <h2 className="h2">Live in a couple of days. Free for the first week.</h2>
              <ol className="adv-steps">
                {AD_STEPS.map((s, i) => (
                  <li key={s.title}>
                    <span className="adv-step-n">{i + 1}</span>
                    <div>
                      <h3>{s.title}</h3>
                      <p>{s.body}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </section>

            {/* Plans */}
            <section className="adv-section" id="plans">
              <span className="eyebrow">Plans</span>
              <h2 className="h2">Simple pricing. Start free.</h2>
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
                    <span className="plan-free">First week free, then</span>
                    <span className="plan-price">
                      <b className="tnum">{formatPrice(p.price)}</b> / {p.period}
                    </span>
                    <span className="plan-blurb">{p.blurb}</span>
                    <span className="plan-cta">Start free with {p.name.toLowerCase()}</span>
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
                  Pay by UPI after your free week, only if you want to continue. Cancel anytime.
                </p>
              </div>
            </section>

            {/* FAQ */}
            <section className="adv-section">
              <span className="eyebrow">Questions</span>
              <h2 className="h2">Before you start</h2>
              <div className="adv-faq">
                {AD_FAQ.map((f) => (
                  <details key={f.q}>
                    <summary>{f.q}</summary>
                    <p>{f.a}</p>
                  </details>
                ))}
              </div>
            </section>

            {/* Who's behind it */}
            <section className="adv-section adv-owner">
              <img
                className="maker-avatar"
                src="/creator.jpg"
                alt="Raunak, who runs Packwise"
                width="56"
                height="56"
                loading="lazy"
              />
              <p>
                Packwise is built and run by <b>Raunak</b>. You deal with me directly. Every ad is
                checked by hand before it goes live.
              </p>
            </section>

            <div className="adv-final-cta">
              <a href="#plans" className="btn btn-primary btn-lg">Start your free week</a>
            </div>
          </>
        )}

        {/* ---------------- 2. Form ---------------- */}
        {stage === 'form' && plan && (
          <form onSubmit={submit} noValidate>
            <div className="step-head">
              <span className="eyebrow">{plan.name} plan · first week free, then {formatPrice(plan.price)} / {plan.period}</span>
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

            <input
              type="text" name="website" value={form.website} onChange={set('website')}
              tabIndex={-1} autoComplete="off" aria-hidden="true" className="hp-field"
            />

            {error && (
              <p className="validation" role="alert">
                <AlertCircle aria-hidden="true" />{error}
              </p>
            )}

            <button type="submit" className="btn btn-primary btn-lg form-submit" disabled={sending}>
              <Send size={16} aria-hidden="true" />
              {sending ? 'Sending…' : 'Send request'}
            </button>
            <p className="xs muted form-hint">
              Nothing to pay now. Your first week is free; after that, pay by UPI only if you want to
              continue. Cancel anytime.
            </p>
          </form>
        )}

        {/* ---------------- 3. Done ---------------- */}
        {stage === 'done' && (
          <div className="ad-done">
            <span className="considered-tick ad-done-tick" aria-hidden="true"><Check /></span>
            <h1 className="h1">{delivered ? 'Request sent.' : 'One more step.'}</h1>
            {delivered ? (
              <p>
                Thanks — we have your request. We&apos;ll get back to you very soon and start your
                advertisement, with your first week free.
              </p>
            ) : CONTACT_WHATSAPP ? (
              <p>
                {FORM_KEY ? 'We could not send this automatically. ' : ''}
                <b>Press send in WhatsApp</b> to finish — we&apos;ll start your advertisement, with your
                first week free.
              </p>
            ) : (
              <p>
                Copy this request and send it to us. We&apos;ll start your advertisement, with your
                first week free.
              </p>
            )}

            <pre className="ad-done-message">{message}</pre>

            <div className="ad-done-actions">
              {CONTACT_WHATSAPP && (
                <a
                  className="btn btn-primary"
                  href={whatsappUrl(message)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {delivered ? 'Also message us on WhatsApp' : 'Open WhatsApp'}
                </a>
              )}
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
