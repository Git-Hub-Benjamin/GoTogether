import { Router } from "express";
import { authenticateToken } from "../utils/authMiddleware.js";
import {
  findNearbyCitiesDynamic,
  getDistanceInMiles,
} from "../utils/findNearbyCities.js";
import { db } from "../utils/ridesDb.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { logDebug } from "../utils/logger.js";
import { sendRequestEmail } from "../utils/emailService.js";
import { checkRideCooldown, checkRequestLimit, setCooldown } from "../middleware/rideCooldown.js";
import { searchLimiter, locationsLimiter, rideLimiter } from "../middleware/rateLimiter.js";
import { markRideAsCompleted, unmarkRideAsCompleted } from "../utils/rideStatusManager.js";
import {
  notifyRideDeletion,
  notifyJoinApproved,
  notifyJoinRejected,
  notifyPassengerRemoved,
  notifyPassengerLeft,
  isWithinNotificationWindow,
} from "../utils/notificationService.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UNIVERSITIES_PATH = path.join(__dirname, "../data/us_universities.json");
const CITIES_PATH = path.join(__dirname, "../data/us_cities.json");

const universities = JSON.parse(fs.readFileSync(UNIVERSITIES_PATH, "utf-8"));
const cities = JSON.parse(fs.readFileSync(CITIES_PATH, "utf-8"));

const router = Router();

// Using imported rate limiters from middleware/rateLimiter.js

// Get nearby locations with optional search query
router.get("/locations", authenticateToken, locationsLimiter, (req, res) => {
  try {
    const { school, miles, query } = req.query;
    const distance = Number(miles) || 100;

    logDebug("GET /locations - Request", {
      params: { school, miles, query },
      normalized: { distance }
    });

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
    const { school } = req.body;
    let from = req.body.from || null;
    let to = req.body.to || null;
    let radius = req.body.radius || null;
    let date = req.body.date || null;

    // Default radius to 100 miles if not provided or invalid
    const searchRadius = radius ? Number(radius) : 100;

    // If radius is not 100 miles, dont use from/to filters
    if (searchRadius !== 100) {
      from = null;
      to = null;
    }

    if (!school) {
      return res.status(400).json({ message: "School parameter required" });
    }

    let rides = await db.findRides({ school });
    // logDebug("POST /search - Initial results", {
    //   school,
    //   foundRides: rides.length
    // });

    rides = rides.filter((ride) => {
      // Exclude rides created by the requesting user
      if (ride.driverEmail === req.user?.email) return false;
      // Exclude rides marked for deletion
      if (ride.status?.status === "delete") return false;
      if (from && from !== ride.from) return false;
      if (to && to !== ride.destination) return false;
      if (date && date !== ride.departureDate) return false;
      if (from && to) return true;
      return searchRadius >= ride.distance;
    });

    rides.sort((a, b) => new Date(a.departureDate) - new Date(b.departureDate));

    logDebug("POST /search - Found: " + rides.length + " rides");

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

    logDebug("GET /mine/created", {
      userEmail: email,
      ridesCount: rides.length,
      dates: rides.map(r => r.departureDate)
    });
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

    logDebug("GET /mine/joined", {
      userEmail: email,
      ridesCount: rides.length,
      dates: rides.map(r => r.departureDate)
    });
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

    logDebug("POST /rides - Create ride request", {
      driver: req.user?.email,
      school: req.user?.school,
      details: {
        from,
        destination,
        departureDate,
        departureTime,
        seatsAvailable,
        hasNotes: !!notes
      }
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
    logDebug("POST /rides - Validation failed", {
      error: "No university found in locations",
      from,
      destination
    });
    return res.status(400).json({ message: "One location must be a campus" });
    }

    if (!fromLat || !fromLng || !toLat || !toLng) {
    logDebug("POST /rides - Validation failed", {
      error: "Invalid coordinates",
      coordinates: {
        from: { lat: fromLat, lng: fromLng },
        to: { lat: toLat, lng: toLng }
      }
    });
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
      status: {
        status: "active",
        status_at: null
      }
    });

    logDebug("POST /rides - Success", {
      rideId: newRide.id,
      driver: newRide.driverEmail,
      route: {
        from: newRide.from,
        to: newRide.destination,
        distance: newRide.distance
      },
      departure: {
        date: newRide.departureDate,
        time: newRide.departureTime
      }
    });

    res.status(201).json(newRide);
  } catch (err) {
    console.error("Error creating ride:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Join ride
// router.post("/:id/join", authenticateToken, rideLimiter, (req, res) => {
//   try {
//     const { id } = req.params;
//     const email = req.user?.email;

//     logDebug("POST /rides/:id/join", {
//       rideId: id,
//       userEmail: email,
//       action: "join"
//     });

//     const result = db.joinRide(id, email);

//     logDebug("Join ride result:", result);

//     if (result.error) {
//       return res.status(400).json({ message: result.error });
//     }

//     res.json(result);
//   } catch (err) {
//     console.error("Error joining ride:", err);
//     res.status(500).json({ message: "Server error" });
//   }
// });

// Leave ride (for passengers)
router.post("/:id/leave", authenticateToken, rideLimiter, async (req, res) => {
  try {
    const { id } = req.params;
    const email = req.user?.email;

    logDebug("POST /rides/:id/leave", {
      rideId: id,
      userEmail: email,
      action: "leave"
    });

    const ride = db.findRideById(id);
    if (!ride) {
      return res.status(404).json({ error: "Ride not found" });
    }

    const result = db.leaveRide(id, email);

    if (result.error) {
      return res.status(404).json({ message: result.error });
    }

    logDebug("Leave ride successful", {
      rideId: id,
      userEmail: email,
      remainingPassengers: result.passengers.length
    });

    // Send notification to driver that passenger left
    await notifyPassengerLeft(ride.driverEmail, ride, email);

    res.json(result);
  } catch (err) {
    console.error("Error leaving ride:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Remove passenger (for drivers)
router.post("/:id/remove/:email", authenticateToken, rideLimiter, async (req, res) => {
  try {
    const { id, email: passengerEmail } = req.params;
    const driverEmail = req.user?.email;
    logDebug("POST /rides/:id/remove/:email", {
      rideId: id,
      driverEmail,
      passengerEmail, 
      action: "remove_passenger"
    });

    const ride = db.getRide(id);
    if (!ride) {
      return res.status(404).json({ message: "Ride not found" });
    }

    // Only the driver can remove passengers
    if (ride.driver !== driverEmail) {
      return res.status(403).json({ message: "Only the driver can remove passengers" });
    }

    const result = db.leaveRide(id, passengerEmail);
    if (result.error) {
      return res.status(404).json({ message: result.error });
    }

    logDebug("Remove passenger successful", {
      rideId: id,
      driverEmail,
      passengerEmail,
      remainingPassengers: result.passengers.length
    });

    // Send removal notification
    await notifyPassengerRemoved(passengerEmail, ride, driverEmail);

    res.json(result);
  } catch (err) {
    console.error("Error removing passenger:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Request to join a ride
router.post("/:id/request", 
  authenticateToken, 
  rideLimiter, 
  checkRideCooldown,
  checkRequestLimit,
  async (req, res) => {
    try {
      const { id } = req.params;
      const email = req.user?.email;

      logDebug("POST /rides/:id/request", {
        rideId: id,
        requesterEmail: email,
        action: "request_to_join"
      });

      const ride = db.findRideById(id);
      if (!ride) {
        return res.status(404).json({ message: "Ride not found" });
      }

      const result = db.requestToJoinRide(id, email);
      if (result.error) {
        return res.status(400).json({ error: result.error });
      }

      logDebug("Request to join ride successful", {
        rideId: id,
        requesterEmail: email,
        driverEmail: ride.driverEmail
      });

      // Send email to driver
      await sendRequestEmail(
        ride.driverEmail, 
        email,
        ride.from,
        ride.destination,
        ride.departureDate
      );

      res.json(result);
    } catch (err) {
      console.error("Error requesting to join ride:", err);
      res.status(500).json({ error: "Server error" });
    }
  });

// Approve join request
router.post("/:id/approve/:email", authenticateToken, rideLimiter, async (req, res) => {
  try {
    const { id, email } = req.params;
    const driverEmail = req.user?.email;

    logDebug("POST /rides/:id/approve/:email", {
      rideId: id,
      driverEmail,
      requestedEmail: email,
      action: "approve_request"
    });

    const ride = db.findRideById(id);
    if (!ride || ride.driverEmail !== driverEmail) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const result = db.approveJoinRequest(id, email);
    if (result.error) {
      return res.status(400).json({ message: result.error });
    }

    // Send approval notification
    await notifyJoinApproved(email, result);

    res.json(result);
  } catch (err) {
    console.error("Error approving join request:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Reject join request
router.post("/:id/reject/:email", authenticateToken, rideLimiter, async (req, res) => {
  try {
    const { id, email } = req.params;
    const driverEmail = req.user?.email;

    logDebug("POST /rides/:id/reject/:email", {
      rideId: id,
      driverEmail,
      requestedEmail: email,
      action: "reject_request"
    });

    const ride = db.findRideById(id);
    if (!ride || ride.driverEmail !== driverEmail) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const result = db.rejectJoinRequest(id, email);
    if (result.error) {
      return res.status(400).json({ message: result.error });
    }

    // Send rejection notification
    await notifyJoinRejected(email, ride);

    res.json(result);
  } catch (err) {
    console.error("Error rejecting join request:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Cancel join request (by requestor)
router.post("/:id/cancel-request", authenticateToken, rideLimiter, (req, res) => {
  try {
    const { id } = req.params;
    const email = req.user?.email;

    logDebug("POST /rides/:id/cancel-request", {
      rideId: id,
      userEmail: email,
      action: "cancel_request"
    });

    const ride = db.findRideById(id);
    if (!ride) {
      return res.status(404).json({ error: "Ride not found" });
    }

    if (!ride.pendingRequests.includes(email)) {
      return res.status(400).json({ error: "No pending request found" });
    }

    ride.pendingRequests = ride.pendingRequests.filter(e => e !== email);
    
    // Set cooldown when request is cancelled
    setCooldown(email, id);
    
    logDebug("Request cancelled successfully", {
      rideId: id,
      userEmail: email,
      remainingRequests: ride.pendingRequests.length
    });

    res.json(ride);
  } catch (err) {
    console.error("Error cancelling join request:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Mark ride as completed (driver only)
router.post("/:id/complete", authenticateToken, rideLimiter, (req, res) => {
  try {
    const { id } = req.params;
    const driverEmail = req.user?.email;

    logDebug("POST /rides/:id/complete", {
      rideId: id,
      driverEmail,
      action: "mark_as_complete"
    });

    const ride = db.findRideById(id);
    if (!ride) {
      return res.status(404).json({ message: "Ride not found" });
    }

    if (ride.driverEmail !== driverEmail) {
      return res.status(403).json({ message: "Only the driver can complete a ride" });
    }

    const result = markRideAsCompleted(id);
    if (result.error) {
      return res.status(400).json({ message: result.error });
    }

    logDebug("Ride marked as completed successfully", {
      rideId: id,
      driverEmail,
      status_at: result.status.status_at
    });

    res.json(result);
  } catch (err) {
    console.error("Error completing ride:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Unmark ride as completed (driver only)
router.post("/:id/unmark-complete", authenticateToken, rideLimiter, (req, res) => {
  try {
    const { id } = req.params;
    const driverEmail = req.user?.email;

    logDebug("POST /rides/:id/unmark-complete", {
      rideId: id,
      driverEmail,
      action: "unmark_as_complete"
    });

    const ride = db.findRideById(id);
    if (!ride) {
      return res.status(404).json({ message: "Ride not found" });
    }

    if (ride.driverEmail !== driverEmail) {
      return res.status(403).json({ message: "Only the driver can unmark a ride" });
    }

    const result = unmarkRideAsCompleted(id);
    if (result.error) {
      return res.status(400).json({ message: result.error });
    }

    logDebug("Ride unmarked as completed successfully", {
      rideId: id,
      driverEmail,
      departureDate: ride.departureDate,
      departureTime: ride.departureTime
    });

    res.json(result);
  } catch (err) {
    console.error("Error unmarking ride:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Delete ride
router.delete("/:id", authenticateToken, rideLimiter, async (req, res) => {
  try {

    logDebug("DELETE /rides/:id - Delete ride request", {
      rideId: req.params.id,
      driverEmail: req.user?.email
    });
    const { id } = req.params;
    const driverEmail = req.user?.email;

    const ride = db.findRideById(id);
    if (!ride) {
      return res.status(404).json({ message: "Ride not found" });
    }

    if (ride.driverEmail !== driverEmail) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // Get all affected users before deleting
    const affectedUsers = [
      ...ride.passengers,
      ...ride.pendingRequests
    ];

    // Delete the ride
    db.deleteRide(id);

    // Send notifications only if within time window
    if (affectedUsers.length > 0) {
      await notifyRideDeletion(affectedUsers, ride);
    }

    res.json({ message: "Ride deleted successfully" });
  } catch (err) {
    console.error("Error deleting ride:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;