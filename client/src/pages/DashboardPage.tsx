// client/src/pages/DashboardPage.tsx
import React, { useEffect, useState, useCallback } from "react";
import { Box, Button, Container, Paper, Typography } from "@mui/material";
import { useAuth } from "../context/AuthContext.tsx";
import CreateRideModal from "../components/CreateRideModal.tsx";
import RideFilters from "../components/rides/RideFilters.tsx";
import MyRidesSection from "../components/rides/MyRidesSection.tsx";
import RideList from "../components/rides/RideList.tsx";

const API_URL = "http://localhost:5000/api/rides";
const NEARBY_URL = "http://localhost:5000/api/nearby";

export interface Ride {
  id: string;
  driverEmail: string;
  school: string;
  from: string;
  destination: string;
  departureDate: string;
  departureTime: string;
  seatsAvailable: number;
  notes?: string;
  passengers: string[];
}

export interface Locations {
  from: string[];
  to: string[];
}

const DashboardPage: React.FC = () => {
  const { user, token, logout } = useAuth();

  const [rides, setRides] = useState<Ride[]>([]);
  const [filteredRides, setFilteredRides] = useState<Ride[]>([]);
  const [locations, setLocations] = useState<Locations>({ from: [], to: [] });
  const [myCreatedRides, setMyCreatedRides] = useState<Ride[]>([]);
  const [myJoinedRides, setMyJoinedRides] = useState<Ride[]>([]);
  const [fromFilter, setFromFilter] = useState("");
  const [toFilter, setToFilter] = useState("");
  const [distance, setDistance] = useState(100); // miles
  const [modalOpen, setModalOpen] = useState(false);
  const [showMyRides, setShowMyRides] = useState(false);

  const schoolName = user?.school || "";

  /** ---------- Fetch Rides ---------- */
  const fetchRides = useCallback(async () => {
    const res = await fetch(`${API_URL}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setRides(data);
    setFilteredRides(data);
  }, [token]);

  /** ---------- Fetch Locations ---------- */
  const fetchLocations = useCallback(async () => {
    const res = await fetch(`${API_URL}/locations`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setLocations(data);
  }, [token]);

  /** ---------- Fetch Nearby Cities ---------- */
  const fetchNearby = useCallback(
    async (miles: number) => {
      if (!user?.school) return;
      try {
        const encodedName = encodeURIComponent(user.school);
        const res = await fetch(`${NEARBY_URL}/${encodedName}?miles=${miles}`);
        const data = await res.json();

        if (Array.isArray(data.nearbyCities)) {
          setLocations({
            from: [user.school],
            to: data.nearbyCities.map((c: any) => `${c.city}, ${c.state}`),
          });
        }
      } catch (err) {
        console.error("Error fetching nearby cities:", err);
      }
    },
    [user]
  );

  /** ---------- Initial Loads + Regular Refresh ---------- */
  useEffect(() => {
    fetchRides();
    fetchLocations();
    const interval = setInterval(fetchRides, 60_000); // ✅ one-minute refresh
    return () => clearInterval(interval);
  }, [fetchRides, fetchLocations]);

  /** ---------- Dynamic filters ---------- */
  useEffect(() => {
    let list = [...rides];
    if (fromFilter) list = list.filter((r) => r.from === fromFilter);
    if (toFilter) list = list.filter((r) => r.destination === toFilter);
    setFilteredRides(list);
  }, [rides, fromFilter, toFilter]);

  /** ---------- My rides logic ---------- */
  const fetchMyRides = useCallback(async () => {
    const headers = { Authorization: `Bearer ${token}` };
    const [createdRes, joinedRes] = await Promise.all([
      fetch(`${API_URL}/mine/created`, { headers }),
      fetch(`${API_URL}/mine/joined`, { headers }),
    ]);
    setMyCreatedRides(await createdRes.json());
    setMyJoinedRides(await joinedRes.json());
  }, [token]);

  useEffect(() => {
    if (showMyRides) fetchMyRides();
  }, [showMyRides, fetchMyRides]);

  /** ---------- Distance change behavior ---------- */
  useEffect(() => {
    const handle = setTimeout(() => {
      if (distance !== 100) {
        fetchNearby(distance);
        setFromFilter(user?.school || "");
      } else {
        fetchLocations();
      }
    }, 500); // ✅ Debounce 500 ms after user stops sliding

    return () => clearTimeout(handle);
  }, [distance, fetchNearby, fetchLocations, user]);

  /** ---------- Ride join/leave ---------- */
  const joinRide = async (id: string) => {
    await fetch(`${API_URL}/${id}/join`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchRides();
  };

  const leaveRide = async (id: string) => {
    await fetch(`${API_URL}/${id}/leave`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchRides();
  };

  const primaryColor = user?.colors?.[0] || "#00263A";
  const secondaryColor = user?.colors?.[1] || "#335a6d";

  return (
    <Box
      sx={{
        width: "100%",
        minHeight: "100vh",
        background: `linear-gradient(120deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
        py: 6,
        transition: "background 1s ease",
      }}
    >
      <Container maxWidth="md">
        {/* ---------- HEADER ---------- */}
        <Paper
          sx={{
            p: 3,
            mb: 3,
            borderRadius: 3,
            backgroundColor: "#ffffffee",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            boxShadow: 3,
          }}
        >
          <Box>
            <Typography variant="h5" fontWeight={600} color="#00263A">
              GoTogether – {schoolName}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Logged in as {user?.email}
            </Typography>
          </Box>

          <Box sx={{ display: "flex", gap: 1 }}>
            <Button
              variant={showMyRides ? "contained" : "outlined"}
              color="primary"
              onClick={() => setShowMyRides(!showMyRides)}
              sx={{ borderRadius: 2, textTransform: "none" }}
            >
              My Rides
            </Button>
            <Button
              variant="outlined"
              color="error"
              onClick={logout}
              sx={{ borderRadius: 2, textTransform: "none" }}
            >
              Logout
            </Button>
          </Box>
        </Paper>

        {/* ---------- MAIN PANEL ---------- */}
        <Paper
          sx={{ p: 3, borderRadius: 3, boxShadow: 2, backgroundColor: "#fff" }}
        >
          <RideFilters
            fromFilter={fromFilter}
            toFilter={toFilter}
            setFromFilter={setFromFilter}
            setToFilter={setToFilter}
            locations={locations}
            setModalOpen={setModalOpen}
            distance={distance}
            setDistance={setDistance}
            lockedFrom={distance !== 100}
            schoolName={schoolName}
          />

          {showMyRides && (
            <MyRidesSection
              myCreatedRides={myCreatedRides}
              myJoinedRides={myJoinedRides}
            />
          )}

          <RideList
            rides={filteredRides}
            userEmail={user?.email || ""}
            joinRide={joinRide}
            leaveRide={leaveRide}
          />
        </Paper>
      </Container>

      <CreateRideModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onRideCreated={fetchRides}
      />
    </Box>
  );
};

export default DashboardPage;
