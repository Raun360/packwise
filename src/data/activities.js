/**
 * Activities the traveller can select.
 *
 * `demands` are abstract needs an activity places on a packing list. The rules
 * engine reads demands rather than activity ids wherever possible, so adding a
 * new activity rarely means touching the rules.
 */

export const ACTIVITIES = [
  {
    id: 'sightseeing',
    label: 'Sightseeing',
    emoji: '🏙️',
    hint: 'Museums, landmarks, walking',
    demands: ['long-walking', 'daytime-outdoors', 'crowds'],
  },
  {
    id: 'hiking',
    label: 'Hiking',
    emoji: '🏔️',
    hint: 'Trails and elevation',
    demands: ['long-walking', 'trail', 'daytime-outdoors', 'exertion', 'remote'],
  },
  {
    id: 'beach',
    label: 'Beach',
    emoji: '🏖️',
    hint: 'Sand, sea, swimming',
    demands: ['water', 'sun-exposure', 'sand', 'swim'],
  },
  {
    id: 'roadtrip',
    label: 'Road trip',
    emoji: '🏍️',
    hint: 'Long hours on the road',
    demands: ['long-transit', 'wind-exposure', 'remote', 'vehicle'],
  },
  {
    id: 'food',
    label: 'Food & cafés',
    emoji: '🍽️',
    hint: 'Eating your way around',
    demands: ['casual-social', 'crowds'],
  },
  {
    id: 'nightlife',
    label: 'Nightlife',
    emoji: '🎉',
    hint: 'Bars, clubs, late nights',
    demands: ['evening-social', 'dress-up', 'late-nights'],
  },
  {
    id: 'photography',
    label: 'Photography',
    emoji: '📸',
    hint: 'Shooting seriously',
    demands: ['gear', 'power-hungry', 'early-starts'],
  },
  {
    id: 'relaxing',
    label: 'Relaxing',
    emoji: '🧘',
    hint: 'Slow mornings, no plans',
    demands: ['downtime', 'comfort'],
  },
  {
    id: 'shopping',
    label: 'Shopping',
    emoji: '🛍️',
    hint: 'Markets and souvenirs',
    demands: ['carry-capacity', 'long-walking', 'crowds'],
  },
  {
    id: 'camping',
    label: 'Camping',
    emoji: '🏕️',
    hint: 'Sleeping outdoors',
    demands: ['outdoor-overnight', 'remote', 'trail', 'exertion', 'no-facilities'],
  },
  {
    id: 'watersports',
    label: 'Water sports',
    emoji: '🤿',
    hint: 'Diving, surfing, rafting',
    demands: ['water', 'swim', 'sun-exposure', 'gear'],
  },
  {
    id: 'snow',
    label: 'Snow & skiing',
    emoji: '⛷️',
    hint: 'Snow play or slopes',
    demands: ['snow', 'exertion', 'sun-exposure', 'wind-exposure'],
  },
  {
    id: 'wildlife',
    label: 'Wildlife & safari',
    emoji: '🦌',
    hint: 'Parks and safaris',
    demands: ['early-starts', 'gear', 'insects', 'daytime-outdoors', 'remote'],
  },
  {
    id: 'work',
    label: 'Working remotely',
    emoji: '💻',
    hint: 'Laptop days on the road',
    demands: ['gear', 'power-hungry', 'workspace'],
  },
];

export const ACTIVITY_MAP = Object.fromEntries(ACTIVITIES.map((a) => [a.id, a]));

/** Union of all demands across the selected activity ids. */
export function demandsOf(activityIds = []) {
  const set = new Set();
  for (const id of activityIds) {
    for (const d of ACTIVITY_MAP[id]?.demands || []) set.add(d);
  }
  return set;
}

/* ------------------------------------------------------------------ */
/*  Places                                                             */
/* ------------------------------------------------------------------ */

/**
 * Named places carry their own signal — a lake pass at 4,300 m implies things
 * the city 40 km below does not. Matching is keyword-based so free-text entries
 * still contribute.
 */
export const PLACE_SIGNALS = [
  { match: ['nathula', 'nathu la'], label: 'Nathula Pass', altitude: 4310, signals: ['extreme-altitude', 'snow-underfoot', 'wind-exposure', 'permit-required', 'intense-uv'] },
  { match: ['tsomgo', 'changu', 'tsongmo'], label: 'Tsomgo Lake', altitude: 3780, signals: ['extreme-altitude', 'snow-underfoot', 'wind-exposure', 'permit-required', 'intense-uv'] },
  { match: ['gurudongmar'], label: 'Gurudongmar Lake', altitude: 5430, signals: ['extreme-altitude', 'snow-underfoot', 'wind-exposure', 'permit-required', 'intense-uv'] },
  { match: ['rohtang'], label: 'Rohtang Pass', altitude: 3980, signals: ['extreme-altitude', 'snow-underfoot', 'wind-exposure', 'intense-uv'] },
  { match: ['khardung'], label: 'Khardung La', altitude: 5359, signals: ['extreme-altitude', 'snow-underfoot', 'wind-exposure', 'intense-uv'] },
  { match: ['pangong'], label: 'Pangong Tso', altitude: 4350, signals: ['extreme-altitude', 'wind-exposure', 'permit-required', 'intense-uv', 'remote'] },
  { match: ['nubra'], label: 'Nubra Valley', altitude: 3050, signals: ['high-altitude', 'sand', 'permit-required', 'remote'] },
  { match: ['tiger hill'], label: 'Tiger Hill', altitude: 2590, signals: ['high-altitude', 'early-starts', 'wind-exposure'] },
  { match: ['jungfrau'], label: 'Jungfraujoch', altitude: 3454, signals: ['extreme-altitude', 'snow-underfoot', 'intense-uv'] },
  { match: ['everest', 'ebc', 'kala patthar'], label: 'Everest region', altitude: 5364, signals: ['extreme-altitude', 'snow-underfoot', 'trail', 'remote', 'exertion'] },
  { match: ['annapurna', 'abc', 'poon hill'], label: 'Annapurna region', altitude: 4130, signals: ['extreme-altitude', 'trail', 'remote', 'exertion'] },

  { match: ['mg marg', 'mall road', 'the mall'], label: 'Pedestrian high street', signals: ['long-walking', 'crowds', 'evening-outdoors'] },
  { match: ['temple', 'monastery', 'gompa', 'shrine', 'mandir', 'ghat'], label: 'Religious site', signals: ['modest-dress', 'shoes-off'] },
  { match: ['mosque', 'masjid', 'dargah'], label: 'Religious site', signals: ['modest-dress', 'shoes-off', 'head-cover'] },
  { match: ['fort', 'palace', 'qila'], label: 'Fort or palace', signals: ['long-walking', 'stairs', 'daytime-outdoors'] },
  { match: ['beach', 'bay'], label: 'Beach', signals: ['water', 'sun-exposure', 'sand', 'swim'] },
  { match: ['falls', 'waterfall'], label: 'Waterfall', signals: ['water', 'slippery', 'trail'] },
  { match: ['cave'], label: 'Cave', signals: ['dark', 'slippery', 'trail'] },
  { match: ['national park', 'sanctuary', 'reserve', 'kaziranga', 'jim corbett'], label: 'National park', signals: ['early-starts', 'insects', 'remote', 'daytime-outdoors'] },
  { match: ['market', 'bazaar', 'bazar', 'souk'], label: 'Market', signals: ['crowds', 'carry-capacity', 'cash'] },
  { match: ['lake', 'tso'], label: 'Lake', signals: ['wind-exposure', 'daytime-outdoors'] },
  { match: ['trek', 'trail', 'base camp'], label: 'Trek', signals: ['trail', 'exertion', 'remote'] },
  { match: ['museum', 'gallery'], label: 'Museum', signals: ['indoor', 'long-walking'] },
  { match: ['desert', 'dunes', 'sam '], label: 'Desert', signals: ['sand', 'intense-uv', 'huge-diurnal-swing'] },
];

/** Analyse a free-text place name for packing-relevant signals. */
export function analysePlace(name) {
  const q = (name || '').toLowerCase();
  const signals = new Set();
  let altitude = null;
  let kind = null;
  for (const p of PLACE_SIGNALS) {
    if (p.match.some((m) => q.includes(m))) {
      p.signals.forEach((s) => signals.add(s));
      if (p.altitude && (!altitude || p.altitude > altitude)) altitude = p.altitude;
      kind = kind || p.label;
    }
  }
  return { name, signals: [...signals], altitude, kind };
}

/** Suggested places, offered as quick-adds once a destination is known. */
export const PLACE_SUGGESTIONS = {
  gangtok: ['Nathula Pass', 'Tsomgo Lake', 'MG Marg', 'Rumtek Monastery', 'Banjhakri Falls'],
  goa: ['Palolem Beach', 'Anjuna Market', 'Fort Aguada', 'Dudhsagar Falls', 'Old Goa churches'],
  ladakh: ['Pangong Tso', 'Nubra Valley', 'Khardung La', 'Thiksey Monastery', 'Magnetic Hill'],
  manali: ['Rohtang Pass', 'Solang Valley', 'Hadimba Temple', 'Old Manali'],
  shimla: ['The Mall', 'Jakhoo Temple', 'Kufri', 'Christ Church'],
  darjeeling: ['Tiger Hill', 'Batasia Loop', 'Tea gardens', 'Toy Train'],
  jaipur: ['Amber Fort', 'Hawa Mahal', 'City Palace', 'Johari Bazaar'],
  udaipur: ['City Palace', 'Lake Pichola', 'Sajjangarh Fort'],
  jaisalmer: ['Sam Sand Dunes', 'Jaisalmer Fort', 'Gadisar Lake'],
  varanasi: ['Dashashwamedh Ghat', 'Kashi Vishwanath Temple', 'Sarnath'],
  shillong: ['Living Root Bridges', 'Nohkalikai Falls', 'Dawki', 'Mawlynnong'],
  munnar: ['Eravikulam National Park', 'Tea Museum', 'Top Station'],
  alleppey: ['Backwater houseboat', 'Marari Beach', 'Fort Kochi'],
  andaman: ['Radhanagar Beach', 'Cellular Jail', 'Elephant Beach', 'Neil Island'],
  rishikesh: ['Laxman Jhula', 'River rafting', 'Beatles Ashram', 'Triveni Ghat'],
  ooty: ['Botanical Gardens', 'Doddabetta Peak', 'Nilgiri Mountain Railway'],
  bali: ['Ubud Monkey Forest', 'Tanah Lot Temple', 'Nusa Penida', 'Tegallalang Rice Terraces'],
  tokyo: ['Shibuya Crossing', 'Senso-ji Temple', 'Mount Fuji day trip', 'Tsukiji Market'],
  paris: ['Louvre Museum', 'Eiffel Tower', 'Montmartre', 'Seine walk'],
  london: ['British Museum', 'Tower of London', 'Camden Market'],
  switzerland: ['Jungfraujoch', 'Lake Thun', 'Grindelwald', 'Schilthorn'],
  iceland: ['Blue Lagoon', 'Golden Circle', 'Northern lights hunt'],
  nepal: ['Pashupatinath', 'Poon Hill trek', 'Pokhara lakeside'],
  maldives: ['Snorkelling reef', 'Male city', 'Sandbank trip'],
  dubai: ['Burj Khalifa', 'Desert safari', 'Dubai Mall'],
  singapore: ['Gardens by the Bay', 'Sentosa', 'Hawker centres'],
  bangkok: ['Grand Palace', 'Chatuchak Market', 'Wat Arun'],
  newyork: ['Central Park', 'Metropolitan Museum', 'Brooklyn Bridge'],
  default: ['City centre walk', 'Local market', 'Main viewpoint'],
};
