class TradingViewWidgetCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  setConfig(config) {
    this._config = config;
    const widgetType = config.widget_type || 'ticker-tape';
    const needsPairs = !['stock-heatmap', 'forex-cross-rates'].includes(widgetType);
    const needsDataSource = widgetType === 'stock-heatmap';
    const needsCurrencies = widgetType === 'forex-cross-rates';

    if (needsPairs && (!config.pairs || !Array.isArray(config.pairs) || config.pairs.length === 0)) {
      throw new Error(`The '${widgetType}' widget requires a "pairs" list with at least one item.`);
    }
    if (needsDataSource && !config.data_source) {
      throw new Error(`The 'stock-heatmap' widget requires a "data_source" option.`);
    }
    if (needsCurrencies && (!config.currencies || !Array.isArray(config.currencies) || config.currencies.length < 2)) {
      throw new Error(`The 'forex-cross-rates' widget requires a "currencies" list with at least two currency codes.`);
    }

    const WIDGET_CONFIGS = {
      'ticker-tape': { baseUrl: 'https://s.tradingview.com/embed-widget/ticker-tape/', defaultHeight: 46 },
      'tickers': { baseUrl: 'https://www.tradingview-widget.com/embed-widget/tickers/', defaultHeight: 75 },
      'single-quote': { baseUrl: 'https://www.tradingview-widget.com/embed-widget/single-quote/', defaultHeight: 100 },
      'stock-heatmap': { baseUrl: 'https://www.tradingview-widget.com/embed-widget/stock-heatmap/', defaultHeight: 500 },
      'forex-cross-rates': { baseUrl: 'https://www.tradingview-widget.com/embed-widget/forex-cross-rates/', defaultHeight: 400 }
    };

    const activeWidgetConfig = WIDGET_CONFIGS[widgetType];
    if (!activeWidgetConfig) {
      throw new Error(`Invalid widget_type: ${widgetType}.`);
    }

    const root = this.shadowRoot;
    while (root.lastChild) { root.removeChild(root.lastChild); }

    const baseOptions = {
      colorTheme: config.color_theme || "dark",
      isTransparent: config.is_transparent || false,
      locale: config.locale || "en",
    };

    let typeSpecificOptions = {};

    switch (widgetType) {
      case 'forex-cross-rates':
        typeSpecificOptions = {
          currencies: config.currencies,
          backgroundColor: config.background_color,
        };
        break;
      case 'stock-heatmap':
        typeSpecificOptions = {
          dataSource: config.data_source,
          blockSize: "market_cap_basic",
          blockColor: "change",
          grouping: config.grouping || "sector",
          isZoomEnabled: config.is_zoom_enabled !== false,
          hasSymbolTooltip: config.has_symbol_tooltip !== false,
        };
        break;
      case 'single-quote':
        typeSpecificOptions = {
          symbol: String(config.pairs[0])
        };
        break;
      case 'tickers':
      case 'ticker-tape':
      default:
        let symbols;
        if (widgetType === 'tickers') {
          symbols = config.pairs.map(p => (typeof p === 'object' && p.proName && p.title) ? { proName: p.proName, title: p.title } : { proName: String(p), title: String(p) });
        } else {
          symbols = config.pairs.map(p => ({ proName: String(p), description: "" }));
        }
        typeSpecificOptions = {
          symbols: symbols,
          showSymbolLogo: config.show_logo !== false,
          displayMode: (widgetType === 'ticker-tape') ? (config.display_mode || "regular") : undefined,
        };
        break;
    }

    const widgetOptions = { ...baseOptions, ...typeSpecificOptions };

    widgetOptions.width = config.width || "100%";
    widgetOptions.height = config.height || activeWidgetConfig.defaultHeight;
    
    Object.keys(widgetOptions).forEach(key => {
      if (widgetOptions[key] === undefined) {
        delete widgetOptions[key];
      }
    });

    const card = document.createElement('ha-card');
    const iframe = document.createElement('iframe');

    iframe.src = `${activeWidgetConfig.baseUrl}?locale=${widgetOptions.locale}#${encodeURIComponent(JSON.stringify(widgetOptions))}`;
    iframe.style.width = '100%';
    iframe.style.height = `${config.height || activeWidgetConfig.defaultHeight}px`;
    iframe.style.border = '0';
    iframe.setAttribute('scrolling', 'no');
    iframe.setAttribute('allowtransparency', 'true');
    iframe.setAttribute('frameborder', '0');

    if (config.title) { card.header = config.title; }
    card.appendChild(iframe);
    root.appendChild(card);
  }

  getCardSize() {
    if (this._config) {
      const widgetType = this._config.widget_type || 'ticker-tape';
      const defaultHeight = (WIDGET_CONFIGS[widgetType] || {}).defaultHeight || 50;
      const height = this._config.height || defaultHeight;
      return Math.ceil(height / 50);
    }
    return 1;
  }

  set hass(hass) {}
}

const WIDGET_CONFIGS = {
  'ticker-tape': { defaultHeight: 46 },
  'tickers': { defaultHeight: 75 },
  'single-quote': { defaultHeight: 100 },
  'stock-heatmap': { defaultHeight: 500 },
  'forex-cross-rates': { defaultHeight: 400 }
};

customElements.define('tradingview-widget-card', TradingViewWidgetCard);
