import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  Button,
  Box,
  IconButton,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useAuth } from "../context/AuthContext.tsx";

const API_URL = "http://localhost:5000/api/rides";

interface CreateRideModalProps {
  open: boolean;
  onClose: () => void;
  onRideCreated: () => void;
}

const CreateRideModal: React.FC<CreateRideModalProps> = ({
  open,
  onClose,
  onRideCreated,
}) => {
  const { token } = useAuth();
  const [destination, setDestination] = useState("");
  const [departureDate, setDepartureDate] = useState("");
  const [departureTime, setDepartureTime] = useState("");
  const [seatsAvailable, setSeatsAvailable] = useState("");
  const [notes, setNotes] = useState("");
  const [from, setFrom] = useState("");

  const handleSubmit = async () => {
    try {
      await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          from,
          destination,
          departureDate,
          departureTime,
          seatsAvailable,
          notes,
        }),
      });
      onRideCreated();
      onClose();
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
        Create New Ride
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
          <TextField
            label="Starting Location"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            fullWidth
          />
          <TextField
            label="Destination"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            fullWidth
          />
          <TextField
            label="Departure Date"
            type="date"
            value={departureDate}
            onChange={(e) => setDepartureDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            fullWidth
          />
          <TextField
            label="Departure Time"
            type="time"
            value={departureTime}
            onChange={(e) => setDepartureTime(e.target.value)}
            InputLabelProps={{ shrink: true }}
            fullWidth
          />
          <TextField
            label="Seats Available"
            type="number"
            value={seatsAvailable}
            onChange={(e) => setSeatsAvailable(e.target.value)}
            fullWidth
          />
          <TextField
            label="Notes (optional)"
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
