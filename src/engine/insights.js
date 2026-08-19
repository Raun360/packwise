/**
 * "Why is my list different from a generic one?"
 *
 * The per-item reasons answer that one item at a time, but only if you go
 * looking. This states the two or three forces that shaped the whole list,
 * before the traveller has clicked anything.
 *
 * Icons are named rather than imported so this stays free of UI dependencies.
 */

const round = (n) => Math.round(n);

export function deriveInsights(ctx) {
  const out = [];
  const { route, contrast } = ctx;
  const highNames = ctx.places
    .filter((p) => (p.altitude ?? 0) >= 3000)
    .map((p) => p.name);

  /* ---- The journey itself comes first on a multi-stop trip ---- */
  if (route.multiStop) {
    const changes = route.destinationChanges;
    out.push({
      icon: 'Route',
      title: `${route.destinationCount} bases, ${changes} ${changes === 1 ? 'transfer' : 'transfers'}`,
      body: `You repack and move ${changes} ${changes === 1 ? 'time' : 'times'} across ${ctx.days} days${route.totalKm ? `, covering roughly ${route.totalKm.toLocaleString()} km` : ''}. Travel intensity is ${route.intensity.label.toLowerCase()} — ${route.intensity.detail.toLowerCase()}`,
    });
  }

  /* ---- Climate contrast across the route ---- */
  if (contrast?.mixedEnvironments && contrast.tempSpread >= 8) {
    out.push({
      icon: 'ThermometerSun',
      title: `${round(contrast.tempSpread)}°C between your warmest and coldest stop`,
      body: `${contrast.hottest.stopName} reaches about ${round(contrast.hottest.tempMax)}°C while ${contrast.coldest.stopName} drops to ${round(contrast.coldest.tempMin)}°C. One bag has to cover both, which is why the list leans on layers.`,
    });
  }

  /* ---- Altitude ---- */
  if (route.elevationRange >= 1200 && route.highest) {
    out.push({
      icon: 'Mountain',
      title: `Your route climbs to ${route.maxElevation.toLocaleString()} m`,
      body: `${route.highest.name} sits ${route.elevationRange.toLocaleString()} m above the lowest point on your trip. Thinner air means stronger sun, colder nights and bigger swings between the two.`,
    });
  } else if (ctx.goesHigh && ctx.highPoint >= 3000) {
    out.push({
      icon: 'Mountain',
      title: `You climb to ${ctx.highPoint.toLocaleString()} m`,
      body: highNames.length
        ? `${highNames.join(' and ')} ${highNames.length > 1 ? 'sit' : 'sits'} far above ${ctx.destinationName}. Up there it is roughly ${ctx.highPointTempMin}° to ${ctx.highPointTempMax}°C.`
        : `Your day trips leave ${ctx.destinationName} far below. Conditions up top are effectively a different season.`,
    });
  }

  /* ---- Environment, stated as what it actually is ---- */
  const env = ctx.environment;
  if (env?.primary === 'cold-desert') {
    out.push({
      icon: 'Sun',
      title: 'A cold desert, not a monsoon',
      body: `Records for your dates show around ${ctx.precipMmPerDay ?? 0} mm of rain a day at ${ctx.destinationName}. Despite the time of year, this is dry, high, intensely sunny ground — sun protection and layers matter far more than waterproofing.`,
    });
  } else if (ctx.rainIntensity === 'extreme' || ctx.rainIntensity === 'heavy') {
    out.push({
      icon: 'CloudRain',
      title: 'Sustained rain is likely',
      body: `${contrast?.wettest?.stopName || ctx.destinationName} averages about ${ctx.precipMmPerDay} mm a day across your dates, so waterproofing is built into the list rather than left to chance.`,
    });
  } else if (ctx.tempMin <= 5 && !route.multiStop) {
    out.push({
      icon: 'Snowflake',
      title: `Nights drop to about ${round(ctx.tempMin)}°C`,
      body: `${ctx.monthLabel} in ${ctx.destinationName} means layering rather than one heavy coat — that is why you see a base layer, a mid layer and a shell.`,
    });
  } else if (ctx.tempMax >= 33) {
    out.push({
      icon: 'Sun',
      title: `Daytime highs near ${round(ctx.tempMax)}°C`,
      body: 'Heat decides the quantities here — more changes of clothing, and sun protection treated as essential rather than optional.',
    });
  }

  /* ---- Permits ---- */
  if (ctx.placeSignals.has('permit-required')) {
    out.push({
      icon: 'FileCheck',
      title: 'Some of your stops need permits',
      body: 'Protected-area permits mean printed ID copies and photographs — paperwork people routinely forget until they are turned back.',
    });
  }

  /* ---- Coast ---- */
  if (ctx.terrain.has('beach') || ctx.demands.has('swim')) {
    out.push({
      icon: 'Waves',
      title: 'Salt, sand and sun',
      body: 'Beach days change what you carry more than most people expect — quick-drying fabrics, protection for electronics, and sunscreen sized for real exposure.',
    });
  }

  /* ---- International ---- */
  if (ctx.international) {
    out.push({
      icon: 'Globe',
      title: `${ctx.foreignCountry || 'This'} is an international trip`,
      body: 'Passport validity, entry documents, local currency and a plug adapter are all part of the list for that reason.',
    });
  }

  return out.slice(0, 3);
}

/**
 * A short, non-medical safety note for high ground.
 *
 * Deliberately not advice: altitude illness is a matter for a doctor and for
 * local guidance, not a packing app. We say that the ground is high, and point
 * elsewhere for anything health-related.
 */
export function altitudeNotice(ctx) {
  const peak = Math.max(ctx.highPoint || 0, ctx.route?.maxElevation || 0);
  if (peak < 3000) return null;

  const sleepsHigh = (ctx.baseElevation || 0) >= 3000;
  const named = ctx.route?.highest?.name
    || ctx.places.filter((p) => (p.altitude ?? 0) >= 3000)[0]?.name;

  return {
    peak,
    title: `Parts of your route are above ${peak >= 4000 ? '4,000' : '3,000'} m`,
    body: sleepsHigh
      ? `You will be sleeping at around ${(ctx.baseElevation || 0).toLocaleString()} m${named ? `, and reaching ${peak.toLocaleString()} m at ${named}` : ''}. How people respond to thin air varies a great deal.`
      : `${named ? `${named} reaches about ${peak.toLocaleString()} m` : `You reach about ${peak.toLocaleString()} m`}, well above where the air starts to thin.`,
    action: 'Check official and local guidance on acclimatising, and speak to a doctor before you travel if you have any health concerns.',
  };
}
