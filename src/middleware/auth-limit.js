const { rateLimit } = require('express-rate-limit');

const registerLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  message: { error: 'Too many requests, please try again later' },
});

const loginLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
  message: { error: 'Too many requests, please try again later' },
});

module.exports = {
  registerLimit,
  loginLimit,
};
