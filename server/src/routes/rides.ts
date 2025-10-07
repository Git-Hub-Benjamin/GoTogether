import express from "express";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { authenticateToken, AuthRequest } from "../utils/authMiddleware";
import { findNearbyCitiesDynamic } from "../utils/findNearbyCities.js";
import universities from "../data/us_universities.json";
import { University } from "../types/us_universities";
import { Ride } from "../types/ride";

const router = express.Router();

// Cache the nearby locations to the schools
const schoolRides: Map<string, Ride[]> = new Map();

const CACHE_PATH = path.resolve(
  "C:\\VSCode\\go-together\\server\\src\\data\\nearby_cache.json"
);

let nearbyCache: Record<string, any[]> = {};
if (fs.existsSync(CACHE_PATH)) {
  try {
    nearbyCache = JSON.parse(fs.readFileSync(CACHE_PATH, "utf-8"));
  } catch {
    console.warn("⚠️ Could not read nearby_cache.json; starting with empty cache.");
    nearbyCache = {};
  }
}

/* =========================================================
   🚗 SEED EXAMPLE RIDES
   ========================================================= */
const exampleRides: Record<string, Ride[]> = {
  "Utah State University": [
    {
      id: crypto.randomUUID(),
      driverEmail: "emma@usu.edu",
      school: "Utah State University",
      from: "Logan, UT",
      destination: "Utah State University (Campus)",
      departureDate: new Date().toISOString().split("T")[0],
      departureTime: "08:30",
      seatsAvailable: 3,
      notes: "Morning commute from Logan downtown to campus.",
      passengers: [],
      createdAt: new Date(),
    },
    {
      id: crypto.randomUUID(),
      driverEmail: "jack@usu.edu",
      school: "Utah State University",
      from: "Utah State University (Campus)",
      destination: "Salt Lake City, UT",
      departureDate: new Date(Date.now() + 86400000).toISOString().split("T")[0],
      departureTime: "17:00",
      seatsAvailable: 2,
      notes: "Heading to SLC for the weekend.",
      passengers: [],
      createdAt: new Date(),
    },
  ],
  "University Of Utah": [
    {
      id: crypto.randomUUID(),
      driverEmail: "sarah@utah.edu",
      school: "University Of Utah",
      from: "University of Utah (Campus)",
      destination: "Provo, UT",
      departureDate: new Date().toISOString().split("T")[0],
      departureTime: "18:15",
      seatsAvailable: 4,
      notes: "Evening ride down to Provo, gas split even.",
      passengers: [],
      createdAt: new Date(),
    },
    {
      id: crypto.randomUUID(),
      driverEmail: "liam@utah.edu",
      school: "University Of Utah",
      from: "Ogden, UT",
      destination: "University of Utah (Campus)",
      departureDate: new Date(Date.now() + 2 * 86400000).toISOString().split("T")[0],
      departureTime: "07:45",
      seatsAvailable: 3,
      notes: "Morning commute from Ogden area.",
      passengers: ["friend1@utah.edu"],
      createdAt: new Date(),
    },
  ],
};

// Inject seeded rides into memory map
for (const [school, rides] of Object.entries(exampleRides)) {
  schoolRides.set(school, rides);
  console.log(`✅ Seeded ${rides.length} rides for ${school}`);
}

// -------------------------

// Get all rides for user’s school
router.get("/", authenticateToken, (req: AuthRequest, res) => {
  const school = req.user?.school?.trim();
  console.log("School: " + school);
  if (!school) return res.status(400).json({ message: "Missing school" });

  const rides = schoolRides.get(school) || [];
  console.log("Rides: " + rides);
  console.log("Full rides: " + schoolRides);
  res.json(rides);
});

// Create new ride
router.post("/", authenticateToken, (req: AuthRequest, res) => {
  const {
    from,
    destination,
    departureDate,
    departureTime,
    seatsAvailable,
    pricePerPerson,
    notes,
  } = req.body;

  if (!from || !destination || !departureDate || !departureTime)
    return res.status(400).json({ message: "Missing ride fields" });

  const school = req.user!.school.trim();

  const newRide: Ride = {
    id: crypto.randomUUID(),
    driverEmail: req.user!.email,
    school,
    from,
    destination,
    departureDate,
    departureTime,
    seatsAvailable: Number(seatsAvailable),
    pricePerPerson: Number(pricePerPerson) || undefined,
    notes,
    passengers: [],
    createdAt: new Date(),
  };

  const rides = schoolRides.get(school) || [];
  rides.push(newRide);
  schoolRides.set(school, rides);

  res.status(201).json(newRide);
});

// Join ride
router.post("/:id/join", authenticateToken, (req: AuthRequest, res) => {
  const school = req.user!.school.trim();
  const rides = schoolRides.get(school) || [];
  const ride = rides.find((r) => r.id === req.params.id);

  if (!ride) return res.status(404).json({ message: "Ride not found" });
  if (ride.passengers.includes(req.user!.email))
    return res.status(400).json({ message: "Already joined" });
  if (ride.passengers.length >= ride.seatsAvailable)
    return res.status(400).json({ message: "No seats left" });

  ride.passengers.push(req.user!.email);
  res.json(ride);
});

// Leave ride
router.post("/:id/leave", authenticateToken, (req: AuthRequest, res) => {
  const school = req.user!.school.trim();
  const rides = schoolRides.get(school) || [];
  const ride = rides.find((r) => r.id === req.params.id);

  if (!ride) return res.status(404).json({ message: "Ride not found" });

  ride.passengers = ride.passengers.filter((p) => p !== req.user!.email);
  res.json(ride);
});

// Get rides created by user
router.get("/mine/created", authenticateToken, (req: AuthRequest, res) => {
  const school = req.user!.school.trim();
  const rides = schoolRides.get(school) || [];
  res.json(rides.filter((r) => r.driverEmail === req.user!.email));
});

// Get rides joined by user
router.get("/mine/joined", authenticateToken, (req: AuthRequest, res) => {
  const school = req.user!.school.trim();
  const rides = schoolRides.get(school) || [];
  res.json(rides.filter((r) => r.passengers.includes(req.user!.email)));
});

// Dynamic nearby locations
router.get("/locations", authenticateToken, (req: AuthRequest, res) => {
  const school = req.user?.school?.trim();
  if (!school) return res.status(400).json({ message: "User school missing." });

  let nearbyCities = nearbyCache[school];

  if (!nearbyCities) {
    const uni = (universities as University[]).find(
      (u) => u.name.toLowerCase() === school.toLowerCase()
    );

    if (uni && uni.lat && uni.lng) {
      nearbyCities = findNearbyCitiesDynamic(uni.lat, uni.lng, 100);
      // Cache it for next time
      nearbyCache[school] = nearbyCities;
      fs.writeFileSync(CACHE_PATH, JSON.stringify(nearbyCache, null, 2), "utf-8");
    } else {
      nearbyCities = [];
    }
  }

  const cityNames = nearbyCities.map((c: any) => `${c.city}, ${c.state}`);
  res.json({
    from: [school, ...cityNames],
    to: cityNames,
  });
});

export default router;