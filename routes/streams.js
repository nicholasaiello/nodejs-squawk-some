const express = require('express');
const router = express.Router();

const fetch = require('node-fetch');

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

const _buildSearchParams = (req) => (
  {
    q: req.query.q || 'foo',
    result_type: 'recent',
    count: 20,
    since_id: req.query.since || 0
  }
);

const _getSearchTweets = (req, params) => {
  return req.twitterClient.get('search/tweets', params)
    .then(response => {
      return {
        meta: {
          count: response.search_metadata.count,
          since_id: response.search_metadata.since_id
        },
        statuses: _parseStatuses(response.statuses)
      }
    })
};


router.get('/', (req, res) => {

  _getSearchTweets(req, _buildSearchParams(req))
    .then(results => {
      res.send({results: results});
    })
    .catch(error => {
      const msg = _parseError(error);
      res.send({results: [], error: msg});
    });

});

router.ws('/', (ws, req) => {

  _getSearchTweets(req, _buildSearchParams(req))
    .then(results => {
      ws.send(JSON.stringify({results: results}));
    })
    .catch(error => {
      const msg = _parseError(error);
      ws.send(JSON.stringify({results: [], error: msg}));
    });

});

module.exports = router
