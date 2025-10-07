import React from "react";
import {
  Box,
  Button,
  MenuItem,
  TextField,
  Typography,
  Slider,
} from "@mui/material";
import { Locations } from "../../pages/DashboardPage";

interface Props {
  fromFilter: string;
  toFilter: string;
  setFromFilter: (val: string) => void;
  setToFilter: (val: string) => void;
  locations: Locations;
  setModalOpen: (open: boolean) => void;
  distance: number;
  setDistance: (val: number) => void;
  lockedFrom: boolean;
  schoolName: string;
  refreshRides: () => void;
}

const RideFilters: React.FC<Props> = ({
  fromFilter,
  toFilter,
  setFromFilter,
  setToFilter,
  locations,
  setModalOpen,
  distance,
  setDistance,
  lockedFrom,
  schoolName,
  refreshRides,
}) => {
  const handleDistanceChange = (_: Event, value: number | number[]) => {
    setDistance(value as number);
  };

  const campusOption = `${schoolName} (Campus)`;

  // Filter duplicate locations
  const fromOptions = [
    campusOption,
    ...(locations.from || []).filter((loc) => loc !== schoolName),
  ].filter((loc) => loc !== toFilter);

  const toOptions = [
    campusOption,
    ...(locations.to || []).filter((loc) => loc !== schoolName),
  ].filter((loc) => loc !== fromFilter);

  // Determine if "To" is locked to campus
  const fromIsCampusLike =
    fromFilter === "" || fromFilter === campusOption; // "Any" or Campus are flexible
  const isToLockedToCampus = !fromIsCampusLike;

  // Force To value to campus when locked
  React.useEffect(() => {
    if (isToLockedToCampus) setToFilter(campusOption);
  }, [isToLockedToCampus, campusOption, setToFilter]);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mb: 3 }}>
      <Typography variant="h6" fontWeight={600}>
        Available Rides
      </Typography>

      {/* ---------- SLIDER ---------- */}
      <Box>
        <Typography variant="body2">Search Radius (miles):</Typography>
        <Slider
          value={distance}
          min={10}
          max={300}
          step={10}
          onChange={handleDistanceChange}
          valueLabelDisplay="on"
          sx={{
            width: "100%",
            mt: 0.5,
            "& .MuiSlider-thumb": { width: 12, height: 12 },
            "& .MuiSlider-track": { height: 4 },
            "& .MuiSlider-rail": { height: 4 },
          }}
        />
      </Box>

      {/* ---------- FROM / TO ---------- */}
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
        {/* FROM */}
        <TextField
          select
          fullWidth
          size="small"
          label="From"
          value={fromFilter}
          onChange={(e) => setFromFilter(e.target.value)}
          disabled={lockedFrom}
        >
          <MenuItem value="">Any</MenuItem>
          {fromOptions.map((loc) => (
            <MenuItem key={loc} value={loc}>
              {loc}
            </MenuItem>
          ))}
        </TextField>

        {/* TO */}
        <TextField
          select
          fullWidth
          size="small"
          label="To"
          value={toFilter}
          onChange={(e) => setToFilter(e.target.value)}
          disabled={isToLockedToCampus}
          SelectProps={{
            MenuProps: { PaperProps: { style: { maxHeight: 200 } } },
          }}
        >
          {isToLockedToCampus ? (
            <MenuItem value={campusOption} disabled sx={{ color: "#999" }}>
              {campusOption}
            </MenuItem>
          ) : (
            toOptions.map((loc) => (
              <MenuItem key={loc} value={loc}>
                {loc}
              </MenuItem>
            ))
          )}
        </TextField>
      </Box>

      {/* ---------- ACTION BUTTONS ---------- */}
      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
        <Button
          variant="outlined"
          color="secondary"
          onClick={() => {
            setFromFilter("");
            setToFilter("");
            setDistance(100);
          }}
          sx={{ textTransform: "none", borderRadius: 2 }}
        >
          Clear Filters
        </Button>

        <Button
          variant="contained"
          color="success"
          onClick={() => setModalOpen(true)}
          sx={{ textTransform: "none", borderRadius: 2 }}
        >
          + Create Ride
        </Button>

        <Button
          variant="contained"
          color="info"
          onClick={refreshRides}
          sx={{ textTransform: "none", borderRadius: 2 }}
        >
          Refresh
        </Button>
      </Box>
    </Box>
  );
};

export default RideFilters;