// server/src/middleware/rateLimiter.js
import rateLimit from "express-rate-limit";

/**
 * Rate limiter for sending verification emails.
 * Prevents brute-force and spam to the /verify-email route.
 */
export const verifyEmailLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 25, // limit each IP to 5 requests per window
  message: {
    message: "Too many verification requests. Please try again later.",
  },
  standardHeaders: true, // Include rate limit info in responses
  legacyHeaders: false,
});

/**
 * Rate limiter for code verification.
 * Allows a bit more attempts per IP, but still restricted.
 */
export const verifyCodeLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 25, // 25 attempts per IP in 5 minutes
  message: {
    message: "Too many verification attempts. Please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter for /api/nearby requests.
 * Allows modest frequency from one client IP.
 */
export const nearbyLimiter = rateLimit({
  windowMs: 60 * 1000, // 1-minute window
  max: 10, // up to 10 nearby lookups per minute per IP
  message: {
    message: "Too many nearby city requests. Please slow down your search.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter for ride searches
 */
export const searchLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { message: "Too many search requests. Please slow down." },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter for location requests
 */
export const locationsLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: { message: "Too many location requests. Please slow down." },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter for ride actions (join, leave, request, etc.)
 */
export const rideLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: { message: "Too many ride requests. Please slow down." },
  standardHeaders: true,
  legacyHeaders: false,
});