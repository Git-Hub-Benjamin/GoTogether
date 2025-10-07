import express, { Request, Response } from "express";
import universities from "../data/us_universities.json";
import { findNearbyCitiesDynamic } from "../utils/findNearbyCities.js";
//! Weird import bug
//import { nearbyLimiter } from "../middleware/nearbyLimiter.js"; // ✅ Import limiter

const router = express.Router();
//! remove me when fixed
import rateLimit from "express-rate-limit";

//! fix weird import bug
const nearbyLimiter = rateLimit({
  windowMs: 60 * 1000, // 1-minute window
  max: 10, // up to 10 nearby lookups per minute per IP
  message: {
    message: "Too many nearby city requests. Please slow down your search.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

router.get("/:name", nearbyLimiter, (req: Request, res: Response) => { // ✅ Apply limiter
  const { name } = req.params;
  const miles = Number(req.query.miles) || 100;

  const university = (universities as any[]).find(
    (u) => u.name.toLowerCase() === name.toLowerCase()
  );

  if (!university) {
    return res.status(404).json({ message: "University not found" });
  }

  const nearbyCities = findNearbyCitiesDynamic(
    university.lat,
    university.lng,
    miles
  );

  res.json({
    university: university.name,
    radius_miles: miles,
    nearbyCities,
  });
});

export default router;