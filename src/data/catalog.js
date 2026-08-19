/**
 * Item catalog — static facts about things you can pack.
 *
 * Rules add items by id and decide quantity, priority and reason. Everything
 * that does not depend on the trip lives here: display name, category, unit
 * weight in kg, and hints the optimiser uses (bulk, compressible, dual-use).
 */

export const CATEGORIES = [
  { id: 'essentials',   label: 'Essentials',          blurb: 'The things that end a trip if you forget them.' },
  { id: 'clothing',     label: 'Clothing',            blurb: 'Sized to your days and the forecast.' },
  { id: 'footwear',     label: 'Footwear',            blurb: 'Chosen for the ground you will actually cover.' },
  { id: 'personalCare', label: 'Personal care',       blurb: 'Small things, easy to forget.' },
  { id: 'health',       label: 'Health & first aid',  blurb: 'Enough to handle the ordinary problems.' },
  { id: 'tech',         label: 'Tech & power',        blurb: 'Keeping everything charged and connected.' },
  { id: 'destination',  label: 'Destination-specific', blurb: 'Because of where you are going, not what you are doing.' },
  { id: 'route',        label: 'Based on your route',  blurb: 'Driven by the journey itself — transfers, distance and changing conditions.' },
  { id: 'activity',     label: 'Activity gear',       blurb: 'Driven by what you plan to do.' },
  { id: 'extras',       label: 'Practical extras',    blurb: 'Small comforts that punch above their weight.' },
];

export const CATEGORY_ORDER = CATEGORIES.map((c) => c.id);
export const CATEGORY_MAP = Object.fromEntries(CATEGORIES.map((c) => [c.id, c]));

/**
 * `w`  unit weight in kg
 * `bulk`  takes disproportionate space relative to weight
 * `compressible`  packing cubes / rolling genuinely helps
 * `wearable`  can be worn in transit instead of packed (optimiser uses this)
 * `unit`  display unit when it is not simply a count
 */
const item = (id, name, category, w, extra = {}) => ({ id, name, category, w, ...extra });

export const CATALOG_LIST = [
  /* ------------------------------ Essentials ------------------------------ */
  item('id-card', 'Government ID', 'essentials', 0.02),
  item('passport', 'Passport', 'essentials', 0.04),
  item('visa-docs', 'Visa documents', 'essentials', 0.02),
  item('wallet', 'Wallet', 'essentials', 0.12),
  item('cash', 'Cash', 'essentials', 0.03),
  item('cards', 'Debit / credit card', 'essentials', 0.01),
  item('phone', 'Phone', 'essentials', 0.19),
  item('tickets', 'Travel tickets', 'essentials', 0.02),
  item('booking-confirmations', 'Hotel & booking confirmations', 'essentials', 0.02),
  item('permit-docs', 'Permit paperwork & ID copies', 'essentials', 0.03),
  item('passport-photos', 'Passport photographs', 'essentials', 0.01),
  item('house-keys', 'House keys', 'essentials', 0.05),
  item('travel-insurance', 'Travel insurance details', 'essentials', 0.01),
  item('forex', 'Foreign currency', 'essentials', 0.03),

  /* ------------------------------- Clothing ------------------------------- */
  item('tshirts', 'T-shirts', 'clothing', 0.15, { compressible: true }),
  item('shirts-full', 'Full-sleeve shirts', 'clothing', 0.22, { compressible: true }),
  item('linen-shirts', 'Light linen shirts', 'clothing', 0.16, { compressible: true }),
  item('base-layer-top', 'Thermal top', 'clothing', 0.19, { compressible: true }),
  item('base-layer-bottom', 'Thermal bottoms', 'clothing', 0.18, { compressible: true }),
  item('fleece', 'Fleece or sweater', 'clothing', 0.42, { bulk: true, compressible: true, wearable: true }),
  item('warm-jacket', 'Insulated jacket', 'clothing', 0.85, { bulk: true, wearable: true }),
  item('heavy-parka', 'Heavy winter parka', 'clothing', 1.35, { bulk: true, wearable: true }),
  item('windcheater', 'Windproof shell', 'clothing', 0.34, { compressible: true, wearable: true }),
  item('rain-jacket', 'Rain jacket', 'clothing', 0.38, { compressible: true, wearable: true }),
  item('light-jacket', 'Light jacket', 'clothing', 0.45, { wearable: true }),
  item('jeans', 'Jeans or trousers', 'clothing', 0.58, { bulk: true, wearable: true }),
  item('trekking-pants', 'Quick-dry trousers', 'clothing', 0.32, { compressible: true }),
  item('shorts', 'Shorts', 'clothing', 0.21, { compressible: true }),
  item('dresses', 'Dresses or kurtas', 'clothing', 0.26, { compressible: true }),
  item('nightwear', 'Nightwear', 'clothing', 0.24, { compressible: true }),
  item('underwear', 'Underwear', 'clothing', 0.05, { compressible: true }),
  item('socks', 'Socks', 'clothing', 0.05, { unit: 'pairs', compressible: true }),
  item('wool-socks', 'Wool socks', 'clothing', 0.08, { unit: 'pairs', compressible: true }),
  item('swimwear', 'Swimwear', 'clothing', 0.12, { compressible: true }),
  item('cover-up', 'Beach cover-up', 'clothing', 0.18, { compressible: true }),
  item('modest-layer', 'Scarf or shawl', 'clothing', 0.16, { compressible: true }),
  item('going-out-outfit', 'One going-out outfit', 'clothing', 0.42),
  item('smart-casual', 'Smart-casual outfit', 'clothing', 0.45),
  item('thermal-gloves', 'Insulated gloves', 'clothing', 0.11),
  item('wool-cap', 'Woollen cap', 'clothing', 0.08, { compressible: true }),
  item('sun-hat', 'Sun hat or cap', 'clothing', 0.09, { bulk: true }),
  item('neck-gaiter', 'Neck gaiter or muffler', 'clothing', 0.07, { compressible: true }),
  item('snow-pants', 'Snow trousers', 'clothing', 0.62, { bulk: true }),
  item('quick-dry-towel', 'Quick-dry towel', 'clothing', 0.16, { compressible: true }),

  /* ------------------------------- Footwear ------------------------------- */
  item('walking-shoes', 'Comfortable walking shoes', 'footwear', 0.78, { bulk: true, wearable: true }),
  item('trekking-shoes', 'Trekking shoes', 'footwear', 1.05, { bulk: true, wearable: true }),
  item('winter-boots', 'Insulated boots', 'footwear', 1.25, { bulk: true, wearable: true }),
  item('sandals', 'Sandals', 'footwear', 0.38, { bulk: true }),
  item('flip-flops', 'Flip-flops', 'footwear', 0.22),
  item('slippers', 'Slippers', 'footwear', 0.20),
  item('water-shoes', 'Water shoes', 'footwear', 0.31),
  item('dress-shoes', 'Evening shoes', 'footwear', 0.62, { bulk: true }),
  item('shoe-bag', 'Shoe bag', 'footwear', 0.04),

  /* ----------------------------- Personal care ---------------------------- */
  item('toothbrush', 'Toothbrush', 'personalCare', 0.02),
  item('toothpaste', 'Toothpaste', 'personalCare', 0.08),
  item('face-wash', 'Face wash', 'personalCare', 0.10),
  item('shampoo', 'Shampoo', 'personalCare', 0.14),
  item('soap', 'Soap or body wash', 'personalCare', 0.12),
  item('moisturiser', 'Moisturiser', 'personalCare', 0.09),
  item('heavy-moisturiser', 'Rich moisturiser or cold cream', 'personalCare', 0.11),
  item('lip-balm', 'Lip balm with SPF', 'personalCare', 0.01),
  item('sunscreen', 'Sunscreen', 'personalCare', 0.13),
  item('reef-safe-sunscreen', 'Reef-safe sunscreen', 'personalCare', 0.13),
  item('deodorant', 'Deodorant', 'personalCare', 0.08),
  item('hand-sanitiser', 'Hand sanitiser', 'personalCare', 0.06),
  item('tissues', 'Tissues', 'personalCare', 0.05),
  item('wet-wipes', 'Wet wipes', 'personalCare', 0.12),
  item('comb', 'Comb or hairbrush', 'personalCare', 0.05),
  item('razor', 'Razor & shaving kit', 'personalCare', 0.10),
  item('nail-clipper', 'Nail clipper', 'personalCare', 0.03),
  item('menstrual-supplies', 'Period supplies', 'personalCare', 0.11),
  item('contact-supplies', 'Contact lenses & solution', 'personalCare', 0.14),
  item('toiletry-bag', 'Toiletry bag', 'personalCare', 0.14),
  item('laundry-soap', 'Travel laundry soap', 'personalCare', 0.06),
  item('hair-oil', 'Hair oil or serum', 'personalCare', 0.09),
  item('mosquito-repellent', 'Mosquito repellent', 'personalCare', 0.10),
  item('talcum', 'Talcum or anti-chafe powder', 'personalCare', 0.10),

  /* ------------------------------- Health --------------------------------- */
  item('prescription-meds', 'Prescription medication', 'health', 0.10),
  item('painkillers', 'Painkillers', 'health', 0.03),
  item('stomach-meds', 'Anti-diarrhoeal & antacid', 'health', 0.04),
  item('motion-sickness', 'Motion-sickness tablets', 'health', 0.02),
  item('band-aids', 'Band-aids & antiseptic', 'health', 0.07),
  item('cold-meds', 'Cold & fever medicine', 'health', 0.04),
  item('altitude-meds', 'Altitude-sickness medication', 'health', 0.03),
  item('ors', 'ORS or electrolyte sachets', 'health', 0.06),
  item('blister-plasters', 'Blister plasters', 'health', 0.02),
  item('first-aid-kit', 'Compact first-aid kit', 'health', 0.22),
  item('face-mask', 'Face masks', 'health', 0.01),
  item('insect-bite-cream', 'Insect-bite cream', 'health', 0.04),
  item('throat-lozenges', 'Throat lozenges', 'health', 0.03),

  /* -------------------------------- Tech ---------------------------------- */
  item('phone-charger', 'Phone charger', 'tech', 0.11),
  item('power-bank', 'Power bank', 'tech', 0.26),
  item('earphones', 'Earphones', 'tech', 0.06),
  item('universal-adapter', 'Universal travel adapter', 'tech', 0.13),
  item('camera', 'Camera', 'tech', 0.72, { bulk: true }),
  item('camera-batteries', 'Spare camera batteries', 'tech', 0.09),
  item('memory-cards', 'Memory cards', 'tech', 0.02),
  item('camera-cleaning', 'Lens cloth & blower', 'tech', 0.06),
  item('tripod', 'Compact tripod', 'tech', 0.98, { bulk: true }),
  item('laptop', 'Laptop & charger', 'tech', 1.65, { bulk: true }),
  item('multi-charger', 'Multi-port charger', 'tech', 0.16),
  item('offline-maps', 'Offline maps downloaded', 'tech', 0, { virtual: true }),
  item('cable-pouch', 'Cable pouch', 'tech', 0.09),

  /* --------------------------- Destination-specific ------------------------ */
  item('sunglasses', 'Sunglasses', 'destination', 0.04),
  item('uv-sunglasses', 'UV-blocking sunglasses', 'destination', 0.04),
  item('umbrella', 'Compact umbrella', 'destination', 0.28),
  item('rain-cover', 'Backpack rain cover', 'destination', 0.13),
  item('dry-bag', 'Dry bag', 'destination', 0.15),
  item('reusable-bottle', 'Reusable water bottle', 'destination', 0.18),
  item('insulated-flask', 'Insulated flask', 'destination', 0.32),
  item('water-purification', 'Water purification tablets', 'destination', 0.03),
  item('snacks', 'Travel snacks', 'destination', 0.30),
  item('hand-warmers', 'Hand warmers', 'destination', 0.06),
  item('lip-protection', 'High-SPF lip protection', 'destination', 0.01),
  item('dust-mask', 'Dust buff or mask', 'destination', 0.04),
  item('sarong', 'Sarong', 'destination', 0.17, { compressible: true }),
  item('anti-humidity-pouch', 'Silica packs for camera bag', 'destination', 0.03),
  item('salt-rinse-cloth', 'Microfibre cloth for salt & sand', 'destination', 0.05),

  /* ----------------------------- Activity gear ---------------------------- */
  item('daypack', 'Small daypack', 'activity', 0.38, { compressible: true }),
  item('trekking-poles', 'Trekking poles', 'activity', 0.48, { bulk: true }),
  item('headlamp', 'Headlamp or torch', 'activity', 0.11),
  item('snorkel-mask', 'Snorkel mask', 'activity', 0.34, { bulk: true }),
  item('waterproof-phone-pouch', 'Waterproof phone pouch', 'activity', 0.05),
  item('gym-wear', 'Activewear set', 'activity', 0.30, { compressible: true }),
  item('yoga-mat', 'Travel yoga mat', 'activity', 0.9, { bulk: true }),
  item('sleeping-bag', 'Sleeping bag', 'activity', 1.25, { bulk: true }),
  item('camp-mat', 'Sleeping mat', 'activity', 0.55, { bulk: true }),
  item('camp-cutlery', 'Camp cutlery & mug', 'activity', 0.22),
  item('binoculars', 'Binoculars', 'activity', 0.55, { bulk: true }),
  item('helmet', 'Riding helmet', 'activity', 1.30, { bulk: true, wearable: true }),
  item('riding-gloves', 'Riding gloves', 'activity', 0.16),
  item('driving-licence', 'Driving licence', 'activity', 0.01),
  item('ski-goggles', 'Snow goggles', 'activity', 0.21, { bulk: true }),

  /* ------------------------------- Extras --------------------------------- */
  item('daybag-lock', 'Small padlock', 'extras', 0.07),
  item('travel-outfit', 'Comfortable travel outfit', 'route', 0.38, { compressible: true, wearable: true }),
  item('transit-pouch', 'Grab pouch for travel days', 'route', 0.08),
  item('layer-access-bag', 'Top-of-bag layer', 'route', 0.05),
  item('compression-sack', 'Compression sack', 'route', 0.09),
  item('luggage-tag', 'Luggage tags', 'route', 0.02),
  item('spare-mask-buff', 'Buff or neck scarf for the road', 'route', 0.06, { compressible: true }),
  item('packing-cubes', 'Packing cubes', 'extras', 0.14),
  item('laundry-bag', 'Laundry bag', 'extras', 0.05),
  item('foldable-tote', 'Foldable tote bag', 'extras', 0.09, { compressible: true }),
  item('neck-pillow', 'Neck pillow', 'extras', 0.22, { bulk: true }),
  item('eye-mask', 'Eye mask & earplugs', 'extras', 0.05),
  item('book', 'Book or e-reader', 'extras', 0.28),
  item('zip-bags', 'Ziplock bags', 'extras', 0.04),
  item('sewing-kit', 'Mini sewing kit', 'extras', 0.03),
  item('travel-pillowcase', 'Travel pillowcase', 'extras', 0.11),
  item('doorstop-alarm', 'Doorstop alarm', 'extras', 0.08),
  item('pen', 'Pen', 'extras', 0.01),
];

export const CATALOG = Object.fromEntries(CATALOG_LIST.map((i) => [i.id, i]));

if (import.meta.env?.DEV) {
  const seen = new Set();
  for (const i of CATALOG_LIST) {
    if (seen.has(i.id)) console.warn('[catalog] duplicate id:', i.id);
    seen.add(i.id);
    if (!CATEGORY_MAP[i.category]) console.warn('[catalog] unknown category:', i.category, i.id);
  }
}
