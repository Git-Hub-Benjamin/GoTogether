import React, { useEffect, useState } from "react";
import { Container, Typography, Box, CircularProgress } from "@mui/material";
import LoginForm from "../components/LoginForm.jsx";

const SERVER_URL = "http://localhost:5000/";

const LoginPage = () => {
  const [serverOnline, setServerOnline] = useState(null);

  const checkServerStatus = async () => {
    try {
      const res = await fetch(SERVER_URL, { method: "GET" });
      if (!res.ok) throw new Error("Not OK");
      setServerOnline(true);
    } catch {
      setServerOnline(false);
    }
  };

  useEffect(() => {
    checkServerStatus();
    const interval = setInterval(checkServerStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  const bubbleColor = serverOnline ? "#2e7d32" : "#d32f2f";

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
        maxWidth="xs"
        sx={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          zIndex: 1,
        }}
      >
        <Box
          sx={{
            padding: 4,
            borderRadius: 3,
            boxShadow: "0px 6px 18px rgba(0,0,0,0.08)",
            backgroundColor: "rgba(255,255,255,0.9)",
            backdropFilter: "blur(8px)",
            width: "100%",
            position: "relative",
            transition: "background 0.4s ease",
          }}
        >
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: 1,
              mb: 3,
            }}
          >
            <Typography
              variant="h5"
              align="center"
              fontWeight={600}
              sx={{
                color: "#2e7d32",
                textShadow: "0 1px 2px rgba(0,0,0,0.06)",
              }}
            >
              GoTogether
            </Typography>

            {serverOnline === null ? (
              <CircularProgress size={16} />
            ) : (
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: "50%",
                  backgroundColor: bubbleColor,
                  animation: serverOnline
                    ? "pulse-green 1.8s ease-in-out infinite"
                    : "none",
                  "@keyframes pulse-green": {
                    "0%, 100%": { opacity: 0.7 },
                    "50%": { opacity: 1 },
                  },
                }}
              />
            )}
          </Box>

          {serverOnline === false && (
            <Typography
              variant="body2"
              align="center"
              color="error"
              sx={{ mb: 2 }}
            >
              ⚠️ Server is offline — please try again later
            </Typography>
          )}

          <LoginForm disabled={!serverOnline} />
        </Box>
      </Container>
    </Box>
  );
};

export default LoginPage;