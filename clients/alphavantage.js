const fetch = require('node-fetch');
const DatesHelper = require('../helpers/dates');

const AlphaVantage = (function(apiKey) {

  const AV_API_URL = "https://www.alphavantage.co/query";

  /**
   * Time Series Data Helpers
   */

  const _intraday = (s, interval = '1min', size = 'compact', type = 'json') => {
    const url = _buildApiUrl({
      s,
      size,
      func: 'TIME_SERIES_INTRADAY',
      extras: `&interval=${interval}`
    });

    return _makeRequest(url);
  };

  const _daily = (s, size = 'compact', type = 'json') => {
    const url = _buildApiUrl({
      s,
      size,
      func: 'TIME_SERIES_DAILY'
    });

    return _makeRequest(url);
  };

  /**
   * Util Methods
   */

  const _buildApiUrl = ({s, func, size, extras = ''}) => (
    `${AV_API_URL}?function=${func}&symbol=${s}&outputsize=${size}${extras}&apikey=${apiKey}`
  );

  const _parseResults = (results, func = 'TIME_SERIES_DAILY', interval = '1min') => {
    let meta = results['Meta Data'];
    let refreshed = meta['3. Last Refreshed'];

    let seriesKey, dateKey;
    if (func === 'TIME_SERIES_DAILY') {
      if (refreshed.length === 10) {
        // at time for market close (ET)
        refreshed = `${refreshed} 16:00:00`;
      }

      seriesKey = 'Time Series (Daily)';
      dateKey = refreshed.substr(0,10);
    } else if (func === 'TIME_SERIES_INTRADAY') {
      seriesKey = `Time Series (${interval})`;
      dateKey = refreshed;
    }

    const info = results[seriesKey][dateKey],
      updated = `${refreshed} E${DatesHelper.isDst() ? 'D' : 'S'}T`;

    return {
      symbol: meta['2. Symbol'].toUpperCase(),
      updated,
      tz: meta['6. Time Zone'],
      open: info['1. open'],
      high: info['2. high'],
      low: info['3. low'],
      close: info['4. close'],
      volume: info['5. volume']
    };
  };

  const _makeRequest = (url) => {
    return fetch(url, {
        method: 'GET'
      })
      .then(response => response.json())
      .then(results => _parseResults(results));
  }

  return {
    series: () => ({
      intraday: _intraday,
      daily: _daily
    })
  };

});

const client = AlphaVantage(process.env.ALPHA_VANTAGE_API_KEY);

module.exports = client;
