/**
 * Sponsored cards shown on the results page.
 *
 * Each ad is matched to a trip by `places` (words found in any stop's name,
 * region or country) and/or `activities` (activity ids). An ad with neither
 * matches every trip. A trip with no matching ad shows no ad at all.
 *
 * Adding an advertiser = adding one object here and deploying.
 *
 * ADS is the live list and starts empty: add real partners here.
 * SAMPLE_ADS are made-up layout examples. They are only used by the local dev
 * server (see engine/ads.js) and never ship to the live site.
 */
export const ADS = [];

export const SAMPLE_ADS = [
  {
    id: 'sample-spiti-4x4',
    partner: 'Spiti 4x4 Rentals',
    title: 'Thar & Scorpio with driver',
    detail: 'Manali → Kaza → Manali, permits handled. From ₹4,500/day.',
    cta: 'Get a quote on WhatsApp',
    url: 'https://wa.me/910000000000?text=Hi%2C%20I%20found%20you%20on%20Packwise',
    places: ['spiti', 'kaza', 'manali', 'lahaul'],
    activities: ['roadtrip'],
    imageId: 'spiti',
  },
  {
    id: 'sample-ladakh-bike',
    partner: 'Leh Bike & Jeep Hire',
    title: 'Royal Enfield or 4x4 for Ladakh',
    detail: 'Khardung La, Pangong, Nubra. Spares and support included.',
    cta: 'Get a quote on WhatsApp',
    url: 'https://wa.me/910000000000?text=Hi%2C%20I%20found%20you%20on%20Packwise',
    places: ['ladakh', 'leh', 'nubra', 'pangong'],
    activities: [],
    imageId: 'ladakh',
  },
  {
    id: 'sample-goa-scooter',
    partner: 'Goa Scooter Hire',
    title: 'Scooters from ₹400/day',
    detail: 'Free helmet and doorstep delivery across North Goa.',
    cta: 'Book on WhatsApp',
    url: 'https://wa.me/910000000000?text=Hi%2C%20I%20found%20you%20on%20Packwise',
    places: ['goa'],
    activities: [],
    imageId: 'goa',
  },
  {
    id: 'sample-package',
    partner: 'Himalayan Trails',
    title: 'Fixed-departure group packages',
    detail: 'Hotels, transport and a trip captain. Small groups of 8–12.',
    cta: 'See departures',
    url: 'https://example.com/packages',
    places: ['spiti', 'kaza', 'ladakh', 'leh', 'kashmir', 'srinagar', 'sikkim', 'gangtok', 'bhutan', 'nepal'],
    activities: ['hiking'],
    imageId: 'ladakh',
  },
];
