import { Router } from "express";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { sendVerificationEmail } from "../utils/emailService";
import universities from "../data/us_universities.json"; // ✅ import JSON dataset

import rateLimit from "express-rate-limit";

export const verifyEmailLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  message: { message: "Too many verification requests. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

export const verifyCodeLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 25,
  message: { message: "Too many verification attempts. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

const router = Router();

interface VerificationData {
  code: string;
  school: string;
  attempts: number;
  expiry: number;
}

const verificationCodes = new Map<string, VerificationData>();

// ---------- VERIFY EMAIL ----------
router.post("/verify-email", verifyEmailLimiter, async (req, res) => {
  const { email, school } = req.body;

  try {
    const code = crypto.randomInt(100000, 999999).toString();
    verificationCodes.set(email, {
      code,
      school,
      attempts: 0,
      expiry: Date.now() + 10 * 60 * 1000,
    });

    console.log(`Verification code for ${email}: ${code}`);
    // await sendVerificationEmail(email, code);

    res.json({ message: "Verification email sent.", email });
  } catch (err) {
    console.error("Error sending email:", err);
    res.status(500).json({ message: "Error sending verification email." });
  }
});

// ---------- CHECK CODE ----------
router.post("/check-code", verifyCodeLimiter, (req, res) => {
  const { email, code } = req.body;
  const record = verificationCodes.get(email);

  if (!record)
    return res.status(400).json({
      message: "No verification process for this email.",
    });

  if (Date.now() > record.expiry) {
    verificationCodes.delete(email);
    return res.status(400).json({ message: "Verification code expired." });
  }

  record.attempts++;
  if (record.attempts > 5) {
    verificationCodes.delete(email);
    return res.status(429).json({ message: "Too many failed attempts." });
  }

  if (record.code !== code) {
    verificationCodes.set(email, record);
    return res.status(400).json({ message: "Invalid code." });
  }

  // ✅ Verified — remove record
  verificationCodes.delete(email);

  // Generate JWT token
  const token = jwt.sign(
    { email, school: record.school },
    process.env.JWT_SECRET || "",
    { expiresIn: "7d" }
  );

  // ✅ Find university entry by school name
  const uni = (universities as any[]).find(
    (u) => u.name.toLowerCase() === record.school.toLowerCase()
  );

  // ✅ Fallback gradient if not found or no colors
  const colors =
    uni && Array.isArray(uni.colors) && uni.colors.length > 0
      ? uni.colors
      : ["#00263A", "#335a6d"];

  // ✅ Return user data with colors
  res.json({
    message: "Email verified successfully!",
    token,
    user: { email, school: record.school, colors },
  });
});

export default router;