import {
  Box,
  Button,
  TextField,
  Typography,
  Autocomplete,
} from "@mui/material";
import { useState, useMemo } from "react";
import { useAuth } from "../../context/AuthContext";
import RideCard from "../rides/RideCard";
import usCities from "../../assets/us_cities.json";

const API_URL = "http://localhost:5000/api/rides";

const FindRidesSection = ({
  active,
  onCreateRide,
  rides,
  userEmail,
  joinRide,
  leaveRide,
  onSearch,
}) => {
  const { user, token } = useAuth();
  const schoolName = user?.school || "";

  const [fromFilter, setFromFilter] = useState("");
  const [toFilter, setToFilter] = useState("");
  const [distance, setDistance] = useState(100);

  // create city list ["City, State"]
  const cityList = useMemo(
    () => usCities.map((c) => `${c.city}, ${c.state_name}`),
    []
  );

  const locationFiltersActive =
    fromFilter.trim().length > 0 || toFilter.trim().length > 0;
  const radiusActive = distance !== 100;

  // local filter
  const filterCities = (input) => {
    if (!input) return cityList.slice(0, 10);
    const lower = input.toLowerCase();
    return cityList
      .filter((item) => item.toLowerCase().includes(lower))
      .slice(0, 10);
  };

  // "From" options with school rules
  const getFromOptions = (input) => {
    let options = filterCities(input);
    const campusOption = `${schoolName} (Campus)`;

    if (!input && !toFilter) options = [campusOption, ...options].slice(0, 11);
    else if (toFilter === campusOption)
      options = options.filter((item) => item !== campusOption);
    else if (toFilter && toFilter !== campusOption) options = [campusOption];
    else {
      if (!options.includes(campusOption)) options.unshift(campusOption);
      options = options.slice(0, 11);
    }
    return options;
  };

  // "To" options with school rules
  const getToOptions = (input) => {
    let options = filterCities(input);
    const campusOption = `${schoolName} (Campus)`;

    if (!input && !fromFilter) options = [campusOption, ...options].slice(0, 11);
    else if (fromFilter === campusOption)
      options = options.filter((item) => item !== campusOption);
    else if (fromFilter && fromFilter !== campusOption) options = [campusOption];
    else {
      if (!options.includes(campusOption)) options.unshift(campusOption);
      options = options.slice(0, 11);
    }
    return options;
  };

  // handle search
  const handleSearch = async () => {
    const normalize = (loc) => {
      if (!loc) return "";
      const trimmed = loc.trim();
      return trimmed.endsWith("(Campus)") ? schoolName : trimmed;
    };

    try {
      const res = await fetch(`${API_URL}/search`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: normalize(fromFilter),
          to: normalize(toFilter),
          radius: distance,
          school: schoolName,
        }),
      });

      if (!res.ok) throw new Error("Failed to fetch rides.");
      const data = await res.json();
      onSearch(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching rides:", err);
      onSearch([]);
    }
  };

  const clearFilters = () => {
    setFromFilter("");
    setToFilter("");
    setDistance(100);
  };

  // handle distance change (disables and resets From/To)
  const handleDistanceChange = (e) => {
    const value = Number(e.target.value);

    // if distance moves off default, reset From/To
    if (value !== 100 && (fromFilter || toFilter)) {
      setFromFilter("");
      setToFilter("");
    }
    setDistance(value);
  };

  return (
    <Box
      sx={{
        position: active ? "relative" : "absolute",
        width: "100%",
        top: 0,
        left: 0,
        opacity: active ? 1 : 0,
        transform: active ? "translateX(0)" : "translateX(-100%)",
        transition:
          "transform 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.4s ease",
        pointerEvents: active ? "all" : "none",
      }}
    >
      {/* ====== Filter Panel ====== */}
      <Box
        sx={{
          background: "#fff",
          borderRadius: "14px",
          boxShadow: "0 6px 20px rgba(0, 0, 0, 0.15)",
          padding: "26px",
          marginBottom: "24px",
          position: "relative",
        }}
      >
        <Typography
          variant="h6"
          sx={{
            color: "#00263a",
            marginBottom: "18px",
            fontSize: "20px",
            fontWeight: 600,
          }}
        >
          🔍 Find a Ride
        </Typography>

        {/* ==== From ==== */}
        <Box sx={{ marginBottom: "16px" }}>
          <Typography
            component="label"
            sx={{
              fontWeight: 600,
              color: "#00263a",
              display: "block",
              marginBottom: "6px",
              fontSize: "14px",
            }}
          >
            From
          </Typography>
          <Autocomplete
            freeSolo
            disabled={radiusActive} // disable when slider active
            filterOptions={(x) => x}
            options={getFromOptions(fromFilter)}
            inputValue={fromFilter}
            onInputChange={(e, newVal) => setFromFilter(newVal || "")}
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder="Type a city or select Campus"
                sx={{
                  opacity: radiusActive ? 0.5 : 1,
                  "& .MuiOutlinedInput-root": {
                    padding: "11px 14px",
                    borderRadius: "8px",
                    fontSize: "15px",
                    "&:hover fieldset": {
                      borderColor: "#006d5b",
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: "#006d5b",
                      boxShadow: "0 0 0 3px rgba(0,109,91,0.1)",
                    },
                  },
                }}
              />
            )}
          />
        </Box>

        {/* ==== To ==== */}
        <Box sx={{ marginBottom: "16px" }}>
          <Typography
            component="label"
            sx={{
              fontWeight: 600,
              color: "#00263a",
              display: "block",
              marginBottom: "6px",
              fontSize: "14px",
            }}
          >
            To
          </Typography>
          <Autocomplete
            freeSolo
            disabled={radiusActive}
            filterOptions={(x) => x}
            options={getToOptions(toFilter)}
            inputValue={toFilter}
            onInputChange={(e, newVal) => setToFilter(newVal || "")}
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder="Type a destination"
                sx={{
                  opacity: radiusActive ? 0.5 : 1,
                  "& .MuiOutlinedInput-root": {
                    padding: "11px 14px",
                    borderRadius: "8px",
                    fontSize: "15px",
                    "&:hover fieldset": {
                      borderColor: "#006d5b",
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: "#006d5b",
                      boxShadow: "0 0 0 3px rgba(0,109,91,0.1)",
                    },
                  },
                }}
              />
            )}
          />
        </Box>

        {/* ==== Radius Slider ==== */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            margin: "20px 0",
            opacity: locationFiltersActive ? 0.5 : 1,
          }}
        >
          <Typography
            component="label"
            sx={{
              fontWeight: 600,
              color: "#00263a",
              fontSize: "14px",
              minWidth: "60px",
            }}
          >
            Radius
          </Typography>
          <Box
            component="input"
            type="range"
            min="50"
            max="500"
            step="25"
            value={distance}
            disabled={locationFiltersActive} // disable when From/To active
            onChange={handleDistanceChange}
            sx={{
              flex: 1,
              height: "6px",
              borderRadius: "5px",
              background: "#d1d5db",
              outline: "none",
              WebkitAppearance: "none",
              transition: "background 0.2s ease",
              "&::-webkit-slider-thumb": {
                WebkitAppearance: "none",
                width: "20px",
                height: "20px",
                borderRadius: "50%",
                background: locationFiltersActive ? "#9ca3af" : "#006d5b",
                cursor: locationFiltersActive ? "not-allowed" : "pointer",
                transition: "transform 0.2s ease, box-shadow 0.2s ease",
                "&:hover": {
                  transform: locationFiltersActive ? "none" : "scale(1.2)",
                  boxShadow: locationFiltersActive
                    ? "none"
                    : "0 0 0 8px rgba(0,109,91,0.15)",
                },
              },
            }}
          />
          <Typography
            sx={{
              fontWeight: 600,
              color: "#006d5b",
              minWidth: "80px",
              textAlign: "right",
              fontSize: "15px",
            }}
          >
            {distance} mi
          </Typography>
        </Box>

        {/* ==== Buttons ==== */}
        <Box sx={{ display: "flex", gap: "12px", marginTop: "20px" }}>
          <Button
            onClick={clearFilters}
            sx={{
              flex: 1,
              background: "transparent",
              color: "#6b7280",
              border: "1.5px solid #d1d5db",
              borderRadius: "8px",
              padding: "12px 20px",
              fontSize: "15px",
              fontWeight: 600,
              textTransform: "none",
              "&:hover": {
                borderColor: "#9ca3af",
                color: "#374151",
                background: "#f9fafb",
              },
            }}
          >
            Clear Filters
          </Button>

          <Button
            onClick={handleSearch}
            sx={{
              flex: 1,
              background: "linear-gradient(135deg, #006d5b, #008c70)",
              color: "white",
              borderRadius: "8px",
              padding: "12px 20px",
              fontSize: "15px",
              fontWeight: 600,
              textTransform: "none",
              transition: "transform 0.2s ease, box-shadow 0.2s ease",
              boxShadow: "0 2px 8px rgba(0,109,91,0.3)",
              "&:hover": {
                transform: "translateY(-2px)",
                boxShadow: "0 4px 12px rgba(0,109,91,0.4)",
              },
            }}
          >
            Search
          </Button>
        </Box>

        {/* ==== Create Ride Button ==== */}
        <Box
          sx={{
            background: "#f9fafb",
            borderTop: "1px solid #e5e7eb",
            borderRadius: "0 0 14px 14px",
            padding: "16px",
            margin: "-26px -26px -26px",
            marginTop: "20px",
            display: "flex",
          }}
        >
          <Button
            onClick={onCreateRide}
            sx={{
              flex: 1,
              background: "linear-gradient(135deg, #006d5b, #008c70)",
              color: "white",
              borderRadius: "8px",
              padding: "12px 20px",
              fontSize: "15px",
              fontWeight: 600,
              textTransform: "none",
              transition: "transform 0.2s ease, box-shadow 0.2s ease",
              boxShadow: "0 2px 8px rgba(0,109,91,0.3)",
              "&:hover": {
                transform: "translateY(-2px)",
                boxShadow: "0 4px 12px rgba(0,109,91,0.4)",
              },
            }}
          >
            + Create Ride
          </Button>
        </Box>
      </Box>

      {/* ====== Search Results ====== */}
      <Box
        sx={{
          background: "#fff",
          borderRadius: "14px",
          boxShadow: "0 6px 20px rgba(0,0,0,0.15)",
          padding: "26px",
        }}
      >
        {!rides || rides.length === 0 ? (
          <Box
            sx={{
              textAlign: "center",
              color: "#9ca3af",
              padding: "40px 20px",
              fontSize: "15px",
            }}
          >
            Start searching to see available rides near campus.
          </Box>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {rides.map((ride, index) => (
              <RideCard
                key={ride.id}
                ride={ride}
                userEmail={userEmail}
                joinRide={joinRide}
                leaveRide={leaveRide}
                index={index}
              />
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default FindRidesSection;