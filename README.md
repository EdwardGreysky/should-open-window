# OpenWindow

**Should you open the window?** OpenWindow uses indoor/outdoor temperature and relative humidity to give you a physics-based recommendation during hot weather.

[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](LICENSE)

---

## Why?

One of the most efficient ways to keep your house cool during a heat wave is to close the windows during the day and open them during the night.

This feels intuitive but if the air outside is warm _and_ humid, you may actually be making things worse. OpenWindow removes the guesswork by computing the real heat content ([enthalpy](https://en.wikipedia.org/wiki/Enthalpy)) or moisture content (humidity ratio) of both air masses, then telling you whether exchanging the air will actually help.

## Features

- **CoolDown mode** — opens the window only when outdoor air contains less heat than indoor air (enthalpy comparison)
- **Dehumidify mode** — opens the window only when outdoor air is drier than indoor air (humidity ratio comparison)
- **Trend-aware** — fetches a 3-hour forecast to warn you if conditions are about to flip
- **Auto weather** — uses your location via the [Open-Meteo](https://open-meteo.com/) free API; no API key required
- **Psychrometric chart** — interactive Chart.js visualization of humidity ratio vs. temperature
- **Three deployment targets** — standalone web app, Home Assistant Lovelace card, embeddable web widget
- **No build step** — vanilla JS, HTML, CSS; just serve the files

## Demo

> https://edwardgreysky.github.io/should-open-window/

---

## Usage

### Standalone Web App

No installation needed — open `index.html` in a browser (served over HTTP/HTTPS).

> The Geolocation API requires HTTPS in most browsers. You can use any local server, e.g.:
>
> ```bash
> python -m http.server 8080
> # then visit http://localhost:8080
> ```

1. Allow location access (or enter coordinates manually)
2. Enter your indoor temperature and relative humidity
3. Choose a mode: **CoolDown** or **Dehumidify**
4. Hit **Check**

### Home Assistant Card

Copy the required files into your Home Assistant `www` directory:

```
www/
└── custom_cards/
    └── openwindow/
        ├── core/
        │   ├── base-card.js
        │   ├── physics.js
        │   ├── meteoData.js
        │   └── logic.js
        └── home-assistant/
            └── app.js
```

Add the resource to your Lovelace configuration:

```yaml
resources:
  - url: /local/custom_cards/openwindow/home-assistant/app.js
    type: module
```

Then add the card to a dashboard:

```yaml
type: custom:openwindow-card
title: Salle à manger
```

You can also define the following entities:

| Entity              | Description                                            |
| ------------------- | ------------------------------------------------------ |
| outdoor_temp_entity | An entity providing your outside temperature           |
| outdoor_hum_entity  | An entity providing your outside relative humidity     |
| indoor_temp_entity  | An entity providing your inside temperature            |
| indoor_hum_entity   | An entity providing your inside relative humidity      |
| trend_entity        | An entity providing the current outside enthalpy trend |

If those are provided, the card reads live values from Home Assistant.
If not, the outdoor data is still fetched automatically from Open-Meteo based on your Home Assistant location.

### Web Widget

Embed OpenWindow in any webpage:

```html
<script type="module" src="web/app.js"></script>
<openwindow-widget></openwindow-widget>
```

---

## How It Works

OpenWindow uses standard psychrometric formulas ([Wikipedia: Psychrometrics](https://en.wikipedia.org/wiki/Psychrometrics)):

**Saturation vapour pressure** ([Tetens equation](https://en.wikipedia.org/wiki/Tetens_equation)):
`Psat = 610.78 · exp(17.27·T / (T + 237.3))`

**Humidity ratio** ([Psychrometric calculations § Humidity Ratio](https://ingener.by/hvac-fundamentals/psychrometrics/psychrometric-calculations)):
`W = 0.622 · Pv / (P − Pv)`

The factor 0.622 is the ratio of molar masses of water vapour to dry air (18.015 / 28.964).

**Specific enthalpy** ([Psychrometric calculations § Specific Enthalpy](https://ingener.by/hvac-fundamentals/psychrometrics/psychrometric-calculations)):
`h = 1.006·T + W·(2501 + 1.86·T)`
With:

- 1.006 kJ/kgₐ·K - specific heat of dry air
- 1.86 kJ/kgᵥ·K - specific heat of water vapor
- 2501 kJ/kgₐ - latent heat at 0°C

**CoolDown**: compares the specific enthalpy of indoor vs. outdoor air. If indoor enthalpy exceeds outdoor by more than the specified threshold (3 kJ/kg), opening the window will reduce heat.

**Dehumidify**: compares the humidity ratio of indoor vs. outdoor air. If indoor W exceeds outdoor by more than the specified threshold (1 g/kg), opening the window will reduce moisture.

A 3-hour forecast is fetched in parallel to compute the enthalpy trend; the recommendation includes both the current state and where things are heading.

---

## Project Structure

```
.
├── core/               # Framework-agnostic business logic
│   ├── physics.js      # Enthalpy & humidity ratio calculations
│   ├── meteoData.js    # Open-Meteo API client
│   ├── logic.js        # Decision thresholds
│   └── base-card.js    # Shared Web Component base class
├── home-assistant/
│   └── app.js          # Home Assistant Lovelace card
├── web/
│   └── app.js          # Standalone web widget
├── docs/               # GitHub Pages entry point
├── index.html          # Standalone app HTML
└── style.css           # Material Design color tokens
```

---

## Dependencies

All loaded via CDN — no `npm install` required.

| Library                                                                                    | Purpose                   |
| ------------------------------------------------------------------------------------------ | ------------------------- |
| [Chart.js](https://www.chartjs.org/)                                                       | Psychrometric chart       |
| [BeerCSS](https://www.beercss.com/)                                                        | Material Design UI        |
| [Material Dynamic Colors](https://github.com/material-foundation/material-color-utilities) | Dynamic theming           |
| [Open-Meteo](https://open-meteo.com/)                                                      | Free weather API (no key) |

---

## Data Privacy

OpenWindow does not collect, store, or transmit any personal data.

- **Location**: Your coordinates are obtained via the browser Geolocation API and sent directly to [Open-Meteo](https://open-meteo.com/) to fetch weather data. They are never stored or logged by this app.
- **Indoor sensor data**: Temperature and humidity values you enter (or that come from Home Assistant entities) are processed entirely in your browser/local environment. They never leave your device.
- **No analytics, no tracking, no cookies.**

Open-Meteo's own privacy policy applies to weather requests made to their API.

## Contributing

Contributions are welcome — bug reports, feature ideas, and pull requests alike.

1. Fork the repo
2. Create a branch: `git checkout -b my-feature`
3. Make your changes
4. Open a pull request

There is currently no test suite. If you add new physics logic, please include a brief note explaining the formula source or reference.

---

## License

[GNU General Public License v3.0](LICENSE) — free to use, modify, and distribute under the same terms.
