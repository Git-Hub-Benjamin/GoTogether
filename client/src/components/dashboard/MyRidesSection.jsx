import React from "react";
import { Box, Button, Typography } from "@mui/material";
import { useAuth } from "../../context/AuthContext";
import universityColors from "../../assets/university_colors.json";
import { calculateEstimatedGasCost } from "../../utils/calculateGasCost.js";

const MyRidesSection = ({ 
  active, 
  myCreatedRides, 
  myJoinedRides, 
  myRequestedRides,
  onCreateRide,
  onCancelRequest,
  onFetchRides
}) => {
  const { user, token } = useAuth();
  const empty = myCreatedRides.length === 0 && myJoinedRides.length === 0 && myRequestedRides.length === 0;
  const API_URL = "http://localhost:5000/api/rides";

  const colors =
    universityColors.find(
      (u) => u.university.toLowerCase() === (user?.school || "").toLowerCase()
    )?.colors || {};

  const handleApprove = async (rideId, requesterEmail) => {
    try {
      const response = await fetch(`${API_URL}/${rideId}/approve/${requesterEmail}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to approve request');
      onFetchRides(); // Refresh rides after approval
    } catch (error) {
      console.error('Error approving request:', error);
    }
  };

  const handleReject = async (rideId, requesterEmail) => {
    try {
      const response = await fetch(`${API_URL}/${rideId}/reject/${requesterEmail}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to reject request');
      onFetchRides(); // Refresh rides after rejection
    } catch (error) {
      console.error('Error rejecting request:', error);
    }
  };

  const handleRemovePassenger = async (rideId, passengerEmail) => {
    try {
      const response = await fetch(`${API_URL}/${rideId}/remove/${passengerEmail}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to remove passenger');
      onFetchRides(); // Refresh rides after passenger removal
    } catch (error) {
      console.error('Error removing passenger:', error);
    }
  };

  const handleLeaveRide = async (rideId) => {
    try {
      const response = await fetch(`${API_URL}/${rideId}/leave`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to leave ride');
      onFetchRides(); // Refresh rides after leaving
    } catch (error) {
      console.error('Error leaving ride:', error);
    }
  };

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
                  <RideCardCompact 
                    key={ride.id} 
                    ride={ride} 
                    colors={colors} 
                    index={index} 
                    label="Your Ride"
                    onApprove={handleApprove}
                    onReject={handleReject}
                    onRemovePassenger={handleRemovePassenger}
                    isJoinedRide={false}
                    user={user}
                  />
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
                    onLeaveRide={handleLeaveRide}
                    isJoinedRide={true}
                    user={user}
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
const RideCardCompact = ({ ride, colors, label, onDelete, onApprove, onReject, onRemovePassenger, onLeaveRide, isJoinedRide }) => {
  const seatsLeft = parseInt(ride.seatsAvailable) - (ride.passengers?.length || 0);
  const hasPendingRequests = ride.pendingRequests?.length > 0;
  const { user } = useAuth();

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
      {/* Header with Route and Actions */}
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
            {ride.departureDate} at {ride.departureTime}
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

      {/* Ride Details */}
      <Box sx={{ mt: 2 }}>
        {/* Distance, Gas Cost, and Created Info */}
        <Typography
          sx={{
            color: colors.text_secondary || "#64748b",
            fontSize: "13px",
            mb: 1,
          }}
        >
          <strong>Distance:</strong> {ride.distance} miles • <strong>Est. Gas:</strong> ~${calculateEstimatedGasCost(ride.distance, ride.passengers.length)}/person
        </Typography>
        <Typography
          sx={{
            color: colors.text_secondary || "#64748b",
            fontSize: "13px",
            mb: 1,
          }}
        >
          <strong>Created:</strong> {new Date(ride.createdAt).toLocaleDateString()}
        </Typography>

        {/* Seats Info */}
        <Typography
          sx={{
            color: colors.text_secondary || "#64748b",
            fontSize: "13px",
            mb: 1,
          }}
        >
          <strong>Seats:</strong> {seatsLeft} available of {ride.seatsAvailable}
        </Typography>

        {/* Notes if any */}
        {ride.notes && (
          <Typography
            sx={{
              color: colors.text_secondary || "#64748b",
              fontSize: "13px",
              mb: 1,
              fontStyle: "italic",
            }}
          >
            <strong>Note:</strong> {ride.notes}
          </Typography>
        )}

        {/* Current Passengers */}
        {ride.passengers?.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Typography
              sx={{
                color: colors.text_primary || "#1e293b",
                fontSize: "14px",
                fontWeight: 600,
                mb: 1,
              }}
            >
              Current Passengers:
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {ride.passengers.map(passenger => (
                <Box
                  key={passenger}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    px: 2,
                    py: 1,
                    backgroundColor: colors.badge_bg || "#d1fae5",
                    borderRadius: "6px",
                  }}
                >
                  <Typography
                    sx={{
                      color: colors.badge_text || "#065f46",
                      fontSize: "13px",
                    }}
                  >
                    {passenger}
                  </Typography>
                  
                  {/* Show leave button for joined rides */}
                  {isJoinedRide && passenger === user?.email && (
                    <Button
                      onClick={() => onLeaveRide(ride.id)}
                      sx={{
                        minWidth: 'unset',
                        px: 2,
                        py: 0.5,
                        backgroundColor: "#ef4444",
                        color: "white",
                        fontSize: "12px",
                        '&:hover': {
                          backgroundColor: "#dc2626"
                        }
                      }}
                    >
                      Leave Ride
                    </Button>
                  )}

                  {/* Show remove option for created rides */}
                  {!isJoinedRide && passenger !== ride.driverEmail && (
                    <Box
                      onClick={() => {
                        if (window.confirm(`Remove passenger ${passenger}?`)) {
                          onRemovePassenger(ride.id, passenger);
                        }
                      }}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        backgroundColor: 'rgba(0,0,0,0.1)',
                        cursor: 'pointer',
                        color: '#666',
                        fontSize: '14px',
                        '&:hover': {
                          backgroundColor: 'rgba(0,0,0,0.2)',
                        }
                      }}
                    >
                      ×
                    </Box>
                  )}
                </Box>
              ))}
            </Box>
          </Box>
        )}

        {/* Pending Requests */}
        {hasPendingRequests && (
          <Box sx={{ mt: 2 }}>
            <Typography
              sx={{
                color: colors.text_primary || "#1e293b",
                fontSize: "14px",
                fontWeight: 600,
                mb: 1,
              }}
            >
              Pending Requests:
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {ride.pendingRequests.map(requester => (
                <Box
                  key={requester}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    px: 2,
                    py: 1,
                    backgroundColor: "#fef3c7",
                    borderRadius: "6px",
                  }}
                >
                  <Typography sx={{ flex: 1, fontSize: "13px", color: "#92400e" }}>
                    {requester}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      onClick={() => onApprove(ride.id, requester)}
                      size="small"
                      sx={{
                        minWidth: 'unset',
                        px: 2,
                        py: 0.5,
                        backgroundColor: "#059669",
                        color: "white",
                        '&:hover': {
                          backgroundColor: "#047857"
                        }
                      }}
                    >
                      Approve
                    </Button>
                    <Button
                      onClick={() => onReject(ride.id, requester)}
                      size="small"
                      sx={{
                        minWidth: 'unset',
                        px: 2,
                        py: 0.5,
                        backgroundColor: "#dc2626",
                        color: "white",
                        '&:hover': {
                          backgroundColor: "#b91c1c"
                        }
                      }}
                    >
                      Reject
                    </Button>
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>
        )}
      </Box>

      {label && (
        <Box
          sx={{
            display: "inline-block",
            mt: 2,
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