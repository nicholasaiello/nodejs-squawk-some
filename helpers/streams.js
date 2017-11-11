'use strict';

const fetch = require('node-fetch');

/**
 * Cache Utils
 */

const _buildCacheKey = (...params) => (
  params.join(':').toLowerCase().replace(/\s/, '-')
);

const _getCache = (redisClient, key) => (
  redisClient.getCache(key)
);

const _setCache = (redisClient, key, obj, ttl = 60) => (
  redisClient.setCache(key, obj, ttl)
);

/**
 * API Utils
 */

const _parseStatuses = (statuses) => (
  statuses.map(x => {
    const { id, text, created_at, user } = x;
    return {
      id,
      text,
      created_at,
      user_name: user.name,
      user_screen_name: user.screen_name,
      user_profile_img: user.profile_image_url_https
    };
  })
);

const _buildSearchParams = ({ q, limit, since }) => ({
  q,
  result_type: 'recent',
  count: limit || 50,
  lang: 'en',
  since_id: since || 0
});

const _queryIsValid = (q) => (
  !(
    !(/^[\w\$\@\#\+\s]{1,16}$/.test(q)) || q in ['0', 'null', 'undefined']
  )
);

const _twitterSearch = async ({query, twitterClient, redisClient}) => {
  const { q, since } = query;

  if (!_queryIsValid(q)) {
    return Promise.resolve({});
  }

  // check for cached result (must have since_id)
  if (since && since !== '0') {
    const result = await _getCache(redisClient, _buildCacheKey(q, since));
    if (result) {
      return Promise.resolve(result);
    }
  }

  // request data from twitter
  const params = _buildSearchParams(query);
  return twitterClient.get('search/tweets', params)
    .then(response => {
      const { count, since_id } = response.search_metadata;
      const results = {
        meta: {
          count,
          since_id
        },
        posts: _parseStatuses(response.statuses)
      };

      // cache result if valid
      if (since_id) {
        // decrease ttl for empty results
        const key = _buildCacheKey(q, since_id);
        const ttl = !results.statuses.length ? 30 : 60;
        _setCache(redisClient, key, results, ttl);
      }

      return results;
    });
};

const apiTwitterSearch = (req) => (
  _twitterSearch(req)
);

const graphqlTwitterSearch = (params, twitterClient, redisClient) => (
  _twitterSearch({query: params, twitterClient, redisClient})
);

module.exports = { apiTwitterSearch, graphqlTwitterSearch };
