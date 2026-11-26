/**
 * Everything the Advertise page says: plans, terms, the example ad and FAQ.
 * Change prices or wording here; the page, form summary and the request
 * email all read from this file.
 */

export const AD_PLANS = [
  {
    id: 'weekly',
    name: 'Weekly',
    price: 499,
    period: 'week',
    blurb: 'Good for a season opener, a festival or a limited offer.',
  },
  {
    id: 'monthly',
    name: 'Monthly',
    price: 1499,
    period: 'month',
    blurb: 'Steady visibility through a whole month of trip planning.',
    badge: 'Best value',
  },
];

/** The three terms shown wherever price is mentioned. */
export const AD_TERMS = ['First week free', 'Pay by UPI', 'Cancel anytime'];

export const AD_INCLUDES = [
  'Your card on the packing plan of travellers heading to the places you serve',
  'Photo, a one-line offer and a button straight to your WhatsApp or link',
  'At most 3 ads on any plan, so yours is never lost in a crowd',
  'We write your ad with you, and update it whenever you ask',
  'A report of how many people saw and clicked your card',
];

export const BUSINESS_TYPES = [
  'Hotel or homestay',
  'Car or 4x4 rental',
  'Bike or scooter rental',
  'Restaurant or cafe',
  'Tour or package operator',
  'Cab or driver service',
  'Other',
];

/** The example card on the Advertise page. Not a real business. */
export const EXAMPLE_AD = {
  id: 'example',
  partner: 'Your homestay',
  title: 'Mountain-view rooms in Kaza',
  detail: 'Rooms from ₹1,200 with breakfast. Bike parking and early check-in.',
  cta: 'Message on WhatsApp',
  imageId: 'spiti',
};

export const AD_STEPS = [
  { title: 'Send your details', body: 'Pick a plan and tell us about your business and the places you serve. Takes two minutes.' },
  { title: 'We start your advertisement', body: 'We review your details and get your ad live, usually within 24–48 hours.' },
  { title: 'Your free week starts', body: 'Your ad shows on every matching trip. You pay nothing for the first week.' },
  { title: 'Continue, or stop', body: 'Like it? We send you a UPI payment request for your plan. Not for you? It simply stops.' },
];

export const AD_FAQ = [
  {
    q: 'Who will see my ad?',
    a: 'Travellers who plan a trip on Packwise that includes the places you choose. Your card appears on their packing plan, right when they are working out where to stay and how to get around.',
  },
  {
    q: 'Can I choose where my ad appears?',
    a: 'Yes. List the towns and areas you serve, like "Spiti, Kaza, Manali", and your card shows on trips that include them, and nowhere else.',
  },
  {
    q: 'How does the free week work?',
    a: 'Your first week is free and needs no payment details. When it ends, we ask if you want to continue. If you do, we send a UPI payment request for your plan. If you don’t, your card is taken down.',
  },
  {
    q: 'How do I pay?',
    a: 'By UPI. We send you a payment request or UPI ID on WhatsApp. No card and no sign-up needed.',
  },
  {
    q: 'Can I cancel?',
    a: 'Anytime. There is no lock-in. Message us and we take your card down.',
  },
  {
    q: 'Will I get bookings?',
    a: 'We can’t promise bookings, and nobody honest can. What we promise is that your card is shown only to people planning a trip to your area, with a direct way to reach you. You see exactly how many people viewed and clicked it.',
  },
  {
    q: 'Do you take a commission?',
    a: 'No. Travellers contact you directly on WhatsApp or your link. Whatever they book is between you and them.',
  },
  {
    q: 'Can I change my ad later?',
    a: 'Yes. New photo, new offer, new price: send it to us and we update it.',
  },
];

export const formatPrice = (n) => `₹${n.toLocaleString('en-IN')}`;
