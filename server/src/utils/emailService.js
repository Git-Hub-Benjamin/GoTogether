import dotenv from "dotenv";
import nodemailer from "nodemailer";
import { google } from "googleapis";
import { logDebug } from "./logger.js";

dotenv.config();
export const PORT = process.env.PORT || 5001;
export const NODE_ENV = process.env.NODE_ENV || "development";

// --- Google OAuth2 Setup ------------------------------------------------------
const oAuth2Client = new google.auth.OAuth2(
  process.env.GMAIL_CLIENT_ID,
  process.env.GMAIL_CLIENT_SECRET
);

oAuth2Client.setCredentials({
  refresh_token: process.env.GMAIL_REFRESH_TOKEN,
});

// --- Create Gmail Transporter (for real sending) ------------------------------
// Uncomment this when you're ready to send real emails via Gmail OAuth2.
//
// async function createRealTransporter() {
//   try {
//     const accessToken = await oAuth2Client.getAccessToken();
//
//     const transporter = nodemailer.createTransport({
//       service: "gmail",
//       auth: {
//         type: "OAuth2",
//         user: process.env.EMAIL_USER,
//         clientId: process.env.GMAIL_CLIENT_ID,
//         clientSecret: process.env.GMAIL_CLIENT_SECRET,
//         refreshToken: process.env.GMAIL_REFRESH_TOKEN,
//         accessToken: accessToken?.token,
//       },
//     });
//
//     // Verify connection on startup
//     transporter.verify((error, success) => {
//       if (error) {
//         console.error("❌ Email setup error:", error);
//       } else {
//         console.log("✅ Gmail OAuth2 transporter is ready");
//       }
//     });
//
//     return transporter;
//   } catch (err) {
//     console.error("❌ Failed to initialize email transporter:", err);
//     return null;
//   }
// }
//
// const transporterPromise = createRealTransporter();

// --- Mock Transporter (for development/testing) -------------------------------
const mockTransporter = {
  sendMail: async (mailOptions) => {
    logDebug("📧 MOCK EMAIL (not sent)", {
      to: mailOptions.to,
      subject: mailOptions.subject,
      text: mailOptions.text,
      htmlPreview: mailOptions.html?.slice(0, 100) + "...",
    });
    return Promise.resolve();
  },
};

// Switch here: use either the real transporter or mock
export const transporter = mockTransporter;
// export const transporter = await createRealTransporter(); // (async top-level not allowed; use function call)

// --- Utility: Send Email ------------------------------------------------------
async function sendMail(options) {
  try {
    await transporter.sendMail(options);
    logDebug(`📨 Email processed | To: ${options.to}, Subject: ${options.subject}`);
  } catch (error) {
    console.error("❌ Email sending error:", error);
  }
}

// --- Email Types --------------------------------------------------------------

export async function sendVerificationEmail(to, code) {
  const mailOptions = {
    from: `"GoTogether" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Your GoTogether Verification Code",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; 
                  margin: 0 auto; padding: 20px;">
        <h2 style="color: #2563eb;">Verify Your Email</h2>
        <p>Welcome to GoTogether! Please use the following code to verify your email address:</p>
        <div style="background-color: #f3f4f6; padding: 12px; border-radius: 8px; 
                    text-align: center; margin: 20px 0;">
          <span style="font-size: 24px; font-weight: bold; letter-spacing: 2px;">
            ${code}
          </span>
        </div>
        <p style="color: #6b7280; font-size: 14px;">This code will expire in 15 minutes.</p>
      </div>
    `,
  };

  console.log(`Verification code for ${to}: ${code}`);
  mailOptions.text = 'Your GoTogether Verification Code: ' + code + '\nThis code will expire in 15 minutes.';

  await sendMail(mailOptions);
}

export async function sendRequestEmail(driverEmail, requesterEmail, from, to, date) {
  const mailOptions = {
    from: `"GoTogether" <${process.env.EMAIL_USER}>`,
    to: driverEmail,
    subject: "New Ride Request",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; 
                  margin: 0 auto; padding: 20px;">
        <h2 style="color: #2563eb;">New Ride Request</h2>
        <p><strong>${requesterEmail}</strong> has requested to join your ride:</p>
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 15px 0;">
          <p><b>From:</b> ${from}<br />
             <b>To:</b> ${to}<br />
             <b>Date:</b> ${date}</p>
        </div>
        <div style="text-align: center; margin-top: 25px;">
          <a href="http://localhost:3000" 
             style="background-color: #2563eb; color: #fff; padding: 12px 24px; 
                    text-decoration: none; border-radius: 6px; display: inline-block;">
            Manage Ride Requests
          </a>
        </div>
        <p style="color: #6b7280; font-size: 14px; text-align: center; margin-top: 20px;">
          This email was sent from GoTogether. If you didn't create this ride, please ignore this email.
        </p>
      </div>
    `,
  };

  await sendMail(mailOptions);
}

export async function sendRideDeletedEmail(to, from, destination, date) {
  const mailOptions = {
    from: `"GoTogether" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Ride Cancelled",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; 
                  margin: 0 auto; padding: 20px;">
        <h2 style="color: #dc2626;">Ride Cancelled</h2>
        <p>The following ride has been cancelled by the driver:</p>
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 15px 0;">
          <p><b>From:</b> ${from}<br />
             <b>To:</b> ${destination}<br />
             <b>Date:</b> ${date}</p>
        </div>
        <p style="color: #6b7280; font-size: 14px; text-align: center;">
          Please make alternative travel arrangements. Thank you for using GoTogether.
        </p>
      </div>
    `,
  };

  await sendMail(mailOptions);
}