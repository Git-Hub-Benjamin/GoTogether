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

    if (!school) {
      return res.status(400).json({ message: "School parameter required" });
    }

    const university = universities.find(
      (u) => u.name.toLowerCase() === school.toLowerCase()
    );

    if (!university) {
      return res.status(404).json({ message: "University not found" });
    }

    // Get nearby cities
    const nearbyCities = findNearbyCitiesDynamic(
      university.lat,
      university.lng,
      distance
    );

    let cityNames = nearbyCities.map((c) => `${c.city}, ${c.state}`);

    // Filter by query if provided
    if (query && query.trim() !== "") {
      const lowerQuery = query.toLowerCase();
      cityNames = cityNames.filter((name) =>
        name.toLowerCase().includes(lowerQuery)
      );
    }

    // Add campus as first option
    const campusOption = school;
    const allLocations = [campusOption, ...cityNames];

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
    console.log("Search request body:", req.body);
    const { from, to, radius, school } = req.body;
    const searchRadius = radius ? Number(radius) : 100;

    if (!school) {
      return res.status(400).json({ message: "School parameter required" });
    }

    // Get all rides for this school
    let rides = await db.findRides({ school });
    console.log(`Found ${rides.length} rides for school ${school}`);
    console.log("Rides:", rides);

    // Filter by from/to
    rides = rides.filter((ride) => {
      if (from && from !== ride.from) return false;
      if (to && to !== ride.destination) return false;

      if (from && to) return true; // if both provided, ignore radius entirely

      // if only one of from/to specified or neither, filter by radius
      return searchRadius >= ride.distance;
    });

    console.log(`After filtering, ${rides.length} rides remain:`, rides);

    console.log(`After filtering, ${rides.length} rides remain:`, rides);

    // Sort by departure date
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
    res.json(rides);
  } catch (err) {
    console.error("Error fetching joined rides:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Create ride
router.post("/", authenticateToken, rideLimiter, (req, res) => {
  console.log("Create ride body:", req.body);
  try {
    const {
      from,
      destination,
      departureDate,
      departureTime,
      seatsAvailable,
      notes,
    } = req.body;

    let fromLat, fromLng, toLat, toLng;

    if (universities.find((u) => u.name.toLowerCase() === from.toLowerCase())) {   
      let university = universities.find(
        (u) => u.name.toLowerCase() === from.toLowerCase()
      );
      fromLat = university.lat;
      fromLng = university.lng;
      let city = cities.find(
        (c) => c.city.toLowerCase() === destination.split(",")[0].trim().toLowerCase()
      );
      toLat = city?.lat;
      toLng = city?.lng;
    } else if (
      universities.find(
        (u) => u.name.toLowerCase() === destination.toLowerCase()
      )
    ) {
      let university = universities.find(
        (u) => u.name.toLowerCase() === destination.toLowerCase()
      );
      toLat = university.lat;
      toLng = university.lng;
      let city = cities.find(
        (c) => c.city.toLowerCase() === from.split(",")[0].trim().toLowerCase()
      );
      fromLat = city?.lat;
      fromLng = city?.lng;
    } else {
      return res.status(400).json({ message: "One location must be a campus" });
    }

    if (!fromLat || !fromLng || !toLat || !toLng)
      return res.status(400).json({ message: "Invalid from or destination" });

    if (!from || !destination || !departureDate || !departureTime || !seatsAvailable)
      return res.status(400).json({ message: "Missing required fields" });

    const newRide = db.createRide({
      driverEmail: req.user?.email,
      school: req.user?.school,
      from,
      destination,
      departureDate,
      departureTime,
      seatsAvailable,
      notes: notes || "",
      distance: getDistanceInMiles(fromLat, fromLng, toLat, toLng).toFixed(2),
    });

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
