import { Box, Button } from "@mui/material";

const DashboardHeader = ({
  schoolName,
  userEmail,
  showMyRides,
  onToggleMyRides,
  onLogout,
}) => {
  return (
    <Box
      component="header"
      sx={{
        background: "rgba(255, 255, 255, 0.15)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(255, 255, 255, 0.2)",
        color: "white",
        width: "100%",
        padding: "14px 24px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}
    >
      <Box
        sx={{
          fontSize: "22px",
          margin: 0,
          fontWeight: 600,
        }}
      >
        🎓 GoTogether – {schoolName}
      </Box>

      <Box sx={{ display: "flex", gap: "10px" }}>
        <Button
          onClick={onToggleMyRides}
          sx={{
            background: "transparent",
            border: "1.5px solid white",
            color: "white",
            borderRadius: "8px",
            padding: "8px 14px",
            fontWeight: 600,
            fontSize: "14px",
            transition: "all 0.3s ease",
            textTransform: "none",
            "&:hover": {
              background: "white",
              color: "#00263a",
              transform: "translateY(-2px)",
            },
            "&:active": {
              transform: "translateY(0)",
            },
          }}
        >
          {showMyRides ? "← Back to Search" : "My Rides"}
        </Button>

        <Button
          onClick={onLogout}
          sx={{
            background: "transparent",
            border: "1.5px solid white",
            color: "white",
            borderRadius: "8px",
            padding: "8px 14px",
            fontWeight: 600,
            fontSize: "14px",
            transition: "all 0.3s ease",
            textTransform: "none",
            "&:hover": {
              background: "white",
              color: "#00263a",
              transform: "translateY(-2px)",
            },
            "&:active": {
              transform: "translateY(0)",
            },
          }}
        >
          Logout
        </Button>
      </Box>
    </Box>
  );
};

export default DashboardHeader;