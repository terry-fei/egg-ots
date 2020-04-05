'use strict';

const ots = require('./lib/ots');

module.exports = app => {
  if (app.config.ots.app) ots(app);
};
