import { Box, Typography } from "@mui/material";
import RideCard from "../rides/RideCard";
import { useRef, useEffect, useState } from "react";

const ResultsSection = ({
  colors,
  rides,
  userEmail,
  joinRide,
  leaveRide,
  filterHeight,
}) => {
  return (
    <Box
      sx={{
        flex: 1,
        width: "100%",
        background: colors.card_bg || "#fff",
        borderRadius: "12px",
        boxShadow: `0 4px 16px ${colors.card_shadow || "rgba(0,0,0,0.08)"}`,
        display: "flex",
        flexDirection: "column",
        height: { xs: "auto", md: filterHeight || "auto" },
        minHeight: { xs: "300px", md: "400px" },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: { xs: 2.5, sm: 3 },
          borderBottom:
            rides && rides.length > 0
              ? `1px solid ${colors.border || "#e2e8f0"}`
              : "none",
        }}
      >
        <Typography
          variant="h6"
          sx={{
            color: colors.text_primary || "#1e293b",
            fontWeight: 600,
            fontSize: "19px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          Available Rides
          {rides && rides.length > 0 && (
            <Typography
              component="span"
              sx={{
                fontSize: "15px",
                color: colors.text_secondary || "#64748b",
                fontWeight: 500,
              }}
            >
              ({rides.length})
            </Typography>
          )}
        </Typography>
      </Box>

      {/* Ride List */}
      <Box
        sx={{
          flex: 1,
          overflowY: "auto",
          p: { xs: 2.5, sm: 3 },
          "&::-webkit-scrollbar": { width: "8px" },
          "&::-webkit-scrollbar-track": {
            background: colors.scrollbar_track || "#f1f5f9",
            borderRadius: "4px",
          },
          "&::-webkit-scrollbar-thumb": {
            background: colors.scrollbar_thumb || "#cbd5e1",
            borderRadius: "4px",
            "&:hover": {
              background: colors.scrollbar_thumb_hover || "#94a3b8",
            },
          },
        }}
      >
        {(!rides || rides.length === 0) && (
          <Typography
            sx={{
              color: colors.text_secondary || "#94a3b8",
              py: 4,
              textAlign: "center",
              fontSize: "14px",
            }}
          >
            Start searching to see available rides near campus.
          </Typography>
        )}

        {rides && rides.length > 0 && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {rides.map((ride, index) => (
              <RideCard
                key={ride.id}
                ride={ride}
                userEmail={userEmail}
                joinRide={joinRide}
                leaveRide={leaveRide}
                index={index}
              />
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default ResultsSection;