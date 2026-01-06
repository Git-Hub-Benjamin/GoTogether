import { Box, Button, Typography, Tooltip, IconButton } from "@mui/material";
import { useAuth } from "../../context/AuthContext.jsx";
import universityColors from "../../assets/university_colors.json";
import SettingsIcon from "@mui/icons-material/Settings";
import HomeIcon from "@mui/icons-material/Home";

const DashboardHeader = ({
  schoolName,
  userEmail,
  userName,
  showMyRides,
  onToggleMyRides,
  onLogout,
  onSettings,
  showSettingsSection,
}) => {
  const { user } = useAuth();

  // 🎨 Find color palette for user's school
  const colors =
    universityColors.find(
      (u) => u.university.toLowerCase() === (user?.school || "").toLowerCase()
    )?.colors || {};

  return (
    <Box
      component="header"
      sx={{
        background: colors.header_bg_blur || "rgba(255,255,255,0.08)",
        backdropFilter: "blur(10px)",
        borderBottom: "1px solid rgba(255,255,255,0.15)",
        color: colors.header_text || "#fff",
        width: "100%",
        padding: "14px 28px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        position: "sticky",
        top: 0,
        zIndex: 100,
        transition: "background 0.2s ease, color 0.2s ease",
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          lineHeight: 1.3,
          userSelect: "none",
        }}
      >
        <Typography
          sx={{
            fontSize: "20px",
            fontWeight: 600,
            letterSpacing: "0.3px",
            color: colors.header_text || "#fff",
          }}
        >
          GoTogether <span style={{ opacity: 0.8 }}>– {schoolName}</span>
        </Typography>

        {(userName || userEmail) && (
          <Typography
            sx={{
              fontSize: "13px",
              opacity: 0.75,
              color: colors.header_text || "#fff",
            }}
          >
            {userName && <span>{userName}</span>}
            {userName && userEmail && <span> • </span>}
            {userEmail && <span>{userEmail}</span>}
          </Typography>
        )}
      </Box>

      <Box sx={{ display: "flex", gap: "10px", alignItems: "center" }}>
        <Tooltip title={showSettingsSection ? "Back to Dashboard" : "Account Settings"}>
          <IconButton
            onClick={onSettings}
            sx={{
              color: colors.header_text || "#fff",
              borderRadius: "8px",
              transition: "all 0.2s ease",
              "&:hover": {
                background:
                  colors.header_button_hover_bg || "rgba(255,255,255,0.15)",
              },
            }}
          >
            {showSettingsSection ? (
              <HomeIcon sx={{ fontSize: "20px" }} />
            ) : (
              <SettingsIcon sx={{ fontSize: "20px" }} />
            )}
          </IconButton>
        </Tooltip>

        <Button
          onClick={onToggleMyRides}
          variant="outlined"
          sx={{
            borderColor: colors.header_button_border || "rgba(255,255,255,0.7)",
            color: colors.header_text || "#fff",
            borderRadius: "8px",
            px: 2.4,
            py: 1,
            fontWeight: 500,
            fontSize: "14px",
            textTransform: "none",
            transition: "all 0.2s ease",
            "&:hover": {
              background:
                colors.header_button_hover_bg || "rgba(255,255,255,0.15)",
              borderColor: "rgba(255,255,255,0.8)",
            },
          }}
        >
          {showSettingsSection ? "My Rides" : (showMyRides ? "Back to Search" : "My Rides")}
        </Button>

        <Button
          onClick={onLogout}
          variant="contained"
          sx={{
            background: colors.header_button_bg || "rgba(255,255,255,0.1)",
            color: colors.header_text || "#fff",
            fontWeight: 500,
            fontSize: "14px",
            borderRadius: "8px",
            px: 2.4,
            py: 1,
            textTransform: "none",
            boxShadow: "none",
            "&:hover": {
              background:
                colors.header_button_hover_bg || "rgba(255,255,255,0.2)",
              color: colors.bg_primary || "#0f172a",
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
