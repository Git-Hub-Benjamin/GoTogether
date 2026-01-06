import { Box, Typography, Button, TextField, Card, CardContent } from "@mui/material";
import { useAuth } from "../../context/AuthContext";
import { useState } from "react";
import universityColors from "../../assets/university_colors.json";

const SettingsSection2 = ({ active }) => {
  const { user, token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const colors =
    universityColors.find(
      (u) => u.university.toLowerCase() === (user?.school || "").toLowerCase()
    )?.colors || {
      bg_primary: "#0F172A",
      bg_secondary: "#1E293B",
      text_primary: "#FFFFFF",
      card_bg: "#1E293B",
    };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData(e.target);
      const currentPassword = formData.get("currentPassword");
      const newPassword = formData.get("newPassword");
      const confirmPassword = formData.get("confirmPassword");

      if (newPassword !== confirmPassword) {
        setMessage({ type: "error", text: "Passwords do not match" });
        setLoading(false);
        return;
      }

      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to change password");
      }

      setMessage({ type: "success", text: "Password changed successfully" });
      e.target.reset();
    } catch (error) {
      setMessage({ type: "error", text: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        position: active ? "relative" : "absolute",
        width: "100%",
        top: 0,
        left: 0,
        opacity: active ? 1 : 0,
        transform: active ? "translateX(0)" : "translateX(100%)",
        transition: "transform 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.4s ease",
        pointerEvents: active ? "all" : "none",
        display: "flex",
        flexDirection: "column",
        gap: 2,
      }}
    >
      {/* Scrollable Settings Container */}
      <Box
        sx={{
          flex: 1,
          background: colors.card_bg || "#1E293B",
          borderRadius: "12px",
          boxShadow: `0 4px 16px rgba(0,0,0,0.08)`,
          padding: { xs: "20px", sm: "24px" },
          overflowY: "auto",
          maxHeight: "calc(100vh - 260px)",
          "&::-webkit-scrollbar": { width: "8px" },
          "&::-webkit-scrollbar-thumb": {
            background: "rgba(255,255,255,0.3)",
            borderRadius: "4px",
          },
        }}
      >
        {/* Account Settings Header */}
        <Typography
          variant="h4"
          sx={{
            color: colors.text_primary || "#FFFFFF",
            marginBottom: "30px",
            fontWeight: 600,
          }}
        >
          Account Settings
        </Typography>

        {/* User Info Card */}
        <Card
          sx={{
            backgroundColor: "rgba(255,255,255,0.05)",
            border: `1px solid rgba(255,255,255,0.1)`,
            marginBottom: "30px",
            color: colors.text_primary || "#FFFFFF",
          }}
        >
          <CardContent>
            <Typography variant="h6" sx={{ marginBottom: "15px", fontWeight: 600 }}>
              Profile Information
            </Typography>
            <Typography sx={{ marginBottom: "10px", opacity: 0.9 }}>
              <strong>Name:</strong> {user?.name || "Not set"}
            </Typography>
            <Typography sx={{ marginBottom: "10px", opacity: 0.9 }}>
              <strong>Email:</strong> {user?.email || "Not set"}
            </Typography>
            <Typography sx={{ marginBottom: "10px", opacity: 0.9 }}>
              <strong>School:</strong> {user?.school || "Not set"}
            </Typography>
            <Typography sx={{ opacity: 0.9 }}>
              <strong>State:</strong> {user?.state || "Not set"}
            </Typography>
          </CardContent>
        </Card>

        {/* Change Password Card */}
        <Card
          sx={{
            backgroundColor: "rgba(255,255,255,0.05)",
            border: `1px solid rgba(255,255,255,0.1)`,
            color: colors.text_primary || "#FFFFFF",
          }}
        >
          <CardContent>
            <Typography variant="h6" sx={{ marginBottom: "20px", fontWeight: 600 }}>
              Change Password
            </Typography>

            {message && (
              <Box
                sx={{
                  padding: "12px",
                  marginBottom: "15px",
                  borderRadius: "6px",
                  backgroundColor:
                    message.type === "error"
                      ? "rgba(220, 38, 38, 0.1)"
                      : "rgba(34, 197, 94, 0.1)",
                  color:
                    message.type === "error"
                      ? "#fca5a5"
                      : "#86efac",
                  fontSize: "14px",
                }}
              >
                {message.text}
              </Box>
            )}

            <form onSubmit={handleChangePassword}>
              <TextField
                fullWidth
                type="password"
                label="Current Password"
                name="currentPassword"
                variant="outlined"
                margin="normal"
                required
                sx={{
                  "& .MuiOutlinedInput-root": {
                    color: colors.text_primary || "#FFFFFF",
                    "& fieldset": {
                      borderColor: "rgba(255,255,255,0.2)",
                    },
                    "&:hover fieldset": {
                      borderColor: "rgba(255,255,255,0.4)",
                    },
                  },
                  "& .MuiInputBase-input::placeholder": {
                    opacity: 0.7,
                  },
                  "& .MuiInputLabel-root": {
                    color: "rgba(255,255,255,0.7)",
                  },
                }}
              />

              <TextField
                fullWidth
                type="password"
                label="New Password"
                name="newPassword"
                variant="outlined"
                margin="normal"
                required
                sx={{
                  "& .MuiOutlinedInput-root": {
                    color: colors.text_primary || "#FFFFFF",
                    "& fieldset": {
                      borderColor: "rgba(255,255,255,0.2)",
                    },
                    "&:hover fieldset": {
                      borderColor: "rgba(255,255,255,0.4)",
                    },
                  },
                  "& .MuiInputBase-input::placeholder": {
                    opacity: 0.7,
                  },
                  "& .MuiInputLabel-root": {
                    color: "rgba(255,255,255,0.7)",
                  },
                }}
              />

              <TextField
                fullWidth
                type="password"
                label="Confirm Password"
                name="confirmPassword"
                variant="outlined"
                margin="normal"
                required
                sx={{
                  "& .MuiOutlinedInput-root": {
                    color: colors.text_primary || "#FFFFFF",
                    "& fieldset": {
                      borderColor: "rgba(255,255,255,0.2)",
                    },
                    "&:hover fieldset": {
                      borderColor: "rgba(255,255,255,0.4)",
                    },
                  },
                  "& .MuiInputBase-input::placeholder": {
                    opacity: 0.7,
                  },
                  "& .MuiInputLabel-root": {
                    color: "rgba(255,255,255,0.7)",
                  },
                }}
              />

              <Button
                type="submit"
                variant="contained"
                fullWidth
                disabled={loading}
                sx={{
                  marginTop: "20px",
                  backgroundColor: "rgba(59, 130, 246, 0.8)",
                  color: "#FFFFFF",
                  "&:hover": {
                    backgroundColor: "rgba(59, 130, 246, 1)",
                  },
                  "&:disabled": {
                    backgroundColor: "rgba(59, 130, 246, 0.4)",
                  },
                }}
              >
                {loading ? "Changing..." : "Change Password"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default SettingsSection2;
