import { Box, Button, Typography, CircularProgress } from "@mui/material";
import { useAuth } from "../../context/AuthContext.jsx";
import { useState } from "react";
import universityColors from "../../assets/university_colors.json";
import { calculateEstimatedGasCost } from '../../utils/calculateGasCost.js';
import { ENDPOINTS } from "../../utils/api.js";

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
  const API_URL = ENDPOINTS.RIDES;
  
  // Loading states for different actions
  const [loadingActions, setLoadingActions] = useState({});

  const colors =
    universityColors.find(
      (u) => u.university.toLowerCase() === (user?.school || "").toLowerCase()
    )?.colors || {};

  const handleApprove = async (rideId, requesterEmail) => {
    const actionKey = `approve-${rideId}-${requesterEmail}`;
    setLoadingActions(prev => ({ ...prev, [actionKey]: true }));
    try {
      const response = await fetch(`${API_URL}/${rideId}/approve/${requesterEmail}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to approve request');
      
      // Brief delay to show user the action happened
      await new Promise(resolve => setTimeout(resolve, 800));
      
      onFetchRides(); // Refresh rides after approval
    } catch (error) {
      console.error('Error approving request:', error);
    } finally {
      setLoadingActions(prev => ({ ...prev, [actionKey]: false }));
    }
  };

  const handleReject = async (rideId, requesterEmail) => {
    const actionKey = `reject-${rideId}-${requesterEmail}`;
    setLoadingActions(prev => ({ ...prev, [actionKey]: true }));
    try {
      const response = await fetch(`${API_URL}/${rideId}/reject/${requesterEmail}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to reject request');
      
      // Brief delay to show user the action happened
      await new Promise(resolve => setTimeout(resolve, 800));
      
      onFetchRides(); // Refresh rides after rejection
    } catch (error) {
      console.error('Error rejecting request:', error);
    } finally {
      setLoadingActions(prev => ({ ...prev, [actionKey]: false }));
    }
  };

  const handleRemovePassenger = async (rideId, passengerEmail) => {
    const actionKey = `remove-${rideId}-${passengerEmail}`;
    setLoadingActions(prev => ({ ...prev, [actionKey]: true }));
    try {
      const response = await fetch(`${API_URL}/${rideId}/remove/${passengerEmail}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to remove passenger');
      
      // Brief delay to show user the action happened
      await new Promise(resolve => setTimeout(resolve, 800));
      
      onFetchRides(); // Refresh rides after passenger removal
    } catch (error) {
      console.error('Error removing passenger:', error);
    } finally {
      setLoadingActions(prev => ({ ...prev, [actionKey]: false }));
    }
  };

  const handleLeaveRide = async (rideId) => {
    const actionKey = `leave-${rideId}`;
    setLoadingActions(prev => ({ ...prev, [actionKey]: true }));
    try {
      const response = await fetch(`${API_URL}/${rideId}/leave`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to leave ride');
      
      // Brief delay to show user the action happened
      await new Promise(resolve => setTimeout(resolve, 800));
      
      onFetchRides(); // Refresh rides after leaving
    } catch (error) {
      console.error('Error leaving ride:', error);
    } finally {
      setLoadingActions(prev => ({ ...prev, [actionKey]: false }));
    }
  };

  const handleCompleteRide = async (rideId) => {
    const actionKey = `complete-${rideId}`;
    setLoadingActions(prev => ({ ...prev, [actionKey]: true }));
    try {
      const response = await fetch(`${API_URL}/${rideId}/complete`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to mark ride as complete');
      
      // Brief delay to show user the action happened
      await new Promise(resolve => setTimeout(resolve, 800));
      
      onFetchRides(); // Refresh rides after completing
    } catch (error) {
      console.error('Error marking ride as complete:', error);
    } finally {
      setLoadingActions(prev => ({ ...prev, [actionKey]: false }));
    }
  };

  const handleUnmarkComplete = async (rideId) => {
    const actionKey = `unmark-${rideId}`;
    setLoadingActions(prev => ({ ...prev, [actionKey]: true }));
    try {
      const response = await fetch(`${API_URL}/${rideId}/unmark-complete`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to unmark ride');
      }
      
      // Brief delay to show user the action happened
      await new Promise(resolve => setTimeout(resolve, 800));
      
      onFetchRides(); // Refresh rides after unmarking
    } catch (error) {
      console.error('Error unmarking ride:', error);
      alert(error.message || 'Error unmarking ride');
    } finally {
      setLoadingActions(prev => ({ ...prev, [actionKey]: false }));
    }
  };

  const handleDeleteRide = async (rideId) => {
    if (!window.confirm('Are you sure you want to delete this ride? All passengers and pending requests will be notified.')) {
      return;
    }
    const actionKey = `delete-${rideId}`;
    setLoadingActions(prev => ({ ...prev, [actionKey]: true }));
    try {
      const response = await fetch(`${API_URL}/${rideId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to delete ride');
      
      // Brief delay to show user the action happened
      await new Promise(resolve => setTimeout(resolve, 800));
      
      onFetchRides(); // Refresh rides after deletion
    } catch (error) {
      console.error('Error deleting ride:', error);
    } finally {
      setLoadingActions(prev => ({ ...prev, [actionKey]: false }));
    }
  };

  const handleCancelRequest = async (rideId) => {
    const actionKey = `cancel-request-${rideId}`;
    setLoadingActions(prev => ({ ...prev, [actionKey]: true }));
    try {
      // Brief delay to show user the action happened
      await new Promise(resolve => setTimeout(resolve, 800));
      
      onCancelRequest(rideId);
    } catch (error) {
      console.error('Error cancelling request:', error);
    } finally {
      setLoadingActions(prev => ({ ...prev, [actionKey]: false }));
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
                    onComplete={handleCompleteRide}
                    onUnmarkComplete={handleUnmarkComplete}
                    onDelete={handleDeleteRide}
                    loadingActions={loadingActions}
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
                      onClick={() => handleCancelRequest(ride.id)}
                      disabled={loadingActions?.[`cancel-request-${ride.id}`] === true}
                      sx={{
                        mt: 1,
                        color: "#ef4444",
                        borderColor: "#ef4444",
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                        '&:hover': {
                          borderColor: "#dc2626",
                          backgroundColor: "rgba(239, 68, 68, 0.04)"
                        },
                        '&:disabled': {
                          color: '#94a3b8',
                          borderColor: '#cbd5e1',
                          backgroundColor: 'rgba(148, 163, 184, 0.1)'
                        }
                      }}
                      variant="outlined"
                      size="small"
                    >
                      {loadingActions?.[`cancel-request-${ride.id}`] ? (
                        <>
                          <CircularProgress size={14} sx={{ color: '#ef4444' }} />
                          Cancelling...
                        </>
                      ) : (
                        'Cancel Request'
                      )}
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
                    loadingActions={loadingActions}
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
const RideCardCompact = ({ ride, colors, label, onDelete, onComplete, onUnmarkComplete, onApprove, onReject, onRemovePassenger, onLeaveRide, loadingActions, isJoinedRide }) => {
  const seatsLeft = parseInt(ride.seatsAvailable) - (ride.passengers?.length || 0);
  const hasPendingRequests = ride.pendingRequests?.length > 0;
  const { user } = useAuth();
  const isCompleted = ride.status?.status === "completed";
  const isDeleted = ride.status?.status === "delete";

  // Check if unmark button should be shown
  const canUnmark = () => {
    if (!isCompleted) return false;
    
    const departureDateTime = new Date(`${ride.departureDate}T${ride.departureTime}`);
    const now = new Date();
    const timeSinceDeparture = now - departureDateTime;
    const oneHourMs = 60 * 60 * 1000;
    
    // Show button if departure hasn't happened yet OR was within the last hour
    return timeSinceDeparture <= oneHourMs;
  };

  // Helper to check if an action is loading
  const isActionLoading = (actionKey) => {
    return loadingActions?.[actionKey] === true;
  };

  return (
    <Box
      sx={{
        background: colors.card_bg || "#fff",
        border: `1px solid ${colors.border || "#e2e8f0"}`,
        borderRadius: "10px",
        padding: "16px",
        boxShadow: `0 2px 8px ${colors.card_shadow || "rgba(0,0,0,0.06)"}`,
        animation: "fadeInUp 0.3s ease forwards",
        opacity: isCompleted ? 0.7 : isDeleted ? 0.5 : 1,
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
          {isCompleted && (
            <Typography
              sx={{
                color: "#059669",
                fontSize: "12px",
                fontWeight: 600,
                mt: 0.5,
              }}
            >
              ✓ Completed
            </Typography>
          )}
          {isDeleted && (
            <Typography
              sx={{
                color: "#dc2626",
                fontSize: "12px",
                fontWeight: 600,
                mt: 0.5,
              }}
            >
              🗑️ Marked for Deletion
            </Typography>
          )}
        </Box>
        
        {/* Action Buttons - Only show for created rides */}
        {!isJoinedRide && !isDeleted && (
          <Box sx={{ display: 'flex', gap: 1 }}>
            {!isCompleted && onComplete && (
              <Button
                onClick={() => onComplete(ride.id)}
                disabled={isActionLoading(`complete-${ride.id}`)}
                color="primary"
                size="small"
                sx={{
                  minWidth: 'unset',
                  px: 2,
                  py: '6px',
                  color: '#2563eb',
                  border: '1px solid #2563eb',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  '&:hover': {
                    backgroundColor: 'rgba(37, 99, 235, 0.04)'
                  },
                  '&:disabled': {
                    color: '#94a3b8',
                    borderColor: '#cbd5e1',
                    backgroundColor: 'rgba(148, 163, 184, 0.1)'
                  }
                }}
                variant="outlined"
              >
                {isActionLoading(`complete-${ride.id}`) ? (
                  <>
                    <CircularProgress size={16} sx={{ color: '#2563eb' }} />
                    Processing...
                  </>
                ) : (
                  'Mark as Complete'
                )}
              </Button>
            )}
            {isCompleted && canUnmark() && onUnmarkComplete && (
              <Button
                onClick={() => onUnmarkComplete(ride.id)}
                disabled={isActionLoading(`unmark-${ride.id}`)}
                color="secondary"
                size="small"
                sx={{
                  minWidth: 'unset',
                  px: 2,
                  py: '6px',
                  color: '#9333ea',
                  border: '1px solid #9333ea',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  '&:hover': {
                    backgroundColor: 'rgba(147, 51, 234, 0.04)'
                  },
                  '&:disabled': {
                    color: '#94a3b8',
                    borderColor: '#cbd5e1',
                    backgroundColor: 'rgba(148, 163, 184, 0.1)'
                  }
                }}
                variant="outlined"
              >
                {isActionLoading(`unmark-${ride.id}`) ? (
                  <>
                    <CircularProgress size={16} sx={{ color: '#9333ea' }} />
                    Processing...
                  </>
                ) : (
                  'Unmark Complete'
                )}
              </Button>
            )}
            {onDelete && (
              <Button
                onClick={() => onDelete(ride.id)}
                disabled={isActionLoading(`delete-${ride.id}`)}
                color="error"
                size="small"
                sx={{
                  minWidth: 'unset',
                  px: 2,
                  py: '6px',
                  color: '#ef4444',
                  border: '1px solid #ef4444',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  '&:hover': {
                    backgroundColor: 'rgba(239, 68, 68, 0.04)'
                  },
                  '&:disabled': {
                    color: '#94a3b8',
                    borderColor: '#cbd5e1',
                    backgroundColor: 'rgba(148, 163, 184, 0.1)'
                  }
                }}
                variant="outlined"
              >
                {isActionLoading(`delete-${ride.id}`) ? (
                  <>
                    <CircularProgress size={16} sx={{ color: '#ef4444' }} />
                    Processing...
                  </>
                ) : (
                  'Delete'
                )}
              </Button>
            )}
          </Box>
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
                      disabled={isActionLoading(`leave-${ride.id}`)}
                      sx={{
                        minWidth: 'unset',
                        px: 2,
                        py: 0.5,
                        backgroundColor: "#ef4444",
                        color: "white",
                        fontSize: "12px",
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                        '&:hover': {
                          backgroundColor: "#dc2626"
                        },
                        '&:disabled': {
                          backgroundColor: '#94a3b8',
                          color: 'white',
                          opacity: 0.6
                        }
                      }}
                    >
                      {isActionLoading(`leave-${ride.id}`) ? (
                        <>
                          <CircularProgress size={12} sx={{ color: 'white' }} />
                          Leaving...
                        </>
                      ) : (
                        'Leave Ride'
                      )}
                    </Button>
                  )}

                  {/* Show remove option for created rides */}
                  {!isJoinedRide && passenger !== ride.driverEmail && (
                    <Box
                      onClick={() => {
                        if (!isActionLoading(`remove-${ride.id}-${passenger}`) && window.confirm(`Remove passenger ${passenger}?`)) {
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
                        backgroundColor: isActionLoading(`remove-${ride.id}-${passenger}`) ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.1)',
                        cursor: isActionLoading(`remove-${ride.id}-${passenger}`) ? 'not-allowed' : 'pointer',
                        color: '#666',
                        fontSize: '14px',
                        position: 'relative',
                        '&:hover': {
                          backgroundColor: 'rgba(0,0,0,0.2)',
                        }
                      }}
                    >
                      {isActionLoading(`remove-${ride.id}-${passenger}`) ? (
                        <CircularProgress size={16} sx={{ color: '#666' }} />
                      ) : (
                        '×'
                      )}
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
                      disabled={isActionLoading(`approve-${ride.id}-${requester}`)}
                      size="small"
                      sx={{
                        minWidth: 'unset',
                        px: 2,
                        py: 0.5,
                        backgroundColor: "#059669",
                        color: "white",
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                        '&:hover': {
                          backgroundColor: "#047857"
                        },
                        '&:disabled': {
                          backgroundColor: '#94a3b8',
                          color: 'white',
                          opacity: 0.6
                        }
                      }}
                    >
                      {isActionLoading(`approve-${ride.id}-${requester}`) ? (
                        <>
                          <CircularProgress size={12} sx={{ color: 'white' }} />
                          Approving...
                        </>
                      ) : (
                        'Approve'
                      )}
                    </Button>
                    <Button
                      onClick={() => onReject(ride.id, requester)}
                      disabled={isActionLoading(`reject-${ride.id}-${requester}`)}
                      size="small"
                      sx={{
                        minWidth: 'unset',
                        px: 2,
                        py: 0.5,
                        backgroundColor: "#dc2626",
                        color: "white",
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                        '&:hover': {
                          backgroundColor: "#b91c1c"
                        },
                        '&:disabled': {
                          backgroundColor: '#94a3b8',
                          color: 'white',
                          opacity: 0.6
                        }
                      }}
                    >
                      {isActionLoading(`reject-${ride.id}-${requester}`) ? (
                        <>
                          <CircularProgress size={12} sx={{ color: 'white' }} />
                          Rejecting...
                        </>
                      ) : (
                        'Reject'
                      )}
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