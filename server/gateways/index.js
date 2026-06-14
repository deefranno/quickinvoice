const stripe = require('./stripe');
const wipay = require('./wipay');
const ezee = require('./ezee');

const getGateway = (name) => {
  switch (name) {
    case 'stripe': return stripe;
    case 'wipay': return wipay;
    case 'ezee': return ezee;
    default: throw new Error(`Unknown gateway: ${name}`);
  }
};

module.exports = { getGateway };
