import React, { useState, useMemo } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  Button,
  Box,
  IconButton,
  Autocomplete,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useAuth } from "../context/AuthContext.jsx";
import usCities from "../assets/us_cities.json";
import { ENDPOINTS } from "../utils/api.js";

const API_URL = ENDPOINTS.RIDES;

const CreateRideModal = ({ open, onClose, onRideCreated, school, state }) => {
  const { token } = useAuth();
  const [from, setFrom] = useState("");
  const [destination, setDestination] = useState("");
  const [departureDate, setDepartureDate] = useState("");
  const [departureTime, setDepartureTime] = useState("");
  const [seatsAvailable, setSeatsAvailable] = useState("");
  const [notes, setNotes] = useState("");

  const campusOption = `${school} (Campus)`;

  // Precompute lists
  const cityList = useMemo(
    () => usCities.map((c) => `${c.city}, ${c.state_name}`),
    []
  );

  // List of cities within the same state as the school
  const stateCityList = useMemo(
    () =>
      usCities
        .filter(
          (c) =>
            c.state_name.toLowerCase() === (state || "").toLowerCase()
        )
        .map((c) => `${c.city}, ${c.state_name}`),
    [state]
  );

  // Fast city filtering with state bias
  const filterCities = (input) => {
    if (!input) {
      // ➕ First open — show first 10 for this state
      return stateCityList.slice(0, 10);
    }
    const lower = input.toLowerCase();
    return cityList
      .filter((item) => item.toLowerCase().includes(lower))
      .slice(0, 10);
  };

  // Logic for "Starting Location"
  const getFromOptions = (input) => {
    let options = filterCities(input);

    if (!input && !destination) {
      options = [campusOption, ...options].slice(0, 11);
    } else if (destination === campusOption) {
      options = options.filter((item) => item !== campusOption);
    } else if (destination && destination !== campusOption) {
      options = [campusOption];
    } else {
      if (!options.includes(campusOption)) options.unshift(campusOption);
      options = options.slice(0, 11);
    }

    return options;
  };

  // Logic for "Destination"
  const getDestinationOptions = (input) => {
    let options = filterCities(input);

    if (!input && !from) {
      options = [campusOption, ...options].slice(0, 11);
    } else if (from === campusOption) {
      options = options.filter((item) => item !== campusOption);
    } else if (from && from !== campusOption) {
      options = [campusOption];
    } else {
      if (!options.includes(campusOption)) options.unshift(campusOption);
      options = options.slice(0, 11);
    }

    return options;
  };

  // Normalize before backend POST
  const normalizeLocation = (value) => {
    if (!value) return "";
    if (value.trim() === campusOption) return school; // strip (Campus)
    return value.trim();
  };

  const handleSubmit = async () => {
    try {
      await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          from: normalizeLocation(from),
          destination: normalizeLocation(destination),
          departureDate,
          departureTime,
          seatsAvailable,
          notes,
        }),
      });

      onRideCreated();
      onClose();

      // Reset all inputs
      setFrom("");
      setDestination("");
      setDepartureDate("");
      setDepartureTime("");
      setSeatsAvailable("");
      setNotes("");
    } catch (err) {
      console.error("Error creating ride:", err);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        Create New Ride
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
          {/* Starting Location Autocomplete */}
          <Autocomplete
            freeSolo
            filterOptions={(x) => x}
            options={getFromOptions(from)}
            inputValue={from}
            onInputChange={(e, newValue) => setFrom(newValue)}
            renderInput={(params) => (
              <TextField {...params} label="Starting Location" fullWidth />
            )}
          />

          {/* Destination Autocomplete */}
          <Autocomplete
            freeSolo
            filterOptions={(x) => x}
            options={getDestinationOptions(destination)}
            inputValue={destination}
            onInputChange={(e, newValue) => setDestination(newValue)}
            renderInput={(params) => (
              <TextField {...params} label="Destination" fullWidth />
            )}
          />

          <TextField
            label="Departure Date"
            type="date"
            value={departureDate}
            onChange={(e) => setDepartureDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            fullWidth
          />

          <TextField
            label="Departure Time"
            type="time"
            value={departureTime}
            onChange={(e) => setDepartureTime(e.target.value)}
            InputLabelProps={{ shrink: true }}
            fullWidth
          />

          <TextField
            label="Seats Available"
            type="number"
            value={seatsAvailable}
            onChange={(e) => setSeatsAvailable(e.target.value)}
            fullWidth
          />

          <TextField
            label="Notes (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            multiline
            rows={3}
            fullWidth
          />

          <Button
            variant="contained"
            color="success"
            onClick={handleSubmit}
            fullWidth
            sx={{ textTransform: "none" }}
          >
            Create Ride
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default CreateRideModal;