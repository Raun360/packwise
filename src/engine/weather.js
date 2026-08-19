/**
 * Weather observations, per stop.
 *
 * Three sources, in order of preference:
 *   1. Live forecast, when the dates are inside the forecast horizon.
 *   2. Historical record for the same calendar dates in recent years — a far
 *      better answer than a monthly average, and the only way to know that
 *      Leh in August is dry while Kolkata in August is not.
 *   3. Curated normals, then a latitude/elevation estimate.
 *
 * Contract: nothing here throws or rejects. The worst case is a result marked
 * `estimated`, and the plan is built regardless. The network is never on the
 * critical path.
 */

import { classifyEnvironment, estimateTemps } from './climate.js';
import { DESTINATIONS } from '../data/destinations.js';

const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';
const ARCHIVE_URL = 'https://archive-api.open-meteo.com/v1/archive';

const TIMEOUT_MS = 7000;
const FORECAST_HORIZON_DAYS = 16;
/** Years of history averaged for dates beyond the forecast horizon. */
const HISTORY_YEARS = 3;

const cache = new Map();

const iso = (d) => d.toISOString().slice(0, 10);
const parse = (s) => new Date(s + 'T00:00:00');

function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms)),
  ]);
}

async function fetchJSON(url, signal) {
  const res = await withTimeout(fetch(url, { signal }), TIMEOUT_MS);
  if (!res.ok) throw new Error('HTTP ' + res.status);
  return res.json();
}

const mean = (arr) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null);
const nums = (arr) => (arr || []).filter((n) => typeof n === 'number');

/* ------------------------------------------------------------------ */
/*  Sources                                                            */
/* ------------------------------------------------------------------ */

async function fromForecast(stop, startDate, endDate, signal) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const maxEnd = new Date(today);
  maxEnd.setDate(maxEnd.getDate() + FORECAST_HORIZON_DAYS);

  const start = parse(startDate) < today ? today : parse(startDate);
  const end = parse(endDate) > maxEnd ? maxEnd : parse(endDate);
  if (end < start) return null;

  const params = new URLSearchParams({
    latitude: String(stop.latitude),
    longitude: String(stop.longitude),
    daily: 'temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max',
    timezone: 'auto',
    start_date: iso(start),
    end_date: iso(end),
  });

  const d = (await fetchJSON(`${FORECAST_URL}?${params}`, signal))?.daily;
  const mins = nums(d?.temperature_2m_min);
  const maxs = nums(d?.temperature_2m_max);
  if (!mins.length || !maxs.length) return null;

  const precip = nums(d.precipitation_sum);
  const prob = nums(d.precipitation_probability_max);

  return {
    source: 'forecast',
    tempMin: Math.round(Math.min(...mins)),
    tempMax: Math.round(Math.max(...maxs)),
    precipMmPerDay: precip.length ? Math.round(mean(precip) * 10) / 10 : null,
    rainChance: prob.length ? Math.round(Math.max(...prob)) : null,
    partial: iso(end) !== endDate,
  };
}

/**
 * The same calendar window in each of the last few years. Averaging several
 * years smooths out any single freak season.
 */
async function fromHistory(stop, startDate, endDate, signal) {
  const start = parse(startDate);
  const end = parse(endDate);
  const thisYear = new Date().getFullYear();
  const baseYear = start.getFullYear();

  const years = [];
  for (let i = 1; i <= HISTORY_YEARS; i++) {
    // Never ask for a window that has not happened yet.
    const y = Math.min(baseYear, thisYear) - i;
    years.push(y);
  }

  const shift = (d, y) => {
    const c = new Date(d);
    c.setFullYear(c.getFullYear() - (baseYear - y));
    return iso(c);
  };

  const results = await Promise.allSettled(years.map((y) => {
    const params = new URLSearchParams({
      latitude: String(stop.latitude),
      longitude: String(stop.longitude),
      daily: 'temperature_2m_max,temperature_2m_min,precipitation_sum',
      timezone: 'auto',
      start_date: shift(start, y),
      end_date: shift(end, y),
    });
    return fetchJSON(`${ARCHIVE_URL}?${params}`, signal);
  }));

  const mins = [];
  const maxs = [];
  const precipTotals = [];
  let days = 0;

  for (const r of results) {
    if (r.status !== 'fulfilled') continue;
    const d = r.value?.daily;
    const lo = nums(d?.temperature_2m_min);
    const hi = nums(d?.temperature_2m_max);
    if (!lo.length || !hi.length) continue;
    mins.push(Math.min(...lo));
    maxs.push(Math.max(...hi));
    const p = nums(d.precipitation_sum);
    if (p.length) {
      precipTotals.push(p.reduce((a, b) => a + b, 0) / p.length);
      days = Math.max(days, p.length);
    }
  }

  if (!mins.length) return null;

  const mmPerDay = precipTotals.length ? mean(precipTotals) : null;
  return {
    source: 'history',
    tempMin: Math.round(mean(mins)),
    tempMax: Math.round(mean(maxs)),
    precipMmPerDay: mmPerDay == null ? null : Math.round(mmPerDay * 10) / 10,
    // Share of sampled years that saw meaningful rain in this window.
    rainChance: precipTotals.length
      ? Math.round((precipTotals.filter((p) => p > 1).length / precipTotals.length) * 100)
      : null,
    yearsSampled: mins.length,
  };
}

/** Curated monthly normals, when we have a profile for this place. */
function fromNormals(stop, months) {
  const profile = stop.profileId
    ? DESTINATIONS.find((d) => d.id === stop.profileId)
    : null;
  if (!profile) return null;

  const sampled = months.map((m) => profile.temps[m]);
  const rainy = months.some((m) => (profile.rainyMonths || []).includes(m + 1));
  const heavy = (profile.tags || []).includes('extreme-rain') ? 22
    : (profile.tags || []).includes('monsoon-heavy') ? 12 : 4;

  return {
    source: 'normals',
    tempMin: Math.min(...sampled.map((p) => p[0])),
    tempMax: Math.max(...sampled.map((p) => p[1])),
    precipMmPerDay: rainy ? heavy : (profile.rainyMonths || []).length ? 0.8 : 0.3,
    rainChance: rainy ? 70 : 15,
  };
}

function fromEstimate(stop, months) {
  const month = months.length ? months[0] : new Date().getMonth();
  const { tempMin, tempMax } = estimateTemps(stop.latitude, stop.elevation, month);
  return { source: 'estimated', tempMin, tempMax, precipMmPerDay: null, rainChance: null };
}

/* ------------------------------------------------------------------ */
/*  Public API                                                         */
/* ------------------------------------------------------------------ */

/**
 * Conditions at one stop for the travel window, plus its environment
 * classification. Always returns an object.
 */
export async function getStopClimate(stop, startDate, endDate, months, { signal } = {}) {
  const key = `${stop.id}|${startDate}|${endDate}`;
  if (cache.has(key)) return cache.get(key);

  const hasCoords = typeof stop.latitude === 'number' && typeof stop.longitude === 'number';
  let obs = null;
  let reason = null;

  if (hasCoords && startDate && endDate && typeof fetch === 'function') {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const daysOut = Math.round((parse(startDate) - today) / 86400000);

    try {
      if (daysOut <= FORECAST_HORIZON_DAYS && daysOut > -2) {
        obs = await fromForecast(stop, startDate, endDate, signal);
      }
      if (!obs) obs = await fromHistory(stop, startDate, endDate, signal);
    } catch (err) {
      reason = 'unreachable';
    }
  } else if (!hasCoords) {
    reason = 'no-location';
  }

  if (!obs) obs = fromNormals(stop, months);
  if (!obs) {
    obs = fromEstimate(stop, months);
    reason = reason || 'estimated';
  }

  const profile = stop.profileId ? DESTINATIONS.find((d) => d.id === stop.profileId) : null;
  const terrain = profile?.terrain || (stop.kind ? [stop.kind] : []);

  const environment = classifyEnvironment({
    lat: stop.latitude,
    elevation: stop.elevation,
    tempMin: obs.tempMin,
    tempMax: obs.tempMax,
    precipMmPerDay: obs.precipMmPerDay,
    terrain,
  });

  const result = {
    stopId: stop.id,
    stopName: stop.name,
    elevation: stop.elevation,
    ...obs,
    reason,
    environment,
    ok: obs.source === 'forecast' || obs.source === 'history',
  };

  cache.set(key, result);
  return result;
}

/** Conditions at every stop, fetched in parallel. */
export async function getRouteClimate(stops, startDate, endDate, months, opts = {}) {
  const settled = await Promise.allSettled(
    stops.map((s) => getStopClimate(s, startDate, endDate, months, opts))
  );
  return settled.map((r, i) =>
    r.status === 'fulfilled' ? r.value : {
      stopId: stops[i].id,
      stopName: stops[i].name,
      ...fromEstimate(stops[i], months),
      environment: classifyEnvironment({ lat: stops[i].latitude, elevation: stops[i].elevation }),
      ok: false,
      reason: 'unreachable',
    }
  );
}

/** How we knew what we knew, in the UI's voice. */
export function climateSourceLabel(climate, monthLabel) {
  if (!climate) return `Typical ${monthLabel} conditions`;
  switch (climate.source) {
    case 'forecast':
      return climate.partial
        ? 'Live forecast for the first part of your trip'
        : 'Live forecast for your dates';
    case 'history':
      return `Based on the last ${climate.yearsSampled || HISTORY_YEARS} years of records for these exact dates`;
    case 'normals':
      return `Typical ${monthLabel} conditions for this destination`;
    default:
      return climate.reason === 'unreachable'
        ? `Weather service unavailable — estimated from elevation and latitude`
        : `Estimated from elevation and latitude`;
  }
}

export const WEATHER_UNAVAILABLE_TEXT = 'Weather information unavailable';
