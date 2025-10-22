import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
// import { logDebug } from "./logger";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, "../data");
const RIDES_FILE = path.join(DATA_DIR, "rides.json");

let ridesCache = [];
try {
  const data = fs.readFileSync(RIDES_FILE, "utf-8");
  ridesCache = JSON.parse(data);
  console.log(`✅ Loaded ${ridesCache.length} test rides from rides.json`);
} catch (err) {
  console.error("⚠️ Could not load rides.json:", err);
  ridesCache = [];
}

// Generate unique ID
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// All reads/writes now modify ridesCache only
export const db = {
  // Get all rides
  getRides() {
    return ridesCache;
  },

  // Get rides by filter
  findRides(filter = {}) {
    return ridesCache.filter((ride) => {
      // Ensure backwards compatibility with older rides
      if (!ride.pendingRequests) {
        ride.pendingRequests = [];
      }
      for (const [key, value] of Object.entries(filter)) {
        if (key === "passengers" && Array.isArray(value)) {
          if (!value.some((p) => ride.passengers?.includes(p))) return false;
        } else if (ride[key] !== value) {
          return false;
        }
      }
      return true;
    });
  },

  // Get ride by ID
  findRideById(id) {
    const ride = ridesCache.find((ride) => ride.id === id);
    // Ensure backwards compatibility with older rides
    if (ride && !ride.pendingRequests) {
      ride.pendingRequests = [];
    }
    return ride;
  },

  // Create ride (in-memory only)
  createRide(rideData) {
    const newRide = {
      id: generateId(),
      ...rideData,
      passengers: [],
      pendingRequests: [],
      createdAt: new Date().toISOString(),
      status: rideData.status || {
        status: "active",
        delete_at: null
      }
    };
    ridesCache.push(newRide);
    return newRide;
  },

  // Update ride
  updateRide(id, updates) {
    const index = ridesCache.findIndex((ride) => ride.id === id);
    if (index === -1) return null;
    ridesCache[index] = { ...ridesCache[index], ...updates };
    return ridesCache[index];
  },

  // Delete ride
  deleteRide(id) {
    const prevLength = ridesCache.length;
    ridesCache = ridesCache.filter((ride) => ride.id !== id);
    return prevLength !== ridesCache.length;
  },

  // Join ride
  joinRide(id, email) {
    const ride = this.findRideById(id);
    if (!ride) return { error: "Ride not found" };
    if (ride.passengers.includes(email)) return { error: "Already joined" };
    if (ride.passengers.length >= ride.seatsAvailable)
      return { error: "No seats available" };

    ride.passengers.push(email);
    return ride;
  },

  // Leave ride
  leaveRide(id, email) {
    const ride = this.findRideById(id);
    if (!ride) return { error: "Ride not found" };

    // Handle both passengers and pending requests
    if (!ride.passengers.includes(email) && !ride.pendingRequests?.includes(email)) {
      return { error: "Not a passenger or pending request in this ride" };
    }

    // Remove from passengers if they're a passenger
    if (ride.passengers.includes(email)) {
      ride.passengers = ride.passengers.filter((p) => p !== email);
    }

    // Remove from pending requests if they're in pending
    if (ride.pendingRequests?.includes(email)) {
      ride.pendingRequests = ride.pendingRequests.filter((p) => p !== email);
    }

    return ride;
  },

  // Request join
  requestToJoinRide(id, email) {
    const ride = this.findRideById(id);
    if (!ride) return { error: "Ride not found" };

    // Ensure arrays exist
    if (!ride.passengers) ride.passengers = [];
    if (!ride.pendingRequests) ride.pendingRequests = [];

    const remainingSeats = ride.seatsAvailable - ride.passengers.length;
    if (remainingSeats <= 0) return { error: "No seats available" };
    if (ride.passengers.includes(email))
      return { error: "Already in ride" };
    if (ride.pendingRequests.includes(email))
      return { error: "Already requested to join" };

    ride.pendingRequests.push(email);
    return ride;
  },

  // Approve join request
  approveJoinRequest(id, requestedEmail) {
    const ride = this.findRideById(id);
    if (!ride) return { error: "Ride not found" };

    const remainingSeats = ride.seatsAvailable - ride.passengers.length;
    if (remainingSeats <= 0) return { error: "Ride is full" };

    if (!ride.pendingRequests.includes(requestedEmail))
      return { error: "No pending request found" };

    ride.pendingRequests = ride.pendingRequests.filter(
      (email) => email !== requestedEmail
    );
    ride.passengers.push(requestedEmail);
    return ride;
  },

  // Reject join request
  rejectJoinRequest(id, requestedEmail) {
    const ride = this.findRideById(id);
    if (!ride) return { error: "Ride not found" };

    ride.pendingRequests = ride.pendingRequests.filter(
      (email) => email !== requestedEmail
    );
    return ride;
  },
};
