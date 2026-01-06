import { Box, Typography, Switch, FormControlLabel, Button, TextField, Card, CardContent, Dialog, DialogTitle, DialogContent, DialogActions } from "@mui/material";
import { useAuth } from "../../context/AuthContext";
import universityColors from "../../assets/university_colors.json";
import { useState, useEffect } from "react";
import { ENDPOINTS } from "../../utils/api.js";
import PasswordStrengthMeter from "../PasswordStrengthMeter.jsx";

const SettingsSection = ({ 
  active,
}) => {
  const { user } = useAuth();
  
  // Notification settings state
  const [emailUpdates, setEmailUpdates] = useState(false);
  const [rideReminders, setRideReminders] = useState(true);

  // Modal states
  const [deleteAccountModal, setDeleteAccountModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [loginSettingsModal, setLoginSettingsModal] = useState(false);
  const [loginPasswordToggle, setLoginPasswordToggle] = useState(false);
  const [loginShowDisableField, setLoginShowDisableField] = useState(false);
  const [loginDisablePassword, setLoginDisablePassword] = useState("");
  const [loginPasswordMessage, setLoginPasswordMessage] = useState(null);
  const [loginNewPasswordStrength, setLoginNewPasswordStrength] = useState(0);
  const [loginNewPasswordValue, setLoginNewPasswordValue] = useState("");
  const [loginConfirmPasswordValue, setLoginConfirmPasswordValue] = useState("");
  const [loginCurrentPasswordValue, setLoginCurrentPasswordValue] = useState("");
  const [forgotPasswordModal, setForgotPasswordModal] = useState(false);
  const [forgotPasswordStep, setForgotPasswordStep] = useState(1); // 1: initial, 2: enter code
  const [forgotPasswordCode, setForgotPasswordCode] = useState("");
  const [forgotPasswordNewPass, setForgotPasswordNewPass] = useState("");
  const [forgotPasswordConfirmPass, setForgotPasswordConfirmPass] = useState("");
  const [forgotPasswordMessage, setForgotPasswordMessage] = useState(null);
  const [forgotPasswordNewPassStrength, setForgotPasswordNewPassStrength] = useState(0);

  // Loading and message states
  const [saveLoading, setSaveLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [settingsFailed, setSettingsFailed] = useState(false);

  // Form states
  const [profileForm, setProfileForm] = useState({
    name: user?.name || "",
  });

  // Track initial values to detect changes
  const [initialValues, setInitialValues] = useState({
    name: user?.name || "",
    emailUpdates: false,
    rideReminders: true,
    passwordEnabled: false,
  });

  const [hasChanges, setHasChanges] = useState(false);

  const colors =
    universityColors.find(
      (u) => u.university.toLowerCase() === (user?.school || "").toLowerCase()
    )?.colors || {
      bg_primary: "#0F172A",
      bg_secondary: "#1E293B",
      text_primary: "#FFFFFF",
    };

  // Fetch settings from server
  const fetchSettings = async () => {
    try {
      const response = await fetch(`${ENDPOINTS.AUTH}/settings`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Fetched settings:", data);
        const isPasswordEnabled = data.settings.passwordEnabled || false;
        
        setInitialValues(prev => ({
          ...prev,
          passwordEnabled: isPasswordEnabled,
        }));
        setSettingsLoaded(true);
        setSettingsFailed(false);
      } else {
        setSettingsFailed(true);
        setSettingsLoaded(true);
      }
    } catch (error) {
      console.error("Failed to fetch settings:", error);
      setSettingsFailed(true);
      setSettingsLoaded(true);
    }
  };

  // Fetch settings on mount
  useEffect(() => {
    if (active) {
      // Fetch settings in background without full page loading
      setSettingsLoaded(false);
      fetchSettings();
    }
  }, [active]);

  // Password strength calculation (same as SignupPage)
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

  // Check for changes
  useEffect(() => {
    const changed = 
      profileForm.name !== initialValues.name ||
      emailUpdates !== initialValues.emailUpdates ||
      rideReminders !== initialValues.rideReminders;
    
    setHasChanges(changed);
  }, [profileForm.name, emailUpdates, rideReminders, initialValues]);

  // Handle login settings modal toggle
  const handleLoginSettingsToggle = (checked) => {
    setLoginPasswordToggle(checked);
    if (!checked && initialValues.passwordEnabled) {
      // Trying to disable - show current password field
      setLoginShowDisableField(true);
    } else {
      setLoginShowDisableField(false);
      setLoginPasswordMessage(null);
    }
  };

  // Handle login settings modal save
  const handleLoginSettingsSave = async () => {
    setLoginPasswordMessage(null);

    try {
      // If enabling password
      if (loginPasswordToggle && !initialValues.passwordEnabled) {
        // Validate new password fields
        const newPass = loginNewPasswordValue;
        const confirmPass = loginConfirmPasswordValue;

        if (!newPass || !confirmPass) {
          setLoginPasswordMessage({ type: "error", text: "New password and confirmation are required" });
          return;
        }
        if (newPass !== confirmPass) {
          setLoginPasswordMessage({ type: "error", text: "Passwords do not match" });
          return;
        }
        if (newPass.length < 8) {
          setLoginPasswordMessage({ type: "error", text: "Password must be at least 8 characters" });
          return;
        }

        // Update profile with new password
        const response = await fetch(`${ENDPOINTS.AUTH}/update-profile`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            name: profileForm.name,
            passwordEnabled: true,
            newPassword: newPass,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          setLoginPasswordMessage({ type: "error", text: errorData.message || "Failed to enable password" });
          setLoginPasswordToggle(false);
          return;
        }

        setLoginPasswordMessage({ type: "success", text: "Password enabled successfully" });
        setInitialValues(prev => ({ ...prev, passwordEnabled: true }));
        setTimeout(() => {
          setLoginSettingsModal(false);
          setLoginNewPasswordValue("");
          setLoginConfirmPasswordValue("");
          // Refetch settings to ensure UI is up to date
          fetchSettings();
        }, 1500);
      }
      // If changing password (password already enabled)
      else if (loginPasswordToggle && initialValues.passwordEnabled && !loginShowDisableField) {
        // Validate password fields
        const currentPass = loginCurrentPasswordValue;
        const newPass = loginNewPasswordValue;
        const confirmPass = loginConfirmPasswordValue;

        if (!currentPass || !newPass || !confirmPass) {
          setLoginPasswordMessage({ type: "error", text: "All password fields are required" });
          return;
        }
        if (newPass !== confirmPass) {
          setLoginPasswordMessage({ type: "error", text: "New passwords do not match" });
          return;
        }
        if (newPass.length < 8) {
          setLoginPasswordMessage({ type: "error", text: "Password must be at least 8 characters" });
          return;
        }

        // Update profile with current and new password
        const response = await fetch(`${ENDPOINTS.AUTH}/update-profile`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            name: profileForm.name,
            currentPassword: currentPass,
            newPassword: newPass,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          setLoginPasswordMessage({ type: "error", text: errorData.message || "Failed to change password" });
          return;
        }

        setLoginPasswordMessage({ type: "success", text: "Password changed successfully" });
        setTimeout(() => {
          setLoginSettingsModal(false);
          setLoginNewPasswordValue("");
          setLoginConfirmPasswordValue("");
          setLoginCurrentPasswordValue("");
          // Refetch settings to ensure UI is up to date
          fetchSettings();
        }, 1500);
      }
      // If disabling password
      else if (!loginPasswordToggle && initialValues.passwordEnabled) {
        if (!loginDisablePassword) {
          setLoginPasswordMessage({ type: "error", text: "Current password is required" });
          return;
        }

        const disableResponse = await fetch(`${ENDPOINTS.AUTH}/disable-password`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({ currentPassword: loginDisablePassword }),
        });

        if (!disableResponse.ok) {
          const errorData = await disableResponse.json();
          setLoginPasswordMessage({ type: "error", text: errorData.message || "Incorrect password" });
          setLoginPasswordToggle(true);
          return;
        }

        setLoginPasswordMessage({ type: "success", text: "Password login disabled" });
        setInitialValues(prev => ({ ...prev, passwordEnabled: false }));
        setLoginShowDisableField(false);
        setLoginDisablePassword("");
        setLoginNewPasswordValue("");
        setLoginConfirmPasswordValue("");
        setLoginCurrentPasswordValue("");
        setTimeout(() => {
          setLoginSettingsModal(false);
          // Refetch settings to ensure UI is up to date
          fetchSettings();
        }, 1500);
      }
    } catch (error) {
      console.error("Failed to update login settings:", error);
      setLoginPasswordMessage({ type: "error", text: "Failed to update login settings" });
    }
  };

  // Handle delete account
  const handleDeleteAccount = async () => {
    if (deleteConfirmText.toLowerCase() !== "yes") {
      setMessage({ type: "error", text: 'Please type "yes" to confirm account deletion' });
      return;
    }

    setSaveLoading(true);
    try {
      const response = await fetch(`${ENDPOINTS.AUTH}/delete-account`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        setMessage({ type: "error", text: errorData.message || "Failed to delete account" });
        setSaveLoading(false);
        return;
      }

      setMessage({ type: "success", text: "Account deleted successfully. Redirecting..." });
      // Redirect to login or home page
      setTimeout(() => {
        window.location.href = "/";
      }, 2000);
    } catch (error) {
      console.error("Failed to delete account:", error);
      setMessage({ type: "error", text: "Failed to delete account" });
      setSaveLoading(false);
    }
  };

  // Handle save changes
  const handleSaveChanges = async () => {
    setMessage(null);
    setSaveLoading(true);

    try {
      // Prepare update data
      const updateData = {
        name: profileForm.name,
      };

      // Call update-profile endpoint
      const response = await fetch(`${ENDPOINTS.AUTH}/update-profile`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setMessage({ type: "error", text: errorData.message || "Failed to update profile" });
        setSaveLoading(false);
        return;
      }

      setMessage({ type: "success", text: "Settings updated successfully!" });
      
      // Update initial values
      setInitialValues({
        name: profileForm.name,
        emailUpdates,
        rideReminders,
        passwordEnabled: initialValues.passwordEnabled,
      });

      // Fetch updated settings from server
      const settingsResponse = await fetch(`${ENDPOINTS.AUTH}/settings`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (settingsResponse.ok) {
        const settingsData = await settingsResponse.json();
        const isPasswordEnabled = settingsData.settings.passwordEnabled || false;
        setInitialValues(prev => ({
          ...prev,
          passwordEnabled: isPasswordEnabled,
        }));
      }

      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error("Failed to save changes:", error);
      setMessage({ type: "error", text: "Failed to save changes" });
    } finally {
      setSaveLoading(false);
    }
  };

  // Handle forgot password request
  const handleForgotPasswordRequest = async () => {
    setForgotPasswordMessage(null);
    try {
      const response = await fetch(`${ENDPOINTS.AUTH}/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        setForgotPasswordMessage({ type: "error", text: errorData.message || "Failed to send reset code" });
        return;
      }

      setForgotPasswordMessage({ type: "success", text: "Reset code sent to your email!" });
      setForgotPasswordStep(2);
    } catch (error) {
      console.error("Failed to request password reset:", error);
      setForgotPasswordMessage({ type: "error", text: "Failed to send reset code" });
    }
  };

  // Handle forgot password reset
  const handleForgotPasswordReset = async () => {
    setForgotPasswordMessage(null);

    if (!forgotPasswordCode) {
      setForgotPasswordMessage({ type: "error", text: "Reset code is required" });
      return;
    }

    if (!forgotPasswordNewPass || !forgotPasswordConfirmPass) {
      setForgotPasswordMessage({ type: "error", text: "New password and confirmation are required" });
      return;
    }

    if (forgotPasswordNewPass !== forgotPasswordConfirmPass) {
      setForgotPasswordMessage({ type: "error", text: "Passwords do not match" });
      return;
    }

    if (forgotPasswordNewPass.length < 8) {
      setForgotPasswordMessage({ type: "error", text: "Password must be at least 8 characters" });
      return;
    }

    try {
      const response = await fetch(`${ENDPOINTS.AUTH}/verify-reset-code`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: user?.email,
          resetCode: forgotPasswordCode,
          newPassword: forgotPasswordNewPass,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setForgotPasswordMessage({ type: "error", text: errorData.message || "Failed to reset password" });
        return;
      }

      setForgotPasswordMessage({ type: "success", text: "Password reset successfully!" });
      setTimeout(() => {
        setForgotPasswordModal(false);
        setForgotPasswordStep(1);
        setForgotPasswordCode("");
        setForgotPasswordNewPass("");
        setForgotPasswordConfirmPass("");
        setForgotPasswordMessage(null);
        // Refetch settings to ensure UI is up to date
        fetchSettings();
      }, 1500);
    } catch (error) {
      console.error("Failed to reset password:", error);
      setForgotPasswordMessage({ type: "error", text: "Failed to reset password" });
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
        transform: active ? "translateX(0)" : "translateX(-100%)",
        transition:
          "transform 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.4s ease",
        pointerEvents: active ? "all" : "none",
      }}
    >
      {/* Message Alert - at the top */}
      {message && (
        <Box
          sx={{
            maxWidth: "1800px",
            mx: "auto",
            px: { xs: 2, md: 3, lg: 4 },
            pt: 2,
            pb: 1,
          }}
        >
          <Box
            sx={{
              padding: "10px 14px",
              borderRadius: "8px",
              backgroundColor:
                message.type === "error"
                  ? "rgba(220, 38, 38, 0.1)"
                  : "rgba(34, 197, 94, 0.1)",
              color:
                message.type === "error"
                  ? "#dc2626"
                  : "#22c55e",
              fontSize: "13px",
              fontWeight: 500,
            }}
          >
            {message.text}
          </Box>
        </Box>
      )}

      {/* Settings Disabled Message */}
      {settingsLoaded && settingsFailed && (
        <Box
          sx={{
            maxWidth: "1800px",
            mx: "auto",
            px: { xs: 2, md: 3, lg: 4 },
            pt: 2,
            pb: 1,
          }}
        >
          <Box
            sx={{
              padding: "10px 14px",
              borderRadius: "8px",
              backgroundColor: "rgba(220, 38, 38, 0.1)",
              color: "#dc2626",
              fontSize: "13px",
              fontWeight: 500,
            }}
          >
            Failed to load settings. Please refresh the page.
          </Box>
        </Box>
      )}

      <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", sm: "column", md: "row" },
              gap: { xs: 1.5, md: 2 },
              maxWidth: "1800px",
              mx: "auto",
              px: { xs: 2, md: 3, lg: 4 },
              width: "100%",
              opacity: settingsLoaded && !settingsFailed ? 1 : 0.5,
              pointerEvents: settingsLoaded && !settingsFailed ? "auto" : "none",
              transition: "opacity 0.3s ease",
            }}
          >
            {/* Left Column - Account Information */}
            <Box
              sx={{
                flex: { xs: "1 1 100%", sm: "1 1 100%", md: "0 0 calc(50% - 6px)" },
              }}
            >
              {/* Account Information Card */}
              <Card
                sx={{
                  backgroundColor: "#FFFFFF",
                  border: "1px solid rgba(0,0,0,0.1)",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                  borderRadius: "12px",
                }}
              >
                <CardContent sx={{ p: { xs: 1.5, md: 2 } }}>
                  <Typography variant="h6" sx={{ marginBottom: "14px", fontWeight: 600, color: "#000", fontSize: "1rem" }}>
                    Account Information
                  </Typography>

                  <TextField
                    fullWidth
                    label="Name"
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                    margin="dense"
                    variant="outlined"
                    size="small"
                  />

                  <TextField
                    fullWidth
                    label="Email"
                    value={user?.email || "Not set"}
                    disabled
                    margin="dense"
                    variant="outlined"
                    size="small"
                    sx={{
                      "& .MuiOutlinedInput-root.Mui-disabled": {
                        backgroundColor: "rgba(0,0,0,0.04)",
                        color: "rgba(0,0,0,0.6)",
                      },
                    }}
                  />

                  <TextField
                    fullWidth
                    label="School"
                    value={user?.school || "Not set"}
                    disabled
                    margin="dense"
                    variant="outlined"
                    size="small"
                    sx={{
                      "& .MuiOutlinedInput-root.Mui-disabled": {
                        backgroundColor: "rgba(0,0,0,0.04)",
                        color: "rgba(0,0,0,0.6)",
                      },
                    }}
                  />

                  <TextField
                    fullWidth
                    label="State"
                    value={user?.state || "Not set"}
                    disabled
                    margin="dense"
                    variant="outlined"
                    size="small"
                    sx={{
                      "& .MuiOutlinedInput-root.Mui-disabled": {
                        backgroundColor: "rgba(0,0,0,0.04)",
                        color: "rgba(0,0,0,0.6)",
                      },
                    }}
                  />

                  <Button
                    fullWidth
                    variant="contained"
                    onClick={handleSaveChanges}
                    disabled={!hasChanges || saveLoading}
                    sx={{
                      marginTop: "23px",
                      backgroundColor: colors.bg_primary || "#0F172A",
                      color: "#fff",
                      fontWeight: 500,
                      py: 1.2,
                      fontSize: "0.95rem",
                      "&:hover": {
                        backgroundColor: colors.bg_secondary || "#1E293B",
                      },
                      "&:disabled": {
                        backgroundColor: "rgba(0,0,0,0.12)",
                        color: "rgba(0,0,0,0.26)",
                      },
                    }}
                  >
                    {saveLoading ? "Saving..." : "Save Changes"}
                  </Button>
                </CardContent>
              </Card>
            </Box>

            {/* Right Column - Notifications & Privacy Settings */}
            <Box
              sx={{
                flex: { xs: "1 1 100%", sm: "1 1 100%", md: "0 0 calc(50% - 6px)" },
                display: "flex",
                flexDirection: "column",
                gap: 1.5,
              }}
            >
              {/* Notification Settings */}
              <Card
                sx={{
                  backgroundColor: "#FFFFFF",
                  border: "1px solid rgba(0,0,0,0.1)",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                  borderRadius: "12px",
                }}
              >
                <CardContent sx={{ p: { xs: 1.5, md: 2 }, "&:last-child": { pb: { xs: 1.5, md: 2 } } }}>
                  <Typography variant="h6" sx={{ marginBottom: "12px", fontWeight: 600, color: "#000", fontSize: "1rem" }}>
                    Notification Settings
                  </Typography>

                  <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={emailUpdates}
                          onChange={(e) => setEmailUpdates(e.target.checked)}
                          size="small"
                        />
                      }
                      label={<Typography sx={{ color: "#333", fontSize: "0.9rem" }}>Email Updates</Typography>}
                    />

                    <FormControlLabel
                      control={
                        <Switch
                          checked={rideReminders}
                          onChange={(e) => setRideReminders(e.target.checked)}
                          size="small"
                        />
                      }
                      label={<Typography sx={{ color: "#333", fontSize: "0.9rem" }}>Ride Reminders</Typography>}
                    />
                  </Box>
                </CardContent>
              </Card>

              {/* Account Security */}
              <Card
                sx={{
                  backgroundColor: "#FFFFFF",
                  border: "1px solid rgba(0,0,0,0.1)",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                  borderRadius: "12px",
                }}
              >
                <CardContent sx={{ p: { xs: 1.5, md: 2 } }}>
                  <Typography variant="h6" sx={{ marginBottom: "12px", fontWeight: 600, color: "#000", fontSize: "1rem" }}>
                    Account Security
                  </Typography>

                  <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                    <Button
                      fullWidth
                      variant="outlined"
                      onClick={() => {
                        const passwordEnabled = initialValues.passwordEnabled || false;
                        setLoginSettingsModal(true);
                        setLoginPasswordToggle(passwordEnabled);
                        setLoginShowDisableField(false);
                        setLoginDisablePassword("");
                        setLoginPasswordMessage(null);
                      }}
                      sx={{
                        borderColor: colors.bg_primary || "#0F172A",
                        color: colors.bg_primary || "#0F172A",
                        fontWeight: 500,
                        fontSize: "0.9rem",
                        py: 1,
                        transition: "background-color 0.2s ease",
                        "&:hover": {
                          backgroundColor: "rgba(15, 23, 42, 0.06)",
                        },
                      }}
                    >
                      Login Settings
                    </Button>

                    <Button
                      fullWidth
                      variant="outlined"
                      disabled={!initialValues.passwordEnabled}
                      onClick={() => {
                        setForgotPasswordModal(true);
                        setForgotPasswordStep(1);
                        setForgotPasswordCode("");
                        setForgotPasswordNewPass("");
                        setForgotPasswordConfirmPass("");
                        setForgotPasswordMessage(null);
                      }}
                      sx={{
                        borderColor: initialValues.passwordEnabled ? colors.bg_primary || "#0F172A" : "rgba(0,0,0,0.1)",
                        color: initialValues.passwordEnabled ? colors.bg_primary || "#0F172A" : "rgba(0,0,0,0.26)",
                        fontWeight: 500,
                        fontSize: "0.9rem",
                        py: 1,
                        backgroundColor: !initialValues.passwordEnabled ? "rgba(0,0,0,0.04)" : "transparent",
                        cursor: initialValues.passwordEnabled ? "pointer" : "default",
                        transition: "background-color 0.2s ease",
                        "&:hover": initialValues.passwordEnabled ? {
                          backgroundColor: "rgba(15, 23, 42, 0.06)",
                        } : {},
                      }}
                    >
                      Forgot Password
                    </Button>

                    <Button
                      fullWidth
                      variant="outlined"
                      onClick={() => {
                        setDeleteAccountModal(true);
                        setDeleteConfirmText("");
                      }}
                      sx={{
                        borderColor: "#dc2626",
                        color: "#dc2626",
                        fontWeight: 500,
                        fontSize: "0.9rem",
                        py: 1,
                        transition: "background-color 0.2s ease",
                        "&:hover": {
                          backgroundColor: "rgba(220, 38, 38, 0.06)",
                        },
                      }}
                    >
                      Delete Account
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Box>
          </Box>

          {/* Login Settings Modal */}
          <Dialog
            open={loginSettingsModal}
            onClose={() => {
              setLoginSettingsModal(false);
              setLoginPasswordToggle(false);
              setLoginShowDisableField(false);
              setLoginDisablePassword("");
              setLoginNewPasswordValue("");
              setLoginConfirmPasswordValue("");
              setLoginPasswordMessage(null);
              setLoginNewPasswordStrength(0);
            }}
            maxWidth="sm"
            fullWidth
          >
            <DialogTitle sx={{ fontWeight: 600, color: "#000" }}>Login Settings</DialogTitle>
            <DialogContent sx={{ pt: 3 }}>
              {loginPasswordMessage && (
                <Box
                  sx={{
                    padding: "10px 14px",
                    marginBottom: "15px",
                    borderRadius: "8px",
                    backgroundColor:
                      loginPasswordMessage.type === "error"
                        ? "rgba(220, 38, 38, 0.1)"
                        : "rgba(34, 197, 94, 0.1)",
                    color:
                      loginPasswordMessage.type === "error"
                        ? "#dc2626"
                        : "#22c55e",
                    fontSize: "13px",
                    fontWeight: 500,
                  }}
                >
                  {loginPasswordMessage.text}
                </Box>
              )}

              <FormControlLabel
                control={
                  <Switch
                    checked={loginPasswordToggle}
                    onChange={(e) => handleLoginSettingsToggle(e.target.checked)}
                    size="small"
                  />
                }
                label={<Typography sx={{ color: "#333", fontSize: "0.95rem" }}>Password Login</Typography>}
                sx={{ mb: 2 }}
              />

              {/* Show disable password field when toggling off and password is enabled */}
              {loginShowDisableField && initialValues.passwordEnabled && !loginPasswordToggle && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" sx={{ color: "#666", fontSize: "0.85rem", display: "block", mb: 1 }}>
                    Verify your current password to disable password login
                  </Typography>
                  <TextField
                    fullWidth
                    type="password"
                    label="Current Password"
                    value={loginDisablePassword}
                    onChange={(e) => setLoginDisablePassword(e.target.value)}
                    margin="normal"
                    variant="outlined"
                    size="small"
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        "&:hover fieldset": {
                          borderColor: colors.bg_primary || "#0F172A",
                        },
                      },
                    }}
                  />
                </Box>
              )}

              {/* Show new password fields when enabling password */}
              {loginPasswordToggle && !initialValues.passwordEnabled && (
                <Box sx={{ mb: 2 }}>
                  <TextField
                    fullWidth
                    type="password"
                    label="New Password"
                    id="login-new-password"
                    value={loginNewPasswordValue}
                    onChange={(e) => {
                      const pwd = e.target.value;
                      setLoginNewPasswordValue(pwd);
                      setLoginNewPasswordStrength(getPasswordStrength(pwd));
                    }}
                    margin="normal"
                    variant="outlined"
                    size="small"
                    placeholder="Min 8 characters"
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        "&:hover fieldset": {
                          borderColor: colors.bg_primary || "#0F172A",
                        },
                      },
                    }}
                  />
                  
                  {/* Password Strength Meter */}
                  <PasswordStrengthMeter strength={loginNewPasswordStrength} />

                  {/* Requirements Checklist */}
                  {(() => {
                    const requirements = validatePassword(loginNewPasswordValue);
                    return (
                      <Box sx={{ p: 1.5, my: 1.5, backgroundColor: "#f9f9f9", borderRadius: 1 }}>
                        <Typography variant="caption" fontWeight={600} display="block" sx={{ mb: 1, fontSize: "0.75rem" }}>
                          Requirements:
                        </Typography>
                        <Box sx={{ display: "grid", gridTemplateColumns: "1fr", gap: 0.75 }}>
                          <RequirementCheck met={requirements.length} text="At least 8 characters" />
                          <RequirementCheck met={requirements.uppercase} text="Uppercase letter (A-Z)" />
                          <RequirementCheck met={requirements.lowercase} text="Lowercase letter (a-z)" />
                          <RequirementCheck met={requirements.number} text="Number (0-9)" />
                          <RequirementCheck met={requirements.special} text="Special character" />
                        </Box>
                      </Box>
                    );
                  })()}

                  <TextField
                    fullWidth
                    type="password"
                    label="Confirm Password"
                    id="login-confirm-password"
                    value={loginConfirmPasswordValue}
                    onChange={(e) => setLoginConfirmPasswordValue(e.target.value)}
                    margin="normal"
                    variant="outlined"
                    size="small"
                    placeholder="Re-enter password"
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        "&:hover fieldset": {
                          borderColor: colors.bg_primary || "#0F172A",
                        },
                      },
                    }}
                  />
                </Box>
              )}

              {/* Show current password field when password is enabled and toggled on */}
              {loginPasswordToggle && initialValues.passwordEnabled && !loginShowDisableField && (
                <Box sx={{ mb: 2 }}>
                  <TextField
                    fullWidth
                    type="password"
                    label="Current Password"
                    value={loginCurrentPasswordValue}
                    onChange={(e) => setLoginCurrentPasswordValue(e.target.value)}
                    margin="normal"
                    variant="outlined"
                    size="small"
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        "&:hover fieldset": {
                          borderColor: colors.bg_primary || "#0F172A",
                        },
                      },
                    }}
                  />
                  
                  <TextField
                    fullWidth
                    type="password"
                    label="New Password"
                    id="login-new-password-change"
                    value={loginNewPasswordValue}
                    onChange={(e) => {
                      const pwd = e.target.value;
                      setLoginNewPasswordValue(pwd);
                      setLoginNewPasswordStrength(getPasswordStrength(pwd));
                    }}
                    margin="normal"
                    variant="outlined"
                    size="small"
                    placeholder="Min 8 characters"
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        "&:hover fieldset": {
                          borderColor: colors.bg_primary || "#0F172A",
                        },
                      },
                    }}
                  />

                  {/* Password Strength Meter */}
                  <PasswordStrengthMeter strength={loginNewPasswordStrength} />

                  {/* Requirements Checklist */}
                  {(() => {
                    const requirements = validatePassword(loginNewPasswordValue);
                    return (
                      <Box sx={{ p: 1.5, my: 1.5, backgroundColor: "#f9f9f9", borderRadius: 1 }}>
                        <Typography variant="caption" fontWeight={600} display="block" sx={{ mb: 1, fontSize: "0.75rem" }}>
                          Requirements:
                        </Typography>
                        <Box sx={{ display: "grid", gridTemplateColumns: "1fr", gap: 0.75 }}>
                          <RequirementCheck met={requirements.length} text="At least 8 characters" />
                          <RequirementCheck met={requirements.uppercase} text="Uppercase letter (A-Z)" />
                          <RequirementCheck met={requirements.lowercase} text="Lowercase letter (a-z)" />
                          <RequirementCheck met={requirements.number} text="Number (0-9)" />
                          <RequirementCheck met={requirements.special} text="Special character" />
                        </Box>
                      </Box>
                    );
                  })()}

                  <TextField
                    fullWidth
                    type="password"
                    label="Confirm Password"
                    id="login-confirm-password"
                    value={loginConfirmPasswordValue}
                    onChange={(e) => setLoginConfirmPasswordValue(e.target.value)}
                    margin="normal"
                    variant="outlined"
                    size="small"
                    placeholder="Re-enter password"
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        "&:hover fieldset": {
                          borderColor: colors.bg_primary || "#0F172A",
                        },
                      },
                    }}
                  />
                </Box>
              )}
            </DialogContent>
            <DialogActions sx={{ p: 2, gap: 1 }}>
              <Button
                onClick={() => setLoginSettingsModal(false)}
                variant="outlined"
              >
                Cancel
              </Button>
              <Button
                onClick={handleLoginSettingsSave}
                variant="contained"
                sx={{
                  backgroundColor: colors.bg_primary || "#0F172A",
                  color: "#fff",
                  "&:hover": {
                    backgroundColor: colors.bg_secondary || "#1E293B",
                  },
                }}
              >
                Save Changes
              </Button>
            </DialogActions>
          </Dialog>

          {/* Delete Account Modal */}
          <Dialog
            open={deleteAccountModal}
            onClose={() => setDeleteAccountModal(false)}
            maxWidth="sm"
            fullWidth
          >
            <DialogTitle sx={{ fontWeight: 600, color: "#dc2626" }}>Delete Account</DialogTitle>
            <DialogContent sx={{ pt: 3 }}>
              <Typography sx={{ mb: 2, color: "#333", fontSize: "0.95rem" }}>
                This action cannot be undone. All your data will be permanently deleted.
              </Typography>
              <Typography sx={{ mb: 3, color: "#666", fontSize: "0.9rem" }}>
                Type <strong>"yes"</strong> to confirm account deletion:
              </Typography>
              <TextField
                fullWidth
                label='Type "yes" to confirm'
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                margin="dense"
                variant="outlined"
                size="small"
              />
            </DialogContent>
            <DialogActions sx={{ p: 2, gap: 1 }}>
              <Button
                onClick={() => setDeleteAccountModal(false)}
                variant="outlined"
              >
                Cancel
              </Button>
              <Button
                onClick={handleDeleteAccount}
                variant="contained"
                disabled={deleteConfirmText.toLowerCase() !== "yes" || saveLoading}
                sx={{
                  backgroundColor: "#dc2626",
                  color: "#fff",
                  "&:hover": {
                    backgroundColor: "#b91c1c",
                  },
                  "&:disabled": {
                    backgroundColor: "rgba(0,0,0,0.12)",
                    color: "rgba(0,0,0,0.26)",
                  },
                }}
              >
                Delete Account
              </Button>
            </DialogActions>
          </Dialog>

          {/* Forgot Password Modal */}
          <Dialog
            open={forgotPasswordModal}
            onClose={() => {
              setForgotPasswordModal(false);
              setForgotPasswordStep(1);
              setForgotPasswordCode("");
              setForgotPasswordNewPass("");
              setForgotPasswordConfirmPass("");
              setForgotPasswordMessage(null);
              setForgotPasswordNewPassStrength(0);
            }}
            maxWidth="sm"
            fullWidth
          >
            <DialogTitle sx={{ fontWeight: 600, color: "#000" }}>Reset Password</DialogTitle>
            <DialogContent sx={{ pt: 3 }}>
              {forgotPasswordMessage && (
                <Box
                  sx={{
                    padding: "10px 14px",
                    marginBottom: "15px",
                    borderRadius: "8px",
                    backgroundColor:
                      forgotPasswordMessage.type === "error"
                        ? "rgba(220, 38, 38, 0.1)"
                        : "rgba(34, 197, 94, 0.1)",
                    color:
                      forgotPasswordMessage.type === "error"
                        ? "#dc2626"
                        : "#22c55e",
                    fontSize: "13px",
                    fontWeight: 500,
                  }}
                >
                  {forgotPasswordMessage.text}
                </Box>
              )}

              {forgotPasswordStep === 1 && (
                <Box>
                  <Typography sx={{ mb: 2, color: "#333", fontSize: "0.95rem" }}>
                    We'll send a reset code to your email address.
                  </Typography>
                </Box>
              )}

              {forgotPasswordStep === 2 && (
                <Box sx={{ mb: 2 }}>
                  <TextField
                    fullWidth
                    label="Reset Code"
                    type="text"
                    value={forgotPasswordCode}
                    onChange={(e) => setForgotPasswordCode(e.target.value)}
                    placeholder="Enter the code from your email"
                    margin="normal"
                    variant="outlined"
                    size="small"
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        "&:hover fieldset": {
                          borderColor: colors.bg_primary || "#0F172A",
                        },
                      },
                    }}
                  />
                  <TextField
                    fullWidth
                    type="password"
                    label="New Password"
                    id="forgot-new-password"
                    value={forgotPasswordNewPass}
                    onChange={(e) => {
                      const pwd = e.target.value;
                      setForgotPasswordNewPass(pwd);
                      setForgotPasswordNewPassStrength(getPasswordStrength(pwd));
                    }}
                    margin="normal"
                    variant="outlined"
                    size="small"
                    placeholder="Min 8 characters"
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        "&:hover fieldset": {
                          borderColor: colors.bg_primary || "#0F172A",
                        },
                      },
                    }}
                  />

                  {/* Password Strength Meter */}
                  <PasswordStrengthMeter strength={forgotPasswordNewPassStrength} />

                  {/* Requirements Checklist */}
                  {(() => {
                    const requirements = validatePassword(forgotPasswordNewPass);
                    return (
                      <Box sx={{ p: 1.5, my: 1.5, backgroundColor: "#f9f9f9", borderRadius: 1 }}>
                        <Typography variant="caption" fontWeight={600} display="block" sx={{ mb: 1, fontSize: "0.75rem" }}>
                          Requirements:
                        </Typography>
                        <Box sx={{ display: "grid", gridTemplateColumns: "1fr", gap: 0.75 }}>
                          <RequirementCheck met={requirements.length} text="At least 8 characters" />
                          <RequirementCheck met={requirements.uppercase} text="Uppercase letter (A-Z)" />
                          <RequirementCheck met={requirements.lowercase} text="Lowercase letter (a-z)" />
                          <RequirementCheck met={requirements.number} text="Number (0-9)" />
                          <RequirementCheck met={requirements.special} text="Special character" />
                        </Box>
                      </Box>
                    );
                  })()}

                  <TextField
                    fullWidth
                    type="password"
                    label="Confirm Password"
                    value={forgotPasswordConfirmPass}
                    onChange={(e) => setForgotPasswordConfirmPass(e.target.value)}
                    margin="normal"
                    variant="outlined"
                    size="small"
                    placeholder="Re-enter password"
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        "&:hover fieldset": {
                          borderColor: colors.bg_primary || "#0F172A",
                        },
                      },
                    }}
                  />
                </Box>
              )}
            </DialogContent>
            <DialogActions sx={{ p: 2, gap: 1 }}>
              <Button
                onClick={() => setForgotPasswordModal(false)}
                variant="outlined"
              >
                Cancel
              </Button>
              {forgotPasswordStep === 1 ? (
                <Button
                  onClick={handleForgotPasswordRequest}
                  variant="contained"
                  sx={{
                    backgroundColor: colors.bg_primary || "#0F172A",
                    color: "#fff",
                    "&:hover": {
                      backgroundColor: colors.bg_secondary || "#1E293B",
                    },
                  }}
                >
                  Send Code
                </Button>
              ) : (
                <Button
                  onClick={handleForgotPasswordReset}
                  variant="contained"
                  sx={{
                    backgroundColor: colors.bg_primary || "#0F172A",
                    color: "#fff",
                    "&:hover": {
                      backgroundColor: colors.bg_secondary || "#1E293B",
                    },
                  }}
                >
                  Reset Password
                </Button>
              )}
            </DialogActions>
          </Dialog>
    </Box>
  );
};

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

export default SettingsSection;