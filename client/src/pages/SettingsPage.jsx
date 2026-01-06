import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  FormControlLabel,
  Switch,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DeleteIcon from "@mui/icons-material/Delete";
import { useAuth } from "../context/AuthContext.jsx";
import { ENDPOINTS } from "../utils/api.js";
import PasswordStrengthMeter from "../components/PasswordStrengthMeter.jsx";
import universityColors from "../assets/university_colors.json";

const SettingsPage = ({ onBack }) => {
  const { user, token, login } = useAuth();

  const [name, setName] = useState(user?.name || "");
  const [passwordEnabled, setPasswordEnabled] = useState(false);
  const [initialPasswordEnabled, setInitialPasswordEnabled] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Function to fetch user settings from server
  const fetchSettings = useCallback(async () => {
    try {
      const response = await fetch(`${ENDPOINTS.AUTH}/settings`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        console.error("Failed to fetch settings");
        return;
      }

      const data = await response.json();
      if (data.settings) {
        setPasswordEnabled(data.settings.passwordEnabled || false);
        setInitialPasswordEnabled(data.settings.passwordEnabled || false);
      }
    } catch (err) {
      console.error("Error fetching settings:", err);
    }
  }, [token]);

  // Fetch user settings on component mount
  useEffect(() => {
    if (token) {
      fetchSettings();
    }
  }, [token, fetchSettings]);

  // Password validation requirements
  const getPasswordStrength = (pwd) => {
    let strength = 0;
    if (pwd.length >= 8) strength += 25;
    if (pwd.length >= 12) strength += 10;
    if (/[a-z]/.test(pwd)) strength += 15;
    if (/[A-Z]/.test(pwd)) strength += 15;
    if (/[0-9]/.test(pwd)) strength += 15;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(pwd)) strength += 5;
    return Math.min(strength, 100);
  };

  const validatePassword = (pwd) => {
    const requirements = {
      length: pwd.length >= 8,
      uppercase: /[A-Z]/.test(pwd),
      lowercase: /[a-z]/.test(pwd),
      number: /[0-9]/.test(pwd),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(pwd),
    };
    return requirements;
  };

  const isPasswordValid = () => {
    if (!passwordEnabled || !newPassword) return true;
    const requirements = validatePassword(newPassword);
    return (
      Object.values(requirements).filter((v) => v).length >= 4 &&
      newPassword === confirmPassword
    );
  };

  const handlePasswordChange = (e) => {
    const pwd = e.target.value;
    setNewPassword(pwd);
    setPasswordStrength(getPasswordStrength(pwd));
  };

  const handleSaveChanges = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!name.trim()) {
      setError("Please enter your name");
      return;
    }

    // Check if user is trying to disable password
    const isDisablingPassword = initialPasswordEnabled && !passwordEnabled;
    if (isDisablingPassword && !currentPassword) {
      setError("Please enter your current password to disable password login");
      return;
    }

    if (passwordEnabled && (!newPassword || !isPasswordValid())) {
      setError("Password does not meet requirements or passwords don't match");
      return;
    }

    setLoading(true);

    try {
      // If disabling password, use the disable-password endpoint
      if (isDisablingPassword) {
        const response = await fetch(`${ENDPOINTS.AUTH}/disable-password`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            currentPassword,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          setError(data.message || "Failed to disable password");
          // Re-toggle the switch if password verification failed
          setPasswordEnabled(true);
          return;
        }

        // Success - update local context
        login(token, {
          ...user,
          name: name.trim(),
          passwordEnabled: false,
        });

        setSuccess("Password login disabled successfully!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setPasswordStrength(0);

        // Refetch settings to update initialPasswordEnabled
        await fetchSettings();

        setTimeout(() => setSuccess(""), 3000);
        setLoading(false);
        return;
      }

      // Regular profile update (for name or enabling/updating password)
      const payload = {
        name: name.trim(),
        passwordEnabled,
      };

      // If enabling/updating password, handle current password requirement
      if (passwordEnabled && newPassword) {
        // Only require current password if user already has password enabled
        if (initialPasswordEnabled && !currentPassword) {
          setError("Please enter your current password to set a new password");
          setLoading(false);
          return;
        }
        if (initialPasswordEnabled) {
          payload.currentPassword = currentPassword;
        }
        payload.newPassword = newPassword;
      }

      const response = await fetch(`${ENDPOINTS.AUTH}/update-profile`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Failed to update profile");
        return;
      }

      // Update local user context
      login(token, {
        ...user,
        name: name.trim(),
        passwordEnabled: passwordEnabled,
      });

      setSuccess("Profile updated successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordStrength(0);

      // Refetch settings to update initialPasswordEnabled based on server state
      await fetchSettings();

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.message || "An error occurred");
      console.error("Settings update error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Handle account deletion
  const handleDeleteAccount = async () => {
    if (deleteConfirmation.toLowerCase() !== "yes") {
      setError("Please type 'yes' to confirm account deletion");
      return;
    }

    setDeleteLoading(true);
    try {
      const response = await fetch(`${ENDPOINTS.AUTH}/delete-account`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.message || "Failed to delete account");
        setDeleteLoading(false);
        return;
      }

      // Account deleted successfully - navigate back to login
      setDeleteModalOpen(false);
      setDeleteConfirmation("");
      onBack(); // This should take us back to login page
    } catch (err) {
      setError(err.message || "An error occurred while deleting account");
      console.error("Delete account error:", err);
      setDeleteLoading(false);
    }
  };

  const requirements = passwordEnabled ? validatePassword(newPassword) : null;

  // Get school colors
  const colors = useMemo(() => {
    const schoolTheme = universityColors.find(
      (u) => u.university.toLowerCase() === (user?.school || "").toLowerCase()
    );
    return (
      schoolTheme?.colors || {
        bg_primary: "#0F172A",
        bg_secondary: "#1E293B",
        text_primary: "#FFFFFF",
        header_text: "#fff",
      }
    );
  }, [user?.school]);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        width: "100%",
        background: `linear-gradient(135deg, ${colors.bg_primary}, ${colors.bg_secondary})`,
        paddingTop: 3,
        paddingBottom: 4,
        transition: "background 1s ease",
        position: "relative",
        opacity: 1,
        transform: "translateX(0)",
        animation: "slideInSettings 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards",
        "@keyframes slideInSettings": {
          from: {
            opacity: 0,
            transform: "translateX(100%)",
          },
          to: {
            opacity: 1,
            transform: "translateX(0)",
          },
        },
        zIndex: 10,
        overflow: "hidden",
      }}
    >
      <Container 
        maxWidth="lg"
        sx={{
          height: "100vh",
          overflow: "auto",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Back Button */}
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={onBack}
          sx={{
            color: colors.header_text || "#fff",
            mb: 2,
            "&:hover": {
              backgroundColor: "rgba(255,255,255,0.1)",
            },
          }}
        >
          Back to Dashboard
        </Button>

        {/* Main Settings Card */}
        <Card
          sx={{
            backgroundColor: "rgba(255,255,255,0.95)",
            backdropFilter: "blur(8px)",
            borderRadius: 3,
            boxShadow: "0px 6px 18px rgba(0,0,0,0.08)",
          }}
        >
          <CardContent sx={{ p: 4 }}>
            {/* Header */}
            <Typography
              variant="h4"
              fontWeight={700}
              sx={{ color: colors.bg_primary || "#2e7d32", mb: 1 }}
            >
              Account Settings
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Manage your profile information and security settings
            </Typography>

            {/* Alerts */}
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            {success && (
              <Alert severity="success" sx={{ mb: 2 }}>
                {success}
              </Alert>
            )}

            <form onSubmit={handleSaveChanges}>
              {/* Two Column Layout */}
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                  gap: 3,
                }}
              >
                {/* Account Info Section */}
                <Box>
                  <Typography
                    variant="subtitle1"
                    fontWeight={600}
                    sx={{ mb: 2, color: "#333" }}
                  >
                    Account Information
                  </Typography>

                  {/* Email (Read-only) */}
                  <TextField
                    fullWidth
                    label="School Email"
                    value={user?.email || ""}
                    disabled
                    margin="normal"
                    sx={{
                      "& .MuiOutlinedInput-root.Mui-disabled": {
                        backgroundColor: "#f5f5f5",
                      },
                    }}
                    helperText="Your school email cannot be changed"
                  />

                  {/* Name */}
                  <TextField
                    fullWidth
                    label="Full Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    margin="normal"
                    disabled={loading}
                    required
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        "&:hover fieldset": {
                          borderColor: colors.bg_primary || "#2e7d32",
                        },
                      },
                    }}
                  />

                  {/* School (Read-only) */}
                  <TextField
                    fullWidth
                    label="School"
                    value={user?.school || ""}
                    disabled
                    margin="normal"
                    sx={{
                      "& .MuiOutlinedInput-root.Mui-disabled": {
                        backgroundColor: "#f5f5f5",
                      },
                    }}
                    helperText="Your school cannot be changed"
                  />
                </Box>

                {/* Password Section */}
                <Box>
                  <Typography
                    variant="subtitle1"
                    fontWeight={600}
                    sx={{ mb: 2, color: "#333" }}
                  >
                    Password Settings
                  </Typography>

                  {/* Toggle and Delete Button Row */}
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={passwordEnabled}
                          onChange={(e) => {
                            setPasswordEnabled(e.target.checked);
                            if (!e.target.checked) {
                              // Clearing only current password, keep name field
                              setCurrentPassword("");
                              setNewPassword("");
                              setConfirmPassword("");
                              setPasswordStrength(0);
                            }
                          }}
                          disabled={loading}
                        />
                      }
                      label="Enable Password-Based Login"
                      sx={{ m: 0 }}
                    />

                    {/* Delete Account Button */}
                    <Button
                      startIcon={<DeleteIcon />}
                      onClick={() => setDeleteModalOpen(true)}
                      sx={{
                        backgroundColor: "#ffebee",
                        color: "#c62828",
                        border: "1px solid #ef5350",
                        "&:hover": {
                          backgroundColor: "#ffcdd2",
                        },
                        textTransform: "none",
                        fontWeight: 500,
                        whiteSpace: "nowrap",
                      }}
                    >
                      Delete Account
                    </Button>
                  </Box>

                  {/* Security Hint - only show when password is not enabled */}
                  {!passwordEnabled && (
                    <Box
                      sx={{
                        p: 2,
                        mb: 2,
                        backgroundColor: "#fefce8",
                        border: "1px solid #fef08a",
                        borderRadius: 1.5,
                      }}
                    >
                      <Typography variant="caption" sx={{ color: "#713f12" }}>
                        Password login is more secure than email-only access. It's recommended to enable it.
                      </Typography>
                    </Box>
                  )}

                  {/* Alert for disabling password */}
                  {initialPasswordEnabled && !passwordEnabled && (
                    <Alert severity="warning" sx={{ mb: 2 }}>
                      Enter your current password below to disable password login
                    </Alert>
                  )}

                  {/* Current Password field for disabling password */}
                  {initialPasswordEnabled && !passwordEnabled && (
                    <TextField
                      fullWidth
                      type="password"
                      label="Current Password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      margin="normal"
                      disabled={loading}
                      required
                      helperText="Required to disable password login"
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          "&:hover fieldset": {
                            borderColor: colors.bg_primary || "#2e7d32",
                          },
                        },
                      }}
                    />
                  )}

                  {passwordEnabled && (
                    <Box sx={{ mt: 2, maxHeight: 200, overflowY: "auto", pr: 1 }}>
                      {/* Current Password - only show if user already had password enabled */}
                      {initialPasswordEnabled && (
                        <TextField
                          fullWidth
                          type="password"
                          label="Current Password"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          margin="normal"
                          disabled={loading}
                          required={passwordEnabled}
                          helperText="Required to set a new password"
                          sx={{
                            "& .MuiOutlinedInput-root": {
                              "&:hover fieldset": {
                                borderColor: colors.bg_primary || "#2e7d32",
                              },
                            },
                          }}
                        />
                      )}

                      {/* New Password */}
                      <TextField
                        fullWidth
                        type="password"
                        label={initialPasswordEnabled ? "New Password" : "Password"}
                        value={newPassword}
                        onChange={handlePasswordChange}
                        margin="normal"
                        disabled={loading}
                        required={passwordEnabled}
                        placeholder="Min 8 characters"
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            "&:hover fieldset": {
                              borderColor: colors.bg_primary || "#2e7d32",
                            },
                          },
                        }}
                      />

                      {/* Password Strength Meter */}
                      <PasswordStrengthMeter strength={passwordStrength} />

                      {/* Requirements Checklist */}
                      <Box sx={{ mt: 2, p: 2, backgroundColor: "#f9f9f9", borderRadius: 1 }}>
                        <Typography variant="caption" fontWeight={600} display="block" sx={{ mb: 1 }}>
                          Requirements:
                        </Typography>
                        <Box sx={{ display: "grid", gridTemplateColumns: "1fr", gap: 1 }}>
                          <RequirementCheck
                            met={requirements.length}
                            text="At least 8 characters"
                          />
                          <RequirementCheck
                            met={requirements.uppercase}
                            text="Uppercase letter (A-Z)"
                          />
                          <RequirementCheck
                            met={requirements.lowercase}
                            text="Lowercase letter (a-z)"
                          />
                          <RequirementCheck met={requirements.number} text="Number (0-9)" />
                          <RequirementCheck
                            met={requirements.special}
                            text="Special character"
                          />
                        </Box>
                      </Box>

                      {/* Confirm Password */}
                      <TextField
                        fullWidth
                        type="password"
                        label={initialPasswordEnabled ? "Confirm New Password" : "Confirm Password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        margin="normal"
                        disabled={loading}
                        required={passwordEnabled}
                        placeholder="Re-enter password"
                        error={
                          passwordEnabled &&
                          newPassword !== confirmPassword &&
                          newPassword.length > 0
                        }
                        helperText={
                          passwordEnabled &&
                          newPassword !== confirmPassword &&
                          newPassword.length > 0
                            ? "Passwords don't match"
                            : ""
                        }
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            "&:hover fieldset": {
                              borderColor: colors.bg_primary || "#2e7d32",
                            },
                          },
                        }}
                      />
                    </Box>
                  )}
                </Box>
              </Box>

              {/* Save Button - Full Width Below */}
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{
                  backgroundColor: colors.bg_primary || "#2e7d32",
                  "&:hover": {
                    backgroundColor: colors.bg_secondary || "#245f26",
                  },
                  padding: "12px",
                  fontWeight: 600,
                  mt: 3,
                }}
                disabled={loading || !name.trim() || (passwordEnabled && !isPasswordValid())}
              >
                {loading ? <CircularProgress size={24} /> : "Save Changes"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Delete Account Confirmation Modal */}
        <Dialog
          open={deleteModalOpen}
          onClose={() => {
            setDeleteModalOpen(false);
            setDeleteConfirmation("");
            setError("");
          }}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle sx={{ color: colors.bg_primary || "#2e7d32", fontWeight: 700 }}>
            Delete Account
          </DialogTitle>
          <DialogContent>
            <Typography sx={{ mb: 2, mt: 2, color: "#333" }}>
              Are you sure you want to delete your account? This action cannot be undone.
            </Typography>
            <Typography variant="body2" sx={{ mb: 2, color: "#666" }}>
              Please type <strong>yes</strong> below to confirm account deletion.
            </Typography>
            <TextField
              fullWidth
              placeholder="Type 'yes' to confirm"
              value={deleteConfirmation}
              onChange={(e) => setDeleteConfirmation(e.target.value)}
              disabled={deleteLoading}
              sx={{
                "& .MuiOutlinedInput-root": {
                  "&:hover fieldset": {
                    borderColor: colors.bg_primary || "#2e7d32",
                  },
                },
              }}
            />
            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}
          </DialogContent>
          <DialogActions sx={{ justifyContent: "center", gap: 2, pb: 2 }}>
            <Button
              onClick={() => {
                setDeleteModalOpen(false);
                setDeleteConfirmation("");
                setError("");
              }}
              disabled={deleteLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteAccount}
              disabled={deleteLoading || deleteConfirmation.toLowerCase() !== "yes"}
              variant="contained"
              sx={{
                backgroundColor: "#c62828",
                "&:hover": {
                  backgroundColor: "#ad1457",
                },
              }}
            >
              {deleteLoading ? <CircularProgress size={24} /> : "Delete Account"}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
};

// Helper Component for Requirements
const RequirementCheck = ({ met, text }) => (
  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
    <Box
      sx={{
        width: 16,
        height: 16,
        borderRadius: "50%",
        backgroundColor: met ? "#2e7d32" : "#ccc",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "white",
        fontSize: "12px",
        fontWeight: "bold",
        flexShrink: 0,
      }}
    >
      {met ? "✓" : ""}
    </Box>
    <Typography variant="caption" sx={{ color: met ? "#2e7d32" : "#999" }}>
      {text}
    </Typography>
  </Box>
);

export default SettingsPage;
