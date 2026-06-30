import { OpenWindowBase } from '../core/base-card.js';

// ─── Custom Card ──────────────────────────────────────────────────────────────
class OpenWindowCard extends OpenWindowBase {
  constructor() {
    super();
    this._hass = null;
  }

  setConfig(config) {
    this._config = config;
    this._render();
    if (!config.outdoor_temp_entity) {
      this._loadWeather();
    }
  }

  _wrapperTag() {
    return 'ha-card';
  }
  _wrapperAttrs() {
    return `header="${this._config.title || 'Open Window?'}"`;
  }

  // Called by HA on every state update
  set hass(hass) {
    this._hass = hass;

    if (this._config.outdoor_temp_entity && this._config.outdoor_hum_entity) {
      this._tOut = Number(hass.states[this._config.outdoor_temp_entity]?.state);
      this._humOut = Number(
        hass.states[this._config.outdoor_hum_entity]?.state
      );
      this._trendWeight = Number(
        hass.states['input_number.outdoor_enthalpy_trend']?.state
      );
      const outTempEl = this.shadowRoot.getElementById('outTemp');
      const outHumEl = this.shadowRoot.getElementById('outHum');
      if (outTempEl) outTempEl.textContent = this._tOut.toFixed(1);
      if (outHumEl) outHumEl.textContent = this._humOut.toFixed(0);
    }

    // Sensor hookup: populate inputs when entities are configured
    const tempEntity = this._config.indoor_temp_entity;
    const humEntity = this._config.indoor_hum_entity;

    if (tempEntity) {
      const val = hass.states[tempEntity]?.state;
      const el = this.shadowRoot?.getElementById('tempInput');
      if (val && el && el !== document.activeElement) {
        el.value = val;
        el.disabled = true;
      }
    }

    if (humEntity) {
      const val = hass.states[humEntity]?.state;
      const el = this.shadowRoot?.getElementById('humInput');
      if (val && el && el !== document.activeElement) {
        el.value = val;
        el.disabled = true;
      }
    }
  }

  getCardSize() {
    return 5;
  }
}

customElements.define('openwindow-card', OpenWindowCard);
