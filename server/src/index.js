import express from "express";
import cors from "cors";
import authRouter from "./routes/auth.js";
import ridesRouter from "./routes/rides.js";
import schoolsRouter from "./routes/schools.js";
import debugRouter from "./routes/debug.js";
import { startRideStatusChecker, stopRideStatusChecker } from "./utils/rideStatusManager.js";
import { connectNotificationDb, closeNotificationDb } from "./utils/notificationDb.js";

const PORT = 5000;
// import { PORT } from "./utils/emailService.js"
import { NODE_ENV } from "./utils/emailService.js";
console.log(`NODE_ENV: ${NODE_ENV}`);

const app = express();

app.use(cors());
app.use(express.json());

// Middleware to track client type (web or mobile)
app.use((req, res, next) => {
  req.clientType = req.headers['x-client-type'] || 'web'; // Default to web
  req.clientPlatform = req.headers['x-client-platform']; // 'ios' or 'android' for mobile
  next();
});

// http://localhost:5000/
app.get("/", (req, res) => {
  console.log("Health check endpoint hit from, " + req.ip);
  res.send(`Go Together API is running.`);
  res.status(200);
});

// http://localhost:5000/api/auth
app.use("/api/auth", authRouter);
// http://localhost:5000/api/rides
app.use("/api/rides", ridesRouter);
// http://localhost:5000/api/schools
app.use("/api/schools", schoolsRouter);

// Debug routes - Only available in development
if (NODE_ENV !== "production") {
  app.use("/debug", debugRouter);
}

const server = app.listen(PORT, '0.0.0.0', async () => {
  console.log(` ----- Server running on http://0.0.0.0:${PORT} ----- `);
  
  // Start the ride status checker
  startRideStatusChecker();

  // Connect to notification database
  try {
    await connectNotificationDb();
  } catch (error) {
    console.error('Failed to connect to notification database:', error);
    // Continue running even if notification DB fails
  }
});

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("SIGTERM received, shutting down gracefully");
  stopRideStatusChecker();
  await closeNotificationDb();
  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});

process.on("SIGINT", async () => {
  console.log("SIGINT received, shutting down gracefully");
  stopRideStatusChecker();
  await closeNotificationDb();
  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});

export const NODEMAIL_USER = process.env.EMAIL_USER;
export const NODEMAIL_PASS = process.env.EMAIL_PASS;