import React, { useState } from "react";
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  FormControlLabel,
  Switch,
  Alert,
  CircularProgress,
} from "@mui/material";
import { useAuth } from "../context/AuthContext.jsx";
import { ENDPOINTS } from "../utils/api.js";
import PasswordStrengthMeter from "../components/PasswordStrengthMeter.jsx";

const SignupPage = ({ email, school, state, onSignupSuccess }) => {
  const { login } = useAuth();

  const [name, setName] = useState("");
  const [passwordEnabled, setPasswordEnabled] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [passwordStrength, setPasswordStrength] = useState(0);

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
    if (!passwordEnabled) return true;
    const requirements = validatePassword(password);
    return (
      Object.values(requirements).filter((v) => v).length >= 4 &&
      password === passwordConfirm
    );
  };

  const handlePasswordChange = (e) => {
    const pwd = e.target.value;
    setPassword(pwd);
    setPasswordStrength(getPasswordStrength(pwd));
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Please enter your name");
      return;
    }

    if (passwordEnabled && !isPasswordValid()) {
      setError("Password does not meet requirements or passwords don't match");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${ENDPOINTS.AUTH}/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          school,
          state,
          name,
          passwordEnabled,
          password: passwordEnabled ? password : undefined,
          notificationsEnabled,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Signup failed");
        return;
      }

      // Store token and user info
      login(data.token, data.user);

      // Trigger callback to refresh app state
      if (onSignupSuccess) {
        onSignupSuccess();
      } else {
        // Force page reload to show dashboard
        window.location.href = '/';
      }
    } catch (err) {
      setError(err.message || "An error occurred during signup");
      console.error("Signup error:", err);
    } finally {
      setLoading(false);
    }
  };

  const requirements = passwordEnabled ? validatePassword(password) : null;

  return (
    <Box
      sx={{
        minHeight: "100vh",
        width: "100%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: `linear-gradient(-45deg,
          #223732ff,
          #27443fff,
          #27403C,
          #30514bff
        )`,
        backgroundSize: "400% 600%",
        animation: "gradientDrift 60s ease-in-out infinite",
        "@keyframes gradientDrift": {
          "0%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
          "100%": { backgroundPosition: "0% 50%" },
        },
      }}
    >
      <Container
        maxWidth="lg"
        sx={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          zIndex: 1,
          py: 4,
        }}
      >
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", lg: passwordEnabled ? "1fr 1fr" : "1fr" },
            gap: 3,
            width: { xs: "100%", lg: "100%" },
            maxWidth: { xs: "500px", lg: passwordEnabled ? "1000px" : "500px" },
          }}
        >
          {/* Left Section - Account Info */}
          <Box
            sx={{
              padding: 4,
              borderRadius: 3,
              boxShadow: "0px 6px 18px rgba(0,0,0,0.08)",
              backgroundColor: "rgba(255,255,255,0.95)",
              backdropFilter: "blur(8px)",
              height: passwordEnabled ? "100%" : "fit-content",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Header */}
            <Box sx={{ mb: passwordEnabled ? 3 : 2, textAlign: "center" }}>
              <Typography
                variant={passwordEnabled ? "h4" : "h5"}
                fontWeight={700}
                sx={{ color: "#2e7d32", mb: 0.5 }}
              >
                Create Account
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: passwordEnabled ? "0.875rem" : "0.8rem" }}>
                Complete your GoTogether profile
              </Typography>
            </Box>

            {/* School Info Display */}
            <Box
              sx={{
                p: 1.5,
                mb: 2,
                backgroundColor: "#f5f5f5",
                borderRadius: 2,
                border: "1px solid #e0e0e0",
              }}
            >
              <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: "0.7rem" }}>
                Email
              </Typography>
              <Typography variant="body2" fontWeight={500} sx={{ mb: 0.5, fontSize: "0.85rem" }}>
                {email}
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: "0.7rem" }}>
                School
              </Typography>
              <Typography variant="body2" fontWeight={500} sx={{ mb: 0.5, fontSize: "0.85rem" }}>
                {school}
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: "0.7rem" }}>
                State
              </Typography>
              <Typography variant="body2" fontWeight={500} sx={{ fontSize: "0.85rem" }}>
                {state}
              </Typography>
            </Box>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <form onSubmit={handleSignup} style={{ display: "flex", flexDirection: "column", height: "100%" }}>
              {/* Name Field */}
              <TextField
                fullWidth
                label="Full Name"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                margin="normal"
                disabled={loading}
                required
                sx={{
                  "& .MuiOutlinedInput-root": {
                    "&:hover fieldset": {
                      borderColor: "#2e7d32",
                    },
                  },
                }}
              />

              {/* Password Toggle */}
              <FormControlLabel
                control={
                  <Switch
                    checked={passwordEnabled}
                    onChange={(e) => {
                      setPasswordEnabled(e.target.checked);
                      if (!e.target.checked) {
                        setPassword("");
                        setPasswordConfirm("");
                        setPasswordStrength(0);
                      }
                    }}
                    disabled={loading}
                  />
                }
                label="Enable Password Login"
                sx={{ my: 1.5 }}
              />

              {/* Security Hint - only show when password is not enabled */}
              {!passwordEnabled && (
                <Box
                  sx={{
                    p: 1.5,
                    mb: 2,
                    backgroundColor: "#fefce8",
                    border: "1px solid #fef08a",
                    borderRadius: 1.5,
                  }}
                >
                  <Typography variant="caption" sx={{ color: "#713f12", fontSize: "0.75rem" }}>
                    Password login is more secure than email-only access. It's recommended to enable it.
                  </Typography>
                </Box>
              )}

              {/* Spacer */}
              <Box sx={{ flex: 1 }} />

              {/* Submit Button - Only on left section when not passwordEnabled or on small screens */}
              {!passwordEnabled && (
                <Button
                  type="submit"
                  fullWidth
                  sx={{
                    mt: 2,
                    padding: "12px",
                    fontWeight: 600,
                    fontSize: "1rem",
                    textTransform: "none",
                    borderRadius: "8px",
                    transition: "all 0.3s ease",
                    backgroundColor: "#2e7d32",
                    color: "white",
                    border: "2px solid #2e7d32",
                    "&:hover:not(:disabled)": {
                      backgroundColor: "#245f26",
                      borderColor: "#1a4620",
                      boxShadow: "0 4px 12px rgba(46, 125, 50, 0.3)",
                    },
                    "&:disabled": {
                      backgroundColor: "transparent",
                      color: "#bdc3c7",
                      borderColor: "#bdc3c7",
                      cursor: "not-allowed",
                    },
                  }}
                  disabled={loading || !name.trim()}
                >
                  {loading ? <CircularProgress size={24} /> : "Create Account"}
                </Button>
              )}
            </form>
          </Box>

          {/* Right Section - Password Setup (only on large screens when passwordEnabled) */}
          {passwordEnabled && (
            <Box
              sx={{
                padding: 4,
                borderRadius: 3,
                boxShadow: "0px 6px 18px rgba(0,0,0,0.08)",
                backgroundColor: "rgba(255,255,255,0.95)",
                backdropFilter: "blur(8px)",
                height: "100%",
                display: { xs: "none", lg: "flex" },
                flexDirection: "column",
              }}
            >
              <Typography
                variant="h6"
                fontWeight={700}
                sx={{ color: "#2e7d32", mb: 3, textAlign: "center" }}
              >
                Set Up Password
              </Typography>

              {/* Password Input */}
              <TextField
                fullWidth
                type="password"
                label="Password"
                value={password}
                onChange={handlePasswordChange}
                margin="normal"
                disabled={loading}
                placeholder="Min 8 characters"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    "&:hover fieldset": {
                      borderColor: "#2e7d32",
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
                label="Confirm Password"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                margin="normal"
                disabled={loading}
                placeholder="Re-enter password"
                error={passwordEnabled && password !== passwordConfirm && password.length > 0}
                helperText={
                  passwordEnabled &&
                  password !== passwordConfirm &&
                  password.length > 0
                    ? "Passwords don't match"
                    : ""
                }
                sx={{
                  "& .MuiOutlinedInput-root": {
                    "&:hover fieldset": {
                      borderColor: "#2e7d32",
                    },
                  },
                }}
              />
            </Box>
          )}
        </Box>

        {/* Password Section on Small Screens */}
        {passwordEnabled && (
          <Box
            sx={{
              display: { xs: "block", lg: "none" },
              width: "100%",
              maxWidth: "500px",
              mt: 3,
              padding: 4,
              borderRadius: 3,
              boxShadow: "0px 6px 18px rgba(0,0,0,0.08)",
              backgroundColor: "rgba(255,255,255,0.95)",
              backdropFilter: "blur(8px)",
            }}
          >
            <Typography
              variant="h6"
              fontWeight={700}
              sx={{ color: "#2e7d32", mb: 3, textAlign: "center" }}
            >
              Set Up Password
            </Typography>

            {/* Password Input */}
            <TextField
              fullWidth
              type="password"
              label="Password"
              value={password}
              onChange={handlePasswordChange}
              margin="normal"
              disabled={loading}
              placeholder="Min 8 characters"
              sx={{
                "& .MuiOutlinedInput-root": {
                  "&:hover fieldset": {
                    borderColor: "#2e7d32",
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
              <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1 }}>
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
              label="Confirm Password"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              margin="normal"
              disabled={loading}
              placeholder="Re-enter password"
              error={passwordEnabled && password !== passwordConfirm && password.length > 0}
              helperText={
                passwordEnabled &&
                password !== passwordConfirm &&
                password.length > 0
                  ? "Passwords don't match"
                  : ""
              }
              sx={{
                "& .MuiOutlinedInput-root": {
                  "&:hover fieldset": {
                    borderColor: "#2e7d32",
                  },
                },
              }}
            />
          </Box>
        )}

        {/* Submit Button - Show below all content */}
        {passwordEnabled && (
          <form onSubmit={handleSignup} style={{ width: "100%", maxWidth: "500px", marginTop: "24px" }}>
            <Button
              type="submit"
              fullWidth
              sx={{
                padding: "12px",
                fontWeight: 600,
                fontSize: "1rem",
                textTransform: "none",
                borderRadius: "8px",
                transition: "all 0.3s ease",
                backgroundColor: "#2e7d32",
                color: "white",
                border: "2px solid #2e7d32",
                "&:hover:not(:disabled)": {
                  backgroundColor: "#245f26",
                  borderColor: "#1a4620",
                  boxShadow: "0 4px 12px rgba(46, 125, 50, 0.3)",
                },
                "&:disabled": {
                  backgroundColor: "transparent",
                  color: "#bdc3c7",
                  borderColor: "#bdc3c7",
                  cursor: "not-allowed",
                },
              }}
              disabled={loading || (passwordEnabled && !isPasswordValid()) || !name.trim()}
            >
              {loading ? <CircularProgress size={24} /> : "Create Account"}
            </Button>
          </form>
        )}
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

export default SignupPage;
