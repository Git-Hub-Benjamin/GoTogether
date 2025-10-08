import { Router } from "express";
import { authenticateToken } from "../utils/authMiddleware.js";
import {
  findNearbyCitiesDynamic,
  getDistanceInMiles,
} from "../utils/findNearbyCities.js";
import { db } from "../utils/db.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import rateLimit from "express-rate-limit";
import { logDebug } from "../utils/logger.js"; // 👈 import debug logger
import { log } from "console";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UNIVERSITIES_PATH = path.join(__dirname, "../data/us_universities.json");
const CITIES_PATH = path.join(__dirname, "../data/us_cities.json");

const universities = JSON.parse(fs.readFileSync(UNIVERSITIES_PATH, "utf-8"));
const cities = JSON.parse(fs.readFileSync(CITIES_PATH, "utf-8"));

const router = Router();

// Rate limiters
const searchLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { message: "Too many search requests. Please slow down." },
});

const locationsLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: { message: "Too many location requests. Please slow down." },
});

const rideLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: { message: "Too many ride requests. Please slow down." },
});

// Get nearby locations with optional search query
router.get("/locations", authenticateToken, locationsLimiter, (req, res) => {
  try {
    const { school, miles, query } = req.query;
    const distance = Number(miles) || 100;

    logDebug("GET /locations", { school, miles, query, distance });

    if (!school) {
      return res.status(400).json({ message: "School parameter required" });
    }

    const university = universities.find(
      (u) => u.name.toLowerCase() === school.toLowerCase()
    );

    if (!university) {
      return res.status(404).json({ message: "University not found" });
    }

    const nearbyCities = findNearbyCitiesDynamic(
      university.lat,
      university.lng,
      distance
    );

    let cityNames = nearbyCities.map((c) => `${c.city}, ${c.state}`);
    if (query && query.trim() !== "") {
      const lowerQuery = query.toLowerCase();
      cityNames = cityNames.filter((name) =>
        name.toLowerCase().includes(lowerQuery)
      );
    }

    const campusOption = school;
    const allLocations = [campusOption, ...cityNames];

    logDebug("Nearby locations result count:", allLocations.length);

    res.json({
      from: allLocations,
      to: allLocations,
    });
  } catch (err) {
    console.error("Error fetching locations:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Search rides, if From and To provided then radius is ignored
router.post("/search", authenticateToken, searchLimiter, async (req, res) => {
  try {
    logDebug("Received /search request with body:", req.body);
    const { radius, school, date } = req.body;
    let from = req.body.from || null;
    let to = req.body.to || null;

    // Default radius to 100 miles if not provided or invalid
    const searchRadius = radius ? Number(radius) : 100;

    // If radius is not 100 miles, dont use from/to filters
    if (searchRadius !== 100) {
      from = null;
      to = null;
    }

    logDebug("POST /search body:", { from, to, radius, school, date });

    if (!school) {
      return res.status(400).json({ message: "School parameter required" });
    }

    let rides = await db.findRides({ school });
    logDebug(`Found ${rides.length} rides for ${school}`);

    rides = rides.filter((ride) => {
      if (from && from !== ride.from) return false;
      if (to && to !== ride.destination) return false;
      if (date && date !== ride.departureDate) return false;
      if (from && to) return true;
      return searchRadius >= ride.distance;
    });

    logDebug(`Filtered rides count: ${rides.length}`);

    rides.sort((a, b) => new Date(a.departureDate) - new Date(b.departureDate));

    res.json(rides);
  } catch (err) {
    console.error("Error searching rides:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get user's created rides
router.get("/mine/created", authenticateToken, rideLimiter, (req, res) => {
  try {
    const email = req.user?.email;
    const rides = db
      .findRides({ driverEmail: email })
      .sort((a, b) => new Date(a.departureDate) - new Date(b.departureDate));

    logDebug(`GET /mine/created for ${email}:`, rides.length);
    res.json(rides);
  } catch (err) {
    console.error("Error fetching created rides:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get user's joined rides
router.get("/mine/joined", authenticateToken, rideLimiter, (req, res) => {
  try {
    const email = req.user?.email;
    const rides = db
      .getRides()
      .filter((ride) => ride.passengers?.includes(email))
      .sort((a, b) => new Date(a.departureDate) - new Date(b.departureDate));

    logDebug(`GET /mine/joined for ${email}:`, rides.length);
    res.json(rides);
  } catch (err) {
    console.error("Error fetching joined rides:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Create ride
router.post("/", authenticateToken, rideLimiter, (req, res) => {
  try {
    const {
      from,
      destination,
      departureDate,
      departureTime,
      seatsAvailable,
      notes,
    } = req.body;

    logDebug("POST / (create ride) body:", {
      from,
      destination,
      departureDate,
      departureTime,
      seatsAvailable,
      notes,
    });

    let fromLat, fromLng, toLat, toLng;

    if (universities.find((u) => u.name.toLowerCase() === from.toLowerCase())) {
      const university = universities.find(
        (u) => u.name.toLowerCase() === from.toLowerCase()
      );
      fromLat = university.lat;
      fromLng = university.lng;
      const city = cities.find(
        (c) =>
          c.city.toLowerCase() === destination.split(",")[0].trim().toLowerCase()
      );
      toLat = city?.lat;
      toLng = city?.lng;
    } else if (
      universities.find(
        (u) => u.name.toLowerCase() === destination.toLowerCase()
      )
    ) {
      const university = universities.find(
        (u) => u.name.toLowerCase() === destination.toLowerCase()
      );
      toLat = university.lat;
      toLng = university.lng;
      const city = cities.find(
        (c) =>
          c.city.toLowerCase() === from.split(",")[0].trim().toLowerCase()
      );
      fromLat = city?.lat;
      fromLng = city?.lng;
    } else {
      logDebug("Create ride validation failed: no university found.");
      return res.status(400).json({ message: "One location must be a campus" });
    }

    if (!fromLat || !fromLng || !toLat || !toLng) {
      logDebug("Invalid coordinates for new ride.");
      return res.status(400).json({ message: "Invalid from or destination" });
    }

    if (!from || !destination || !departureDate || !departureTime || !seatsAvailable)
      return res.status(400).json({ message: "Missing required fields" });

    const distance = getDistanceInMiles(fromLat, fromLng, toLat, toLng).toFixed(2);
    const newRide = db.createRide({
      driverEmail: req.user?.email,
      school: req.user?.school,
      from,
      destination,
      departureDate,
      departureTime,
      seatsAvailable,
      notes: notes || "",
      distance,
    });

    logDebug("Ride created:", newRide);

    res.status(201).json(newRide);
  } catch (err) {
    console.error("Error creating ride:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Join ride
router.post("/:id/join", authenticateToken, rideLimiter, (req, res) => {
  try {
    const { id } = req.params;
    const email = req.user?.email;

    logDebug(`POST /${id}/join by ${email}`);

    const result = db.joinRide(id, email);

    if (result.error) {
      return res.status(400).json({ message: result.error });
    }

    res.json(result);
  } catch (err) {
    console.error("Error joining ride:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Leave ride
router.post("/:id/leave", authenticateToken, rideLimiter, (req, res) => {
  try {
    const { id } = req.params;
    const email = req.user?.email;

    logDebug(`POST /${id}/leave by ${email}`);

    const result = db.leaveRide(id, email);

    if (result.error) {
      return res.status(404).json({ message: result.error });
    }

    res.json(result);
  } catch (err) {
    console.error("Error leaving ride:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;