import { fetchWeatherData, getNextHoursForecast } from './meteoData.js';
import { decideShouldOpen } from './logic.js';
import {
  humidityRatio,
  calculateEnthalpy,
  saturationCurve,
  enthalpyLine,
  humidityRatioLine,
  calculateEnthalpyTrend,
} from './physics.js';

// ─── Load Chart.js once ───────────────────────────────────────────────────────
function ensureChartJs() {
  return new Promise(resolve => {
    if (window.Chart) return resolve();
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
    script.onload = resolve;
    document.head.appendChild(script);
  });
}

export class OpenWindowBase extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._tOut = null;
    this._humOut = null;
    this._trendWeight = 0;
    this._chartInstance = null;
    this._config = {};
  }
  _render() {
    const tag = this._wrapperTag();
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          font-family: sans-serif;
        }
        .card-content {
          padding: 16px;
        }
        .outdoor-badge {
          display: flex;
          gap: 12px;
          margin-bottom: 16px;
          font-size: 0.85em;
          color: var(--secondary-text-color, #888);
        }
        .outdoor-badge span {
          background: var(--secondary-background-color, #f0f0f0);
          padding: 4px 10px;
          border-radius: 12px;
        }
        .mode-row {
          display: flex;
          gap: 16px;
          margin-bottom: 14px;
        }
        .mode-row label {
          display: flex;
          align-items: center;
          gap: 6px;
          cursor: pointer;
          font-size: 0.9em;
        }
        .inputs {
          display: flex;
          gap: 8px;
          margin-bottom: 12px;
        }
        .inputs input {
          flex: 1;
          padding: 8px;
          border-radius: 6px;
          border: 1px solid var(--divider-color, #ccc);
          background: var(--card-background-color, #fff);
          color: var(--primary-text-color, #000);
          font-size: 1em;
          width: 50%;
        }
        .inputs input:focus {
          outline: 2px solid var(--primary-color, #03a9f4);
          border-color: transparent;
        }
        button {
          width: 100%;
          padding: 11px;
          border: none;
          border-radius: 6px;
          background: var(--primary-color, #03a9f4);
          color: var(--text-primary-color, #fff);
          font-size: 1em;
          cursor: pointer;
          transition: opacity 0.15s;
        }
        button:hover { opacity: 0.88; }
        .result {
          margin-top: 14px;
          font-size: 1.1em;
          font-weight: 600;
          min-height: 1.5em;
          text-align: center;
          color: var(--primary-text-color, #000);
        }
        .error {
          color: var(--error-color, #c00);
          font-size: 0.85em;
          margin-top: 6px;
          min-height: 1.2em;
        }
        canvas {
          margin-top: 16px;
          width: 100% !important;
        }
      </style>

      <${tag} ${this._wrapperAttrs()}>
        <div class="card-content">

          <div class="outdoor-badge">
            <span>🌡 <span id="outTemp">…</span> °C</span>
            <span>💧 <span id="outHum">…</span> %</span>
          </div>

          <div class="mode-row">
            <label>
              <input type="radio" name="mode" value="CoolDown" checked />
              Cool down
            </label>
            <label>
              <input type="radio" name="mode" value="Dehumidify" />
              Dehumidify
            </label>
          </div>

          <div class="inputs">
            <input id="tempInput" type="number" placeholder="Indoor temp (°C)" />
            <input id="humInput"  type="number" placeholder="Indoor humidity (%)" />
          </div>

          <button id="btn">Check</button>
          <div class="error"  id="error"></div>
          <div class="result" id="result"></div>
          <div class="result" id="adjustedResult"></div>
          <canvas id="chart"></canvas>

        </div>
      </ha-card>
    `;

    this.shadowRoot
      .getElementById('btn')
      .addEventListener('click', () => this._handleClick());
  }

  async _loadWeather() {
    try {
      const data = await fetchWeatherData();
      this._tOut = data.tempOut;
      this._humOut = data.humOut;
      this.shadowRoot.getElementById('outTemp').textContent =
        data.tempOut.toFixed(1);
      this.shadowRoot.getElementById('outHum').textContent =
        data.humOut.toFixed(0);
      this._tOut = data.tempOut;

      if (this._trendWeight == 0) {
        const nextHoursData = await getNextHoursForecast(3);

        this._trendWeight = calculateEnthalpyTrend(nextHoursData);
      }
    } catch (e) {
      this._setError('Could not load outdoor weather data.');
    }
  }

  _handleClick() {
    this._setError('');
    this._setResult('');
    this._setAdjustedResult('');

    const t = Number(this.shadowRoot.getElementById('tempInput').value);
    let rh = Number(this.shadowRoot.getElementById('humInput').value);
    const mode = this.shadowRoot.querySelector(
      'input[name="mode"]:checked'
    ).value;

    if (isNaN(t) || isNaN(rh) || (t === 0 && rh === 0)) {
      this._setError('Enter valid indoor temperature and humidity values.');
      return;
    }
    if (this._tOut === null || this._humOut === null) {
      this._setError('Outdoor data not loaded yet. Please wait.');
      return;
    }

    if (!rh || rh == 0) {
      rh = this._humOut;
    }

    const trendWeight = this._trendWeight || 0;

    const [shouldOpen, adjustedShouldOpen] = decideShouldOpen(
      mode,
      t,
      rh,
      this._tOut,
      this._humOut,
      trendWeight
    );

    if (shouldOpen === null)
      this._setResult('🔄 No significant difference — keep as is');
    else if (shouldOpen) this._setResult('✅ Open the window');
    else this._setResult('🪟 Keep the window closed');
    this._updateChart(t, rh / 100, mode);

    if (adjustedShouldOpen !== undefined) {
      this._setAdjustedResult(
        `${adjustedShouldOpen ? '✅ Open' : '🪟 Closed'} ` +
          `(trend: ${trendWeight > 0 ? '↗ rising' : trendWeight < 0 ? '↘ falling' : '→ stable'})`
      );
    }
  }

  async _updateChart(tIn, rhIn, mode) {
    await ensureChartJs();

    const canvas = this.shadowRoot.getElementById('chart');
    if (this._chartInstance) {
      this._chartInstance.destroy();
      this._chartInstance = null;
    }

    const wIn = humidityRatio(tIn, rhIn);
    const wOut = humidityRatio(this._tOut, this._humOut / 100);
    const hIn = calculateEnthalpy(tIn, rhIn);

    const datasets = [
      {
        label: '100% RH (Saturation)',
        data: saturationCurve(-5, 40),
        type: 'line',
        borderColor: 'rgba(100,100,200,0.8)',
        borderWidth: 2,
        pointRadius: 0,
        fill: false,
      },
      ...(mode === 'CoolDown'
        ? [
            {
              label: 'Enthalpy Line',
              data: enthalpyLine(hIn, -5, 40),
              type: 'line',
              borderColor: 'rgba(0,150,136,0.8)',
              borderWidth: 2,
              pointRadius: 0,
              fill: true,
              backgroundColor: 'rgba(0,150,136,0.1)',
            },
          ]
        : []),
      ...(mode === 'Dehumidify'
        ? [
            {
              label: 'Humidity Ratio Line',
              data: humidityRatioLine(wIn, -5, 40),
              type: 'line',
              borderColor: 'rgba(0,150,136,0.8)',
              borderWidth: 2,
              pointRadius: 0,
              fill: true,
              backgroundColor: 'rgba(0,150,136,0.1)',
            },
          ]
        : []),
      {
        label: 'Inside',
        data: [{ x: tIn, y: wIn }],
        backgroundColor: 'rgba(3,169,244,1)',
        pointRadius: 6,
      },
      {
        label: 'Outside',
        data: [{ x: this._tOut, y: wOut }],
        backgroundColor: 'rgba(244,67,54,1)',
        pointRadius: 6,
      },
    ];

    this._chartInstance = new window.Chart(canvas, {
      type: 'scatter',
      data: { datasets },
      options: {
        responsive: true,
        scales: {
          x: {
            title: { display: true, text: 'Temperature (°C)' },
            min: -5,
            max: 40,
          },
          y: {
            title: { display: true, text: 'Humidity ratio (kg/kg)' },
          },
        },
        plugins: {
          legend: { position: 'bottom' },
        },
      },
    });
  }

  _setResult(text) {
    const el = this.shadowRoot.getElementById('result');
    if (el) el.textContent = text;
  }

  _setAdjustedResult(text) {
    const el = this.shadowRoot.getElementById('adjustedResult');
    if (el) el.textContent = text;
  }

  _setError(text) {
    const el = this.shadowRoot.getElementById('error');
    if (el) el.textContent = text;
  }
}
