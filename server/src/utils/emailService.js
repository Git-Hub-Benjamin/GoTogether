import { logDebug } from "./logger.js";

//* Uncomment and configure to enable real email sending & change mockTransporter to realTransporter

// import nodemailer from 'nodemailer';

// const realTransporter = nodemailer.createTransport({
//   service: 'gmail',  // or custom SMTP
//   auth: {
//     user: process.env.EMAIL_USER || 'your-email@gmail.com',
//     pass: process.env.EMAIL_PASS || 'your-app-specific-password'
//   }
// });

// // Test the connection
// realTransporter.verify((error, success) => {
//   if (error) {
//     console.error('Email setup error:', error);
//   } else {
//     console.log('Email server is ready');
//   }
// });


// Email sending temporarily disabled - debug mode only
const mockTransporter = {
  sendMail: (mailOptions) => {
    logDebug("📧 DEBUG: Email would have been sent:", {
      to: mailOptions.to,
      subject: mailOptions.subject,
      text: mailOptions.text,
      html: mailOptions.html
    });
    return Promise.resolve();
  }
};

const transporter = mockTransporter; // Change to realTransporter to enable real emails

export async function sendVerificationEmail(to, code) {
  const mailOptions = {
    from: `"GoTogether" <noreply@gotogether.app>`,
    to,
    subject: "Your GoTogether Verification Code",
    text: `Your verification code is: ${code}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #2563eb;">Verify Your Email</h2>
        <p>Welcome to GoTogether! Please use the following code to verify your email address:</p>
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0;">
          <span style="font-size: 24px; font-weight: bold; letter-spacing: 2px;">${code}</span>
        </div>
        <p style="color: #6b7280; font-size: 14px;">This code will expire in 15 minutes.</p>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
}

export async function sendRequestEmail(driverEmail, requesterEmail, from, to, date) {
  const mailOptions = {
    from: `"GoTogether" <noreply@gotogether.app>`,
    to: driverEmail,
    subject: "New Ride Request",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #2563eb;">New Ride Request</h2>
        <p>${requesterEmail} has requested to join your ride:</p>
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 8px 0;">
            <b style="color: #4b5563;">From:</b> ${from}<br>
            <b style="color: #4b5563;">To:</b> ${to}<br>
            <b style="color: #4b5563;">Date:</b> ${date}
          </p>
        </div>
        <div style="text-align: center; margin-top: 30px;">
          <a href="http://localhost:3000" 
             style="background-color: #2563eb; color: white; padding: 12px 24px; 
                    text-decoration: none; border-radius: 6px; display: inline-block;">
            Manage Ride Requests
          </a>
        </div>
        <p style="color: #6b7280; font-size: 14px; margin-top: 20px; text-align: center;">
          This email was sent from GoTogether. If you didn't create this ride, please ignore this email.
        </p>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
}

export async function sendRideDeletedEmail(to, from, destination, date) {
  const mailOptions = {
    from: `"GoTogether" <noreply@gotogether.app>`,
    to,
    subject: "Ride Cancelled",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #dc2626;">Ride Cancelled</h2>
        <p>The following ride has been cancelled by the driver:</p>
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 8px 0;">
            <b style="color: #4b5563;">From:</b> ${from}<br>
            <b style="color: #4b5563;">To:</b> ${destination}<br>
            <b style="color: #4b5563;">Date:</b> ${date}
          </p>
        </div>
        <p style="color: #6b7280; font-size: 14px; margin-top: 20px; text-align: center;">
          Please make alternative travel arrangements. Thank you for using GoTogether.
        </p>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
}