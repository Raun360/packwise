/**
 * Advertising plans shown on the Advertise page.
 *
 * SAMPLE PRICES — set your real ones here. Nothing else needs to change:
 * the page, the form summary and the message sent to you all read from this.
 */
export const AD_PLANS = [
  {
    id: 'weekly',
    name: 'Weekly',
    price: 499,
    period: 'week',
    blurb: 'Try it for a week. Good for a season opener or a limited offer.',
  },
  {
    id: 'monthly',
    name: 'Monthly',
    price: 1499,
    period: 'month',
    blurb: 'A full month of steady visibility.',
    badge: 'Best value',
  },
];

export const AD_INCLUDES = [
  'Your card on trip plans for the places you serve',
  'Photo, a one-line offer and a button to your link or WhatsApp',
  'Only shown to people planning a trip near you',
  'A views and clicks report when your plan ends',
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

export const formatPrice = (n) => `₹${n.toLocaleString('en-IN')}`;
