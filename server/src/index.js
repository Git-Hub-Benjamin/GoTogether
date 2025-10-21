import express from "express";
import cors from "cors";
import authRouter from "./routes/auth.js";
import ridesRouter from "./routes/rides.js";
import schoolsRouter from "./routes/schools.js";
import debugRouter from "./routes/debug.js";
import { startRideStatusChecker, stopRideStatusChecker } from "./utils/rideStatusManager.js";

import { PORT } from "./utils/emailService.js"
import { NODE_ENV } from "./utils/emailService.js";
console.log(`NODE_ENV: ${NODE_ENV}`);

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Go-Together backend is running 🚗");
});

app.use("/api/auth", authRouter);
app.use("/api/rides", ridesRouter);
app.use("/api/schools", schoolsRouter);

// Debug routes - Only available in development
if (NODE_ENV !== "production") {
  app.use("/debug", debugRouter);
}

const server = app.listen(PORT, () => {
  console.log(` ----- Server running on http://localhost:${PORT} ----- `);
  
  // Start the ride status checker
  startRideStatusChecker();
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully");
  stopRideStatusChecker();
  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  console.log("SIGINT received, shutting down gracefully");
  stopRideStatusChecker();
  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});

export const NODEMAIL_USER = process.env.EMAIL_USER;
export const NODEMAIL_PASS = process.env.EMAIL_PASS;