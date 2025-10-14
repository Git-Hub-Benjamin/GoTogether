import React, { useState } from "react";
import { TextField, Button, Box, Typography, IconButton, Tooltip } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import RefreshIcon from "@mui/icons-material/Refresh";
import SchoolSelect from "./SchoolSelect.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const API_URL = "http://localhost:5000/api/auth";

const LoginForm = ({ disabled = false }) => {
  const { login } = useAuth();

  const [stage, setStage] = useState("email");
  const [selectedState, setSelectedState] = useState("");
  const [selectedSchool, setSelectedSchool] = useState(null);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");

  const handleEmailSubmit = async () => {
    if (!selectedSchool || !selectedState) {
      setError("Please select your state and university first.");
      return;
    }

    setError("");
    setStatus("Sending email...");

    try {
      const res = await fetch(`${API_URL}/verify-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          school: selectedSchool.name,
          state: selectedState,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      // Update status message based on whether code is new or existing
      setStatus(data.existing 
        ? "Previous code is still valid. Please enter it below." 
        : "New verification code sent!");
      setStage("code");
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
          <SchoolSelect
            selectedState={selectedState}
            setSelectedState={setSelectedState}
            selectedSchool={selectedSchool}
            setSelectedSchool={setSelectedSchool}
            disabled={disabled}
          />

          <TextField
            fullWidth
            label="School Email"
            variant="outlined"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            sx={{ mb: 2 }}
            disabled={disabled || !selectedState || !selectedSchool}
            placeholder={!selectedState ? "Select your state first" : !selectedSchool ? "Select your university first" : "Enter your .edu email"}
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
    </Box>
  );
};

export default LoginForm;