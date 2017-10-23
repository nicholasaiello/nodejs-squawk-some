/**
 * KISS Redis Client for Node.js
 * Get/Set/SetEx with Promises
 */
redis = require('redis');

const init = (redisUrl) => {

  const _r = redis.createClient(redisUrl);

  const getCache = (key) => {
    return new Promise((resolve) => {
      _r.get(key, (err, result) => {
        resolve(err ? null : JSON.parse(result));
      });
    });
  };

  const setCache = (key, value, ttl = 0) => {
    return new Promise((resolve) => {
      if (ttl) {
        _r.setex(key, ttl, JSON.stringify(value));
      } else {
        _r.set(key, JSON.stringify(value));
      }

      resolve(true);
    });
  };

  // TODO add more methods?
  return {
    getCache,
    setCache
  };

};

const client = init(
  process.env.REDIS_URL || 'redis://127.0.0.1:6379');

module.exports = client;
