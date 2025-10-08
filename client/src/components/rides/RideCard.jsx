import React from "react";
import { Box, Button, Typography, Divider } from "@mui/material";
import { useAuth } from "../../context/AuthContext.jsx";
import universityColors from "../../assets/university_colors.json";

const RideCard = ({ ride, userEmail, joinRide, leaveRide, index = 0 }) => {
  const { user } = useAuth();
  const schoolName = user?.school || "";

  // Pull color theme from the university JSON
  const colors =
    universityColors.find(
      (u) => u.university.toLowerCase() === schoolName.toLowerCase()
    )?.colors || {};

  const joined = ride.passengers.includes(userEmail);
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

        {joined && (
          <Box
            sx={{
              px: 1.5,
              py: 0.5,
              background: "#d1fae5",
              color: "#065f46",
              borderRadius: "12px",
              fontSize: "0.75rem",
              fontWeight: 600,
              whiteSpace: "nowrap",
            }}
          >
            Joined
          </Box>
        )}
      </Box>

      <Divider sx={{ my: 1.5 }} />

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
          <strong>Distance:</strong> {ride.distance} mi
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

      <Box sx={{ display: "flex", gap: 1.5, mt: 2 }}>
        {joined ? (
          <Button
            onClick={() => leaveRide(ride.id)}
            sx={{
              flex: 1,
              background: colors.button_secondary_hover_bg || "#f3f4f6",
              color: colors.text_primary || "#374151",
              borderRadius: "8px",
              py: 1,
              textTransform: "none",
              fontWeight: 500,
              fontSize: "0.95rem",
              "&:hover": {
                background: "#e5e7eb",
              },
            }}
          >
            Leave Ride
          </Button>
        ) : (
          <Button
            onClick={() => joinRide(ride.id)}
            sx={{
              flex: 1,
              background:
                colors.button_primary_bg ||
                "linear-gradient(135deg, #334155, #1e293b)",
              color: colors.button_primary_text || "#fff",
              borderRadius: "8px",
              py: 1,
              textTransform: "none",
              fontWeight: 500,
              fontSize: "0.95rem",
              boxShadow: "0 2px 5px rgba(0,0,0,0.12)",
              "&:hover": {
                background:
                  colors.button_primary_hover ||
                  "linear-gradient(135deg, #1e293b, #0f172a)",
              },
            }}
          >
            Join Ride
          </Button>
        )}
      </Box>
    </Box>
  );
};

export default RideCard;