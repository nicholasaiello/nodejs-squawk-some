'use strict';

const express = require('express');
const expressWs = require('express-ws');
const logger = require('morgan');

const twitterClient = require('./clients/twitter');
const alphaClient = require('./clients/alphavantage');
const redisClient = require('./clients/redis');

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

// alphavantage client
app.use((req, res, next) => {
  req.alphaClient = alphaClient;
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

const streamRoutes = require('./routes/streams');
const metaRoutes = require('./routes/meta');

app.use('/streams', streamRoutes);
app.use('/meta', metaRoutes);

// handle 404s
app.use((req, res, next) => {
  let err = new Error('Not Found');
  err.status = 404;
  next(err);
});

module.exports = app;
