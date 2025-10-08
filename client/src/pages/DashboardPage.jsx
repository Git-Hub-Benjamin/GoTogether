import React, { useState, useCallback } from "react";
import { Box, Container } from "@mui/material";
import { useAuth } from "../context/AuthContext.jsx";
import CreateRideModal from "../components/CreateRideModal.jsx";
import DashboardHeader from "../components/dashboard/DashboardHeader.jsx";
import FindRidesSection from "../components/dashboard/FindRidesSection.jsx";
import MyRidesSection from "../components/dashboard/MyRidesSection.jsx";

const API_URL = "http://localhost:5000/api/rides";

const DashboardPage = () => {
  const { user, token, logout } = useAuth();

  const [rides, setRides] = useState([]);
  const [myCreatedRides, setMyCreatedRides] = useState([]);
  const [myJoinedRides, setMyJoinedRides] = useState([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [showMyRides, setShowMyRides] = useState(false);

  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  /** Fetch user's rides (created & joined) */
  const fetchMyRides = useCallback(async () => {
    try {
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
  }, [headers]);

  /** Join ride handler */
  const joinRide = async (id) => {
    await fetch(`${API_URL}/${id}/join`, { method: "POST", headers });
    // Refresh current rides view
    const currentRides = await fetch(`${API_URL}/search`, {
      method: "POST",
      headers,
      body: JSON.stringify({ school: user?.school }),
    }).then((res) => res.json());
    setRides(currentRides);
  };

  /** Leave ride handler */
  const leaveRide = async (id) => {
    await fetch(`${API_URL}/${id}/leave`, { method: "POST", headers });
    // Refresh current rides view
    const currentRides = await fetch(`${API_URL}/search`, {
      method: "POST",
      headers,
      body: JSON.stringify({ school: user?.school }),
    }).then((res) => res.json());
    setRides(currentRides);
  };

  /** Handle ride creation */
  const handleRideCreated = () => {
    // Refresh all data
    fetchMyRides();
    setRides([]);
  };

  const primaryColor = user?.colors?.[0] || "#00263A";
  const secondaryColor = user?.colors?.[1] || "#335a6d";

  return (
    <Box
      sx={{
        width: "100%",
        minHeight: "100vh",
        background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
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

      <Container maxWidth="md" sx={{ py: 5, position: "relative" }}>
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
            onCreateRide={() => setModalOpen(true)}
          />
        </Box>
      </Container>

      <Box
        component="footer"
        sx={{
          color: "rgba(255, 255, 255, 0.7)",
          fontSize: "13px",
          padding: "20px",
          textAlign: "center",
          mt: "auto",
        }}
      >
        © 2025 GoTogether
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