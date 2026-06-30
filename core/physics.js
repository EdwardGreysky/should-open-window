// ─── Physics constants ────────────────────────────────────────────────────────
const DRY_AIR_TERM = 1.006;
const LATENT_HEAT_VAPORIZATION = 2501;
const WATER_VAPOR_TERM = 1.86;
const ATM_PRESSURE = 101325; // Pa

function saturationVaporPressure(T) {
  return 610.78 * Math.exp((17.27 * T) / (T + 237.3));
}

function vaporPressure(T, RH) {
  return RH * saturationVaporPressure(T);
}

export function humidityRatio(T, RH) {
  const Pv = vaporPressure(T, RH);
  return (0.622 * Pv) / (ATM_PRESSURE - Pv);
}

export function calculateEnthalpy(temp, rh) {
  const w = humidityRatio(temp, rh);
  return (
    DRY_AIR_TERM * temp +
    w * (LATENT_HEAT_VAPORIZATION + WATER_VAPOR_TERM * temp)
  );
}

export function saturationCurve(Tmin, Tmax, step = 0.5) {
  const points = [];
  for (let T = Tmin; T <= Tmax; T += step) {
    const Psat = saturationVaporPressure(T);
    const wSat = (0.622 * Psat) / (ATM_PRESSURE - Psat);
    points.push({ x: T, y: wSat });
  }
  return points;
}

export function enthalpyLine(h, Tmin, Tmax, step = 0.5) {
  const points = [];
  for (let T = Tmin; T <= Tmax; T += step) {
    const w =
      (h - DRY_AIR_TERM * T) /
      (LATENT_HEAT_VAPORIZATION + WATER_VAPOR_TERM * T);
    if (w > 0) points.push({ x: T, y: w });
  }
  return points;
}

export function humidityRatioLine(w, Tmin, Tmax) {
  return [
    { x: Tmin, y: w },
    { x: Tmax, y: w },
  ];
}

export function calculateEnthalpyTrend(nextHoursData) {
  const enthalpies = {};

  const values = Object.values(nextHoursData ?? {});
  values.forEach((element, idx) => {
    enthalpies[idx] = calculateEnthalpy(element.temp, element.rh / 100);
  });
  const lastIdx = values.length - 1;

  return (enthalpies[lastIdx] - enthalpies[0]) / values.length;
}
