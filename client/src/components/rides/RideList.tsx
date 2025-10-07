// client/src/components/rides/RideList.tsx
import React from "react";
import Grid2 from "@mui/material/Grid2";
import { Typography } from "@mui/material";
import { Ride } from "../../pages/DashboardPage";
import RideCard from "./RideCard.tsx";

interface Props {
  rides: Ride[];
  userEmail: string;
  joinRide: (id: string) => void;
  leaveRide: (id: string) => void;
}

const RideList: React.FC<Props> = ({ rides, userEmail, joinRide, leaveRide }) => {
  if (rides.length === 0)
    return (
      <Typography sx={{ p: 3, textAlign: "center" }} color="text.secondary">
        No rides available with selected filters.
      </Typography>
    );

  return (
    <Grid2 container spacing={2}>
      {rides.map((ride) => (
        <Grid2 xs={12} key={ride.id}>
          <RideCard ride={ride} userEmail={userEmail} joinRide={joinRide} leaveRide={leaveRide} />
        </Grid2>
      ))}
    </Grid2>
  );
};

export default RideList;