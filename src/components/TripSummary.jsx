import {
  CalendarDays, Thermometer, Backpack, Mountain, CloudRain, Info, Sun, Gauge,
} from 'lucide-react';
import { climateSourceLabel } from '../engine/weather.js';
import { ACTIVITY_MAP } from '../data/activities.js';

const STYLE_LABEL = { minimal: 'Minimal packing', balanced: 'Balanced packing', prepared: 'Prepared packing' };
const LUGGAGE_LABEL = { backpack: 'Backpack', cabin: 'Cabin bag', suitcase: 'Suitcase' };

const climateWord = (thermal) => ({
  freezing: 'Freezing conditions',
  cold: 'Cold weather',
  cool: 'Cool weather',
  mild: 'Mild weather',
  warm: 'Warm weather',
  hot: 'Hot weather',
}[thermal] || 'Mixed conditions');

export default function TripSummary({ ctx }) {
  const activities = ctx.activities.map((a) => ACTIVITY_MAP[a]?.label).filter(Boolean);
  const primaryClimate = ctx.climates[0] || null;
  const { contrast, route } = ctx;

  return (
    <div className="card trip-card">
      <div className="eyebrow">Conditions</div>
      <div className="trip-rows">
        <div className="trip-row">
          <CalendarDays aria-hidden="true" />
          <span className="val">
            {ctx.days} {ctx.days === 1 ? 'day' : 'days'} · {ctx.nights} {ctx.nights === 1 ? 'night' : 'nights'}
            <span className="sub">{ctx.monthLabel}</span>
          </span>
        </div>

        <div className="trip-row">
          <Thermometer aria-hidden="true" />
          <span className="val">
            {ctx.haveReadings ? (
              <>
                {climateWord(ctx.thermal)}
                <span className="sub tnum">
                  {Math.round(ctx.tempMin)}° to {Math.round(ctx.tempMax)}°C across your route
                </span>
              </>
            ) : (
              <>
                Weather information unavailable
                <span className="sub">Using elevation and latitude to estimate</span>
              </>
            )}
          </span>
        </div>

        {contrast?.mixedEnvironments && contrast.tempSpread >= 8 && (
          <div className="trip-row">
            <Gauge aria-hidden="true" />
            <span className="val">
              {Math.round(contrast.tempSpread)}°C swing along the way
              <span className="sub">
                {contrast.coldest.stopName} coldest · {contrast.hottest.stopName} warmest
              </span>
            </span>
          </div>
        )}

        {ctx.environment && (
          <div className="trip-row">
            <Sun aria-hidden="true" />
            <span className="val">
              {ctx.environment.label}
              <span className="sub">
                {[...ctx.zones]
                  .filter((z) => z !== ctx.environment.primary)
                  .slice(0, 3)
                  .join(' · ') || 'Consistent across your route'}
              </span>
            </span>
          </div>
        )}

        {route.elevationRange >= 300 && (
          <div className="trip-row">
            <Mountain aria-hidden="true" />
            <span className="val">
              <span className="tnum">
                {route.minElevation.toLocaleString()}–{route.maxElevation.toLocaleString()} m
              </span>
              <span className="sub">
                {ctx.goesHigh
                  ? `Around ${ctx.highPointTempMin}° to ${ctx.highPointTempMax}°C at the highest point`
                  : `Highest at ${route.highest?.name || 'your route'}`}
              </span>
            </span>
          </div>
        )}

        {ctx.rainLikely ? (
          <div className="trip-row">
            <CloudRain aria-hidden="true" />
            <span className="val">
              {ctx.rainIntensity === 'extreme' ? 'Very heavy rain likely'
                : ctx.rainIntensity === 'heavy' ? 'Sustained rain likely' : 'Some rain likely'}
              <span className="sub tnum">
                {ctx.precipMmPerDay != null
                  ? `~${ctx.precipMmPerDay} mm a day at ${contrast?.wettest?.stopName || ctx.destinationName}`
                  : `Typical for ${ctx.monthLabel}`}
              </span>
            </span>
          </div>
        ) : ctx.precipMmPerDay != null && (
          <div className="trip-row">
            <CloudRain aria-hidden="true" />
            <span className="val">
              Dry across your dates
              <span className="sub tnum">~{ctx.precipMmPerDay} mm a day — no rain gear needed</span>
            </span>
          </div>
        )}

        <div className="trip-row">
          <Backpack aria-hidden="true" />
          <span className="val">
            {STYLE_LABEL[ctx.style]}
            <span className="sub">{LUGGAGE_LABEL[ctx.luggage]}</span>
          </span>
        </div>
      </div>

      {activities.length > 0 && (
        <div className="weather-note" style={{ borderTop: '1px solid var(--line-faint)' }}>
          <span>{activities.join(' · ')}</span>
        </div>
      )}

      <div className="weather-note">
        <Info aria-hidden="true" />
        <span>{climateSourceLabel(primaryClimate, ctx.monthLabel)}</span>
      </div>
    </div>
  );
}
