import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRouter from "./routes/auth";
import ridesRouter from "./routes/rides";
import schoolsRouter from "./routes/schools";
import nearbyRouter from "./routes/nearby"

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Go-Together backend is running 🚗");
});

app.use("/api/auth", authRouter);
app.use("/api/rides", ridesRouter);
app.use("/api/schools", schoolsRouter);
app.use("/api/nearby", nearbyRouter);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});