/**
 * Gazetteer of well-known travel places.
 *
 * Two gaps this fills. First, global geocoders index cities well but rank small
 * Himalayan settlements poorly or miss them entirely — a search for "Kaza"
 * returns Kazan in Tatarstan long before the village in Spiti. Second, the
 * named points of interest that matter most for packing (a pass at 5,359 m, a
 * lake at 3,753 m) are exactly the entries a geocoder is weakest on.
 *
 * Coordinates and elevations are real. Entries here are merged into search
 * ahead of remote results, and keep working with no network.
 */

const p = (name, region, country, lat, lon, elevation, kind, extra = {}) => ({
  name, region, country, lat, lon, elevation, kind, ...extra,
});

export const CURATED_PLACES = [
  /* ---- Sikkim & Darjeeling ---- */
  p('Nathula Pass', 'Sikkim', 'India', 27.3866, 88.8306, 4310, 'pass', { permit: true }),
  p('Tsomgo Lake', 'Sikkim', 'India', 27.3747, 88.7626, 3753, 'lake', { permit: true, aliases: ['changu lake', 'tsongmo'] }),
  p('Gurudongmar Lake', 'Sikkim', 'India', 27.9500, 88.7100, 5430, 'lake', { permit: true }),
  p('MG Marg', 'Sikkim', 'India', 27.3280, 88.6140, 1650, 'landmark', { aliases: ['mg road gangtok'] }),
  p('Rumtek Monastery', 'Sikkim', 'India', 27.2880, 88.5610, 1550, 'landmark'),
  p('Pelling', 'Sikkim', 'India', 27.3017, 88.2394, 2150, 'town'),
  p('Ravangla', 'Sikkim', 'India', 27.3070, 88.3620, 2000, 'town'),
  p('Lachung', 'Sikkim', 'India', 27.6900, 88.7430, 2750, 'village', { permit: true }),
  p('Yumthang Valley', 'Sikkim', 'India', 27.8200, 88.7000, 3564, 'valley', { permit: true }),
  p('Tiger Hill', 'West Bengal', 'India', 27.0060, 88.2680, 2590, 'peak'),
  p('Batasia Loop', 'West Bengal', 'India', 27.0300, 88.2500, 2200, 'landmark'),

  /* ---- Himachal & Spiti ---- */
  p('Kaza', 'Himachal Pradesh', 'India', 32.2270, 78.0710, 3800, 'town', { aliases: ['spiti'] }),
  p('Tabo', 'Himachal Pradesh', 'India', 32.0950, 78.3830, 3280, 'village'),
  p('Spiti Valley', 'Himachal Pradesh', 'India', 32.2460, 78.0170, 3800, 'valley'),
  p('Kibber', 'Himachal Pradesh', 'India', 32.3300, 78.0100, 4270, 'village'),
  p('Chandratal', 'Himachal Pradesh', 'India', 32.4780, 77.6180, 4300, 'lake'),
  p('Key Monastery', 'Himachal Pradesh', 'India', 32.2980, 78.0120, 4166, 'landmark', { aliases: ['ki monastery'] }),
  p('Rohtang Pass', 'Himachal Pradesh', 'India', 32.3720, 77.2470, 3978, 'pass'),
  p('Solang Valley', 'Himachal Pradesh', 'India', 32.3160, 77.1580, 2560, 'valley'),
  p('Kunzum Pass', 'Himachal Pradesh', 'India', 32.4100, 77.6400, 4590, 'pass'),
  p('Kalpa', 'Himachal Pradesh', 'India', 31.5380, 78.2570, 2960, 'village'),
  p('Kasol', 'Himachal Pradesh', 'India', 32.0100, 77.3150, 1640, 'village'),
  p('Dharamshala', 'Himachal Pradesh', 'India', 32.2190, 76.3234, 1457, 'town', { aliases: ['mcleodganj'] }),

  /* ---- Ladakh ---- */
  p('Khardung La', 'Ladakh', 'India', 34.2796, 77.6045, 5359, 'pass'),
  p('Pangong Tso', 'Ladakh', 'India', 33.7500, 78.9000, 4225, 'lake', { permit: true, aliases: ['pangong lake'] }),
  p('Nubra Valley', 'Ladakh', 'India', 34.6868, 77.5619, 3048, 'valley', { permit: true }),
  p('Tso Moriri', 'Ladakh', 'India', 32.9000, 78.3200, 4522, 'lake', { permit: true }),
  p('Thiksey Monastery', 'Ladakh', 'India', 34.0550, 77.6670, 3600, 'landmark'),
  p('Magnetic Hill', 'Ladakh', 'India', 34.2200, 77.3800, 3400, 'landmark'),
  p('Zanskar Valley', 'Ladakh', 'India', 33.4500, 76.9000, 3500, 'valley'),

  /* ---- Uttarakhand & Nepal ---- */
  p('Kedarnath', 'Uttarakhand', 'India', 30.7350, 79.0669, 3583, 'landmark'),
  p('Badrinath', 'Uttarakhand', 'India', 30.7433, 79.4938, 3133, 'landmark'),
  p('Valley of Flowers', 'Uttarakhand', 'India', 30.7280, 79.6050, 3658, 'park'),
  p('Auli', 'Uttarakhand', 'India', 30.5290, 79.5660, 2800, 'village'),
  p('Poon Hill', 'Gandaki', 'Nepal', 28.4000, 83.6860, 3210, 'peak'),
  p('Everest Base Camp', 'Koshi', 'Nepal', 28.0026, 86.8528, 5364, 'landmark'),
  p('Annapurna Base Camp', 'Gandaki', 'Nepal', 28.5300, 83.8800, 4130, 'landmark'),
  p('Pokhara', 'Gandaki', 'Nepal', 28.2096, 83.9856, 822, 'city'),

  /* ---- North-east ---- */
  p('Cherrapunji', 'Meghalaya', 'India', 25.3000, 91.7000, 1430, 'town', { aliases: ['sohra'] }),
  p('Dawki', 'Meghalaya', 'India', 25.1900, 92.0200, 100, 'village'),
  p('Mawlynnong', 'Meghalaya', 'India', 25.2020, 91.9160, 800, 'village'),
  p('Nohkalikai Falls', 'Meghalaya', 'India', 25.2760, 91.6850, 1200, 'waterfall'),
  p('Tawang', 'Arunachal Pradesh', 'India', 27.5860, 91.8590, 3048, 'town', { permit: true }),
  p('Kaziranga National Park', 'Assam', 'India', 26.5775, 93.1711, 80, 'park'),

  /* ---- Elsewhere in India ---- */
  p('Amber Fort', 'Rajasthan', 'India', 26.9855, 75.8513, 550, 'landmark', { aliases: ['amer fort'] }),
  p('Hawa Mahal', 'Rajasthan', 'India', 26.9239, 75.8267, 430, 'landmark'),
  p('Sam Sand Dunes', 'Rajasthan', 'India', 26.8700, 70.5100, 180, 'beach'),
  p('Dudhsagar Falls', 'Goa', 'India', 15.3144, 74.3144, 320, 'waterfall'),
  p('Palolem Beach', 'Goa', 'India', 15.0100, 74.0233, 5, 'beach'),
  p('Anjuna Beach', 'Goa', 'India', 15.5752, 73.7405, 5, 'beach'),
  p('Radhanagar Beach', 'Andaman & Nicobar', 'India', 11.9830, 92.9500, 5, 'beach'),
  p('Eravikulam National Park', 'Kerala', 'India', 10.1900, 77.0500, 2000, 'park'),
  p('Dashashwamedh Ghat', 'Uttar Pradesh', 'India', 25.3070, 83.0100, 80, 'landmark'),

  /* ---- International high points ---- */
  p('Jungfraujoch', 'Bern', 'Switzerland', 46.5474, 7.9855, 3454, 'pass'),
  p('Schilthorn', 'Bern', 'Switzerland', 46.5580, 7.8350, 2970, 'peak'),
  p('Grindelwald', 'Bern', 'Switzerland', 46.6240, 8.0340, 1034, 'village'),
  p('Blue Lagoon', 'Sudurnes', 'Iceland', 63.8804, -22.4495, 30, 'spring'),
  p('Mount Fuji', 'Shizuoka', 'Japan', 35.3606, 138.7274, 3776, 'peak'),
];

/** Names that reliably indicate a place is visited from somewhere, not stayed in. */
export const POI_KINDS = new Set([
  'lake', 'pass', 'peak', 'mountain', 'glacier', 'waterfall', 'cave',
  'landmark', 'park', 'beach', 'spring', 'valley', 'coast', 'transit',
]);
