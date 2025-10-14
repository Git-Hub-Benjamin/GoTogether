import React from "react";
import { Box, Button, Typography } from "@mui/material";
import { useAuth } from "../../context/AuthContext";
import universityColors from "../../assets/university_colors.json";

const MyRidesSection = ({ 
  active, 
  myCreatedRides, 
  myJoinedRides, 
  myRequestedRides,
  onCreateRide,
  onCancelRequest
}) => {
  const { user } = useAuth();
  const empty = myCreatedRides.length === 0 && myJoinedRides.length === 0 && myRequestedRides.length === 0;

  const colors =
    universityColors.find(
      (u) => u.university.toLowerCase() === (user?.school || "").toLowerCase()
    )?.colors || {};

    console.log("My Created Rides:", myCreatedRides);

  return (
    <Box
      sx={{
        position: active ? "relative" : "absolute",
        width: "100%",
        top: 0,
        left: 0,
        opacity: active ? 1 : 0,
        transform: active ? "translateX(0)" : "translateX(100%)",
        transition:
          "transform 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.4s ease",
        pointerEvents: active ? "all" : "none",
        display: "flex",
        flexDirection: "column",
        gap: 2,
      }}
    >
      {/* Scrollable Rides Container */}
      <Box
        sx={{
          flex: 1,
          background: colors.card_bg || "#fff",
          borderRadius: "12px",
          boxShadow: `0 4px 16px ${colors.card_shadow || "rgba(0,0,0,0.08)"}`,
          padding: { xs: "20px", sm: "24px" },
          overflowY: "auto",
          maxHeight: "calc(100vh - 260px)", // still limits page height on large screens
          "&::-webkit-scrollbar": { width: "8px" },
          "&::-webkit-scrollbar-thumb": {
            background: colors.text_secondary || "#94a3b8",
            borderRadius: "4px",
          },
        }}
      >
        <Typography
          variant="h6"
          sx={{
            color: colors.text_primary || "#1e293b",
            margin: "0 0 16px",
            fontSize: "19px",
            fontWeight: 600,
          }}
        >
          My Rides
        </Typography>

        {empty ? (
          <Box
            sx={{
              textAlign: "center",
              padding: "40px 20px",
              color: colors.text_secondary || "#94a3b8",
              fontSize: "14px",
            }}
          >
            You haven't joined or created any rides yet.
          </Box>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {/* Created rides */}
            {myCreatedRides.length > 0 && (
              <>
                <Typography
                  sx={{
                    fontWeight: 600,
                    fontSize: "15px",
                    color: colors.text_primary || "#1e293b",
                  }}
                >
                  Created Rides
                </Typography>

                {myCreatedRides.map((ride, index) => (
                  <RideCardCompact key={ride.id} ride={ride} colors={colors} index={index} label="Your Ride" />
                ))}
              </>
            )}

            {/* Requested rides */}
            {myRequestedRides.length > 0 && (
              <>
                <Typography
                  sx={{
                    fontWeight: 600,
                    fontSize: "15px",
                    color: colors.text_primary || "#1e293b",
                    marginTop: myCreatedRides.length > 0 ? "24px" : 0,
                  }}
                >
                  Pending Requests
                </Typography>
                {myRequestedRides.map((ride, index) => (
                  <Box
                    key={ride.id}
                    sx={{
                      background: colors.card_bg || "#fff",
                      border: `1px solid ${colors.border || "#e2e8f0"}`,
                      borderRadius: "10px",
                      padding: "16px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px"
                    }}
                  >
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <Typography sx={{ fontWeight: 600 }}>
                        {ride.from} → {ride.destination}
                      </Typography>
                      <Box
                        sx={{
                          px: 1.5,
                          py: 0.5,
                          background: "#fef3c7",
                          color: "#92400e",
                          borderRadius: "12px",
                          fontSize: "0.75rem",
                          fontWeight: 600,
                        }}
                      >
                        Request Pending
                      </Box>
                    </Box>
                    <Typography sx={{ color: colors.text_secondary, fontSize: "0.9rem" }}>
                      📅 {ride.departureDate} • 🕓 {ride.departureTime}
                    </Typography>
                    <Button
                      onClick={() => onCancelRequest(ride.id)}
                      sx={{
                        mt: 1,
                        color: "#ef4444",
                        borderColor: "#ef4444",
                        '&:hover': {
                          borderColor: "#dc2626",
                          backgroundColor: "rgba(239, 68, 68, 0.04)"
                        }
                      }}
                      variant="outlined"
                      size="small"
                    >
                      Cancel Request
                    </Button>
                  </Box>
                ))}
              </>
            )}

            {/* Joined rides */}
            {myJoinedRides.length > 0 && (
              <>
                <Typography
                  sx={{
                    fontWeight: 600,
                    fontSize: "15px",
                    color: colors.text_primary || "#1e293b",
                    mt: myCreatedRides.length > 0 ? "16px" : 0,
                  }}
                >
                  Joined Rides
                </Typography>

                {myJoinedRides.map((ride, index) => (
                  <RideCardCompact
                    key={ride.id}
                    ride={ride}
                    colors={colors}
                    index={index + myCreatedRides.length}
                  />
                ))}
              </>
            )}
          </Box>
        )}
      </Box>

      {/* Footer Action Bar (fixed height, always visible) */}
      <Box
        sx={{
          background: colors.footer_bg || "#f9fafb",
          border: `1px solid ${colors.border || "#e2e8f0"}`,
          borderRadius: "12px",
          padding: "14px",
          display: "flex",
          justifyContent: "center",
          boxShadow: `0 2px 6px ${colors.card_shadow || "rgba(0,0,0,0.08)"}`,
        }}
      >
        <Button
          onClick={onCreateRide}
          sx={{
            flex: 1,
            maxWidth: "300px",
            background: colors.button_primary_bg || "#334155",
            color: colors.button_primary_text || "#fff",
            fontWeight: 600,
            textTransform: "none",
            fontSize: "14px",
            borderRadius: "8px",
            py: "10px",
            "&:hover": {
              background: colors.button_primary_hover || "#1e293b",
            },
          }}
        >
          + Create Ride
        </Button>
      </Box>
    </Box>
  );
};

// In RideCardCompact component
const RideCardCompact = ({ ride, colors, label, onDelete }) => {
  return (
    <Box
      sx={{
        background: colors.card_bg || "#fff",
        border: `1px solid ${colors.border || "#e2e8f0"}`,
        borderRadius: "10px",
        padding: "16px",
        boxShadow: `0 2px 8px ${colors.card_shadow || "rgba(0,0,0,0.06)"}`,
        animation: "fadeInUp 0.3s ease forwards",
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography
            sx={{
              marginBottom: "4px",
              color: colors.text_primary || "#1e293b",
              fontSize: "16px",
              fontWeight: 600,
            }}
          >
            {ride.from} → {ride.destination}
          </Typography>
          <Typography
            sx={{
              color: colors.text_secondary || "#64748b",
              fontSize: "13px",
            }}
          >
            📅 {ride.departureDate} • 🕓 {ride.departureTime}
          </Typography>
        </Box>
        
        {onDelete && (
          <Button
            onClick={() => onDelete(ride.id)}
            color="error"
            size="small"
            sx={{
              minWidth: 'unset',
              p: '6px',
              color: '#ef4444',
              '&:hover': {
                backgroundColor: 'rgba(239, 68, 68, 0.04)'
              }
            }}
          >
            Delete
          </Button>
        )}
      </Box>

      {label && (
        <Box
          sx={{
            display: "inline-block",
            mt: "6px",
            px: "10px",
            py: "4px",
            fontSize: "11px",
            fontWeight: 600,
            borderRadius: "8px",
            background: colors.badge_bg || "#d1fae5",
            color: colors.badge_text || "#065f46",
          }}
        >
          {label}
        </Box>
      )}
    </Box>
  );
};


export default MyRidesSection;