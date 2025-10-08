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

  const joinRide = async (id) => {
    await fetch(`${API_URL}/${id}/join`, { method: "POST", headers });
    const currentRides = await fetch(`${API_URL}/search`, {
      method: "POST",
      headers,
      body: JSON.stringify({ school: user?.school }),
    }).then((res) => res.json());
    setRides(currentRides);
  };

  const leaveRide = async (id) => {
    await fetch(`${API_URL}/${id}/leave`, { method: "POST", headers });
    const currentRides = await fetch(`${API_URL}/search`, {
      method: "POST",
      headers,
      body: JSON.stringify({ school: user?.school }),
    }).then((res) => res.json());
    setRides(currentRides);
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
          color: colors.footer_text,
          fontSize: "13px",
          padding: "20px",
          textAlign: "center",
          mt: "auto",
          borderTop: "1px solid rgba(255,255,255,0.15)",
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