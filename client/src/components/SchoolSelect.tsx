import React, { useEffect, useState } from "react";
import { TextField, MenuItem, Box } from "@mui/material";

export interface University {
  name: string;
  domain: string;
}

interface SchoolSelectProps {
  selectedState: string;
  setSelectedState: (value: string) => void;
  selectedSchool: University | null;
  setSelectedSchool: (value: University | null) => void;
  disabled?: boolean; // ✅ added prop
}

const API_URL = "http://localhost:5000/api/schools";

const SchoolSelect: React.FC<SchoolSelectProps> = ({
  selectedState,
  setSelectedState,
  selectedSchool,
  setSelectedSchool,
  disabled = false, // ✅ default to false
}) => {
  const [states, setStates] = useState<string[]>([]);
  const [schools, setSchools] = useState<University[]>([]);

  // Fetch all states once
  useEffect(() => {
    if (disabled) return; // ✅ skip fetching when disabled
    fetch(`${API_URL}/states`)
      .then((res) => res.json())
      .then(setStates)
      .catch((err) => console.error("Error fetching states:", err));
  }, [disabled]);

  // Fetch schools whenever a state is chosen
  useEffect(() => {
    if (disabled) return;
    if (selectedState) {
      fetch(`${API_URL}/${encodeURIComponent(selectedState)}`)
        .then((res) => res.json())
        .then(setSchools)
        .catch((err) => console.error("Error fetching schools:", err));
    } else {
      setSchools([]);
      setSelectedSchool(null);
    }
  }, [selectedState, setSelectedSchool, disabled]);

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
        disabled={disabled} // ✅ disable when parent says so
      >
        {states.map((s) => (
          <MenuItem key={s} value={s}>
            {s}
          </MenuItem>
        ))}
      </TextField>

      <TextField
        select
        fullWidth
        label="Select University"
        disabled={disabled || !selectedState} // ✅ disable here too
        value={selectedSchool?.name || ""}
        onChange={(e) => {
          const school = schools.find((s) => s.name === e.target.value) || null;
          setSelectedSchool(school);
        }}
      >
        {schools.map((s) => (
          <MenuItem key={s.domain} value={s.name}>
            {s.name}
          </MenuItem>
        ))}
      </TextField>
    </Box>
  );
};

export default SchoolSelect;