import nodemailer from "nodemailer";

function getTransporter() {
  if (process.env.EMAIL_HOST) {
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT || 587),
      secure: process.env.EMAIL_SECURE === "true",
      auth: process.env.EMAIL_USER
        ? {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
          }
        : undefined
    });
  }

  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    return nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  }

  return null;
}

async function sendEmail({ to, subject, text, html }) {
  const transporter = getTransporter();

  if (!transporter) {
    console.log(`Email not sent because SMTP is not configured: ${subject}`);
    return { skipped: true };
  }

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to,
    subject,
    text,
    html
  });

  return { skipped: false };
}

export async function sendVerificationEmail(user, token) {
  const baseUrl = process.env.VERIFY_EMAIL_URL || process.env.CLIENT_URL;
  const verificationUrl = baseUrl
    ? `${baseUrl.replace(/\/$/, "")}/verify-email/${token}`
    : `Verification token: ${token}`;

  return sendEmail({
    to: user.email,
    subject: "Verify your Macro Tracker email",
    text: `Verify your email here: ${verificationUrl}`,
    html: `<p>Verify your Macro Tracker email here:</p><p><a href="${verificationUrl}">${verificationUrl}</a></p>`
  });
}

export async function sendPasswordResetEmail(user, token) {
  const baseUrl = process.env.RESET_PASSWORD_URL || process.env.CLIENT_URL;
  const resetUrl = baseUrl
    ? `${baseUrl.replace(/\/$/, "")}/reset-password/${token}`
    : `Password reset token: ${token}`;

  return sendEmail({
    to: user.email,
    subject: "Reset your Macro Tracker password",
    text: `Reset your password here: ${resetUrl}`,
    html: `<p>Reset your Macro Tracker password here:</p><p><a href="${resetUrl}">${resetUrl}</a></p>`
  });
}
