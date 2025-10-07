import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail", // you can use another service or SMTP config
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export async function sendVerificationEmail(
  to: string,
  code: string
): Promise<void> {
  const mailOptions = {
    from: `"AggieRides" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Your AggieRides Verification Code",
    text: `Your verification code is: ${code}`,
  };

  await transporter.sendMail(mailOptions);
}