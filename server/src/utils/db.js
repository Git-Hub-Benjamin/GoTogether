import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, "../data");
const RIDES_FILE = path.join(DATA_DIR, "rides.json");

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initialize rides file if it doesn't exist
if (!fs.existsSync(RIDES_FILE)) {
  fs.writeFileSync(RIDES_FILE, JSON.stringify([], null, 2));
}

// Load rides from file
function loadRides() {
  try {
    const data = fs.readFileSync(RIDES_FILE, "utf-8");
    return JSON.parse(data);
  } catch (err) {
    console.error("Error loading rides:", err);
    return [];
  }
}

// Save rides to file
function saveRides(rides) {
  try {
    fs.writeFileSync(RIDES_FILE, JSON.stringify(rides, null, 2));
  } catch (err) {
    console.error("Error saving rides:", err);
  }
}

// Generate unique ID
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export const db = {
  // Get all rides
  getRides() {
    return loadRides();
  },

  // Get rides by filter
  findRides(filter = {}) {
    const rides = loadRides();
    return rides.filter((ride) => {
      for (const [key, value] of Object.entries(filter)) {
        if (key === "passengers" && Array.isArray(value)) {
          // Check if any passenger matches
          if (!value.some((p) => ride.passengers?.includes(p))) {
            return false;
          }
        } else if (ride[key] !== value) {
          return false;
        }
      }
      return true;
    });
  },

  // Get ride by ID
  findRideById(id) {
    const rides = loadRides();
    return rides.find((ride) => ride.id === id);
  },

  // Create ride
  createRide(rideData) {
    const rides = loadRides();
    const newRide = {
      id: generateId(),
      ...rideData,
      passengers: [],
      createdAt: new Date().toISOString(),
    };
    rides.push(newRide);
    saveRides(rides);
    return newRide;
  },

  // Update ride
  updateRide(id, updates) {
    const rides = loadRides();
    const index = rides.findIndex((ride) => ride.id === id);
    if (index === -1) return null;

    rides[index] = { ...rides[index], ...updates };
    saveRides(rides);
    return rides[index];
  },

  // Delete ride
  deleteRide(id) {
    const rides = loadRides();
    const filtered = rides.filter((ride) => ride.id !== id);
    if (filtered.length === rides.length) return false;
    saveRides(filtered);
    return true;
  },

  // Join ride
  joinRide(id, email) {
    const ride = this.findRideById(id);
    if (!ride) return { error: "Ride not found" };
    if (ride.passengers.includes(email)) {
      return { error: "Already joined" };
    }
    if (ride.passengers.length >= ride.seatsAvailable) {
      return { error: "No seats available" };
    }

    ride.passengers.push(email);
    return this.updateRide(id, { passengers: ride.passengers });
  },

  // Leave ride
  leaveRide(id, email) {
    const ride = this.findRideById(id);
    if (!ride) return { error: "Ride not found" };

    const passengers = ride.passengers.filter((p) => p !== email);
    return this.updateRide(id, { passengers });
  },
};