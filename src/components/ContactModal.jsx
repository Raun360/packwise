import { useState } from 'react';
import { AlertCircle, Send, Check, Copy } from 'lucide-react';
import Modal from './Modal.jsx';
import { track, EVENTS } from '../lib/analytics.js';
import { FORM_KEY, CONTACT_WHATSAPP, whatsappUrl, sendForm } from '../lib/sendForm.js';

const TOPICS = ['Feedback', 'Something is wrong', 'Question', 'Partnership'];

/**
 * "Send us a message". Emails the owner via Web3Forms; when that is not
 * configured or fails, falls back to a prefilled WhatsApp message or a copy.
 */
export default function ContactModal({ onClose }) {
  const [topic, setTopic] = useState(TOPICS[0]);
  const [message, setMessage] = useState('');
  const [name, setName] = useState('');
  const [replyTo, setReplyTo] = useState('');
  const [trap, setTrap] = useState(''); // honeypot
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null); // null | 'sent' | 'fallback'
  const [copied, setCopied] = useState(false);

  const text = [
    `Packwise message — ${topic}`,
    message.trim(),
    '',
    `From: ${name.trim() || 'Anonymous'}`,
    `Reply to: ${replyTo.trim() || '—'}`,
  ].join('\n');

  const submit = async (e) => {
    e.preventDefault();
    if (sending) return;
    if (message.trim().length < 3) { setError('Write a message first.'); return; }
    if (replyTo.trim().length < 6) {
      setError('Add your email or WhatsApp number so we can reply.');
      return;
    }

    track(EVENTS.CONTACT_SENT, { topic });
    if (trap) { setResult('sent'); return; }

    setSending(true);
    const ok = await sendForm(`Packwise: ${topic}`, {
      topic,
      message: message.trim(),
      name: name.trim() || 'Anonymous',
      reply_to: replyTo.trim(),
    });
    setSending(false);
    setResult(ok ? 'sent' : 'fallback');
  };

  const copy = async () => {
    try { await navigator.clipboard.writeText(text); setCopied(true); } catch { /* visible on screen */ }
  };

  if (result === 'sent') {
    return (
      <Modal title="Message sent" subtitle="Thanks for reaching out." onClose={onClose}>
        <p className="contact-done">
          <Check aria-hidden="true" />
          We&apos;ll get back to you very soon.
        </p>
        <button type="button" className="btn btn-primary btn-block" onClick={onClose}>Done</button>
      </Modal>
    );
  }

  if (result === 'fallback') {
    return (
      <Modal title="One more step" subtitle="Your message isn't sent yet." onClose={onClose}>
        <p className="small muted" style={{ marginBottom: 'var(--s-4)' }}>
          {FORM_KEY ? "We couldn't send it automatically. " : ''}
          {CONTACT_WHATSAPP ? 'Send it on WhatsApp instead:' : 'Copy it and send it to us:'}
        </p>
        <pre className="ad-done-message">{text}</pre>
        <div className="ad-done-actions">
          {CONTACT_WHATSAPP && (
            <a className="btn btn-primary" href={whatsappUrl(text)} target="_blank" rel="noopener noreferrer">
              Open WhatsApp
            </a>
          )}
          <button type="button" className="btn btn-secondary" onClick={copy}>
            <Copy size={14} aria-hidden="true" />{copied ? 'Copied' : 'Copy message'}
          </button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      title="Send us a message"
      subtitle="Feedback, a problem, a question — it comes straight to us."
      onClose={onClose}
    >
      <form onSubmit={submit} noValidate className="form-stack contact-form">
        <div>
          <label className="label" htmlFor="c-topic">About</label>
          <select id="c-topic" className="field" value={topic} onChange={(e) => setTopic(e.target.value)}>
            {TOPICS.map((t) => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="c-msg">Message</label>
          <textarea
            id="c-msg" className="field" rows={5} value={message} maxLength={2000}
            onChange={(e) => { setMessage(e.target.value); setError(''); }}
            placeholder="What's on your mind?"
          />
        </div>
        <div>
          <label className="label" htmlFor="c-name">Name <span className="faint">Optional</span></label>
          <input id="c-name" className="field" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="c-reply">Email or WhatsApp number</label>
          <input
            id="c-reply" className="field" value={replyTo} placeholder="So we can get back to you"
            onChange={(e) => { setReplyTo(e.target.value); setError(''); }}
          />
        </div>
        <input
          type="text" value={trap} onChange={(e) => setTrap(e.target.value)}
          tabIndex={-1} autoComplete="off" aria-hidden="true" className="hp-field"
        />
        {error && (
          <p className="validation" role="alert"><AlertCircle aria-hidden="true" />{error}</p>
        )}
        <button type="submit" className="btn btn-primary btn-block" disabled={sending}>
          <Send size={16} aria-hidden="true" />{sending ? 'Sending…' : 'Send message'}
        </button>
      </form>
    </Modal>
  );
}
