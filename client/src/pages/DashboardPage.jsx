import React, { useState, useCallback, useMemo, useEffect } from "react";
import { Box, Container } from "@mui/material";
import { useAuth } from "../context/AuthContext.jsx";
import CreateRideModal from "../components/CreateRideModal.jsx";
import DashboardHeader from "../components/dashboard/DashboardHeader.jsx";
import FindRidesSection from "../components/dashboard/FindRidesSection.jsx";
import MyRidesSection from "../components/dashboard/MyRidesSection.jsx";
import universityColors from "../assets/university_colors.json";

const API_URL = "http://localhost:5000/api/rides";

const DashboardPage = () => {
  const { user, token, logout } = useAuth();

  const [rides, setRides] = useState([]);
  const [myCreatedRides, setMyCreatedRides] = useState([]);
  const [myJoinedRides, setMyJoinedRides] = useState([]);
  const [myRequestedRides, setMyRequestedRides] = useState([]);
  const [alert, setAlert] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [showMyRides, setShowMyRides] = useState(false);

  const headers = useMemo(
    () => ({
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    }),
    [token]
  );

  useEffect(() => {
    const fetchInitialRides = async () => {
      if (!user?.school) return;
      try {
        const res = await fetch(`${API_URL}/search`, {
          method: "POST",
          headers,
          body: JSON.stringify({ school: user.school }),
        });
        const data = await res.json();
        setRides(data);
      } catch (err) {
        console.error("Error fetching initial rides:", err);
      }
    };

    fetchInitialRides();
  }, [user?.school, headers]);
  // =========================================================

  const fetchMyRides = useCallback(async () => {
    try {
      // Get all rides and filter locally for requested ones
      const allRides = await fetch(`${API_URL}/search`, {
        method: "POST",
        headers,
        body: JSON.stringify({ school: user?.school }),
      }).then(res => res.json());

      const requested = allRides.filter(ride => ride.pendingRequests?.includes(user?.email));
      setMyRequestedRides(requested);

      const [createdRes, joinedRes] = await Promise.all([
        fetch(`${API_URL}/mine/created`, { headers }),
        fetch(`${API_URL}/mine/joined`, { headers }),
      ]);
      const created = await createdRes.json();
      const joined = await joinedRes.json();
      setMyCreatedRides(created);
      setMyJoinedRides(joined);
    } catch (err) {
      console.error("Error fetching user rides:", err);
    }
  }, [headers, user?.email, user?.school]);

  const joinRide = async (id) => {
    try {
      const response = await fetch(`${API_URL}/${id}/request`, { 
        method: "POST", 
        headers 
      });
      const result = await response.json();
      if (result.error) {
        console.error("Error requesting to join:", result.error);
        setAlert({
          type: 'error',
          message: result.error
        });
        return;
      }
      // Refresh the rides list
      const currentRides = await fetch(`${API_URL}/search`, {
        method: "POST",
        headers,
        body: JSON.stringify({ school: user?.school }),
      }).then((res) => res.json());
      setRides(currentRides);
      await fetchMyRides(); // Refresh my rides to show the request
    } catch (err) {
      console.error("Error requesting to join ride:", err);
      setAlert({
        type: 'error',
        message: 'Failed to request joining the ride'
      });
    }
  };

  const leaveRide = async (id) => {
    await fetch(`${API_URL}/${id}/leave`, { method: "POST", headers });
    const currentRides = await fetch(`${API_URL}/search`, {
      method: "POST",
      headers,
      body: JSON.stringify({ school: user?.school }),
    }).then((res) => res.json());
    setRides(currentRides);
    fetchMyRides();
  };

  const cancelRequest = async (id) => {
    try {
      const response = await fetch(`${API_URL}/${id}/cancel-request`, { 
        method: "POST", 
        headers 
      });
      const result = await response.json();
      
      if (result.error) {
        setAlert({
          type: 'warning',
          message: result.error
        });
        return;
      }
      
      // Refresh rides lists
      const currentRides = await fetch(`${API_URL}/search`, {
        method: "POST",
        headers,
        body: JSON.stringify({ school: user?.school }),
      }).then((res) => res.json());
      setRides(currentRides);
      await fetchMyRides();
    } catch (err) {
      console.error("Error canceling request:", err);
      setAlert({
        type: 'error',
        message: 'Failed to cancel the request'
      });
    }
  };

  const deleteRide = async (id) => {
    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
        headers
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message);
      }
      
      // Refresh rides lists after deletion
      await fetchMyRides();
      const searchResults = await fetch(`${API_URL}/search`, {
        method: "POST",
        headers,
        body: JSON.stringify({ school: user?.school }),
      }).then(res => res.json());
      setRides(searchResults);
      
      setAlert({
        type: 'warning',
        message: 'Ride deleted successfully'
      });
    } catch (err) {
      console.error('Error deleting ride:', err);
      setAlert({
        type: 'error',
        message: err.message || 'Failed to delete ride'
      });
    }
  };

  const handleRideCreated = () => {
    fetchMyRides();
    setRides([]);
  };

  const colors = useMemo(() => {
    const universityTheme = universityColors.find(
      (u) => u.university.toLowerCase() === (user?.school || "").toLowerCase()
    );
    return (
      universityTheme?.colors || {
        bg_primary: "#0F172A",
        bg_secondary: "#1E293B",
        text_primary: "#FFFFFF",
        footer_text: "rgba(255,255,255,0.6)",
      }
    );
  }, [user?.school]);

  return (
    <Box
      sx={{
        width: "100%",
        minHeight: "100vh",
        background: `linear-gradient(135deg, ${colors.bg_primary}, ${colors.bg_secondary})`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        overflow: "hidden",
        transition: "background 1s ease",
      }}
    >
      <DashboardHeader
        schoolName={user?.school || ""}
        userEmail={user?.email}
        showMyRides={showMyRides}
        onToggleMyRides={() => {
          setShowMyRides(!showMyRides);
          if (!showMyRides) fetchMyRides();
        }}
        onLogout={logout}
      />

      <Container
        maxWidth={false}
        sx={{
          py: 4,
          px: { xs: 2, sm: 3, md: 4 },
          position: "relative",
          color: colors.text_primary || "#0F172A",
          maxWidth: "1900px",
        }}
      >
        {alert && (
          <Box
            sx={{
              position: 'fixed',
              top: 20,
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 1000,
              backgroundColor: alert.type === 'warning' ? '#fef3c7' : '#fee2e2',
              color: alert.type === 'warning' ? '#92400e' : '#dc2626',
              padding: '12px 24px',
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <span>{alert.message}</span>
            <Box
              component="button"
              onClick={() => setAlert(null)}
              sx={{
                background: 'none',
                border: 'none',
                padding: '4px',
                cursor: 'pointer',
                color: 'inherit',
                opacity: 0.7,
                '&:hover': { opacity: 1 }
              }}
            >
              ✕
            </Box>
          </Box>
        )}
        <Box sx={{ position: "relative", width: "100%" }}>
          <FindRidesSection
            active={!showMyRides}
            onCreateRide={() => setModalOpen(true)}
            rides={rides}
            userEmail={user?.email || ""}
            joinRide={joinRide}
            leaveRide={leaveRide}
            onSearch={setRides}
          />

          <MyRidesSection
            active={showMyRides}
            myCreatedRides={myCreatedRides}
            myJoinedRides={myJoinedRides}
            myRequestedRides={myRequestedRides}
            onCreateRide={() => setModalOpen(true)}
            onCancelRequest={cancelRequest}
            onDelete={deleteRide}
            onFetchRides={fetchMyRides}
          />
        </Box>
      </Container>

      <Box
        component="footer"
        sx={{
          color: colors.footer_text,
          fontSize: "13px",
          padding: "20px",
          textAlign: "center",
          mt: "auto",
          borderTop: "1px solid rgba(255,255,255,0.15)",
        }}
      >
        © 2025 GoTogether
        <span style={{ marginLeft: 8, opacity: 0.8 }}>v1.0</span>
      </Box>

      <CreateRideModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onRideCreated={handleRideCreated}
        school={user?.school || ""}
        state={user?.state || ""}
      />
    </Box>
  );
};

export default DashboardPage;