// client/src/components/rides/MyRidesSection.tsx
import React from "react";
import { Box, Divider, Typography } from "@mui/material";
import { Ride } from "../../pages/DashboardPage";

interface Props {
  myCreatedRides: Ride[];
  myJoinedRides: Ride[];
}

const MyRidesSection: React.FC<Props> = ({ myCreatedRides, myJoinedRides }) => {
  const empty = myCreatedRides.length === 0 && myJoinedRides.length === 0;

  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="subtitle1" fontWeight={600}>
        My Rides
      </Typography>

      {empty ? (
        <Typography color="text.secondary">
          You haven’t created or joined any rides yet.
        </Typography>
      ) : (
        <>
          {myCreatedRides.length > 0 && (
            <>
              <Typography fontWeight={600} sx={{ mt: 1 }}>
                Created Rides
              </Typography>
              {myCreatedRides.map((r) => (
                <Typography key={r.id} variant="body2">
                  🚗 {r.from} → {r.destination} ({r.departureDate})
                </Typography>
              ))}
            </>
          )}
          {myJoinedRides.length > 0 && (
            <>
              <Typography fontWeight={600} sx={{ mt: 2 }}>
                Joined Rides
              </Typography>
              {myJoinedRides.map((r) => (
                <Typography key={r.id} variant="body2">
                  🧍 {r.from} → {r.destination} ({r.departureDate})
                </Typography>
              ))}
            </>
          )}
        </>
      )}
      <Divider sx={{ mt: 2, mb: 2 }} />
    </Box>
  );
};

export default MyRidesSection;