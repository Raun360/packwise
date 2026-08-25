import {
  Mountain, Waves, Landmark, Building2, Snowflake, TreePine,
} from 'lucide-react';

/** Next occurrence of a month/day pair, so trips never read as already past. */
function nextDates(month, day, nights) {
  const now = new Date();
  let year = now.getFullYear();
  if (now.getMonth() > month - 1) year += 1;
  const start = new Date(Date.UTC(year, month - 1, day));
  const end = new Date(start.getTime() + nights * 86400000);
  return { startDate: start.toISOString().slice(0, 10), endDate: end.toISOString().slice(0, 10) };
}

/**
 * Popular ready-made journeys shown on the landing page. Each builds a real
 * plan through the same path as a hand-entered trip — clicking one just
 * pre-fills the planner with real geocoded places instead of starting blank.
 */
export const POPULAR_TRIPS = [
  {
    id: 'ladakh',
    name: 'Ladakh',
    tagline: 'High-altitude cold desert',
    icon: Mountain,
    origin: 'Delhi',
    destinations: ['Leh'],
    pois: { Leh: ['Pangong Lake'] },
    activities: ['roadtrip', 'sightseeing', 'hiking'],
    dates: nextDates(9, 12, 6),
  },
  {
    id: 'spiti',
    name: 'Spiti Valley',
    tagline: 'Remote Himalayan valley',
    icon: Mountain,
    origin: 'Delhi',
    destinations: ['Kaza'],
    pois: { Kaza: ['Key Monastery'] },
    activities: ['roadtrip', 'sightseeing', 'hiking'],
    dates: nextDates(8, 15, 7),
  },
  {
    id: 'kerala',
    name: 'Kerala',
    tagline: 'Backwaters and hill country',
    icon: TreePine,
    origin: 'Mumbai',
    destinations: ['Kochi', 'Munnar', 'Alleppey'],
    activities: ['sightseeing', 'food', 'relaxing'],
    dates: nextDates(11, 5, 6),
  },
  {
    id: 'goa',
    name: 'Goa',
    tagline: 'Coastal, laid-back, warm',
    icon: Waves,
    origin: 'Mumbai',
    destinations: ['Goa'],
    activities: ['beach', 'food', 'nightlife'],
    dates: nextDates(12, 20, 5),
  },
  {
    id: 'rajasthan',
    name: 'Rajasthan',
    tagline: 'Desert forts and palaces',
    icon: Landmark,
    origin: 'Delhi',
    destinations: ['Jaipur', 'Jodhpur', 'Udaipur'],
    activities: ['sightseeing', 'photography', 'food'],
    dates: nextDates(10, 10, 8),
  },
  {
    id: 'tokyo',
    name: 'Tokyo',
    tagline: 'Dense, modern, international',
    icon: Building2,
    origin: 'Mumbai',
    destinations: ['Tokyo'],
    activities: ['sightseeing', 'food', 'shopping'],
    dates: nextDates(4, 3, 7),
  },
  {
    id: 'switzerland',
    name: 'Switzerland',
    tagline: 'Alpine towns, cold and scenic',
    icon: Snowflake,
    origin: 'Delhi',
    destinations: ['Zurich', 'Interlaken', 'Zermatt'],
    activities: ['sightseeing', 'hiking', 'photography'],
    dates: nextDates(1, 15, 8),
  },
  {
    id: 'new-york',
    name: 'New York',
    tagline: 'Big city, international',
    icon: Building2,
    origin: 'Delhi',
    destinations: ['New York'],
    activities: ['sightseeing', 'food', 'shopping'],
    dates: nextDates(10, 25, 6),
  },
];
