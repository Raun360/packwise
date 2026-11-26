/**
 * Delivers form submissions (ad requests, contact messages) to the site owner.
 *
 * Email goes through Web3Forms: one free access key from web3forms.com, tied
 * to the owner's email. The key is safe to ship in the site because it can
 * only ever send to the address it was created for.
 *
 * WhatsApp is the fallback: a prefilled message the visitor still has to send.
 */

export const FORM_KEY = (import.meta.env.VITE_WEB3FORMS_KEY || '').trim();

/** WhatsApp number, digits only with country code (e.g. 919876543210). */
export const CONTACT_WHATSAPP = (import.meta.env.VITE_CONTACT_WHATSAPP || '').replace(/\D/g, '');

export const whatsappUrl = (text) =>
  `https://wa.me/${CONTACT_WHATSAPP}?text=${encodeURIComponent(text)}`;

/**
 * Email a submission to the owner. Resolves true only when Web3Forms
 * confirms delivery; never throws.
 *
 * @param {string} subject  email subject line
 * @param {object} fields   flat key/value pairs shown in the email
 */
export async function sendForm(subject, fields) {
  if (!FORM_KEY) return false;
  try {
    const res = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ access_key: FORM_KEY, subject, from_name: 'Packwise', ...fields }),
    });
    const data = await res.json();
    return !!data.success;
  } catch {
    return false;
  }
}
