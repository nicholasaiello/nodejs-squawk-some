const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');

/**
 * TODO break this up
 */

/**
 * Cache Utils
 */

const _buildCacheKey = (...params) => (
  params.join(':').toLowerCase().replace(/\s/, '-')
);

const _getCache = (req, key) => (
  req.redisClient.getCache(key)
);

const _setCache = (req, key, obj, ttl = 60) => (
  req.redisClient.setCache(key, obj, ttl)
);

/**
 * API Utils
 */

const _parseStatuses = (statuses) => (
  statuses.map(x => {
    return {
      id: x.id,
      text: x.text,
      user_name: x.user.name,
      user_screen_name: x.user.screen_name,
      user_profile_img: x.user.profile_image_url_https,
      created_at: x.created_at
    };
  })
);

const _parseError = (error) => (
  error[0].message || ''
);

const _buildSearchParams = ({ q, limit, since }) => ({
  q: q,
  result_type: 'recent',
  count: limit || 50,
  lang: 'en',
  since_id: since || 0
});

const _getSearchTweets = async (req) => {
  const { q, since } = req.query;
  // TODO better validation
  // validate query
  if (!(/^[\w\$\@\#\+\s]{1,16}$/.test(q)) || q in ['0', 'null', 'undefined']) {
    return Promise.resolve([]);
  }

  // check for cached result (must have since_id)
  if (since && since !== '0') {
    const result = await _getCache(req, _buildCacheKey(q, since));
    if (result) {
      return Promise.resolve(result);
    }
  }

  // request data from twitter
  const params = _buildSearchParams(req.query);
  return req.twitterClient.get('search/tweets', params)
    .then(response => {
      const { count, since_id } = response.search_metadata;
      const results = {
        meta: {
          count: count,
          since_id: since_id
        },
        statuses: _parseStatuses(response.statuses)
      };

      // cache result if valid
      if (since_id) {
        // decrease ttl for empty results
        const ttl = !results.statuses.length ? 30 : 60,
          key = _buildCacheKey(q, since_id);
        _setCache(req, key, results, ttl);
      }

      return results;
    });
};

/**
 * Routes
 */

// CORS
router.options('/twitter/', (req, res) => {
  res.send(200);
});

router.get('/twitter/', (req, res) => {

  _getSearchTweets(req)
    .then(results => {
      res.send({results: results});
    })
    .catch(error => {
      const msg = _parseError(error);
      res.send({results: [], error: msg});
    });

});

router.ws('/twitter/', (ws, req) => {

  _getSearchTweets(req)
    .then(results => {
      ws.send(JSON.stringify({results: results}));
    })
    .catch(error => {
      const msg = _parseError(error);
      ws.send(JSON.stringify({results: [], error: msg}));
    });

});

module.exports = router
