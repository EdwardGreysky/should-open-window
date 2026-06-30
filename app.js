import { OpenWindowBase } from './core/base-card.js';

// ─── Custom Card ──────────────────────────────────────────────────────────────
class OpenWindowWidget extends OpenWindowBase {
  connectedCallback() {
    this._render();
    this._loadWeather();
  }

  setConfig(config) {
    this._config = config;
    this._render();
    if (!config.outdoor_temp_entity) {
      this._loadWeather();
    }
  }

  _wrapperTag() {
    return 'div';
  }
  _wrapperAttrs() {
    return ``;
  }
}

customElements.define('openwindow-widget', OpenWindowWidget);
