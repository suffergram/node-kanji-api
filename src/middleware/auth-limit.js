import { rateLimit } from 'express-rate-limit';

const baseOptions = {
  windowMs: 15 * 60 * 1000,
  message: { error: 'Too many attempts, please try again later' },
  // Vercel sends the client IP in both Forwarded and X-Forwarded-For;
  // req.ip already uses the latter via 'trust proxy'
  validate: { forwardedHeader: false },
};

export const registerLimit = rateLimit({
  ...baseOptions,
  limit: 5,
});

export const loginLimit = rateLimit({
  ...baseOptions,
  limit: 10,
  skipSuccessfulRequests: true,
});

export const sensitiveLimit = rateLimit({
  ...baseOptions,
  limit: 10,
  skipSuccessfulRequests: true,
});


