const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');

// TODO make a client
const AV_API_URL = "https://www.alphavantage.co/query",
  AV_API_KEY = process.env.ALPHA_VANTAGE_API_KEY;

// FIXME
const TIME_SERIES_MAP = {
  TIME_SERIES_INTRADAY: (interval) => (`Time Series (${interval})`),
  TIME_SERIES_DAILY: () => ('Time Series (Daily)')
};

/**
 * Util methods
 */

/**
 * Validate object and determine freshness
 */
const _isResultValid = (result) => {
  if (!result || !result.current) {
    return false;
  }

  // compare last and current date/prices
  // see if we're in weekend/off-hours (offset to Eastern Time)

  const now = new Date();
  if (now.getUTCDay() in [0,6]) {
    return true;
  }

  const { current, last } = result;

  // if prices are similar, and refreshed is close to NOW,
  // don't force a refresh

  return false;
};

const _buildApiUrl = ({s, func = 'TIME_SERIES_DAILY'}) => (
  `${AV_API_URL}?function=${func}&symbol=${s}&apikey=${AV_API_KEY}`
);

const _parseStockMeta = (results, func = 'TIME_SERIES_DAILY', interval = '1min') => {
  const meta = results['Meta Data'],
    refreshed = meta['3. Last Refreshed'];

  const seriesKey = TIME_SERIES_MAP[func](interval),
    dateKey = refreshed.substr(0,10);

  return {
    symbol: meta['2. Symbol'].toUpperCase(),
    refreshed,
    tz: meta['6. Time Zone'],
    price: results[seriesKey][dateKey]['4. close'],
    open: results[seriesKey][dateKey]['1. open'],
    volume: results[seriesKey][dateKey]['5. volume']
  };
};

const _fetchStockQuote = async (req) => {
  const s = req.query.s.toLowerCase(),
    result = await req.redisClient.getCache(s);

  if (_isResultValid(result)) {
    return Promise.resolve(_parseStockMeta(result.current));
  }

  return fetch(_buildApiUrl(req.query), {
    method: 'GET'
  })
  .then(response => response.json())
  .then(json => {
    // cache current, and last result for evaluation
    const obj = {
      current: json,
      last: result || null
    };

    req.redisClient.setCache(s, obj, 60 * 5);
    return obj.current;
  })
  .then(obj => _parseStockMeta(obj))
  .catch(err => console.log('error:', err));
};

/**
 * Routes
 */

// CORS
router.options('/stocks/', (req, res) => {
  res.send(200);
});

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
