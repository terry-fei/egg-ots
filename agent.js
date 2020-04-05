'use strict';

const ots = require('./lib/ots');

module.exports = agent => {
  if (agent.config.ots.agent) ots(agent);
};
