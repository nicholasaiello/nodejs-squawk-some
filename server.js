'use strict';

const express = require('express'),
  expressWs = require('express-ws'),
  path = require('path'),
  logger = require('morgan');

const PORT = process.env.PORT || 8080,
  HOST = process.env.HOST_NAME || '0.0.0.0';

const twitterClient = require('./clients/twitter'),
  redisClient = require('./clients/redis');

const app = express();
expressWs(app);

/*
 * MIDDLEWARE
 */

//
app.use(logger(process.env.NODE_ENV || 'dev'));

// cors BS
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Methods", "OPTIONS, GET");
  res.setHeader("Access-Control-Allow-Origin", process.env.CORS_ALLOW_ORIGIN || "*");
  res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.setHeader("Access-Control-Allow-Credentials", true);
  next();
});

// twitter client
app.use((req, res, next) => {
  req.twitterClient = twitterClient;
  next();
});

// redis client
app.use((req, res, next) => {
  req.redisClient = redisClient;
  next();
});

/*
 * Routes
 */

// http(s) & ws
app.get('/', (req, res) => (
  res.send("Hello World\n")
));

const streamRoutes = require('./routes/streams'),
  metaRoutes = require('./routes/meta');
  
app.use('/streams', streamRoutes);
app.use('/meta', metaRoutes);

// handle 404s
app.use((req, res, next) => {
  let err = new Error('Not Found');
  err.status = 404;
  next(err);
});


app.listen(PORT, HOST);
console.log(`Node server start @ ${HOST}:${PORT}`);
