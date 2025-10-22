import { Router } from "express";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { verifyEmailLimiter, verifyCodeLimiter } from "../middleware/rateLimiter.js";
import { sendVerificationEmail } from "../utils/emailService.js";
import { storeDeviceToken, emailHasDeviceToken } from "../utils/notificationDb.js";
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

// Using imported rate limiters from middleware/rateLimiter.js

const verificationCodes = new Map();

router.post("/verify-email", verifyEmailLimiter, async (req, res) => {
  try {
    const { email, school } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required." });
    }

    const university = universities.find(
      (u) => u.name.toLowerCase() === school.toLowerCase()
    );

    if (!university) {
      return res.status(400).json({ message: "Invalid school." });
    }

    // Check email domain
    if (!email.endsWith(university.domains[0])) {
      return res.status(400).json({ 
        message: "Please use your valid @" + university.domains[0] + " email address." 
      });
    }

    // If there's an existing valid code, return success but indicate it's existing
    if (verificationCodes.has(email)) {
      const record = verificationCodes.get(email);
      if (Date.now() < record.expiry) {
        return res.json({ 
          message: "Code is still valid. Please enter your code.",
          email,
          existing: true
        });
      }
      verificationCodes.delete(email);
    }

    // Generate new code
    const code = crypto.randomInt(100000, 999999).toString();
    verificationCodes.set(email, {
      code,
      school,
      attempts: 0,
      expiry: Date.now() + 10 * 60 * 1000,
    });

    await sendVerificationEmail(email, code);

    res.json({ 
      message: "Verification email sent.",
      email,
      existing: false
    });
  } catch (err) {
    console.error("Error sending email:", err);
    res.status(500).json({ message: "Error sending verification email." });
  }
});

router.post("/check-code", verifyCodeLimiter, async (req, res) => {
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

  const response = {
    message: "Email verified successfully!",
    token,
    user: { email, school: record.school, state: uni.state },
  };

  // Handle mobile client device token registration
  // Only request permissions if this is a new user (not in notification DB)
  if (req.clientType === 'mobile') {
    const hasExistingToken = await emailHasDeviceToken(email);
    
    if (!hasExistingToken) {
      // New user - request permissions
      response.requestNotifications = true;
      console.log(`📱 New user ${email} - will request notification permissions`);
    } else {
      console.log(`✅ Returning user ${email} - no permission request needed`);
    }
    
    // If deviceToken is provided, store it
    if (req.body.deviceToken) {
      try {
        await storeDeviceToken(
          email,
          req.body.deviceToken,
          req.clientPlatform // 'ios' or 'android'
        );
        response.notificationsEnabled = true;
        console.log(`✅ Device token registered for ${email} (${req.clientPlatform})`);
      } catch (error) {
        console.error('Error registering device token:', error);
        // Continue even if device token registration fails
      }
    }
  }

  res.json(response);
});

export default router;