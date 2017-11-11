const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');

const { apiTwitterSearch } = require('../helpers/streams');

const _parseError = (error) => {
  if (error && error.length) {
    return error[0].message || '';
  }

  return 'Error';
};

/**
 * Routes
 */

// CORS
router.options('/twitter/', (req, res) => {
  res.send(200);
});

router.get('/twitter/', (req, res) => {

  apiTwitterSearch(req)
    .then(results => {
      res.send({results: results});
    })
    .catch((error = []) => {
      const msg = _parseError(error);
      res.send({results: [], error: msg});
    });

});

router.ws('/twitter/', (ws, req) => {

  apiTwitterSearch(req)
    .then(results => {
      ws.send(JSON.stringify({results: results}));
    })
    .catch((error = []) => {
      const msg = _parseError(error);
      ws.send(JSON.stringify({results: [], error: msg}));
    });

});

module.exports = router
