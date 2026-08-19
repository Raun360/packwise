/**
 * Destination profiles.
 *
 * Each profile carries the physical facts that change what you pack:
 * elevation, terrain, monthly temperature normals, rain pattern and a few
 * practical notes. Monthly temps are `[minC, maxC]` indexed Jan..Dec.
 *
 * This is demo-grade climatology. When the live weather layer returns data for
 * the actual travel dates it overrides these normals — see engine/weather.js.
 */

const t = (...pairs) => pairs;

export const DESTINATIONS = [
  {
    id: 'gangtok',
    name: 'Gangtok',
    region: 'Sikkim',
    country: 'India',
    aliases: ['sikkim'],
    lat: 27.3389, lon: 88.6065,
    elevation: 1650,
    terrain: ['mountain', 'hill-station', 'forest'],
    tags: ['himalaya', 'steep-streets', 'high-altitude-daytrips', 'monsoon-heavy', 'border-permits'],
    temps: t([4, 15], [5, 16], [8, 20], [11, 23], [13, 23], [15, 23], [16, 23], [16, 23], [15, 23], [12, 21], [8, 19], [5, 16]),
    rainyMonths: [6, 7, 8, 9],
    dayTripAltitude: 4300, // Nathula / Tsomgo territory
    notes: [
      'Steep, uneven streets — MG Marg and the ridge involve a lot of walking on slopes.',
      'Day trips climb far above the town; conditions up top are a different climate entirely.',
    ],
    permits: 'Protected-area permits are required for Nathula Pass and some border areas — carry printed ID copies and passport photos.',
  },
  {
    id: 'goa',
    name: 'Goa',
    region: 'Goa',
    country: 'India',
    aliases: ['panaji', 'panjim', 'calangute', 'anjuna', 'palolem'],
    lat: 15.2993, lon: 74.1240,
    elevation: 10,
    terrain: ['beach', 'coastal', 'urban'],
    tags: ['tropical', 'humid', 'high-uv', 'nightlife', 'scooter-country', 'saltwater', 'monsoon-heavy'],
    temps: t([20, 32], [21, 32], [23, 32], [25, 33], [26, 33], [25, 31], [24, 29], [24, 29], [24, 30], [23, 32], [22, 33], [21, 32]),
    rainyMonths: [6, 7, 8, 9],
    notes: [
      'Most travel between beaches happens on a rented two-wheeler.',
      'Salt, sand and humidity are hard on electronics and leather.',
    ],
  },
  {
    id: 'ladakh',
    name: 'Leh, Ladakh',
    region: 'Ladakh',
    country: 'India',
    aliases: ['leh', 'ladakh', 'nubra', 'pangong'],
    lat: 34.1526, lon: 77.5771,
    elevation: 3500,
    terrain: ['mountain', 'cold-desert', 'high-altitude'],
    tags: ['extreme-altitude', 'arid', 'huge-diurnal-swing', 'intense-uv', 'remote', 'thin-air'],
    temps: t([-14, -3], [-11, 1], [-6, 7], [-1, 13], [3, 18], [7, 22], [10, 25], [10, 24], [6, 21], [0, 14], [-6, 8], [-11, 1]),
    rainyMonths: [],
    notes: [
      'Above 3,000 m the air holds far less oxygen — the first 48 hours are for acclimatising, not sightseeing.',
      'Day-to-night temperature swings of 20 °C are routine, even in summer.',
      'Long road days between towns with nothing open in between.',
    ],
    permits: 'Inner Line Permits are needed for Nubra, Pangong and Tso Moriri — carry printed copies.',
  },
  {
    id: 'manali',
    name: 'Manali',
    region: 'Himachal Pradesh',
    country: 'India',
    aliases: ['solang', 'kullu', 'himachal'],
    lat: 32.2396, lon: 77.1887,
    elevation: 2050,
    terrain: ['mountain', 'hill-station', 'forest', 'river'],
    tags: ['himalaya', 'snow-possible', 'trekking', 'monsoon-heavy'],
    temps: t([-1, 10], [1, 12], [5, 17], [8, 22], [11, 25], [14, 27], [15, 25], [15, 24], [12, 23], [7, 20], [3, 16], [0, 12]),
    rainyMonths: [7, 8],
    dayTripAltitude: 3980, // Rohtang
    notes: ['Rohtang and Solang sit far above the town and hold snow well into spring.'],
  },
  {
    id: 'shimla',
    name: 'Shimla',
    region: 'Himachal Pradesh',
    country: 'India',
    lat: 31.1048, lon: 77.1734,
    elevation: 2200,
    terrain: ['mountain', 'hill-station', 'forest'],
    tags: ['himalaya', 'steep-streets', 'snow-possible', 'colonial-town'],
    temps: t([-1, 9], [0, 11], [4, 16], [8, 21], [12, 24], [14, 24], [14, 21], [14, 20], [12, 20], [8, 18], [4, 15], [1, 11]),
    rainyMonths: [7, 8],
    notes: ['The Mall and Ridge are pedestrian-only and steeply stacked — expect long uphill walks.'],
  },
  {
    id: 'darjeeling',
    name: 'Darjeeling',
    region: 'West Bengal',
    country: 'India',
    lat: 27.0410, lon: 88.2663,
    elevation: 2045,
    terrain: ['mountain', 'hill-station', 'tea-country'],
    tags: ['himalaya', 'steep-streets', 'fog', 'damp-cold', 'monsoon-heavy'],
    temps: t([2, 10], [3, 11], [7, 15], [10, 18], [12, 19], [14, 20], [14, 20], [14, 20], [13, 19], [10, 18], [6, 15], [3, 11]),
    rainyMonths: [6, 7, 8, 9],
    dayTripAltitude: 2590, // Tiger Hill
    notes: ['Damp cold with persistent fog — it feels colder than the numbers suggest.'],
  },
  {
    id: 'jaipur',
    name: 'Jaipur',
    region: 'Rajasthan',
    country: 'India',
    aliases: ['pink city'],
    lat: 26.9124, lon: 75.7873,
    elevation: 430,
    terrain: ['urban', 'arid', 'heritage'],
    tags: ['dry-heat', 'dusty', 'high-uv', 'fort-climbs', 'temple-etiquette'],
    temps: t([8, 22], [11, 26], [16, 32], [22, 38], [26, 40], [27, 39], [26, 34], [24, 32], [23, 33], [18, 33], [13, 28], [9, 23]),
    rainyMonths: [7, 8],
    notes: ['Forts mean long stone staircases in open sun.', 'Fine dust gets into everything.'],
  },
  {
    id: 'delhi',
    name: 'Delhi',
    region: 'Delhi',
    country: 'India',
    aliases: ['new delhi', 'ncr', 'gurgaon', 'noida'],
    lat: 28.6139, lon: 77.2090,
    elevation: 216,
    terrain: ['urban', 'metropolis'],
    tags: ['extreme-summer', 'cold-snap-winter', 'air-quality', 'dusty'],
    temps: t([7, 20], [10, 24], [15, 30], [21, 37], [26, 40], [28, 39], [27, 35], [26, 34], [24, 34], [19, 33], [13, 28], [8, 22]),
    rainyMonths: [7, 8],
    notes: ['Winter mornings are genuinely cold and foggy; air quality dips sharply Nov–Jan.'],
  },
  {
    id: 'mumbai',
    name: 'Mumbai',
    region: 'Maharashtra',
    country: 'India',
    aliases: ['bombay'],
    lat: 19.0760, lon: 72.8777,
    elevation: 14,
    terrain: ['urban', 'coastal', 'metropolis'],
    tags: ['humid', 'monsoon-heavy', 'tropical', 'crowded-transit'],
    temps: t([18, 31], [19, 32], [22, 33], [25, 33], [27, 34], [26, 32], [25, 30], [25, 29], [24, 31], [23, 34], [21, 34], [19, 32]),
    rainyMonths: [6, 7, 8, 9],
    notes: ['Humidity stays high year-round — cotton dries slowly.'],
  },
  {
    id: 'kolkata',
    name: 'Kolkata',
    region: 'West Bengal',
    country: 'India',
    aliases: ['calcutta'],
    lat: 22.5726, lon: 88.3639,
    elevation: 9,
    terrain: ['urban', 'metropolis', 'river'],
    tags: ['humid', 'monsoon-heavy', 'tropical', 'walkable-old-city'],
    temps: t([14, 26], [17, 29], [22, 33], [25, 35], [26, 35], [26, 34], [26, 32], [26, 32], [26, 32], [24, 32], [19, 30], [14, 27]),
    rainyMonths: [6, 7, 8, 9],
    notes: ['Winter is mild and pleasant; the rest of the year is humid.'],
  },
  {
    id: 'bengaluru',
    name: 'Bengaluru',
    region: 'Karnataka',
    country: 'India',
    aliases: ['bangalore'],
    lat: 12.9716, lon: 77.5946,
    elevation: 920,
    terrain: ['urban', 'plateau'],
    tags: ['mild', 'evening-chill', 'unpredictable-showers', 'sudden-downpours'],
    temps: t([15, 28], [17, 31], [19, 33], [21, 34], [21, 33], [20, 29], [19, 28], [19, 28], [19, 28], [19, 28], [17, 27], [15, 26]),
    rainyMonths: [5, 6, 9, 10],
    notes: ['Evenings cool off noticeably even in summer — a light layer earns its place.'],
  },
  {
    id: 'chennai',
    name: 'Chennai',
    region: 'Tamil Nadu',
    country: 'India',
    aliases: ['madras'],
    lat: 13.0827, lon: 80.2707,
    elevation: 6,
    terrain: ['urban', 'coastal'],
    tags: ['humid', 'hot', 'tropical', 'temple-etiquette'],
    temps: t([21, 29], [22, 31], [24, 33], [26, 35], [27, 38], [27, 37], [26, 35], [25, 34], [25, 34], [24, 32], [23, 29], [22, 28]),
    rainyMonths: [10, 11, 12],
    notes: ['The heavy rain arrives late in the year with the northeast monsoon.'],
  },
  {
    id: 'munnar',
    name: 'Munnar',
    region: 'Kerala',
    country: 'India',
    aliases: ['kerala hills', 'thekkady'],
    lat: 10.0889, lon: 77.0595,
    elevation: 1600,
    terrain: ['mountain', 'hill-station', 'tea-country', 'forest'],
    tags: ['damp-cool', 'leeches-in-monsoon', 'trekking', 'monsoon-heavy'],
    temps: t([12, 24], [13, 26], [15, 27], [16, 27], [17, 26], [17, 23], [17, 22], [17, 23], [16, 24], [16, 24], [14, 23], [12, 23]),
    rainyMonths: [6, 7, 8, 9, 10],
    notes: ['Cool, wet and green — mornings are misty and the ground stays damp.'],
  },
  {
    id: 'alleppey',
    name: 'Alleppey',
    region: 'Kerala',
    country: 'India',
    aliases: ['alappuzha', 'backwaters', 'kumarakom', 'kochi', 'cochin'],
    lat: 9.4981, lon: 76.3388,
    elevation: 3,
    terrain: ['coastal', 'backwater', 'tropical'],
    tags: ['humid', 'tropical', 'mosquitoes', 'boat-travel', 'monsoon-heavy'],
    temps: t([23, 32], [24, 32], [25, 33], [26, 33], [25, 32], [24, 29], [23, 29], [23, 29], [24, 30], [24, 31], [24, 31], [23, 32]),
    rainyMonths: [6, 7, 8, 9, 10],
    notes: ['Life happens on and beside water — mosquitoes are constant near the backwaters.'],
  },
  {
    id: 'rishikesh',
    name: 'Rishikesh',
    region: 'Uttarakhand',
    country: 'India',
    aliases: ['haridwar'],
    lat: 30.0869, lon: 78.2676,
    elevation: 372,
    terrain: ['river', 'foothills', 'forest'],
    tags: ['rafting', 'yoga', 'temple-etiquette', 'dry-town', 'monsoon-heavy'],
    temps: t([7, 20], [9, 24], [14, 30], [19, 36], [23, 39], [25, 37], [24, 32], [24, 31], [22, 31], [17, 30], [11, 26], [8, 21]),
    rainyMonths: [7, 8],
    notes: [
      'Modest dress is expected around the ghats and ashrams.',
      'River activities mean a second set of clothes gets soaked.',
    ],
  },
  {
    id: 'udaipur',
    name: 'Udaipur',
    region: 'Rajasthan',
    country: 'India',
    lat: 24.5854, lon: 73.7125,
    elevation: 598,
    terrain: ['urban', 'lake', 'heritage', 'arid'],
    tags: ['dry-heat', 'high-uv', 'palace-walks', 'temple-etiquette'],
    temps: t([8, 24], [11, 27], [16, 32], [21, 37], [26, 39], [26, 37], [24, 32], [23, 30], [22, 32], [18, 32], [13, 29], [9, 25]),
    rainyMonths: [7, 8],
    notes: ['Lakeside evenings are pleasant; midday sun on open palace terraces is not.'],
  },
  {
    id: 'andaman',
    name: 'Andaman Islands',
    region: 'Andaman & Nicobar',
    country: 'India',
    aliases: ['port blair', 'havelock', 'neil island', 'radhanagar'],
    lat: 11.6234, lon: 92.7265,
    elevation: 5,
    terrain: ['beach', 'island', 'coastal', 'forest'],
    tags: ['tropical', 'humid', 'high-uv', 'snorkelling', 'saltwater', 'limited-atms', 'patchy-signal', 'monsoon-heavy'],
    temps: t([23, 30], [23, 31], [24, 32], [25, 32], [25, 31], [24, 30], [24, 29], [24, 29], [24, 30], [24, 30], [23, 30], [23, 30]),
    rainyMonths: [5, 6, 7, 8, 9, 10],
    notes: [
      'Card acceptance and mobile signal are patchy outside Port Blair — carry cash.',
      'Reef-safe sunscreen matters here; ordinary sunscreen damages coral.',
    ],
  },
  {
    id: 'varanasi',
    name: 'Varanasi',
    region: 'Uttar Pradesh',
    country: 'India',
    aliases: ['banaras', 'kashi'],
    lat: 25.3176, lon: 82.9739,
    elevation: 81,
    terrain: ['urban', 'river', 'heritage'],
    tags: ['temple-etiquette', 'crowded-lanes', 'barefoot-zones', 'dusty', 'extreme-summer'],
    temps: t([9, 23], [12, 27], [17, 33], [23, 39], [27, 41], [28, 39], [27, 34], [26, 33], [25, 33], [21, 33], [15, 29], [10, 24]),
    rainyMonths: [7, 8],
    notes: [
      'Ghats and temples require removing shoes — slip-ons save real time.',
      'The old lanes are narrow, crowded and uneven.',
    ],
  },
  {
    id: 'shillong',
    name: 'Shillong',
    region: 'Meghalaya',
    country: 'India',
    aliases: ['meghalaya', 'cherrapunji', 'sohra', 'dawki'],
    lat: 25.5788, lon: 91.8933,
    elevation: 1500,
    terrain: ['mountain', 'hill-station', 'forest', 'waterfall'],
    tags: ['extreme-rain', 'damp-cool', 'trekking', 'caves', 'monsoon-heavy'],
    temps: t([4, 15], [6, 17], [10, 21], [14, 23], [15, 23], [17, 24], [17, 24], [17, 24], [16, 24], [13, 22], [9, 19], [6, 16]),
    rainyMonths: [5, 6, 7, 8, 9],
    notes: [
      'Among the wettest places on earth — rain is a design constraint, not a risk.',
      'Living-root-bridge trails involve thousands of wet stone steps.',
    ],
  },
  {
    id: 'jaisalmer',
    name: 'Jaisalmer',
    region: 'Rajasthan',
    country: 'India',
    aliases: ['thar', 'desert'],
    lat: 26.9157, lon: 70.9083,
    elevation: 225,
    terrain: ['desert', 'arid', 'heritage'],
    tags: ['dry-heat', 'sandstorms', 'huge-diurnal-swing', 'intense-uv', 'camel-safari'],
    temps: t([8, 24], [11, 28], [17, 34], [23, 39], [27, 42], [29, 42], [27, 38], [26, 36], [25, 37], [20, 36], [14, 30], [9, 25]),
    rainyMonths: [7, 8],
    notes: [
      'Desert nights are far colder than the daytime heat suggests.',
      'Blown sand is the main threat to camera gear.',
    ],
  },
  {
    id: 'ooty',
    name: 'Ooty',
    region: 'Tamil Nadu',
    country: 'India',
    aliases: ['nilgiris', 'coonoor', 'kodaikanal'],
    lat: 11.4102, lon: 76.6950,
    elevation: 2240,
    terrain: ['mountain', 'hill-station', 'tea-country'],
    tags: ['damp-cool', 'fog', 'garden-walks', 'monsoon-heavy'],
    temps: t([5, 20], [6, 22], [8, 23], [11, 24], [12, 24], [12, 21], [11, 20], [11, 20], [11, 21], [10, 21], [8, 20], [6, 19]),
    rainyMonths: [6, 7, 8, 9, 10],
    notes: ['Cool all year; evenings drop quickly once the mist settles.'],
  },
  {
    id: 'pondicherry',
    name: 'Pondicherry',
    region: 'Puducherry',
    country: 'India',
    aliases: ['puducherry', 'auroville'],
    lat: 11.9416, lon: 79.8083,
    elevation: 3,
    terrain: ['coastal', 'urban', 'heritage'],
    tags: ['humid', 'tropical', 'cycling-town', 'cafe-culture'],
    temps: t([20, 29], [21, 31], [23, 33], [26, 35], [27, 37], [27, 37], [26, 35], [25, 34], [25, 33], [24, 31], [22, 29], [21, 28]),
    rainyMonths: [10, 11, 12],
    notes: ['The French Quarter is best covered on foot or by bicycle.'],
  },

  /* ------------------------- International ------------------------- */
  {
    id: 'bali',
    name: 'Bali',
    region: 'Bali',
    country: 'Indonesia',
    aliases: ['ubud', 'canggu', 'seminyak', 'indonesia'],
    lat: -8.4095, lon: 115.1889,
    elevation: 50,
    terrain: ['beach', 'island', 'tropical', 'forest'],
    tags: ['tropical', 'humid', 'high-uv', 'scooter-country', 'temple-etiquette', 'saltwater', 'international', 'monsoon-heavy'],
    temps: t([24, 31], [24, 31], [24, 32], [24, 32], [23, 31], [23, 30], [22, 30], [22, 30], [23, 31], [24, 31], [24, 32], [24, 31]),
    rainyMonths: [12, 1, 2, 3],
    notes: [
      'Temples require covered shoulders and knees; sarongs are usually lent at the gate.',
      'Scooters are the default way to get around.',
    ],
  },
  {
    id: 'bangkok',
    name: 'Bangkok',
    region: 'Bangkok',
    country: 'Thailand',
    aliases: ['thailand', 'phuket', 'chiang mai'],
    lat: 13.7563, lon: 100.5018,
    elevation: 2,
    terrain: ['urban', 'tropical', 'metropolis'],
    tags: ['humid', 'hot', 'temple-etiquette', 'strong-aircon', 'street-food', 'international', 'monsoon-heavy'],
    temps: t([22, 33], [24, 34], [26, 35], [27, 36], [26, 34], [26, 33], [25, 33], [25, 33], [25, 32], [24, 32], [23, 32], [21, 32]),
    rainyMonths: [6, 7, 8, 9, 10],
    notes: [
      'Temples enforce covered shoulders and knees.',
      'Indoor air-conditioning runs cold enough to want a layer.',
    ],
  },
  {
    id: 'singapore',
    name: 'Singapore',
    country: 'Singapore',
    aliases: [],
    lat: 1.3521, lon: 103.8198,
    elevation: 15,
    terrain: ['urban', 'tropical', 'metropolis'],
    tags: ['humid', 'hot', 'strong-aircon', 'sudden-downpours', 'international', 'card-friendly'],
    temps: t([24, 30], [24, 31], [25, 32], [25, 32], [26, 32], [26, 32], [25, 31], [25, 31], [25, 31], [25, 31], [24, 31], [24, 30]),
    rainyMonths: [11, 12, 1],
    notes: ['Downpours arrive fast and pass quickly.', 'Indoor spaces are aggressively air-conditioned.'],
  },
  {
    id: 'dubai',
    name: 'Dubai',
    country: 'UAE',
    aliases: ['abu dhabi', 'uae', 'emirates'],
    lat: 25.2048, lon: 55.2708,
    elevation: 5,
    terrain: ['urban', 'desert', 'coastal'],
    tags: ['extreme-heat', 'intense-uv', 'strong-aircon', 'modest-dress-public', 'international', 'card-friendly'],
    temps: t([15, 24], [16, 25], [18, 29], [21, 33], [25, 38], [27, 40], [30, 41], [30, 41], [27, 39], [23, 35], [19, 30], [16, 26]),
    rainyMonths: [],
    notes: [
      'Outdoors is punishing in summer; indoors is chilled.',
      'Modest dress is expected in malls and public areas.',
    ],
  },
  {
    id: 'paris',
    name: 'Paris',
    country: 'France',
    aliases: ['france'],
    lat: 48.8566, lon: 2.3522,
    elevation: 35,
    terrain: ['urban', 'temperate', 'metropolis'],
    tags: ['walking-city', 'cobblestones', 'drizzle', 'four-season', 'international', 'card-friendly'],
    temps: t([3, 7], [3, 8], [5, 12], [7, 16], [11, 20], [14, 23], [16, 25], [16, 25], [13, 21], [10, 16], [6, 11], [4, 8]),
    rainyMonths: [10, 11, 12, 1],
    notes: [
      'Cobblestones and 15,000-step days are the norm.',
      'Grey drizzle is more common than heavy rain.',
    ],
  },
  {
    id: 'london',
    name: 'London',
    country: 'United Kingdom',
    aliases: ['uk', 'england', 'britain'],
    lat: 51.5074, lon: -0.1278,
    elevation: 11,
    terrain: ['urban', 'temperate', 'metropolis'],
    tags: ['walking-city', 'drizzle', 'four-season', 'international', 'card-friendly', 'type-g-plug'],
    temps: t([3, 8], [3, 9], [4, 12], [6, 15], [9, 18], [12, 21], [14, 24], [14, 23], [12, 20], [9, 16], [5, 12], [3, 9]),
    rainyMonths: [10, 11, 12, 1],
    notes: ['Rain is light but frequent — a compact umbrella beats a heavy raincoat.'],
  },
  {
    id: 'tokyo',
    name: 'Tokyo',
    country: 'Japan',
    aliases: ['japan', 'kyoto', 'osaka'],
    lat: 35.6762, lon: 139.6503,
    elevation: 40,
    terrain: ['urban', 'temperate', 'metropolis'],
    tags: ['walking-city', 'four-season', 'cash-still-useful', 'shoes-off-indoors', 'international'],
    temps: t([2, 10], [2, 11], [5, 14], [10, 19], [15, 23], [18, 26], [22, 30], [23, 31], [20, 27], [14, 22], [8, 17], [4, 12]),
    rainyMonths: [6, 7, 9],
    notes: [
      'Expect 20,000-step days across train stations.',
      'Public bins are rare — a small pouch for rubbish is genuinely useful.',
      'Shoes come off in many restaurants and ryokan.',
    ],
  },
  {
    id: 'switzerland',
    name: 'Interlaken',
    region: 'Bernese Oberland',
    country: 'Switzerland',
    aliases: ['swiss', 'zurich', 'lucerne', 'jungfrau', 'alps'],
    lat: 46.6863, lon: 7.8632,
    elevation: 570,
    terrain: ['mountain', 'alpine', 'lake', 'forest'],
    tags: ['alpine', 'intense-uv', 'cable-cars', 'four-season', 'international', 'expensive'],
    temps: t([-2, 3], [-2, 5], [1, 10], [4, 14], [8, 19], [11, 22], [13, 24], [13, 23], [10, 19], [6, 14], [1, 8], [-1, 4]),
    rainyMonths: [6, 7, 8],
    dayTripAltitude: 3450, // Jungfraujoch
    notes: [
      'Cable cars lift you thousands of metres in minutes — the summit is a different season.',
      'Snow and glare persist at altitude even in midsummer.',
    ],
  },
  {
    id: 'maldives',
    name: 'Maldives',
    country: 'Maldives',
    aliases: ['male', 'atoll'],
    lat: 3.2028, lon: 73.2207,
    elevation: 2,
    terrain: ['beach', 'island', 'coastal'],
    tags: ['tropical', 'high-uv', 'snorkelling', 'saltwater', 'boat-travel', 'international', 'modest-dress-local-islands', 'monsoon-heavy'],
    temps: t([26, 30], [26, 31], [27, 31], [27, 32], [26, 31], [26, 30], [26, 30], [26, 30], [26, 30], [26, 30], [26, 30], [26, 30]),
    rainyMonths: [5, 6, 7, 10, 11],
    notes: [
      'Reef-safe sunscreen is required at many resorts.',
      'On inhabited local islands, cover up away from designated beaches.',
    ],
  },
  {
    id: 'nepal',
    name: 'Kathmandu',
    country: 'Nepal',
    aliases: ['pokhara', 'everest', 'annapurna', 'abc', 'ebc'],
    lat: 27.7172, lon: 85.3240,
    elevation: 1400,
    terrain: ['mountain', 'urban', 'forest'],
    tags: ['himalaya', 'trekking', 'dusty', 'temple-etiquette', 'international', 'monsoon-heavy'],
    temps: t([2, 19], [4, 21], [8, 25], [12, 28], [16, 29], [19, 29], [20, 28], [20, 28], [19, 28], [13, 27], [7, 23], [3, 20]),
    rainyMonths: [6, 7, 8, 9],
    dayTripAltitude: 3200,
    notes: [
      'Trekking routes gain serious altitude — plan for a different climate on the trail.',
      'Kathmandu air is dusty; a light mask helps in traffic.',
    ],
  },
  {
    id: 'newyork',
    name: 'New York City',
    country: 'United States',
    aliases: ['nyc', 'manhattan', 'usa', 'brooklyn'],
    lat: 40.7128, lon: -74.0060,
    elevation: 10,
    terrain: ['urban', 'temperate', 'metropolis'],
    tags: ['walking-city', 'four-season', 'harsh-winter', 'card-friendly', 'international'],
    temps: t([-3, 4], [-2, 6], [2, 11], [7, 17], [13, 22], [18, 27], [21, 29], [20, 28], [16, 24], [10, 18], [5, 12], [0, 7]),
    rainyMonths: [3, 4, 11],
    notes: [
      'Winter wind between buildings cuts harder than the temperature suggests.',
      'Everything is walking distance until it suddenly is not.',
    ],
  },
  {
    id: 'iceland',
    name: 'Reykjavik',
    country: 'Iceland',
    aliases: ['reykjavik', 'northern lights'],
    lat: 64.1466, lon: -21.9426,
    elevation: 40,
    terrain: ['coastal', 'volcanic', 'tundra'],
    tags: ['severe-wind', 'wet-cold', 'four-seasons-in-a-day', 'geothermal-pools', 'international', 'expensive', 'drizzle'],
    temps: t([-3, 2], [-2, 3], [-2, 4], [1, 6], [4, 10], [7, 13], [9, 15], [8, 14], [6, 11], [2, 7], [-1, 4], [-2, 3]),
    rainyMonths: [9, 10, 11, 12, 1, 2],
    notes: [
      'Wind, not temperature, is the real challenge — windproof beats thick.',
      'The weather genuinely changes several times a day.',
      'Swimwear is essential; geothermal pools are everyday life.',
    ],
  },
];

/* ------------------------------------------------------------------ */
/*  Fallback profiles by climate archetype                             */
/* ------------------------------------------------------------------ */

export const ARCHETYPES = {
  tropicalCoast: {
    elevation: 10,
    terrain: ['beach', 'coastal', 'tropical'],
    tags: ['tropical', 'humid', 'high-uv', 'saltwater'],
    temps: t([22, 31], [23, 32], [24, 33], [26, 34], [26, 34], [25, 32], [25, 31], [25, 31], [25, 32], [24, 32], [23, 32], [22, 31]),
    rainyMonths: [6, 7, 8, 9],
  },
  mountain: {
    elevation: 2000,
    terrain: ['mountain', 'hill-station'],
    tags: ['high-altitude', 'steep-streets', 'cold-nights'],
    temps: t([1, 12], [2, 14], [6, 18], [9, 21], [12, 22], [14, 22], [14, 21], [14, 21], [12, 21], [9, 19], [5, 16], [2, 13]),
    rainyMonths: [7, 8],
  },
  desert: {
    elevation: 300,
    terrain: ['desert', 'arid'],
    tags: ['dry-heat', 'huge-diurnal-swing', 'intense-uv', 'dusty'],
    temps: t([8, 24], [11, 28], [16, 33], [22, 38], [27, 41], [28, 41], [27, 37], [26, 35], [24, 36], [19, 34], [13, 29], [9, 25]),
    rainyMonths: [],
  },
  temperateCity: {
    elevation: 100,
    terrain: ['urban', 'temperate'],
    tags: ['walking-city', 'four-season'],
    temps: t([2, 8], [3, 10], [6, 14], [9, 18], [13, 22], [16, 26], [18, 28], [18, 27], [15, 23], [11, 18], [6, 12], [3, 9]),
    rainyMonths: [10, 11, 12],
  },
  subtropicalCity: {
    elevation: 150,
    terrain: ['urban'],
    tags: ['humid', 'crowded-transit'],
    temps: t([12, 25], [15, 28], [20, 32], [24, 35], [26, 36], [26, 34], [26, 32], [25, 32], [24, 32], [21, 31], [16, 28], [12, 25]),
    rainyMonths: [6, 7, 8, 9],
  },
};

/* ------------------------------------------------------------------ */
/*  Resolution                                                         */
/* ------------------------------------------------------------------ */

const norm = (s) => (s || '').toLowerCase().trim();

/** Keyword hints used when we have no exact profile for a place. */
const HINTS = [
  { words: ['beach', 'island', 'atoll', 'coast', 'bay', 'riviera'], archetype: 'tropicalCoast' },
  { words: ['mountain', 'hill', 'peak', 'valley', 'pass', 'alps', 'himalaya', 'trek', 'glacier'], archetype: 'mountain' },
  { words: ['desert', 'dune', 'sahara', 'oasis'], archetype: 'desert' },
];

/** Countries whose default climate we can guess reasonably well. */
const COUNTRY_HINTS = {
  india: 'subtropicalCity', thailand: 'tropicalCoast', vietnam: 'tropicalCoast',
  indonesia: 'tropicalCoast', philippines: 'tropicalCoast', 'sri lanka': 'tropicalCoast',
  malaysia: 'tropicalCoast', cambodia: 'tropicalCoast', france: 'temperateCity',
  germany: 'temperateCity', italy: 'temperateCity', spain: 'temperateCity',
  netherlands: 'temperateCity', poland: 'temperateCity', norway: 'temperateCity',
  sweden: 'temperateCity', canada: 'temperateCity', japan: 'temperateCity',
  korea: 'temperateCity', china: 'temperateCity', egypt: 'desert',
  morocco: 'desert', jordan: 'desert', qatar: 'desert', australia: 'tropicalCoast',
  'new zealand': 'temperateCity', nepal: 'mountain', bhutan: 'mountain',
  switzerland: 'mountain', austria: 'mountain', peru: 'mountain',
};

const titleCase = (s) =>
  (s || '').trim().replace(/\s+/g, ' ')
    .replace(/(^|[\s,\-/])([a-z])/g, (m, p, c) => p + c.toUpperCase());

/**
 * Resolve any free-text destination to a usable profile.
 * Always returns something for non-empty input — never null — so the app
 * cannot dead-end on a place we have not catalogued.
 */
export function resolveDestination(query) {
  const q = norm(query);
  if (!q) return null;

  // 1. Exact / alias / substring match against the curated set.
  const scored = DESTINATIONS.map((d) => {
    const hay = [d.name, d.region, d.country, ...(d.aliases || [])].filter(Boolean).map(norm);
    let score = 0;
    for (const h of hay) {
      if (h === q) score = Math.max(score, 100);
      else if (h.startsWith(q) && q.length >= 3) score = Math.max(score, 80);
      else if (q.startsWith(h) && h.length >= 4) score = Math.max(score, 74);
      else if (h.includes(q) && q.length >= 4) score = Math.max(score, 60);
      else if (q.includes(h) && h.length >= 4) score = Math.max(score, 55);
    }
    return { d, score };
  }).filter((x) => x.score > 0).sort((a, b) => b.score - a.score);

  if (scored.length) return { ...scored[0].d, confidence: 'known' };

  // 2. Keyword / country inference.
  let archetypeKey = null;
  for (const hint of HINTS) {
    if (hint.words.some((w) => q.includes(w))) { archetypeKey = hint.archetype; break; }
  }
  if (!archetypeKey) {
    for (const [country, key] of Object.entries(COUNTRY_HINTS)) {
      if (q.includes(country)) { archetypeKey = key; break; }
    }
  }

  const base = ARCHETYPES[archetypeKey || 'subtropicalCity'];
  return {
    ...base,
    id: 'custom:' + q.replace(/\W+/g, '-'),
    name: titleCase(query),
    region: null,
    country: null,
    lat: null,
    lon: null,
    notes: [],
    confidence: archetypeKey ? 'inferred' : 'unknown',
  };
}

/** Type-ahead suggestions for the destination field. */
export function searchDestinations(query, limit = 6) {
  const q = norm(query);
  if (q.length < 1) return [];
  const out = [];
  for (const d of DESTINATIONS) {
    const hay = [d.name, d.region, d.country, ...(d.aliases || [])].filter(Boolean).map(norm);
    if (hay.some((h) => h.startsWith(q))) out.push({ d, rank: 0 });
    else if (hay.some((h) => h.includes(q))) out.push({ d, rank: 1 });
  }
  return out.sort((a, b) => a.rank - b.rank).slice(0, limit).map((x) => x.d);
}

export const POPULAR = ['Gangtok', 'Goa', 'Leh, Ladakh', 'Manali', 'Jaipur', 'Bali'];

/** Cities offered as origin suggestions. Origin only affects transit advice. */
export const ORIGIN_SUGGESTIONS = [
  'Kolkata', 'Delhi', 'Mumbai', 'Bengaluru', 'Chennai', 'Hyderabad',
  'Pune', 'Ahmedabad', 'Jaipur', 'Lucknow', 'Guwahati', 'Kochi',
];
