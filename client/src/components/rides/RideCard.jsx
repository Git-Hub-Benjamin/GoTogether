import React from "react";
import { Box, Button, Typography } from "@mui/material";

const RideCard = ({ ride, userEmail, joinRide, leaveRide, index = 0 }) => {
  const joined = ride.passengers.includes(userEmail);

  return (
    <Box
      sx={{
        background: "linear-gradient(145deg, #ffffff, #f9fafb)",
        borderRadius: "12px",
        padding: "18px",
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
        transition: "transform 0.2s ease, box-shadow 0.2s ease",
        opacity: 0,
        animation: "fadeInUp 0.4s ease forwards",
        animationDelay: `${index * 0.05}s`,
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: "0 6px 16px rgba(0, 0, 0, 0.12)",
        },
        "@keyframes fadeInUp": {
          from: {
            opacity: 0,
            transform: "translateY(20px)",
          },
          to: {
            opacity: 1,
            transform: "translateY(0)",
          },
        },
      }}
    >
      <Typography
        variant="h6"
        sx={{
          margin: "0 0 6px",
          color: "#00263a",
          fontSize: "17px",
          fontWeight: 600,
        }}
      >
        {ride.from} → {ride.destination}
      </Typography>

      <Typography
        variant="body2"
        sx={{
          color: "#6b7280",
          fontSize: "13px",
        }}
      >
        📅 {ride.departureDate} • 🕓 {ride.departureTime} • 👥{" "}
        {ride.seatsAvailable - ride.passengers.length} seats
      </Typography>

      {joined && (
        <Box
          sx={{
            display: "inline-block",
            background: "#d1fae5",
            color: "#065f46",
            padding: "4px 10px",
            borderRadius: "12px",
            fontSize: "12px",
            fontWeight: 600,
            marginTop: "8px",
          }}
        >
          Your Ride
        </Box>
      )}

      <Box sx={{ display: "flex", gap: "12px", marginTop: "12px" }}>
        {joined ? (
          <Button
            onClick={() => leaveRide(ride.id)}
            sx={{
              background: "#e5e7eb",
              color: "#374151",
              border: "none",
              borderRadius: "8px",
              padding: "12px 20px",
              fontSize: "15px",
              fontWeight: 600,
              textTransform: "none",
              transition: "all 0.2s ease",
              "&:hover": {
                background: "#d1d5db",
              },
            }}
          >
            Leave Ride
          </Button>
        ) : (
          <Button
            onClick={() => joinRide(ride.id)}
            sx={{
              background: "linear-gradient(135deg, #006d5b, #008c70)",
              color: "white",
              border: "none",
              borderRadius: "8px",
              padding: "12px 20px",
              fontSize: "15px",
              fontWeight: 600,
              textTransform: "none",
              transition: "transform 0.2s ease, box-shadow 0.2s ease",
              boxShadow: "0 2px 8px rgba(0, 109, 91, 0.3)",
              "&:hover": {
                transform: "translateY(-2px)",
                boxShadow: "0 4px 12px rgba(0, 109, 91, 0.4)",
                background: "linear-gradient(135deg, #006d5b, #008c70)",
              },
              "&:active": {
                transform: "translateY(0)",
              },
            }}
          >
            Join Ride
          </Button>
        )}
      </Box>

      {ride.notes && (
        <Typography
          variant="body2"
          sx={{
            marginTop: "12px",
            fontStyle: "italic",
            color: "#6b7280",
            fontSize: "13px",
          }}
        >
          "{ride.notes}"
        </Typography>
      )}
    </Box>
  );
};

export default RideCard;