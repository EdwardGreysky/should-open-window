// ─── Geolocation + Open-Meteo ─────────────────────────────────────────────────
async function getPosition() {
  return new Promise(resolve => {
    const stored = localStorage.getItem('cachedGeolocation');
    if (stored) return resolve(JSON.parse(stored));
    if (!navigator.geolocation)
      return resolve({ latitude: 48.8, longitude: 2.33 });
    navigator.geolocation.getCurrentPosition(
      pos => {
        const coords = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        };
        localStorage.setItem('cachedGeolocation', JSON.stringify(coords));
        resolve(coords);
      },
      () => resolve({ latitude: 48.8, longitude: 2.33 })
    );
  });
}

export async function fetchWeatherData() {
  const { latitude, longitude } = await getPosition();
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}` +
    `&current=temperature_2m,relative_humidity_2m`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('Weather API error: ' + response.status);
  const data = await response.json();
  const tempOut = data.current?.temperature_2m;
  const humOut = data.current?.relative_humidity_2m;
  if (typeof tempOut !== 'number' || typeof humOut !== 'number') {
    throw new Error('Invalid weather data');
  }
  return { tempOut, humOut };
}

export async function getNextHoursForecast(nbOfHours) {
  const { latitude, longitude } = await getPosition();
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}` +
    `&hourly=temperature_2m,relative_humidity_2m&forecast_days=1`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('Weather API error: ' + response.status);
  const data = await response.json();
  let outData = {};
  for (let i = 0; i < nbOfHours; i++) {
    outData[i] = {
      temp: data.hourly?.temperature_2m[i],
      rh: data.hourly?.relative_humidity_2m[i],
    };
  }
  return outData;
}
