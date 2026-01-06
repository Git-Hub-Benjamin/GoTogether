import { Box } from "@mui/material";
import { useAuth } from "../../context/AuthContext";
import universityColors from "../../assets/university_colors.json";
import FilterSection from "./FilterSection";
import ResultsSection from "./ResultsSection";
import { useRideFilters } from "../../hooks/useRideFilters";
import { useEffect } from "react";

const FindRidesSection = ({
  active,
  onCreateRide,
  rides,
  userEmail,
  joinRide,
  leaveRide,
  onSearch,
  loadingRideIds,
  onCancelRequest,
  onFiltersChange,
  searchLoading,
  onPerformSearch,
}) => {
  const { user, token } = useAuth();
  const schoolName = user?.school || "";
  const state = user?.state || "";

  const colors =
    universityColors.find(
      (u) => u.university.toLowerCase() === schoolName.toLowerCase()
    )?.colors || {};

  const filterProps = useRideFilters(schoolName, state, token, onSearch);

  // Update parent with current filters whenever they change
  useEffect(() => {
    if (onFiltersChange) {
      onFiltersChange({
        from: filterProps.fromFilter,
        to: filterProps.toFilter,
        radius: filterProps.distance,
        date: filterProps.selectedDate,
      });
    }
  }, [filterProps.fromFilter, filterProps.toFilter, filterProps.distance, filterProps.selectedDate, onFiltersChange]);

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
          colors={colors}
          onCreateRide={onCreateRide}
          {...filterProps}
          searchLoading={searchLoading}
          handleSearch={onPerformSearch}
        />

        <ResultsSection
          colors={colors}
          rides={rides}
          userEmail={userEmail}
          joinRide={joinRide}
          leaveRide={leaveRide}
          loadingRideIds={loadingRideIds}
          onCancelRequest={onCancelRequest}
        />
      </Box>
    </Box>
  );
};

export default FindRidesSection;