import React, { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { Box, Container } from "@mui/material";
import { useAuth } from "../context/AuthContext.jsx";
import CreateRideModal from "../components/CreateRideModal.jsx";
import DashboardHeader from "../components/dashboard/DashboardHeader.jsx";
import FindRidesSection from "../components/dashboard/FindRidesSection.jsx";
import MyRidesSection from "../components/dashboard/MyRidesSection.jsx";
import universityColors from "../assets/university_colors.json";
import { ENDPOINTS } from "../utils/api.js";

const API_URL = ENDPOINTS.RIDES;

const DashboardPage = () => {
  const { user, token, logout } = useAuth();

  const [rides, setRides] = useState([]);
  const [myCreatedRides, setMyCreatedRides] = useState([]);
  const [myJoinedRides, setMyJoinedRides] = useState([]);
  const [myRequestedRides, setMyRequestedRides] = useState([]);
  const [alert, setAlert] = useState(null);
  const [loadingRideIds, setLoadingRideIds] = useState({}); // Track per ride ID
  const [showMyRides, setShowMyRides] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false); // Loading state for search button
  
  // Current filters state for refreshing search
  const [currentFilters, setCurrentFilters] = useState({
    from: "",
    to: "",
    radius: 100,
    date: "",
  });
  
  // Debounce timer refs
  const tabToggleTimeoutRef = useRef(null);
  const searchTriggerRef = useRef(null); // Ref to trigger search programmatically
  const initialSearchDone = useRef(false); // Track if initial search has run

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
    setLoadingRideIds(prev => ({ ...prev, [id]: true }));
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
        setLoadingRideIds(prev => ({ ...prev, [id]: false }));
        return;
      }
      
      // Brief delay to show user the action happened
      await new Promise(resolve => setTimeout(resolve, 800));
      
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
    } finally {
      setLoadingRideIds(prev => ({ ...prev, [id]: false }));
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
    await fetchMyRides();
  };

  const cancelRequest = async (id) => {
    setLoadingRideIds(prev => ({ ...prev, [`cancel-${id}`]: true }));
    try {
      const response = await fetch(`${API_URL}/${id}/cancel-request`, { 
        method: "POST", 
        headers 
      });
      const result = await response.json();
      if (result.error) {
        console.error("Error cancelling request:", result.error);
        setAlert({
          type: 'error',
          message: result.error
        });
        setLoadingRideIds(prev => ({ ...prev, [`cancel-${id}`]: false }));
        return;
      }
      
      // Brief delay to show user the action happened
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Refresh the rides list and my rides
      const currentRides = await fetch(`${API_URL}/search`, {
        method: "POST",
        headers,
        body: JSON.stringify({ school: user?.school }),
      }).then((res) => res.json());
      setRides(currentRides);
      await fetchMyRides(); // Refresh my rides
    } catch (err) {
      console.error("Error cancelling request:", err);
      setAlert({
        type: 'error',
        message: 'Failed to cancel the request'
      });
    } finally {
      setLoadingRideIds(prev => ({ ...prev, [`cancel-${id}`]: false }));
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

  const handleTabToggle = useCallback(() => {
    // Update UI immediately for fast switching
    setShowMyRides(prev => !prev);
    
    // Clear existing timeout
    if (tabToggleTimeoutRef.current) {
      clearTimeout(tabToggleTimeoutRef.current);
    }
    
    // Set new timeout - only fetch after 500ms of settling
    tabToggleTimeoutRef.current = setTimeout(() => {
      setShowMyRides(prev => {
        // When switching TO Find Rides, trigger search programmatically
        if (!prev) {
          // Trigger search button click after a tiny delay to ensure state is set
          setTimeout(() => {
            if (searchTriggerRef.current) {
              searchTriggerRef.current();
            }
          }, 50);
        } else {
          // When switching TO My Rides, fetch my rides
          fetchMyRides();
        }
        return prev;
      });
    }, 500);
  }, [fetchMyRides]);

  // Unified search function that will be triggered by search button or programmatically
  const performSearch = useCallback(async () => {
    setSearchLoading(true);
    try {
      // Clean up campus suffix from filter (client-side only)
      const cleanedFilters = {
        from: currentFilters.from.includes(" (Campus)")
          ? currentFilters.from.replace(" (Campus)", "").trim()
          : currentFilters.from,
        to: currentFilters.to.includes(" (Campus)")
          ? currentFilters.to.replace(" (Campus)", "").trim()
          : currentFilters.to,
        radius: currentFilters.radius,
        date: currentFilters.date,
      };

      const res = await fetch(`${API_URL}/search`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          from: cleanedFilters.from,
          to: cleanedFilters.to,
          radius: cleanedFilters.radius,
          school: user?.school,
          date: cleanedFilters.date,
        }),
      });
      const data = await res.json();
      setRides(Array.isArray(data) ? data : []);
      
      // Add delay for UX feedback
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (err) {
      console.error("Error searching rides:", err);
    } finally {
      setSearchLoading(false);
    }
  }, [currentFilters, headers, user?.school]);

  // Set ref so search can be triggered programmatically
  useEffect(() => {
    searchTriggerRef.current = performSearch;
  }, [performSearch]);

  // Initial search on page load (only once)
  useEffect(() => {
    if (user?.school && !showMyRides && !initialSearchDone.current) {
      initialSearchDone.current = true;
      performSearch();
    }
  }, [user?.school, showMyRides, performSearch]);

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
        onToggleMyRides={handleTabToggle}
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
            loadingRideIds={loadingRideIds}
            onCancelRequest={cancelRequest}
            onFiltersChange={setCurrentFilters}
            searchLoading={searchLoading}
            onPerformSearch={performSearch}
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