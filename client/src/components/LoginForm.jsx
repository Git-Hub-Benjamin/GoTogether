import React, { useState } from "react";
import { TextField, Button, Box, Typography, IconButton, Tooltip } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import RefreshIcon from "@mui/icons-material/Refresh";
// ===== TEMPORARY: USU IMPLEMENTATION ONLY - UNCOMMENT WHEN READY FOR MULTI-SCHOOL =====
// import SchoolSelect from "./SchoolSelect.jsx";
// ===== END TEMPORARY USU CODE =====
import { useAuth } from "../context/AuthContext.jsx";
import { ENDPOINTS } from "../utils/api.js";

const API_URL = ENDPOINTS.AUTH;
  
const LoginForm = ({ disabled = false }) => {
  const { login } = useAuth();

  const [stage, setStage] = useState("email");
  
  // ===== TEMPORARY: USU IMPLEMENTATION ONLY - REMOVE THESE LINES WHEN READY FOR MULTI-SCHOOL =====
  const selectedState = "Utah";
  const selectedSchool = { name: "Utah State University" };
  // ===== END TEMPORARY USU CODE =====

  // ===== ORIGINAL: Multi-school support (commented out for USU implementation) =====
  // const [selectedState, setSelectedState] = useState("");
  // const [selectedSchool, setSelectedSchool] = useState(null);
  // ===== END ORIGINAL CODE =====

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");

  const handleEmailSubmit = async () => {
    // ===== TEMPORARY: USU IMPLEMENTATION ONLY - REMOVE THIS VALIDATION WHEN READY FOR MULTI-SCHOOL =====
    // Hardcoded values check
    if (!email) {
      setError("Please enter your email.");
      return;
    }
    // ===== END TEMPORARY USU CODE =====

    setError("");
    setStatus("Verifying email...");

    try {
      const res = await fetch(`${API_URL}/verify-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          // ===== TEMPORARY: USU IMPLEMENTATION ONLY - HARDCODED VALUES, REMOVE WHEN READY FOR MULTI-SCHOOL =====
          school: selectedSchool.name,
          state: selectedState,
          // ===== END TEMPORARY USU CODE =====
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      // Set authentication method based on response
      if (data.authMethod === "password") {
        // Account has password - move to password entry stage
        setStatus("");
        setStage("password");
      } else {
        // Account uses verification code
        if (data.codeExisting) {
          setStatus("Previous code is still valid. Please enter it below.");
        } else {
          setStatus("Verification code sent to your email!");
        }
        setStage("code");
      }
    } catch (err) {
      setError(err.message);
      setStatus("");
    }
  };

  const handleCodeSubmit = async () => {
    setError("");
    setStatus("Verifying...");

    try {
      const res = await fetch(`${API_URL}/check-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      // Check if user is new or existing
      if (data.isNewUser && data.requiresSignup) {
        // Redirect to signup page with user data
        // Using window.location to pass data and reload
        sessionStorage.setItem('signupData', JSON.stringify({
          email: data.email,
          school: data.school,
          state: data.state,
        }));
        window.location.href = '/signup';
        return;
      }

      // Existing user - login directly
      login(data.token, data.user);
    } catch (err) {
      setError(err.message);
      setStatus("");
    }
  };

  const handlePasswordSubmit = async () => {
    setError("");
    setStatus("Logging in...");

    try {
      const res = await fetch(`${API_URL}/enter-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      // Login successful
      login(data.token, data.user);
    } catch (err) {
      setError(err.message);
      setStatus("");
    }
  };

  return (
    <Box>
      {stage === "email" && (
        <>
          {/* ===== TEMPORARY: USU IMPLEMENTATION ONLY - REMOVE THESE LINES WHEN READY FOR MULTI-SCHOOL ===== */}
          <Box sx={{ mb: 3, p: 2, backgroundColor: "#e8f5e9", borderRadius: 1, border: "2px solid #4caf50" }}>
            <Typography variant="body2" sx={{ color: "#2e7d32", fontWeight: 600 }}>
              Utah State University
            </Typography>
            <Typography variant="caption" sx={{ color: "#558b2f" }}>
              Enter your USU .edu email
            </Typography>
          </Box>
          {/* ===== END TEMPORARY USU CODE ===== */}

          {/* ===== ORIGINAL: School/State selectors (commented out for USU implementation) =====
          <SchoolSelect
            selectedState={selectedState}
            setSelectedState={setSelectedState}
            selectedSchool={selectedSchool}
            setSelectedSchool={setSelectedSchool}
            disabled={disabled}
          />
          ===== END ORIGINAL CODE ===== */}

          <TextField
            fullWidth
            label="School Email"
            variant="outlined"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            sx={{ mb: 2 }}
            disabled={disabled}
            placeholder="Enter your USU .edu email"
          />

          {error && (
            <Typography color="error" variant="body2" sx={{ mb: 2 }}>
              {error}
            </Typography>
          )}

          <Button
            fullWidth
            variant="contained"
            color="success"
            onClick={handleEmailSubmit}
            disabled={disabled || !selectedSchool}
          >
            Send Verification Code
          </Button>

          <Typography align="center" sx={{ mt: 2, color: "text.secondary" }}>
            {status}
          </Typography>
        </>
      )}

      {stage === "code" && (
        <>
          <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <IconButton
                onClick={() => {
                  setStage("email");
                  setCode("");
                  setError("");
                  setStatus("");
                }}
              >
                <ArrowBackIcon />
              </IconButton>
              <Typography
                variant="subtitle1"
                noWrap
                sx={{ ml: 1, mr: 1, fontSize: "0.95rem" }}
              >
                Enter the 6-digit Verification Code
              </Typography>
              <Tooltip title="Resend verification code">
                <IconButton 
                  onClick={handleEmailSubmit}
                  size="small"
                  sx={{
                    '&:hover': {
                      backgroundColor: 'rgba(46, 125, 50, 0.04)'
                    }
                  }}
                >
                  <RefreshIcon fontSize="small" color="success" />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          <TextField
            fullWidth
            label="Verification Code"
            variant="outlined"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            sx={{ mb: 2 }}
          />
          <Button
            fullWidth
            variant="contained"
            color="success"
            onClick={handleCodeSubmit}
          >
            Verify Code
          </Button>

          {status && (
            <Typography
              align="center"
              sx={{ mt: 2, color: "text.secondary" }}
            >
              {status}
            </Typography>
          )}
          {error && (
            <Typography color="error" variant="body2" sx={{ mt: 1 }}>
              {error}
            </Typography>
          )}
        </>
      )}

      {stage === "password" && (
        <>
          <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
            <IconButton
              onClick={() => {
                setStage("email");
                setPassword("");
                setError("");
                setStatus("");
              }}
            >
              <ArrowBackIcon />
            </IconButton>
            <Typography
              variant="subtitle1"
              noWrap
              sx={{ ml: 1, fontSize: "0.95rem" }}
            >
              Enter Your Password
            </Typography>
          </Box>

          <TextField
            fullWidth
            label="Password"
            type="password"
            variant="outlined"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            sx={{ mb: 2 }}
          />
          <Button
            fullWidth
            variant="contained"
            color="success"
            onClick={handlePasswordSubmit}
          >
            Login
          </Button>

          {status && (
            <Typography
              align="center"
              sx={{ mt: 2, color: "text.secondary" }}
            >
              {status}
            </Typography>
          )}
          {error && (
            <Typography color="error" variant="body2" sx={{ mt: 1 }}>
              {error}
            </Typography>
          )}
        </>
      )}
    </Box>
  );
};

export default LoginForm;