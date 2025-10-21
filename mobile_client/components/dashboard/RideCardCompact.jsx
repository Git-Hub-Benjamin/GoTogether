import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { calculateEstimatedGasCost } from "../../utils/calculateGasCost.js";
import { ENDPOINTS } from "../../utils/api.js";
import { useAuth } from "../../context/AuthContext";

export default function RideCardCompact({ ride, type, onFetchRides }) {
  const API_URL = ENDPOINTS.RIDES;
  const { token } = useAuth();
  const seatsLeft =
    parseInt(ride.seatsAvailable) - (ride.passengers?.length || 0);
  const estimatedGas = calculateEstimatedGasCost(
    ride.distance,
    ride.passengers.length + 1
  );
  const handleLeaveRide = async () => {
    try {
      const response = await fetch(`${API_URL}/${ride.id}/leave`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) throw new Error("Failed to leave ride");
      onFetchRides();
    } catch (error) {
      console.error("Error leaving ride:", error);
    }
  };

  const handleRemovePassenger = async (rideId, passengerEmail) => {
    try {
      const response = await fetch(`${API_URL}/${rideId}/remove-passenger`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ passengerEmail }),
      });
      if (!response.ok) throw new Error("Failed to remove passenger");
      onFetchRides();
    } catch (error) {
      console.error("Error removing passenger:", error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.route}>
            {ride.from} → {ride.destination}
          </Text>
          <Text style={styles.datetime}>
            {ride.departureDate} at {ride.departureTime}
          </Text>
        </View>
        {type === "joined" && (
          <TouchableOpacity
            style={styles.leaveButton}
            onPress={handleLeaveRide}
          >
            <Text style={styles.leaveButtonText}>Leave</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.details}>
        <Text style={styles.detailText}>
          <Text style={styles.label}>Distance:</Text> {ride.distance} miles
        </Text>
        <Text style={styles.detailText}>
          <Text style={styles.label}>Est. Gas:</Text> ~${estimatedGas}/person
        </Text>
        <Text style={styles.detailText}>
          <Text style={styles.label}>Seats:</Text> {seatsLeft} available
        </Text>
      </View>

      {ride.notes && (
        <Text style={styles.notes}>
          <Text style={styles.label}>Note:</Text> {ride.notes}
        </Text>
      )}

      {ride.passengers?.length > 0 && (
        <View style={styles.passengers}>
          <Text style={styles.label}>Passengers:</Text>
          {ride.passengers.map((passenger, index) => (
            <View key={passenger} style={styles.passengerItem}>
              <Text style={styles.passengerText}>{passenger}</Text>
              {type === "created" && (
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => handleRemovePassenger(ride.id, passenger)}
                >
                  <Text style={styles.removeButtonText}>Remove</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  route: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
  },
  datetime: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 4,
  },
  details: {
    marginBottom: 12,
  },
  detailText: {
    fontSize: 14,
    color: "#4b5563",
    marginBottom: 4,
  },
  label: {
    fontWeight: "600",
    color: "#374151",
  },
  notes: {
    fontSize: 14,
    color: "#4b5563",
    fontStyle: "italic",
    marginBottom: 12,
  },
  passengers: {
    marginTop: 12,
  },
  passengerItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#f3f4f6",
    borderRadius: 8,
    marginTop: 8,
  },
  passengerText: {
    fontSize: 14,
    color: "#374151",
  },
  leaveButton: {
    backgroundColor: "#ef4444",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  leaveButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  removeButton: {
    backgroundColor: "#ef4444",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  removeButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "500",
  },
});
