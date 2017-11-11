'use strict';

const WORKERS = process.env.WEB_CONCURRENCY || 1;
const PORT = process.env.PORT || 8080;
const HOST = process.env.HOST_NAME || '0.0.0.0';

const app = require('./app');
const schema = require('./schema');

function start() {
  app.listen(PORT, HOST);
  console.log(`Node server start @ ${HOST}:${PORT}`);
}

start();
