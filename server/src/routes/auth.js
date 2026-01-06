import { Router } from "express";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { verifyEmailLimiter, verifyCodeLimiter } from "../middleware/rateLimiter.js";
import { sendVerificationEmail } from "../utils/emailService.js";
import { 
  createUser, 
  getUserByEmail, 
  userExists, 
  verifyUserPassword, 
  addDeviceToken, 
  updateLastLogin,
  updateUserProfile,
  deleteUser,
  getNotificationSettings,
  updateNotificationSettings
} from "../utils/userDb.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { logDebug } from "../utils/logger.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UNIVERSITIES_PATH = path.join(
  __dirname,
  "../data/us_universities.json"
);
const universities = JSON.parse(
  fs.readFileSync(UNIVERSITIES_PATH, "utf-8")
);

const router = Router();

/**
 * Validate password strength on the server
 * Matches client-side validation from PasswordStrengthMeter
 * Requirements: min 8 chars, uppercase, lowercase, number, special char
 */
function validatePasswordStrength(password) {
  const requirements = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };

  const metRequirements = Object.values(requirements).filter(Boolean).length;
  const allMet = Object.values(requirements).every(Boolean);

  return {
    valid: allMet,
    requirements,
    metRequirements,
    totalRequirements: 5
  };
}

async function createAndSendVerificationCode(email, school, state) {
    const code = crypto.randomInt(100000, 999999).toString();
    verificationCodes.set(email, {
      code,
      school,
      state,
      attempts: 0,
      expiry: Date.now() + 10 * 60 * 1000, // 10 minutes
    });

    await sendVerificationEmail(email, code);
}

// Store verification codes temporarily (in production, use Redis)
const verificationCodes = new Map();

/**
 * POST /auth/verify-email
 * Check if account exists and determine authentication method (password or verification code)
 */
router.post("/verify-email", verifyEmailLimiter, async (req, res) => {
  try {
    const { email, school, state } = req.body;

    if (!email || !school || !state) {
      return res.status(400).json({ message: "Email, school, and state are required." });
    }

    logDebug("POST /auth/verify-email", { email, school });

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

    // Check if user exists in database
    const userExistsResult = await userExists(email);
    
    if (userExistsResult) {
      // User exists - check their authentication method
      const user = await getUserByEmail(email);
      
      logDebug("Existing user attempting login", { email, hasPassword: user.passwordEnabled });

      // Only send verification code if user doesn't have password enabled
      if (!user.passwordEnabled) {
        // User uses verification code authentication - send new code
        await createAndSendVerificationCode(email, school, state);
      }
      return res.json({
        message: "Account found.",
        email,
        accountExists: true,
        authMethod: user.passwordEnabled ? "password" : "code",
        hasPassword: user.passwordEnabled,
        user: {
          name: user.name,
          school: user.school,
          state: user.state
        }
      });
    }

    // New user - send verification code
    logDebug("New user attempting signup", { email, school });

    // If there's an existing valid code, return success but indicate it's existing
    if (verificationCodes.has(email)) {
      const record = verificationCodes.get(email);
      if (Date.now() < record.expiry) {
        return res.json({ 
          message: "Code is still valid. Please enter it below.",
          email,
          accountExists: false,
          authMethod: "code",
          codeExisting: true
        });
      }
      verificationCodes.delete(email);
    }

    // Generate new code
    await createAndSendVerificationCode(email, school, state);

    res.json({ 
      message: "Verification code sent to your email.",
      email,
      accountExists: false,
      authMethod: "code",
      codeExisting: false
    });
  } catch (err) {
    console.error("Error verifying email:", err);
    res.status(500).json({ message: "Error verifying email." });
  }
});

/**
 * POST /auth/check-code
 * Verify code and check if user exists
 * If user doesn't exist, triggers signup flow
 */
router.post("/check-code", verifyCodeLimiter, async (req, res) => {
  try {
    const { email, code } = req.body;

    logDebug("POST /auth/check-code", { email });

    const record = verificationCodes.get(email);

    if (!record) {
      return res.status(400).json({ 
        message: "No verification process for this email." 
      });
    }

    if (Date.now() > record.expiry) {
      verificationCodes.delete(email);
      return res.status(400).json({ 
        message: "Verification code expired." 
      });
    }

    record.attempts++;
    if (record.attempts > 5) {
      verificationCodes.delete(email);
      return res.status(429).json({ 
        message: "Too many failed attempts." 
      });
    }

    if (record.code !== code) {
      verificationCodes.set(email, record);
      return res.status(400).json({ 
        message: "Invalid code." 
      });
    }

    // Code is valid - check if user exists
    const userExists_result = await userExists(email);

    if (userExists_result) {
      // Existing user - return JWT token
      verificationCodes.delete(email);

      const user = await getUserByEmail(email);
      await updateLastLogin(email);

      const token = jwt.sign(
        { email, school: user.school },
        process.env.JWT_SECRET || "secret",
        { expiresIn: "7d" }
      );

      logDebug("Existing user verified", { email, school: user.school });

      return res.json({
        message: "Email verified successfully!",
        token,
        user: { 
          email: user.email, 
          school: user.school, 
          state: user.state,
          name: user.name,
          passwordEnabled: user.passwordEnabled
        },
        isNewUser: false
      });
    } else {
      // New user - prompt for signup
      verificationCodes.delete(email);

      logDebug("New user detected, redirect to signup", { email });

      return res.json({
        message: "Welcome! Please complete your signup.",
        email,
        school: record.school,
        state: record.state,
        isNewUser: true,
        requiresSignup: true
      });
    }
  } catch (err) {
    console.error("Error checking code:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * POST /auth/signup
 * Create new user account
 * Body: { email, school, state, name, passwordEnabled, password?, deviceToken?, platform? }
 */
router.post("/signup", async (req, res) => {
  try {
    const { email, school, state, name, passwordEnabled, password, deviceToken, platform, notificationsEnabled } = req.body;

    logDebug("POST /auth/signup", { email, name, passwordEnabled, hasPassword: !!password });

    // Validate required fields
    if (!email || !school || !state || !name) {
      return res.status(400).json({ 
        message: "Email, school, state, and name are required." 
      });
    }

    // If password is enabled, validate password strength
    if (passwordEnabled) {
      if (!password) {
        return res.status(400).json({ 
          message: "Password is required when password authentication is enabled." 
        });
      }

      const strengthCheck = validatePasswordStrength(password);
      if (!strengthCheck.valid) {
        return res.status(400).json({ 
          message: "Password does not meet strength requirements.",
          details: "Password must contain: uppercase letter, lowercase letter, number, special character, and be at least 8 characters long."
        });
      }
    }

    // Check if user already exists
    const userAlreadyExists = await userExists(email);
    if (userAlreadyExists) {
      return res.status(400).json({ 
        message: "User with this email already exists." 
      });
    }

    // Validate university domain
    const university = universities.find(
      (u) => u.name.toLowerCase() === school.toLowerCase()
    );

    if (!university) {
      return res.status(400).json({ 
        message: "Invalid school." 
      });
    }

    if (!email.endsWith(university.domains[0])) {
      return res.status(400).json({ 
        message: "Please use your valid @" + university.domains[0] + " email address." 
      });
    }

    // Create user
    await createUser(
      email,
      school,
      state,
      name,
      passwordEnabled ? password : null,
      deviceToken,
      platform || 'web',
      notificationsEnabled !== false // Default to true if not specified
    );

    // Generate JWT token
    const token = jwt.sign(
      { email, school },
      process.env.JWT_SECRET || "secret",
      { expiresIn: "7d" }
    );

    logDebug("New user created successfully", { email, name });

    res.status(201).json({
      message: "Account created successfully!",
      token,
      user: { email, school, state, name },
      notificationsEnabled: notificationsEnabled !== false
    });
  } catch (err) {
    console.error("Error during signup:", err);
    res.status(500).json({ message: err.message || "Server error during signup." });
  }
});

/**
 * POST /auth/login
 * Login with email and password
 * Body: { email, password, deviceToken?, platform? }
 */
router.post("/login", verifyCodeLimiter, async (req, res) => {
  try {
    const { email, password, deviceToken, platform } = req.body;

    logDebug("POST /auth/login", { email, hasPassword: !!password });

    if (!email || !password) {
      return res.status(400).json({ 
        message: "Email and password are required." 
      });
    }

    // Get user
    const user = await getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ 
        message: "Invalid email or password." 
      });
    }

    // Check if user has password enabled
    if (!user.passwordEnabled || !user.password) {
      return res.status(401).json({ 
        message: "This account uses email verification. Please use the verification code login." 
      });
    }

    // Verify password
    const isPasswordValid = await verifyUserPassword(email, password);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        message: "Invalid email or password." 
      });
    }

    // Update last login
    await updateLastLogin(email);

    // Add device token if provided
    if (deviceToken) {
      try {
        await addDeviceToken(email, deviceToken, platform || 'web');
      } catch (tokenErr) {
        console.warn('Failed to add device token:', tokenErr);
        // Continue even if device token fails
      }
    }

    // Generate JWT token
    const token = jwt.sign(
      { email, school: user.school },
      process.env.JWT_SECRET || "secret",
      { expiresIn: "7d" }
    );

    logDebug("User logged in with password", { email });

    res.json({
      message: "Login successful!",
      token,
      user: { 
        email: user.email, 
        school: user.school, 
        state: user.state,
        name: user.name,
        passwordEnabled: user.passwordEnabled
      },
      notificationsEnabled: !!deviceToken
    });
  } catch (err) {
    console.error("Error during login:", err);
    res.status(500).json({ message: "Server error during login." });
  }
});

/**
 * POST /auth/enter-password
 * Login with email and password (simplified for initial login screen)
 * Body: { email, password, deviceToken?, platform? }
 */
router.post("/enter-password", verifyCodeLimiter, async (req, res) => {
  try {
    const { email, password, deviceToken, platform } = req.body;

    logDebug("POST /auth/enter-password", { email, hasPassword: !!password });

    if (!email || !password) {
      return res.status(400).json({ 
        message: "Email and password are required." 
      });
    }

    // Get user
    const user = await getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ 
        message: "Invalid email or password." 
      });
    }

    // Check if user has password enabled
    if (!user.passwordEnabled || !user.password) {
      return res.status(401).json({ 
        message: "This account uses email verification. Please use the verification code login." 
      });
    }

    // Verify password
    const isPasswordValid = await verifyUserPassword(email, password);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        message: "Invalid email or password." 
      });
    }

    // Update last login
    await updateLastLogin(email);

    // Add device token if provided
    if (deviceToken) {
      try {
        await addDeviceToken(email, deviceToken, platform || 'web');
      } catch (tokenErr) {
        console.warn('Failed to add device token:', tokenErr);
        // Continue even if device token fails
      }
    }

    // Generate JWT token
    const token = jwt.sign(
      { email, school: user.school },
      process.env.JWT_SECRET || "secret",
      { expiresIn: "7d" }
    );

    logDebug("User logged in via enter-password", { email });

    res.json({
      message: "Login successful!",
      token,
      user: { 
        email: user.email, 
        school: user.school, 
        state: user.state,
        name: user.name,
        passwordEnabled: user.passwordEnabled
      },
      notificationsEnabled: !!deviceToken
    });
  } catch (err) {
    console.error("Error during enter-password:", err);
    res.status(500).json({ message: "Server error during login." });
  }
});

/**
 * POST /auth/verify-password
 * Check if a user has password authentication enabled
 * Body: { email }
 */
router.post("/verify-password", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ 
        message: "Email is required." 
      });
    }

    const user = await getUserByEmail(email);
    if (!user) {
      // Don't reveal if user doesn't exist
      return res.json({
        email,
        hasPassword: false
      });
    }

    logDebug("POST /auth/verify-password", { email, hasPassword: user.passwordEnabled });

    res.json({
      email,
      hasPassword: user.passwordEnabled || false,
      message: user.passwordEnabled 
        ? "This account has password authentication." 
        : "This account uses email verification."
    });
  } catch (err) {
    console.error("Error checking password status:", err);
    res.status(500).json({ message: "Server error." });
  }
});

/**
 * Middleware to verify JWT token
 */
const verifyJWT = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ message: "No token provided." });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Invalid token format." });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "secret"
    );
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: "Invalid or expired token." });
  }
};

/**
 * POST /auth/update-profile
 * Update user profile (name, password settings)
 * Headers: { Authorization: Bearer <token> }
 * Body: { name, passwordEnabled, currentPassword, newPassword }
 */
router.post("/update-profile", verifyJWT, async (req, res) => {
  try {
    const { name, passwordEnabled, currentPassword, newPassword } = req.body;
    const userEmail = req.user.email;

    // Get current user
    const user = await getUserByEmail(userEmail);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Prepare updates
    const updates = {};

    // Update name if provided
    if (name !== undefined && name.trim() !== "") {
      updates.name = name.trim();
    }

    // Handle password changes
    if (passwordEnabled !== undefined) {
      updates.passwordEnabled = passwordEnabled;

      // If enabling/changing password
      if (passwordEnabled) {
        // Validate new password
        if (!newPassword) {
          return res.status(400).json({ message: "New password is required." });
        }

        // Validate password strength
        const strengthCheck = validatePasswordStrength(newPassword);
        if (!strengthCheck.valid) {
          return res.status(400).json({ 
            message: "Password does not meet strength requirements.",
            details: "Password must contain: uppercase letter, lowercase letter, number, special character, and be at least 8 characters long."
          });
        }

        // If user already has a password, verify current password
        if (user.passwordEnabled && user.password) {
          if (!currentPassword) {
            return res.status(400).json({ message: "Current password is required to change password." });
          }

          const isPasswordValid = await verifyUserPassword(userEmail, currentPassword);
          if (!isPasswordValid) {
            return res.status(401).json({ message: "Current password is incorrect." });
          }
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        updates.password = hashedPassword;
      } else {
        // Disable password authentication
        updates.password = null;
      }
    }

    // Update user profile
    const updatedUser = await updateUserProfile(userEmail, updates);
    if (!updatedUser) {
      console.error('updateUserProfile returned null', { email: userEmail, updates });
      return res.status(404).json({ message: "Failed to update profile." });
    }

    logDebug("User profile updated", { email: userEmail });

    res.json({
      message: "Profile updated successfully!",
      user: updatedUser
    });
  } catch (err) {
    console.error("Error updating profile:", err);
    res.status(500).json({ message: "Server error during profile update." });
  }
});

/**
 * GET /auth/settings
 * Fetch user settings (password enabled status, notification settings, etc)
 * Headers: { Authorization: Bearer <token> }
 */
router.get("/settings", verifyJWT, async (req, res) => {
  try {
    const userEmail = req.user.email;

    // Get current user
    const user = await getUserByEmail(userEmail);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    logDebug("User settings fetched", { email: userEmail });

    res.json({
      settings: {
        passwordEnabled: user.passwordEnabled || false,
        notificationSettings: user.notificationSettings || {
          emailNotifications: true,
          phoneNotifications: true,
          nearbyRides: true,
          nearbyRidesLocation: null,
          notificationRadius: 50
        }
      }
    });
  } catch (err) {
    console.error("Error fetching settings:", err);
    res.status(500).json({ message: "Server error while fetching settings." });
  }
});

/**
 * POST /auth/notification-settings
 * Update user notification settings
 * Headers: { Authorization: Bearer <token> }
 * Body: { emailNotifications?, phoneNotifications?, nearbyRides?, nearbyRidesLocation?, notificationRadius? }
 */
router.post("/notification-settings", verifyJWT, async (req, res) => {
  try {
    const userEmail = req.user.email;
    const { emailNotifications, phoneNotifications, nearbyRides, nearbyRidesLocation, notificationRadius } = req.body;

    // Get current user
    const user = await getUserByEmail(userEmail);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Build settings object with only provided fields
    const settingsToUpdate = {};
    
    if (emailNotifications !== undefined) {
      settingsToUpdate.emailNotifications = emailNotifications;
    }
    if (phoneNotifications !== undefined) {
      settingsToUpdate.phoneNotifications = phoneNotifications;
    }
    if (nearbyRides !== undefined) {
      settingsToUpdate.nearbyRides = nearbyRides;
    }
    if (nearbyRidesLocation !== undefined) {
      settingsToUpdate.nearbyRidesLocation = nearbyRidesLocation;
    }
    if (notificationRadius !== undefined) {
      // Validate radius is a positive number
      if (typeof notificationRadius === 'number' && notificationRadius > 0) {
        settingsToUpdate.notificationRadius = notificationRadius;
      } else {
        return res.status(400).json({ message: "Notification radius must be a positive number." });
      }
    }

    // Update settings
    const updatedSettings = await updateNotificationSettings(userEmail, settingsToUpdate);
    
    if (!updatedSettings) {
      return res.status(404).json({ message: "Failed to update notification settings." });
    }

    logDebug("Notification settings updated", { email: userEmail });

    res.json({
      message: "Notification settings updated successfully!",
      notificationSettings: updatedSettings
    });
  } catch (err) {
    console.error("Error updating notification settings:", err);
    res.status(500).json({ message: "Server error while updating notification settings." });
  }
});

/**
 * GET /auth/notification-settings
 * Fetch user notification settings
 * Headers: { Authorization: Bearer <token> }
 */
router.get("/notification-settings", verifyJWT, async (req, res) => {
  try {
    const userEmail = req.user.email;

    const settings = await getNotificationSettings(userEmail);
    if (!settings) {
      return res.status(404).json({ message: "User not found." });
    }

    logDebug("Notification settings fetched", { email: userEmail });

    res.json({
      notificationSettings: settings
    });
  } catch (err) {
    console.error("Error fetching notification settings:", err);
    res.status(500).json({ message: "Server error while fetching notification settings." });
  }
});

/**
 * POST /auth/disable-password
 * Disable password login (requires current password verification)
 * Headers: { Authorization: Bearer <token> }
 * Body: { currentPassword }
 */
router.post("/disable-password", verifyJWT, async (req, res) => {
  try {
    const { currentPassword } = req.body;
    const userEmail = req.user.email;

    // Get current user
    const user = await getUserByEmail(userEmail);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Check if user has password enabled
    if (!user.passwordEnabled || !user.password) {
      return res.status(400).json({ message: "Password login is not enabled for this account." });
    }

    // Require current password
    if (!currentPassword) {
      return res.status(400).json({ message: "Current password is required to disable password login." });
    }

    // Verify current password
    const isPasswordValid = await verifyUserPassword(userEmail, currentPassword);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Current password is incorrect." });
    }

    // Disable password authentication
    const updatedUser = await updateUserProfile(userEmail, {
      passwordEnabled: false,
      password: null
    });

    if (!updatedUser) {
      return res.status(404).json({ message: "Failed to disable password." });
    }

    logDebug("Password login disabled", { email: userEmail });

    res.json({
      message: "Password login disabled successfully!",
      settings: {
        passwordEnabled: false
      }
    });
  } catch (err) {
    console.error("Error disabling password:", err);
    res.status(500).json({ message: "Server error while disabling password." });
  }
});

/**
 * POST /auth/delete-account
 * Delete user account (requires authentication)
 */
router.post("/delete-account", verifyJWT, async (req, res) => {
  try {
    const userEmail = req.user.email;

    // Get current user to verify they exist
    const user = await getUserByEmail(userEmail);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Delete user from database
    const deleted = await deleteUser(userEmail);
    
    if (!deleted) {
      return res.status(500).json({ message: "Failed to delete account." });
    }

    logDebug("Account deleted", { email: userEmail });

    res.json({
      message: "Account deleted successfully!"
    });
  } catch (err) {
    console.error("Error deleting account:", err);
    res.status(500).json({ message: "Server error while deleting account." });
  }
});

/**
 * POST /auth/forgot-password
 * Send password reset code to user email (requires password to be enabled)
 * Headers: { Authorization: Bearer <token> }
 */
router.post("/forgot-password", verifyJWT, async (req, res) => {
  try {
    const userEmail = req.user.email;

    // Get current user
    const user = await getUserByEmail(userEmail);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Check if user has password enabled
    if (!user.passwordEnabled || !user.password) {
      return res.status(400).json({ message: "This account does not have password authentication enabled." });
    }

    // Generate reset code
    const resetCode = crypto.randomInt(100000, 999999).toString();
    verificationCodes.set(`reset-${userEmail}`, {
      code: resetCode,
      attempts: 0,
      expiry: Date.now() + 15 * 60 * 1000, // 15 minutes
    });

    // Send code to email
    await sendVerificationEmail(userEmail, resetCode, "Password Reset Code");

    logDebug("Password reset code sent", { email: userEmail });

    res.json({
      message: "Password reset code sent to your email!",
      email: userEmail
    });
  } catch (err) {
    console.error("Error sending password reset code:", err);
    res.status(500).json({ message: "Server error while sending reset code." });
  }
});

/**
 * POST /auth/verify-reset-code
 * Verify password reset code
 * Body: { email, resetCode, newPassword }
 */
router.post("/verify-reset-code", async (req, res) => {
  try {
    const { email, resetCode, newPassword } = req.body;

    if (!email || !resetCode || !newPassword) {
      return res.status(400).json({ message: "Email, reset code, and new password are required." });
    }

    // Validate password strength
    const strengthCheck = validatePasswordStrength(newPassword);
    if (!strengthCheck.valid) {
      return res.status(400).json({ 
        message: "Password does not meet strength requirements.",
        details: "Password must contain: uppercase letter, lowercase letter, number, special character, and be at least 8 characters long."
      });
    }

    const record = verificationCodes.get(`reset-${email}`);

    if (!record) {
      return res.status(400).json({ message: "No password reset process for this email." });
    }

    if (Date.now() > record.expiry) {
      verificationCodes.delete(`reset-${email}`);
      return res.status(400).json({ message: "Reset code expired." });
    }

    record.attempts++;
    if (record.attempts > 5) {
      verificationCodes.delete(`reset-${email}`);
      return res.status(429).json({ message: "Too many failed attempts." });
    }

    if (record.code !== resetCode) {
      verificationCodes.set(`reset-${email}`, record);
      return res.status(400).json({ message: "Invalid reset code." });
    }

    // Code is valid - update password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const updatedUser = await updateUserProfile(email, {
      password: hashedPassword
    });

    if (!updatedUser) {
      return res.status(404).json({ message: "Failed to update password." });
    }

    verificationCodes.delete(`reset-${email}`);

    logDebug("Password reset successfully", { email });

    res.json({
      message: "Password reset successfully!"
    });
  } catch (err) {
    console.error("Error verifying reset code:", err);
    res.status(500).json({ message: "Server error while resetting password." });
  }
});

export default router;