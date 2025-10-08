import { Router } from "express";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import rateLimit from "express-rate-limit";
import { sendVerificationEmail } from "../utils/emailService.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UNIVERSITIES_PATH = path.join(
  __dirname,
  "../data/us_universities.json"
);
const universities = JSON.parse(
  fs.readFileSync(UNIVERSITIES_PATH, "utf-8")
);

const router = Router();

const verifyEmailLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  message: {
    message: "Too many verification requests. Please try again later.",
  },
});

const verifyCodeLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 25,
  message: {
    message:
      "Too many verification attempts. Please try again later.",
  },
});

const verificationCodes = new Map();

router.post("/verify-email", verifyEmailLimiter, async (req, res) => {
  
  try {
    // try to destruct the email and school
    const { email, school } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required." });
    }

    // find school
    const university = universities.find(
      (u) => u.name.toLowerCase() === school.toLowerCase()
    );

    // check for existence
    if (!university) {
      return res.status(400).json({ message: "Invalid school." });
    }

    //! fix -- check if a code was already sent and is still valid
    if (verificationCodes.has(email)) {
      const record = verificationCodes.get(email);
      if (Date.now() < record.expiry) {
        return res
          .status(400)
          .json({ message: "A code has already been sent to this email." });
      }
      verificationCodes.delete(email);
    }

    if (email.endsWith(university.domains[0]) === false) {
      return res
        .status(400)
        .json({ message: "Please use your valid @" + university.domains[0] + " email address." });
    }
    
    // generate 6 digit code
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

router.post("/check-code", verifyCodeLimiter, (req, res) => {
  console.log("Body:", req.body);

  const { email, code } = req.body;
  const record = verificationCodes.get(email);

  if (!record) {
    return res
      .status(400)
      .json({ message: "No verification process for this email." });
  }

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

  verificationCodes.delete(email);

  const token = jwt.sign(
    { email, school: record.school },
    process.env.JWT_SECRET || "secret",
    { expiresIn: "7d" }
  );

  const uni = universities.find(
    (u) => u.name.toLowerCase() === record.school.toLowerCase()
  );

  const colors =
    uni && Array.isArray(uni.colors) && uni.colors.length > 0
      ? uni.colors
      : ["#00263A", "#335a6d"];

  res.json({
    message: "Email verified successfully!",
    token,
    user: { email, school: record.school, state: uni.state ,colors },
  });
});

export default router;