// Store cooldowns in memory
const rideCooldowns = new Map();
const userRequestCounts = new Map();

const COOLDOWN_MINUTES = 10;
const MAX_REQUESTS = 3;

export function checkRideCooldown(req, res, next) {
  const email = req.user?.email;
  const rideId = req.params.id;

  if (!email || !rideId) {
    return next();
  }

  const key = `${email}:${rideId}`;
  const lastCancel = rideCooldowns.get(key);

  if (lastCancel) {
    const timePassed = Date.now() - lastCancel;
    if (timePassed < COOLDOWN_MINUTES * 60 * 1000) {
      const minutesLeft = Math.ceil((COOLDOWN_MINUTES * 60 * 1000 - timePassed) / 60000);
      return res.status(429).json({
        error: `Please wait ${minutesLeft} minutes before requesting to join this ride again`
      });
    }
    // Cooldown expired, remove it
    rideCooldowns.delete(key);
  }

  next();
}

export function checkRequestLimit(req, res, next) {
  const email = req.user?.email;
  
  if (!email) {
    return next();
  }

  const now = Date.now();
  const userRequests = userRequestCounts.get(email) || [];
  
  // Filter to keep only requests from last 10 minutes
  const recentRequests = userRequests.filter(time => (now - time) < COOLDOWN_MINUTES * 60 * 1000);
  
  if (recentRequests.length >= MAX_REQUESTS) {
    return res.status(429).json({
      error: `You can only request to join up to ${MAX_REQUESTS} rides within ${COOLDOWN_MINUTES} minutes`
    });
  }

  // Add this request
  recentRequests.push(now);
  userRequestCounts.set(email, recentRequests);

  next();
}

export function setCooldown(email, rideId) {
  const key = `${email}:${rideId}`;
  rideCooldowns.set(key, Date.now());
}