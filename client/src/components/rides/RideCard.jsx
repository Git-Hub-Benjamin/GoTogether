import React from "react";
import { Box, Button, Typography, Divider, CircularProgress } from "@mui/material";
import { useAuth } from "../../context/AuthContext.jsx";
import universityColors from "../../assets/university_colors.json";
import { calculateEstimatedGasCost } from "../../utils/calculateGasCost.js";

// Format time to 12-hour format with AM/PM
const formatTime = (timeStr) => {
  if (!timeStr) return "";
  const [hours, minutes] = timeStr.split(":").map(Number);
  const period = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${String(minutes).padStart(2, "0")} ${period}`;
};

const RideCard = ({
  ride,
  userEmail,
  joinRide,
  leaveRide,
  approveRequest,
  rejectRequest,
  index = 0,
  loadingRideIds,
  onCancelRequest,
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
      {/* Header - Route and Time */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Box sx={{ flex: 1 }}>
          <Typography
            sx={{
              fontSize: "1.25rem",
              fontWeight: 700,
              color: colors.text_primary || "#1e293b",
              lineHeight: 1.2,
            }}
          >
            {ride.from} → {ride.destination}
          </Typography>
          <Typography
            sx={{
              fontSize: "0.95rem",
              color: colors.text_secondary || "#6b7280",
              mt: 0.5,
              fontWeight: 500,
            }}
          >
            {ride.departureDate}
          </Typography>
        </Box>

        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            ml: 2,
          }}
        >
          <Box
            sx={{
              fontSize: "1.8rem",
              fontWeight: 700,
              color: colors.primary || "#2563eb",
              lineHeight: 1,
            }}
          >
            {formatTime(ride.departureTime)}
          </Box>
          {(joined || isPending) && (
            <Box
              sx={{
                px: 1.5,
                py: 0.5,
                background: joined ? "#d1fae5" : "#fef3c7",
                color: joined ? "#065f46" : "#92400e",
                borderRadius: "8px",
                fontSize: "0.7rem",
                fontWeight: 700,
                whiteSpace: "nowrap",
                mt: 1,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              {joined ? "✓ Joined" : "⏳ Pending"}
            </Box>
          )}
        </Box>
      </Box>

      <Divider sx={{ my: 1.5 }} />

      {/* Ride Details Grid */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 2,
          mb: 2,
        }}
      >
        {/* Driver */}
        <Box>
          <Typography
            sx={{
              fontSize: "0.75rem",
              fontWeight: 700,
              color: colors.text_secondary || "#9ca3af",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              mb: 0.5,
            }}
          >
            Driver
          </Typography>
          <Typography
            sx={{
              fontSize: "0.95rem",
              fontWeight: 600,
              color: colors.text_primary || "#1e293b",
            }}
          >
            {ride.driverEmail.split("@")[0]}
          </Typography>
        </Box>

        {/* Seats Left */}
        <Box>
          <Typography
            sx={{
              fontSize: "0.75rem",
              fontWeight: 700,
              color: colors.text_secondary || "#9ca3af",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              mb: 0.5,
            }}
          >
            Seats Available
          </Typography>
          <Typography
            sx={{
              fontSize: "0.95rem",
              fontWeight: 600,
              color:
                remainingSeats === 0
                  ? "#ef4444"
                  : colors.primary || "#2563eb",
            }}
          >
            {remainingSeats === 0 ? "Full" : `${remainingSeats} left`}
          </Typography>
        </Box>

        {/* Gas Cost */}
        {ride.showEstimatedGasCost && (
          <Box>
            <Typography
              sx={{
                fontSize: "0.75rem",
                fontWeight: 700,
                color: colors.text_secondary || "#9ca3af",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                mb: 0.5,
              }}
            >
              Est. Gas Cost
            </Typography>
            <Typography
              sx={{
                fontSize: "1rem",
                fontWeight: 700,
                color: colors.primary || "#2563eb",
              }}
            >
              ~${calculateEstimatedGasCost(ride.distance, ride.passengers.length + 1)}/person
            </Typography>
          </Box>
        )}

        {/* Total Passengers */}
        <Box>
          <Typography
            sx={{
              fontSize: "0.75rem",
              fontWeight: 700,
              color: colors.text_secondary || "#9ca3af",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              mb: 0.5,
            }}
          >
            Passengers
          </Typography>
          <Typography
            sx={{
              fontSize: "0.95rem",
              fontWeight: 600,
              color: colors.text_primary || "#1e293b",
            }}
          >
            {ride.passengers.length} / {ride.seatsAvailable}
          </Typography>
        </Box>
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
              onClick={() => onCancelRequest(ride.id)}
              variant="outlined"
              color="error"
              size="small"
              disabled={loadingRideIds?.[`cancel-${ride.id}`] || false}
              sx={{
                borderColor: "#ef4444",
                color: "#ef4444",
                minWidth: "unset",
                px: 2,
                py: 0.75,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                "&:hover": {
                  borderColor: "#dc2626",
                  backgroundColor: "rgba(239, 68, 68, 0.04)",
                },
              }}
            >
              {loadingRideIds?.[`cancel-${ride.id}`] ? (
                <>
                  <CircularProgress size={16} sx={{ color: '#ef4444' }} />
                  Cancelling...
                </>
              ) : (
                "Cancel Request"
              )}
            </Button>
          ) : (
            <Button
              onClick={() => joinRide(ride.id)}
              variant="contained"
              size="small"
              disabled={remainingSeats === 0 || loadingRideIds?.[ride.id] || false}
              sx={{
                bgcolor: colors.primary || "#2563eb",
                minWidth: "unset",
                px: 2,
                py: 0.75,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                "&:hover": {
                  bgcolor: colors.primary_dark || "#1d4ed8",
                },
              }}
            >
              {loadingRideIds?.[ride.id] ? (
                <>
                  <CircularProgress size={16} sx={{ color: 'white' }} />
                  Requesting...
                </>
              ) : (
                "Request to Join"
              )}
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