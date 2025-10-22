import { db } from "./ridesDb.js";
import { logDebug } from "./logger.js";

// checks every 5 minutes
const CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes
// rides are marked completed 1 hour after departure
const COMPLETION_THRESHOLD = 60 * 60 * 1000; // 1 hour after departure
// rides transition from completed to delete after 3 hours
const DELETE_THRESHOLD = 3 * 60 * 60 * 1000; // 3 hours after marked completed
// rides with delete status are hard-deleted after 12 hours
const HARD_DELETE_THRESHOLD = 12 * 60 * 60 * 1000; // 12 hours after marked delete

let statusCheckInterval = null;

export function startRideStatusChecker() {
  if (statusCheckInterval) {
    logDebug("Ride status checker already running");
    return;
  }

  logDebug("Starting ride status checker - checks every 5 minutes");
  
  statusCheckInterval = setInterval(() => {
    checkAndUpdateRideStatuses();
  }, CHECK_INTERVAL);

  // Run immediately on start
  checkAndUpdateRideStatuses();
}

export function stopRideStatusChecker() {
  if (statusCheckInterval) {
    clearInterval(statusCheckInterval);
    statusCheckInterval = null;
    logDebug("Ride status checker stopped");
  }
}

function checkAndUpdateRideStatuses() {
  const now = new Date();
  const rides = db.getRides();

  logDebug("Checking ride statuses", {
    timestamp: now.toISOString(),
    totalRides: rides.length
  });

  let completedCount = 0;
  let markedDeleteCount = 0;
  let hardDeleteCount = 0;

  rides.forEach(ride => {
    // Ensure status field exists (backwards compatibility)
    if (!ride.status) {
      ride.status = {
        status: "active",
        status_at: null
      };
    }

    // Check for active rides that should be marked as completed
    if (ride.status.status === "active") {
      const departureDateTime = new Date(`${ride.departureDate}T${ride.departureTime}`);
      const timeSinceDeparture = now - departureDateTime;

      if (timeSinceDeparture >= COMPLETION_THRESHOLD) {
        ride.status.status = "completed";
        ride.status.status_at = now.toISOString();
        completedCount++;

        logDebug("Ride auto-marked as completed (1+ hour after departure)", {
          rideId: ride.id,
          route: `${ride.from} → ${ride.destination}`,
          departureDate: ride.departureDate,
          completedAt: ride.status.status_at
        });
      }
    }

    // Check for completed rides that should be marked as delete
    if (ride.status.status === "completed" && ride.status.status_at) {
      const statusChangedTime = new Date(ride.status.status_at);
      const timeSinceCompletion = now - statusChangedTime;

      if (timeSinceCompletion >= DELETE_THRESHOLD) {
        ride.status.status = "delete";
        ride.status.status_at = now.toISOString();
        markedDeleteCount++;

        logDebug("Ride marked for deletion (3+ hours after completion)", {
          rideId: ride.id,
          route: `${ride.from} → ${ride.destination}`,
          markedDeleteAt: ride.status.status_at
        });
      }
    }

    // Check for delete status rides that should be hard-deleted from DB
    if (ride.status.status === "delete" && ride.status.status_at) {
      const deleteMarkedTime = new Date(ride.status.status_at);
      const timeSinceDeleteMark = now - deleteMarkedTime;

      if (timeSinceDeleteMark >= HARD_DELETE_THRESHOLD) {
        db.deleteRide(ride.id);
        hardDeleteCount++;

        logDebug("Ride hard-deleted from database (12+ hours after delete mark)", {
          rideId: ride.id,
          route: `${ride.from} → ${ride.destination}`,
          hardDeletedAt: now.toISOString()
        });
      }
    }
  });

  if (completedCount > 0 || markedDeleteCount > 0 || hardDeleteCount > 0) {
    logDebug("Ride status check complete", {
      autoCompleted: completedCount,
      markedForDelete: markedDeleteCount,
      hardDeleted: hardDeleteCount,
      timestamp: now.toISOString()
    });
  }
}

// Helper function to manually mark a ride as completed (for driver)
export function markRideAsCompleted(rideId) {
  const ride = db.findRideById(rideId);
  if (!ride) {
    return { error: "Ride not found" };
  }

  if (ride.status?.status === "completed") {
    return { error: "Ride is already completed" };
  }

  if (ride.status?.status === "delete") {
    return { error: "Ride has been marked for deletion and cannot be modified" };
  }

  const now = new Date();
  ride.status = {
    status: "completed",
    status_at: now.toISOString()
  };

  logDebug("Ride manually marked as completed", {
    rideId: ride.id,
    route: `${ride.from} → ${ride.destination}`,
    completedAt: ride.status.status_at
  });

  return ride;
}

// Helper function to unmark a ride as completed (revert to active)
export function unmarkRideAsCompleted(rideId) {
  const ride = db.findRideById(rideId);
  if (!ride) {
    return { error: "Ride not found" };
  }

  if (ride.status?.status === "delete") {
    return { error: "Ride has been marked for deletion and cannot be modified" };
  }

  if (ride.status?.status !== "completed") {
    return { error: "Ride is not currently marked as completed" };
  }

  // Check if departure time hasn't happened yet or was within the last hour
  const departureDateTime = new Date(`${ride.departureDate}T${ride.departureTime}`);
  const now = new Date();
  const timeSinceDeparture = now - departureDateTime;

  // If departure was more than 1 hour ago, don't allow unmark
  if (timeSinceDeparture > 60 * 60 * 1000) {
    return { 
      error: "Cannot unmark ride: departure was more than 1 hour ago"
    };
  }

  ride.status = {
    status: "active",
    status_at: null
  };

  logDebug("Ride unmarked from completed", {
    rideId: ride.id,
    route: `${ride.from} → ${ride.destination}`,
    unmarkedAt: now.toISOString()
  });

  return ride;
}