import React, { useState } from "react";
import { TextField, Button, Box, Typography, IconButton } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SchoolSelect, { University } from "./SchoolSelect.tsx";
import { useAuth } from "../context/AuthContext.tsx";

const API_URL = "http://localhost:5000/api/auth";

interface LoginFormProps {
  disabled?: boolean;
}

const LoginForm: React.FC<LoginFormProps> = ({ disabled = false }) => {
  const { login } = useAuth();

  const [stage, setStage] = useState<"email" | "code">("email");
  const [selectedState, setSelectedState] = useState("");
  const [selectedSchool, setSelectedSchool] = useState<University | null>(null);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");

  const handleEmailSubmit = async () => {
    if (!selectedSchool || !selectedState) {
      setError("Please select your state and university first.");
      return;
    }

    const domain = selectedSchool.domain;
    if (!email.endsWith(domain)) {
      setError(`Please use your valid @${domain} email address.`);
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
          domain,
          state: selectedState,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      // ✅ Dynamically reflect backend message
      setStatus(data.message);
      setStage("code");
    } catch (err: any) {
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
    } catch (err: any) {
      setError(err.message);
      setStatus("");
    }
  };

  return (
    <Box>
      {/* ──────────────── EMAIL STAGE ──────────────── */}
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
            disabled={disabled}
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

      {/* ──────────────── CODE STAGE ──────────────── */}
      {stage === "code" && (
        <>
          {/* Back Arrow */}
          <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
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
            <Typography variant="h6" sx={{ ml: 1 }}>
              Enter the 6-digit Verification Code
            </Typography>
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
            <Typography align="center" sx={{ mt: 2, color: "text.secondary" }}>
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
