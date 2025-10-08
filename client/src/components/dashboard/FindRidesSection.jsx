import { Box } from "@mui/material";
import { useAuth } from "../../context/AuthContext";
import universityColors from "../../assets/university_colors.json";
import FilterSection from "./FilterSection";
import ResultsSection from "./ResultsSection";
import { useRideFilters } from "../../hooks/useRideFilters";
import { useRef, useState, useEffect } from "react";

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
  const state = user?.state || "";

  const colors =
    universityColors.find(
      (u) => u.university.toLowerCase() === schoolName.toLowerCase()
    )?.colors || {};

  const filterProps = useRideFilters(schoolName, state, token, onSearch);

  const filterRef = useRef(null);
  const [filterHeight, setFilterHeight] = useState(null);

  useEffect(() => {
    if (filterRef.current) {
      setFilterHeight(`${filterRef.current.offsetHeight}px`);
    }
  }, [active]);

  return (
    <Box
      sx={{
        position: active ? "relative" : "absolute",
        width: "100%",
        opacity: active ? 1 : 0,
        transform: active ? "translateX(0)" : "translateX(-100%)",
        transition:
          "transform 0.4s cubic-bezier(0.4,0,0.2,1), opacity 0.4s ease",
        pointerEvents: active ? "all" : "none",
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          gap: { xs: 3, md: 3 },
          maxWidth: "1800px",
          mx: "auto",
          px: { xs: 0, md: 4, lg: 6 },
          width: "100%",
          alignItems: { xs: "center", md: "flex-start" },
        }}
      >
        <FilterSection
          ref={filterRef}
          colors={colors}
          onCreateRide={onCreateRide}
          {...filterProps}
        />

        <ResultsSection
          colors={colors}
          rides={rides}
          userEmail={userEmail}
          joinRide={joinRide}
          leaveRide={leaveRide}
          filterHeight={filterHeight}
        />
      </Box>
    </Box>
  );
};

export default FindRidesSection;