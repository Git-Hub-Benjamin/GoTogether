import React, { useEffect, useState } from "react";
import { TextField, MenuItem, Box, CircularProgress } from "@mui/material";

const API_URL = "http://localhost:5000/api/schools";

const HARD_CODED_STATES = [
  "Alabama",
  "Alaska",
  "Arizona",
  "Arkansas",
  "California",
  "Colorado",
  "Connecticut",
  "Delaware",
  "Florida",
  "Georgia",
  "Hawaii",
  "Idaho",
  "Illinois",
  "Indiana",
  "Iowa",
  "Kansas",
  "Kentucky",
  "Louisiana",
  "Maine",
  "Maryland",
  "Massachusetts",
  "Michigan",
  "Minnesota",
  "Mississippi",
  "Missouri",
  "Montana",
  "Nebraska",
  "Nevada",
  "New Hampshire",
  "New Jersey",
  "New Mexico",
  "New York",
  "North Carolina",
  "North Dakota",
  "Ohio",
  "Oklahoma",
  "Oregon",
  "Pennsylvania",
  "Rhode Island",
  "South Carolina",
  "South Dakota",
  "Tennessee",
  "Texas",
  "Utah",
  "Vermont",
  "Virginia",
  "Washington",
  "West Virginia",
  "Wisconsin",
  "Wyoming",
];

const SchoolSelect = ({
  selectedState,
  setSelectedState,
  selectedSchool,
  setSelectedSchool,
  disabled = false,
}) => {
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!selectedState || disabled) {
      setSchools([]);
      setSelectedSchool(null);
      return;
    }

    const fetchSchools = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `${API_URL}/${encodeURIComponent(selectedState)}`
        );
        const data = await res.json();

        if (res.ok) {
          setSchools(data);
        }
      } catch (err) {
        console.error("Error fetching schools:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSchools();
  }, [selectedState, disabled, setSelectedSchool]);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mb: 2 }}>
      <TextField
        select
        fullWidth
        label="Select State"
        value={selectedState}
        onChange={(e) => {
          setSelectedState(e.target.value);
          setSelectedSchool(null);
        }}
        disabled={disabled}
      >
        {HARD_CODED_STATES.map((s) => (
          <MenuItem key={s} value={s}>
            {s}
          </MenuItem>
        ))}
      </TextField>

      <TextField
        select
        fullWidth
        label="Select University"
        disabled={disabled || !selectedState || loading}
        value={selectedSchool?.name || ""}
        onChange={(e) => {
          const school =
            schools.find((s) => s.name === e.target.value) || null;
          setSelectedSchool(school);
        }}
        InputProps={{
          endAdornment: loading ? <CircularProgress size={20} /> : null,
        }}
      >
        {schools.map((s) => (
          <MenuItem key={s.name} value={s.name}>
            {s.name}
          </MenuItem>
        ))}
      </TextField>
    </Box>
  );
};

export default SchoolSelect;