import React from "react";
import { Box, Button, Typography } from "@mui/material";

const MyRidesSection = ({
  active,
  myCreatedRides,
  myJoinedRides,
  onCreateRide,
}) => {
  const empty = myCreatedRides.length === 0 && myJoinedRides.length === 0;

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
          background: "#fff",
          borderRadius: "14px",
          boxShadow: "0 6px 20px rgba(0, 0, 0, 0.15)",
          padding: "26px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <Typography
          variant="h6"
          sx={{
            color: "#00263a",
            margin: "0 0 18px",
            fontSize: "20px",
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
              color: "#9ca3af",
              fontSize: "15px",
            }}
          >
            You haven't joined or created any rides yet.
          </Box>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {myCreatedRides.length > 0 && (
              <>
                <Typography sx={{ fontWeight: 600, fontSize: "16px" }}>
                  Created Rides
                </Typography>
                {myCreatedRides.map((ride, index) => (
                  <Box
                    key={ride.id}
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
                      sx={{
                        color: "#6b7280",
                        fontSize: "13px",
                      }}
                    >
                      📅 {ride.departureDate} • 🕓 {ride.departureTime}
                    </Typography>
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
                  </Box>
                ))}
              </>
            )}

            {myJoinedRides.length > 0 && (
              <>
                <Typography
                  sx={{
                    fontWeight: 600,
                    fontSize: "16px",
                    marginTop: myCreatedRides.length > 0 ? "20px" : 0,
                  }}
                >
                  Joined Rides
                </Typography>
                {myJoinedRides.map((ride, index) => (
                  <Box
                    key={ride.id}
                    sx={{
                      background: "linear-gradient(145deg, #ffffff, #f9fafb)",
                      borderRadius: "12px",
                      padding: "18px",
                      boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
                      transition: "transform 0.2s ease, box-shadow 0.2s ease",
                      opacity: 0,
                      animation: "fadeInUp 0.4s ease forwards",
                      animationDelay: `${
                        (index + myCreatedRides.length) * 0.05
                      }s`,
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
                      sx={{
                        color: "#6b7280",
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
            background: "#f9fafb",
            borderTop: "1px solid #e5e7eb",
            borderRadius: "0 0 14px 14px",
            padding: "16px",
            margin: "-26px -26px -26px",
            marginTop: "20px",
            display: "flex",
            gap: "12px",
          }}
        >
          <Button
            onClick={onCreateRide}
            sx={{
              flex: 1,
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
            + Create Ride
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default MyRidesSection;