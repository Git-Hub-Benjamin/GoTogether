import React from "react";
import { Box, Button, Typography } from "@mui/material";
import { useAuth } from "../../context/AuthContext";
import universityColors from "../../assets/university_colors.json";

const MyRidesSection = ({
  active,
  myCreatedRides,
  myJoinedRides,
  onCreateRide,
}) => {
  const { user } = useAuth();
  const empty = myCreatedRides.length === 0 && myJoinedRides.length === 0;

  const colors =
    universityColors.find(
      (u) => u.university.toLowerCase() === (user?.school || "").toLowerCase()
    )?.colors || {};

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
      }}
    >
      <Box
        sx={{
          background: colors.card_bg || "#fff",
          borderRadius: "12px",
          boxShadow: `0 4px 16px ${colors.card_shadow || "rgba(0,0,0,0.08)"}`,
          padding: { xs: "20px", sm: "24px" },
          position: "relative",
          overflow: "hidden",
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
          🚗 My Rides
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
                  <Box
                    key={ride.id}
                    sx={{
                      background: colors.card_bg || "#fff",
                      border: `1px solid ${colors.border || "#e2e8f0"}`,
                      borderRadius: "10px",
                      padding: "16px",
                      boxShadow: `0 2px 8px ${
                        colors.card_shadow || "rgba(0,0,0,0.06)"
                      }`,
                      transition: "transform 0.2s ease, box-shadow 0.2s ease",
                      opacity: 0,
                      animation: "fadeInUp 0.4s ease forwards",
                      animationDelay: `${index * 0.05}s`,
                      "&:hover": {
                        transform: "translateY(-2px)",
                        boxShadow: `0 4px 12px ${
                          colors.card_shadow || "rgba(0,0,0,0.1)"
                        }`,
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
                      sx={{
                        margin: "0 0 6px",
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
                    <Box
                      sx={{
                        display: "inline-block",
                        background: colors.badge_bg || "#d1fae5",
                        color: colors.badge_text || "#065f46",
                        padding: "4px 10px",
                        borderRadius: "8px",
                        fontSize: "11px",
                        fontWeight: 600,
                        marginTop: "8px",
                      }}
                    >
                      Your Ride
                    </Box>
                  </Box>
                ))}
              </>
            )}

            {myJoinedRides.length > 0 && (
              <>
                <Typography
                  sx={{
                    fontWeight: 600,
                    fontSize: "15px",
                    color: colors.text_primary || "#1e293b",
                    marginTop: myCreatedRides.length > 0 ? "16px" : 0,
                  }}
                >
                  Joined Rides
                </Typography>
                {myJoinedRides.map((ride, index) => (
                  <Box
                    key={ride.id}
                    sx={{
                      background: colors.card_bg || "#fff",
                      border: `1px solid ${colors.border || "#e2e8f0"}`,
                      borderRadius: "10px",
                      padding: "16px",
                      boxShadow: `0 2px 8px ${
                        colors.card_shadow || "rgba(0,0,0,0.06)"
                      }`,
                      transition: "transform 0.2s ease, box-shadow 0.2s ease",
                      opacity: 0,
                      animation: "fadeInUp 0.4s ease forwards",
                      animationDelay: `${
                        (index + myCreatedRides.length) * 0.05
                      }s`,
                      "&:hover": {
                        transform: "translateY(-2px)",
                        boxShadow: `0 4px 12px ${
                          colors.card_shadow || "rgba(0,0,0,0.1)"
                        }`,
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
                      sx={{
                        margin: "0 0 6px",
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
                ))}
              </>
            )}
          </Box>
        )}

        {/* Action Bar */}
        <Box
          sx={{
            background: colors.footer_bg || "#f9fafb",
            borderTop: `1px solid ${colors.border || "#e2e8f0"}`,
            borderRadius: "0 0 12px 12px",
            padding: "14px",
            margin: { xs: "-20px -20px -20px", sm: "-24px -24px -24px" },
            marginTop: "16px",
            display: "flex",
            gap: "10px",
          }}
        >
          <Button
            onClick={onCreateRide}
            sx={{
              flex: 1,
              background: colors.button_primary_bg || "#334155",
              color: colors.button_primary_text || "#fff",
              border: "none",
              borderRadius: "8px",
              padding: "10px 18px",
              fontSize: "13px",
              fontWeight: 600,
              textTransform: "none",
              transition: "transform 0.2s ease, box-shadow 0.2s ease",
              boxShadow: `0 2px 8px ${
                colors.button_shadow || "rgba(51,65,85,0.3)"
              }`,
              "&:hover": {
                transform: "translateY(-2px)",
                boxShadow: `0 4px 12px ${
                  colors.button_shadow || "rgba(51,65,85,0.4)"
                }`,
                background: colors.button_primary_hover || "#1e293b",
              },
              "&:active": {
                transform: "translateY(0)",
              },
            }}
          >
            + Create Ride
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default MyRidesSection;