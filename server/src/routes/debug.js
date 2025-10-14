import { Router } from "express";
import { db } from "../utils/db.js";
import jwt from "jsonwebtoken";

const router = Router();

// Debug auth middleware - Only for development!
const debugToken = jwt.sign(
  { email: "debug@admin.com", role: "debug" },
  process.env.JWT_SECRET || "secret",
  { expiresIn: "7d" }
);

function debugAuth(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (token === debugToken) {
    next();
  } else {
    res.status(403).json({ message: "Debug authorization required" });
  }
}

// Get debug token
router.get("/token", (req, res) => {
  res.json({ token: debugToken });
});

// Get server status and info
router.get("/status", debugAuth, (req, res) => {
  const info = {
    status: "running",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    environment: process.env.NODE_ENV || "development",
  };
  res.json(info);
});

// Get all rides with complete debug information
router.get("/rides", debugAuth, (req, res) => {
  const rides = db.getRides();
  const now = new Date();
  
  // Detailed statistics
  const stats = {
    total: rides.length,
    activeRides: rides.filter(r => new Date(r.departureDate) >= now).length,
    pastRides: rides.filter(r => new Date(r.departureDate) < now).length,
    totalPassengers: rides.reduce((acc, r) => acc + (r.passengers?.length || 0), 0),
    totalPendingRequests: rides.reduce((acc, r) => acc + (r.pendingRequests?.length || 0), 0),
    totalSeatsAvailable: rides.reduce((acc, r) => acc + (r.seatsAvailable || 0), 0),
    totalSeatsUsed: rides.reduce((acc, r) => acc + (r.passengers?.length || 0), 0),
    averageSeatsPerRide: rides.length ? (rides.reduce((acc, r) => acc + (r.seatsAvailable || 0), 0) / rides.length).toFixed(2) : 0,
    bySchool: rides.reduce((acc, r) => {
      if (!acc[r.school]) {
        acc[r.school] = {
          total: 0,
          active: 0,
          passengers: 0,
          pendingRequests: 0,
          averageSeats: 0,
          totalSeats: 0
        };
      }
      acc[r.school].total++;
      if (new Date(r.departureDate) >= now) acc[r.school].active++;
      acc[r.school].passengers += r.passengers?.length || 0;
      acc[r.school].pendingRequests += r.pendingRequests?.length || 0;
      acc[r.school].totalSeats += r.seatsAvailable || 0;
      acc[r.school].averageSeats = (acc[r.school].totalSeats / acc[r.school].total).toFixed(2);
      return acc;
    }, {}),
    byMonth: rides.reduce((acc, r) => {
      const month = new Date(r.departureDate).toLocaleString('default', { month: 'long', year: 'numeric' });
      acc[month] = (acc[month] || 0) + 1;
      return acc;
    }, {}),
    requestStats: rides.reduce((acc, r) => {
      if (r.pendingRequests?.length > 0) {
        acc.ridesWithRequests++;
        acc.totalRequests += r.pendingRequests.length;
      }
      return acc;
    }, { ridesWithRequests: 0, totalRequests: 0 })
  };

  // Enhanced ride information
  const enhancedRides = rides.map(ride => {
    const departureDate = new Date(ride.departureDate);
    return {
      ...ride, // Include all original ride data
      debug: {
        isActive: departureDate >= now,
        timeUntilDeparture: departureDate >= now ? 
          Math.round((departureDate - now) / (1000 * 60 * 60 * 24)) : // days
          null,
        occupancyRate: ((ride.passengers?.length || 0) / ride.seatsAvailable * 100).toFixed(1) + '%',
        remainingSeats: ride.seatsAvailable - (ride.passengers?.length || 0),
        requestRate: ((ride.pendingRequests?.length || 0) / ride.seatsAvailable * 100).toFixed(1) + '%',
        status: departureDate < now ? 'completed' :
               ride.seatsAvailable <= (ride.passengers?.length || 0) ? 'full' :
               'active',
        passengerDetails: ride.passengers?.map(email => ({
          email,
          joinTime: ride.passengerJoinTimes?.[email] || 'unknown'
        })) || [],
        requestDetails: ride.pendingRequests?.map(email => ({
          email,
          requestTime: ride.requestTimes?.[email] || 'unknown'
        })) || []
      }
    };
  });

  res.json({ 
    stats, 
    rides: enhancedRides,
    timestamp: now.toISOString(),
    debugInfo: {
      totalRidesInMemory: rides.length,
      memoryUsage: process.memoryUsage(),
      nodeVersion: process.version,
      platform: process.platform
    }
  });
});

// Get user activity summary
router.get("/users", debugAuth, (req, res) => {
  const rides = db.getRides();
  const users = new Map();

  rides.forEach(ride => {
    // Track drivers
    if (!users.has(ride.driverEmail)) {
      users.set(ride.driverEmail, { 
        driving: [], 
        riding: [], 
        pending: [] 
      });
    }
    users.get(ride.driverEmail).driving.push(ride.id);

    // Track passengers
    ride.passengers?.forEach(email => {
      if (!users.has(email)) {
        users.set(email, { 
          driving: [], 
          riding: [], 
          pending: [] 
        });
      }
      users.get(email).riding.push(ride.id);
    });

    // Track pending requests
    ride.pendingRequests?.forEach(email => {
      if (!users.has(email)) {
        users.set(email, { 
          driving: [], 
          riding: [], 
          pending: [] 
        });
      }
      users.get(email).pending.push(ride.id);
    });
  });

  const userStats = Array.from(users.entries()).map(([email, data]) => ({
    email,
    ridesAsDriver: data.driving.length,
    ridesAsPassenger: data.riding.length,
    pendingRequests: data.pending.length,
    rideIds: data
  }));

  res.json({
    totalUsers: users.size,
    users: userStats
  });
});

// Get system events (rate limits, cooldowns, etc.)
router.get("/events", debugAuth, (req, res) => {
  // This would typically connect to your logging system
  // For now we'll return some sample data
  const events = {
    rateLimits: {
      searchLimiter: "60 requests per minute",
      rideLimiter: "20 requests per minute",
      locationsLimiter: "30 requests per minute"
    },
    cooldowns: {
      rideRequest: "10 minutes between requests",
      maxRequests: "3 requests per 10 minutes"
    }
  };
  res.json(events);
});

// Clear rate limiters (for testing)
router.post("/clear-limiters", debugAuth, (req, res) => {
  // This would reset your rate limiters
  res.json({ message: "Rate limiters cleared" });
});

export default router;