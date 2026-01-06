import React from "react";
import { Box, LinearProgress, Typography } from "@mui/material";

const PasswordStrengthMeter = ({ strength }) => {
  const getColor = () => {
    if (strength < 25) return "#d32f2f"; // Red
    if (strength < 50) return "#f57c00"; // Orange
    if (strength < 75) return "#fbc02d"; // Yellow
    return "#2e7d32"; // Green
  };

  const getLabel = () => {
    if (strength < 25) return "Very Weak";
    if (strength < 50) return "Weak";
    if (strength < 75) return "Fair";
    if (strength < 100) return "Strong";
    return "Very Strong";
  };

  return (
    <Box sx={{ mt: 1, mb: 2 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
        <Typography variant="caption" color="text.secondary">
          Password Strength
        </Typography>
        <Typography
          variant="caption"
          sx={{ color: getColor(), fontWeight: 600 }}
        >
          {getLabel()}
        </Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={strength}
        sx={{
          height: 6,
          borderRadius: 3,
          backgroundColor: "#e0e0e0",
          "& .MuiLinearProgress-bar": {
            backgroundColor: getColor(),
            borderRadius: 3,
          },
        }}
      />
    </Box>
  );
};

export default PasswordStrengthMeter;
