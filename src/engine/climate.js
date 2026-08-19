/**
 * Climate intelligence.
 *
 * Classifies a place by what it physically is, not by what month it is.
 * "India in August" is not a climate: Kolkata in August is tropical and
 * soaked, while Leh in August is a high-altitude cold desert that sees almost
 * no rain at all. Those two facts have to produce different packing lists, and
 * only real elevation, latitude and precipitation data can tell them apart.
 *
 * Pure functions — no network. Observations come from engine/weather.js.
 */

export const ALTITUDE_BANDS = [
  { id: 'sea-level', min: -100, label: 'Sea level' },
  { id: 'low', min: 500, label: 'Low elevation' },
  { id: 'mid', min: 1500, label: 'Hill elevation' },
  { id: 'high', min: 2500, label: 'High elevation' },
  { id: 'extreme', min: 3500, label: 'Very high elevation' },
];

export function altitudeBand(elevation) {
  const e = elevation || 0;
  let band = ALTITUDE_BANDS[0];
  for (const b of ALTITUDE_BANDS) if (e >= b.min) band = b;
  return band.id;
}

/** Millimetres of rain per day, banded. */
export function aridityOf(mmPerDay) {
  if (mmPerDay == null) return null;
  if (mmPerDay < 0.6) return 'arid';
  if (mmPerDay < 2) return 'semi-arid';
  if (mmPerDay < 6) return 'moderate';
  return 'wet';
}

export function thermalOf(tempMin, tempMax) {
  if (tempMin <= 0) return 'freezing';
  if (tempMin <= 8) return 'cold';
  if (tempMax <= 20) return 'cool';
  if (tempMax <= 28) return 'mild';
  if (tempMax <= 35) return 'warm';
  return 'hot';
}

export const ZONE_LABEL = {
  'cold-desert': 'Cold desert',
  'high-altitude': 'High altitude',
  mountain: 'Mountain',
  desert: 'Desert',
  arid: 'Arid',
  'semi-arid': 'Semi-arid',
  tropical: 'Tropical',
  subtropical: 'Subtropical',
  temperate: 'Temperate',
  coastal: 'Coastal',
  wet: 'Very wet',
  continental: 'Continental',
};

/**
 * Classify a place's environment.
 *
 * @param {object} input
 *   lat, elevation, tempMin, tempMax, precipMmPerDay, terrain (Set|array)
 * @returns {{zones: string[], primary: string, altitude: string,
 *            aridity: string|null, thermal: string, label: string}}
 */
export function classifyEnvironment({
  lat = 20, elevation = 0, tempMin = 15, tempMax = 25,
  precipMmPerDay = null, terrain = [],
} = {}) {
  const terr = new Set(Array.isArray(terrain) ? terrain : [...(terrain || [])]);
  const absLat = Math.abs(lat ?? 20);
  const alt = altitudeBand(elevation);
  const aridity = aridityOf(precipMmPerDay);
  const thermal = thermalOf(tempMin, tempMax);

  const zones = new Set();

  /* --- Elevation --- */
  if (alt === 'extreme' || alt === 'high') zones.add('high-altitude');
  if (elevation >= 1500) zones.add('mountain');

  /* --- Moisture --- */
  if (aridity === 'arid') zones.add('arid');
  else if (aridity === 'semi-arid') zones.add('semi-arid');
  else if (aridity === 'wet') zones.add('wet');

  // A cold desert is the combination that most often gets mis-packed: high,
  // dry and cold, in a month people associate with monsoon rain.
  const dry = aridity === 'arid' || aridity === 'semi-arid';
  if (elevation >= 2500 && dry && tempMin <= 12) zones.add('cold-desert');
  if (elevation < 1500 && aridity === 'arid' && tempMax >= 30) zones.add('desert');

  /* --- Latitude, only meaningful near sea level --- */
  if (elevation < 1200) {
    if (absLat < 23.5) zones.add('tropical');
    else if (absLat < 35) zones.add('subtropical');
    else if (absLat < 55) zones.add('temperate');
    else zones.add('continental');
  } else if (absLat >= 35) {
    zones.add('continental');
  }

  /* --- Coast --- */
  if (terr.has('beach') || terr.has('coastal') || terr.has('island') || terr.has('backwater')) {
    zones.add('coastal');
  }

  // Terrain we were told about explicitly outranks anything inferred.
  if (terr.has('cold-desert')) zones.add('cold-desert');
  if (terr.has('desert')) zones.add(elevation >= 2000 ? 'cold-desert' : 'desert');

  /* --- Pick the most distinctive label --- */
  const PRIORITY = [
    'cold-desert', 'desert', 'high-altitude', 'mountain', 'wet',
    'coastal', 'tropical', 'arid', 'semi-arid', 'subtropical',
    'temperate', 'continental',
  ];
  const primary = PRIORITY.find((z) => zones.has(z)) || 'temperate';

  return {
    zones: [...zones],
    primary,
    altitude: alt,
    aridity,
    thermal,
    label: ZONE_LABEL[primary] || 'Temperate',
  };
}

/* ------------------------------------------------------------------ */
/*  Fallback estimation                                                */
/* ------------------------------------------------------------------ */

const LAPSE = 6.5 / 1000;

/**
 * Last-resort temperature estimate from latitude, elevation and month, used
 * only when we have neither an observation nor a curated profile. Crude, and
 * labelled as such wherever it reaches the UI.
 */
export function estimateTemps(lat, elevation, month) {
  const absLat = Math.abs(lat ?? 20);
  const seaLevelMean = 27 - 0.32 * absLat;
  // Seasonal swing grows with latitude; the tropics barely have one.
  const amplitude = Math.max(1.5, 0.28 * absLat);
  // Northern hemisphere peaks in July (month index 6); southern in January.
  const peak = (lat ?? 20) >= 0 ? 6 : 0;
  const seasonal = Math.cos((2 * Math.PI * (month - peak)) / 12);
  const mean = seaLevelMean + amplitude * seasonal - (elevation || 0) * LAPSE;

  // Daily range widens with elevation and dryness.
  const spread = 5 + Math.min(9, (elevation || 0) / 450);
  return {
    tempMin: Math.round(mean - spread),
    tempMax: Math.round(mean + spread),
  };
}

/**
 * Combine several stops' conditions into what the traveller must actually be
 * ready for across the whole route.
 */
export function combineClimates(stopClimates) {
  const valid = stopClimates.filter(Boolean);
  if (!valid.length) return null;

  const tempMin = Math.min(...valid.map((c) => c.tempMin));
  const tempMax = Math.max(...valid.map((c) => c.tempMax));
  const precip = valid
    .map((c) => c.precipMmPerDay)
    .filter((n) => typeof n === 'number');

  const zones = new Set();
  valid.forEach((c) => (c.environment?.zones || []).forEach((z) => zones.add(z)));

  return {
    tempMin,
    tempMax,
    // The span across the route is what forces layering.
    span: tempMax - tempMin,
    precipMmPerDay: precip.length ? Math.max(...precip) : null,
    wettest: valid.reduce((a, b) =>
      (b.precipMmPerDay ?? -1) > (a.precipMmPerDay ?? -1) ? b : a, valid[0]),
    coldest: valid.reduce((a, b) => (b.tempMin < a.tempMin ? b : a), valid[0]),
    hottest: valid.reduce((a, b) => (b.tempMax > a.tempMax ? b : a), valid[0]),
    zones: [...zones],
  };
}
