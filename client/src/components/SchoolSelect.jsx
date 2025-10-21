import React, { useEffect, useState, useMemo } from "react";
import { Autocomplete, TextField, Box, CircularProgress } from "@mui/material";
import { ENDPOINTS } from "../utils/api.js";

const API_URL = ENDPOINTS.SCHOOLS;

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

  const stateOptions = useMemo(() => HARD_CODED_STATES.map(state => ({
    label: state,
    value: state
  })), []);

  const schoolOptions = useMemo(() => schools.map(school => ({
    label: school.name,
    value: school.name,
    ...school
  })), [schools]);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mb: 2 }}>
      <Autocomplete
        fullWidth
        options={stateOptions}
        value={selectedState ? { label: selectedState, value: selectedState } : null}
        onChange={(_, newValue) => {
          setSelectedState(newValue?.value || "");
          setSelectedSchool(null);
        }}
        disabled={disabled}
        getOptionLabel={(option) => option.label}
        renderInput={(params) => (
          <TextField
            {...params}
            label="Select State"
            sx={{ minWidth: 200 }}
          />
        )}
        isOptionEqualToValue={(option, value) => option.value === value?.value}
      />

      <Autocomplete
        fullWidth
        options={schoolOptions}
        value={selectedSchool ? { label: selectedSchool.name, value: selectedSchool.name, ...selectedSchool } : null}
        onChange={(_, newValue) => setSelectedSchool(newValue)}
        disabled={!selectedState || disabled}
        loading={loading}
        getOptionLabel={(option) => option.label}
        renderInput={(params) => (
          <TextField
            {...params}
            label="Select University"
            sx={{ minWidth: 200 }}
            InputProps={{
              ...params.InputProps,
              endAdornment: (
                <>
                  {loading ? <CircularProgress size={20} /> : null}
                  {params.InputProps.endAdornment}
                </>
              ),
            }}
          />
        )}
        isOptionEqualToValue={(option, value) => option.value === value?.value}
      />
    </Box>
  );
};

export default SchoolSelect;