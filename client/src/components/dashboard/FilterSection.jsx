import {
  Box,
  Button,
  TextField,
  Typography,
  Autocomplete,
  CircularProgress,
  FormControlLabel,
  Checkbox,
} from "@mui/material";
import { forwardRef } from "react";

const FilterSection = forwardRef(
  (
    {
      colors,
      fromFilter,
      setFromFilter,
      toFilter,
      setToFilter,
      selectedDate,
      setSelectedDate,
      distance,
      handleDistanceChange,
      getFromOptions,
      getToOptions,
      locationFiltersActive,
      radiusActive,
      clearFilters,
      handleSearch,
      onCreateRide,
      searchLoading,
      showMyRidesOnly,
      setShowMyRidesOnly,
    },
    ref
  ) => {
    return (
      <Box
        ref={ref}
        sx={{
          width: "100%",
          maxWidth: { xs: "90%", sm: "85%", md: "360px" },
          background: colors.card_bg || "#fff",
          borderRadius: "12px",
          boxShadow: `0 4px 16px ${colors.card_shadow || "rgba(0,0,0,0.08)"}`,
          p: { xs: 2.5, sm: 3 },
          display: "flex",
          flexDirection: "column",
          gap: 1.8,
          // height: "fit-content",
          height: "500px",
          position: "sticky",
          top: 20,
        }}
      >
        <Typography
          variant="h6"
          sx={{
            color: colors.text_primary || "#1e293b",
            fontWeight: 600,
            fontSize: "19px",
            mb: 0.5,
            textAlign: { xs: "center", md: "left" },
          }}
        >
          Find a Ride
        </Typography>

        {/* From Field */}
        <Box>
          <Typography
            sx={{
              fontWeight: 600,
              color: colors.text_secondary || "#334155",
              fontSize: "13px",
              mb: "6px",
            }}
          >
            From
          </Typography>
          <Autocomplete
            freeSolo
            disabled={radiusActive}
            filterOptions={(x) => x}
            options={getFromOptions(fromFilter)}
            inputValue={fromFilter}
            onInputChange={(e, val) => setFromFilter(val || "")}
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder="City or campus"
                size="small"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "8px",
                    fontSize: "14px",
                  },
                }}
              />
            )}
          />
        </Box>

        {/* To Field */}
        <Box>
          <Typography
            sx={{
              fontWeight: 600,
              color: colors.text_secondary || "#334155",
              fontSize: "13px",
              mb: "6px",
            }}
          >
            To
          </Typography>
          <Autocomplete
            freeSolo
            disabled={radiusActive}
            filterOptions={(x) => x}
            options={getToOptions(toFilter)}
            inputValue={toFilter}
            onInputChange={(e, val) => setToFilter(val || "")}
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder="Destination"
                size="small"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "8px",
                    fontSize: "14px",
                  },
                }}
              />
            )}
          />
        </Box>

        {/* Date Field and Show My Rides Checkbox Row */}
        <Box sx={{ display: "flex", gap: 1.5, alignItems: "flex-start" }}>
          {/* Date Field - 50% width */}
          <Box sx={{ flex: "0 0 50%" }}>
            <Typography
              sx={{
                fontWeight: 600,
                color: colors.text_secondary || "#334155",
                fontSize: "13px",
                mb: "6px",
              }}
            >
              Day
            </Typography>
            <TextField
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              size="small"
              fullWidth
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "8px",
                  fontSize: "14px",
                },
              }}
            />
          </Box>

          {/* Show My Rides Checkbox - 50% width */}
          <Box sx={{ flex: "0 0 50%", display: "flex", alignItems: "center", pt: 0.5, mt: '18px', ml: '25px' }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={showMyRidesOnly}
                  onChange={(e) => setShowMyRidesOnly(e.target.checked)}
                  size="small"
                  sx={{
                    color: colors.text_secondary || "#334155",
                    "&.Mui-checked": {
                      color: colors.button_primary_bg || "#1e293b",
                    },
                    transform: { xs: "scale(1.3)", md: "scale(1)" },
                    transformOrigin: "left",
                  }}
                />
              }
              label="My rides"
              sx={{
                m: 0,
                "& .MuiTypography-root": {
                  fontSize: { xs: "15px", md: "13px" },
                  fontWeight: 500,
                  color: colors.text_secondary || "#334155",
                },
              }}
            />
          </Box>
        </Box>

        {/* Radius */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            justifyContent: "space-between",
          }}
        >
          <Typography
            sx={{
              fontWeight: 600,
              color: colors.text_secondary || "#334155",
              fontSize: "13px",
              flexShrink: 0,
            }}
          >
            Radius
          </Typography>
          <Box
            component="input"
            type="range"
            min="50"
            max="500"
            step="25"
            value={distance}
            disabled={locationFiltersActive}
            onChange={handleDistanceChange}
            sx={{
              flex: 1,
              accentColor: colors.text_secondary || "#334155",
            }}
          />
          <Typography
            sx={{
              color: colors.text_secondary || "#334155",
              fontWeight: 600,
              fontSize: "13px",
              minWidth: "55px",
              textAlign: "right",
            }}
          >
            {distance} mi
          </Typography>
        </Box>

        {/* Buttons */}
        <Box sx={{ display: "flex", gap: 1.5, mt: 0.5 }}>
          <Button
            variant="outlined"
            onClick={clearFilters}
            size="small"
            sx={{
              flex: 1,
              borderColor: colors.button_secondary_border || "#CBD5E1",
              color: colors.button_secondary_text || "#475569",
              borderRadius: "8px",
              textTransform: "none",
              fontSize: "13px",
              py: 0.8,
              "&:hover": { background: "#f1f5f9" },
            }}
          >
            Clear
          </Button>

          <Button
            variant="contained"
            onClick={handleSearch}
            disabled={searchLoading}
            size="small"
            sx={{
              flex: 1,
              background: colors.button_primary_bg || "#1e293b",
              color: colors.button_primary_text || "#fff",
              borderRadius: "8px",
              textTransform: "none",
              fontSize: "13px",
              py: 0.8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 1,
              "&:hover": {
                background: colors.button_primary_hover || "#0f172a",
              },
            }}
          >
            {searchLoading ? (
              <>
                <CircularProgress size={16} sx={{ color: 'white' }} />
                Searching...
              </>
            ) : (
              "Search"
            )}
          </Button>
        </Box>

        <Button
          onClick={onCreateRide}
          variant="contained"
          size="small"
          sx={{
            mt: 1,
            width: "100%",
            background: colors.button_primary_bg || "#334155",
            color: colors.button_primary_text || "#fff",
            borderRadius: "8px",
            textTransform: "none",
            py: 1,
            fontSize: "13px",
            fontWeight: 500,
            height: "100%",
            "&:hover": {
              background: colors.button_primary_hover || "#1e293b",
            },
          }}
        >
          + Create Ride
        </Button>
      </Box>
    );
  }
);

FilterSection.displayName = "FilterSection";

export default FilterSection;