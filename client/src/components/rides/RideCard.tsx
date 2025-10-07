// client/src/components/rides/RideCard.tsx
import React from "react";
import { Box, Button, Card, CardContent, Typography } from "@mui/material";
import { Ride } from "../../pages/DashboardPage";

interface Props {
  ride: Ride;
  userEmail: string;
  joinRide: (id: string) => void;
  leaveRide: (id: string) => void;
}

const RideCard: React.FC<Props> = ({ ride, userEmail, joinRide, leaveRide }) => {
  const joined = ride.passengers.includes(userEmail);

  return (
    <Card
      sx={{
        p: 2,
        borderRadius: 3,
        background: "linear-gradient(145deg,#ffffff,#f5f7fa)",
        boxShadow: 1,
        transition: "transform 0.15s ease-in-out",
        "&:hover": { transform: "scale(1.01)", boxShadow: 3 },
      }}
    >
      <CardContent>
        <Typography variant="h6" fontWeight={600} sx={{ color: "#00263A" }}>
          {ride.from} → {ride.destination}
        </Typography>
        <Typography variant="body2" sx={{ mt: 0.5 }}>
          📅 {ride.departureDate} • {ride.departureTime}
        </Typography>
        <Typography variant="body2" sx={{ mt: 0.5 }}>
          👥 Seats Left: {ride.seatsAvailable - ride.passengers.length}
        </Typography>

        <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
          {joined ? (
            <Button
              variant="outlined"
              color="error"
              size="small"
              onClick={() => leaveRide(ride.id)}
            >
              Leave Ride
            </Button>
          ) : (
            <Button
              variant="contained"
              color="success"
              size="small"
              onClick={() => joinRide(ride.id)}
            >
              Join Ride
            </Button>
          )}
        </Box>

        {ride.notes && (
          <Typography
            variant="body2"
            sx={{ mt: 1, fontStyle: "italic", color: "text.secondary" }}
          >
            “{ride.notes}”
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};

export default RideCard;