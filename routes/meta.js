const express = require('express');
const router = express.Router();

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

  return true;
};

const _fetchStockQuote = async (req) => {
  const s = req.query.s.toLowerCase(),
    cached = await req.redisClient.getCache(s);

  if (_isResultValid(cached)) {
    return Promise.resolve((cached.current));
  }

  return req.alphaClient.series().daily(s)
    .then(result => {
      // cache current, and last result for evaluation
      const obj = {
        current: result,
        last: cached || null
      };

      req.redisClient.setCache(s, obj, 60 * 5);
      return obj;
    })
    .then(obj => obj.current)
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
