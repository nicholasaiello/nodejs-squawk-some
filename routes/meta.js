const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');

const AV_API_URL = "https://www.alphavantage.co/query",
  AV_API_KEY = process.env.ALPHA_VANTAGE_API_KEY;

/**
 * Util methods
 */

// FIXME
const TIME_SERIES_MAP = {
  TIME_SERIES_INTRADAY: (interval) => (`Time Series (${interval})`),
  TIME_SERIES_DAILY: 'Time Series (Daily)'
};

/**
 * Validate object and determine freshness
 */
const _isResultValid = (result) => {
  if (!result) {
    return false;
  }

  return false;
};

const _buildApiUrl = ({s, func = 'TIME_SERIES_DAILY'}) => (
  `${AV_API_URL}?function=${func}&symbol=${s}&apikey=${AV_API_KEY}`
);

const _parseStockMeta = (data, func) => {
  const meta = data['Meta Data'],
    refreshed = meta['3. Last Refreshed'];

  const seriesKey = TIME_SERIES_MAP[func];

  return {
    symbol: meta['2. Symbol'],
    refreshed,
    tz: meta['6. Time Zone'],
    price: data[seriesKey][refreshed]['4. close'],
    volume: data[seriesKey][refreshed]['5. volume']
  };
};

const _fetchStockQuote = async (req) => {
  const {
    s,
    func = 'TIME_SERIES_INTRADAY',
    interval = '1min'
  } = req.query;

  const result = await req.redisClient.getCache(s);
  if (_isResultValid(result)) {
    console.log(result)
    return Promise.resolve(_parseStockMeta(result, func));
  }

  return fetch(_buildApiUrl(req.query), {
    method: 'GET'
  })
  .then((response) => response.json())
  .then(json => {
    req.redisClient.setCache(s, json);
    return _parseStockMeta(json, func);
  })
  .catch(err => console.log('error:', err));
};

/**
 * Routes
 */

router.get('/stocks/', (req, res) => {
  _fetchStockQuote(req)
    .then((json) => {
      res.send(json);
    });
});

router.ws('/stocks/', (ws, req) => {
  _fetchStockQuote(req)
    .then((json) => {
      ws.send(JSON.stringify(json));
    });
});

module.exports = router;
