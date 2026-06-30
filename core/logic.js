import { calculateEnthalpy, humidityRatio } from './physics.js';

const ENTHALPY_THRESHOLD = 3; // kJ/kg
const HUMIDITY_THRESHOLD = 1; // g/kg

export function decideShouldOpen(
  mode,
  t,
  rh,
  tOut,
  humOut,
  enthalpyTrendWeight
) {
  let shouldOpen;
  let adjustedShouldOpen;

  if (mode === 'CoolDown') {
    const hIn = calculateEnthalpy(t, rh / 100);
    const hOut = calculateEnthalpy(tOut, humOut / 100);
    const diff = hIn - hOut;
    const threshold = ENTHALPY_THRESHOLD; // kJ/kg
    const adjustedDiff = diff - enthalpyTrendWeight;

    if (Math.abs(diff) < threshold)
      shouldOpen = null; // dead zone
    else shouldOpen = diff > 0;

    if (Math.abs(adjustedDiff) < threshold)
      adjustedShouldOpen = null; // dead zone
    else adjustedShouldOpen = adjustedDiff > 0;
  } else {
    const wIn = humidityRatio(t, rh / 100);
    const wOut = humidityRatio(tOut, humOut / 100);
    const diff = (wIn - wOut) * 1000; // convert to g/kg for threshold comparison
    const threshold = HUMIDITY_THRESHOLD; // g/kg

    if (Math.abs(diff) < threshold) shouldOpen = null;
    else shouldOpen = diff > 0;
  }

  return [shouldOpen, adjustedShouldOpen];
}
