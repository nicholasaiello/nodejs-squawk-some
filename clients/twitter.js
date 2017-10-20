const fetch = require('node-fetch');
const Twitter = require('twitter');

function generateBearerToken(key, secret) {
  const credentials = new Buffer(`${key}:${secret}`).toString('base64');

  fetch('https://api.twitter.com/oauth2/token', {
    method: 'POST',
    headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
    },
    body: 'grant_type=client_credentials'
  }).then((response) => response.json())
    .then((json) => {
      console.log(json)
    });
}

const client = new Twitter({
  consumer_key: process.env.TWITTER_CONSUMER_KEY,
  consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
  bearer_token: process.env.TWITTER_BEARER_TOKEN
});

module.exports = client;
