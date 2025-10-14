import React from "react";
import { Box, Button, Typography, Divider } from "@mui/material";
import { useAuth } from "../../context/AuthContext.jsx";
import universityColors from "../../assets/university_colors.json";
import { calculateEstimatedGasCost } from "../../utils/calculateGasCost.js";

const RideCard = ({
  ride,
  userEmail,
  joinRide,
  leaveRide,
  approveRequest,
  rejectRequest,
  index = 0,
}) => {
  const { user } = useAuth();
  const schoolName = user?.school || "";

  // Pull color theme from the university JSON
  const colors =
    universityColors.find(
      (u) => u.university.toLowerCase() === schoolName.toLowerCase()
    )?.colors || {};

  const joined = ride.passengers.includes(userEmail);
  const isPending = ride.pendingRequests?.includes(userEmail);
  const isDriver = ride.driverEmail === userEmail;
  const remainingSeats = ride.seatsAvailable - ride.passengers.length;

  return (
    <Box
      sx={{
        background: colors.card_bg || "#fff",
        borderRadius: "12px",
        boxShadow: `0 2px 8px ${colors.card_shadow || "rgba(0,0,0,0.08)"}`,
        p: 3,
        transition: "transform 0.2s ease, box-shadow 0.2s ease",
        opacity: 0,
        animation: "fadeInUp 0.4s ease forwards",
        animationDelay: `${index * 0.05}s`,
        "&:hover": {
          transform: "translateY(-3px)",
          boxShadow: `0 6px 16px ${
            colors.card_shadow || "rgba(0,0,0,0.12)"
          }`,
        },
        "@keyframes fadeInUp": {
          from: { opacity: 0, transform: "translateY(20px)" },
          to: { opacity: 1, transform: "translateY(0)" },
        },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          mb: 1,
        }}
      >
        <Box>
          <Typography
            sx={{
              fontSize: "1.05rem",
              fontWeight: 600,
              color: colors.text_primary || "#1e293b",
            }}
          >
            {ride.from} → {ride.destination}
          </Typography>
          <Typography
            sx={{
              fontSize: "0.85rem",
              color: colors.text_secondary || "#6b7280",
              mt: 0.2,
            }}
          >
            {ride.departureDate} · {ride.departureTime}
          </Typography>
        </Box>

        {(joined || isPending) && (
          <Box
            sx={{
              px: 1.5,
              py: 0.5,
              background: joined ? "#d1fae5" : "#fef3c7",
              color: joined ? "#065f46" : "#92400e",
              borderRadius: "12px",
              fontSize: "0.75rem",
              fontWeight: 600,
              whiteSpace: "nowrap",
            }}
          >
            {joined ? "Joined" : "Request Pending"}
          </Box>
        )}
      </Box>

      <Divider sx={{ my: 1.5 }} />

      {/* Ride Details */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          flexWrap: "wrap",
          rowGap: 0.8,
        }}
      >
        <Typography
          sx={{
            fontSize: "0.9rem",
            color: colors.text_secondary || "#475569",
          }}
        >
          <strong>Driver:</strong> {ride.driverEmail}
        </Typography>
        <Typography
          sx={{
            fontSize: "0.9rem",
            color: colors.text_secondary || "#475569",
          }}
        >
          <strong>Seats Left:</strong> {remainingSeats}
        </Typography>
        <Typography
          sx={{
            fontSize: "0.9rem",
            color: colors.text_secondary || "#475569",
          }}
        >
          <strong>Distance:</strong> {ride.distance} mi
        </Typography>
        <Typography
          sx={{
            fontSize: "0.9rem",
            color: colors.text_secondary || "#475569",
          }}
        >
          <strong>Est. Gas:</strong> ~${calculateEstimatedGasCost(ride.distance, ride.passengers.length)}/person
        </Typography>
      </Box>

      {ride.notes && (
        <Typography
          sx={{
            mt: 1.5,
            fontSize: "0.875rem",
            lineHeight: 1.5,
            color: colors.text_secondary || "#6b7280",
            fontStyle: "italic",
          }}
        >
          "{ride.notes}"
        </Typography>
      )}

      {/* Passenger Buttons (only for non-drivers) */}
      {!isDriver && (
        <Box sx={{ mt: 2, display: "flex", justifyContent: "flex-end" }}>
          {joined ? (
            <Button 
              onClick={() => leaveRide(ride.id)}
              variant="outlined"
              color="error"
              size="small"
              sx={{
                borderColor: "#ef4444",
                color: "#ef4444",
                "&:hover": {
                  borderColor: "#dc2626",
                  backgroundColor: "rgba(239, 68, 68, 0.04)",
                },
              }}
            >
              Leave Ride
            </Button>
          ) : isPending ? (
            <Button
              onClick={() => leaveRide(ride.id)}
              variant="outlined"
              color="error"
              size="small"
              sx={{
                borderColor: "#ef4444",
                color: "#ef4444",
                "&:hover": {
                  borderColor: "#dc2626",
                  backgroundColor: "rgba(239, 68, 68, 0.04)",
                },
              }}
            >
              Cancel Request
            </Button>
          ) : (
            <Button
              onClick={() => joinRide(ride.id)}
              variant="contained"
              size="small"
              sx={{
                bgcolor: colors.primary || "#2563eb",
                "&:hover": {
                  bgcolor: colors.primary_dark || "#1d4ed8",
                },
              }}
              disabled={remainingSeats === 0}
            >
              Request to Join
            </Button>
          )}
        </Box>
      )}

      {/* Pending approvals (driver only) */}
      {isDriver && ride.pendingRequests?.length > 0 && (
        <Box sx={{ mt: 2 }}>
          <Typography sx={{ fontWeight: 600, mb: 1 }}>
            Pending Requests ({ride.pendingRequests.length})
          </Typography>

          {ride.pendingRequests.map((email) => (
            <Box
              key={email}
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                mb: 1,
              }}
            >
              <Typography>{email}</Typography>
              <Box>
                <Button
                  onClick={() => approveRequest(ride.id, email)}
                  disabled={remainingSeats === 0}
                  sx={{ mr: 1 }}
                >
                  Accept
                </Button>
                <Button
                  onClick={() => rejectRequest(ride.id, email)}
                  color="error"
                >
                  Decline
                </Button>
              </Box>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default RideCard;