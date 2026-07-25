const nodemailer = require("nodemailer");

const hasSmtp = process.env.SMTP_HOST && process.env.SMTP_USER;

const transport = hasSmtp
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    })
  : null;

async function sendMail({ to, subject, html }) {
  if (!transport) {
    // Dev fallback: no SMTP configured yet, so just log it instead of failing silently.
    console.log(`[mailer] (no SMTP configured) would send to ${to}: ${subject}`);
    console.log(html);
    return { simulated: true };
  }
  return transport.sendMail({ from: process.env.SMTP_FROM, to, subject, html });
}

function receiptEmail({ parentName, childName, eventName, amountCents, qrCode }) {
  const amount = (amountCents / 100).toFixed(2);
  return {
    subject: `You're registered for ${eventName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px;">
        <h2>Registration confirmed</h2>
        <p>Hi ${parentName},</p>
        <p><strong>${childName}</strong> is registered for <strong>${eventName}</strong>.</p>
        <p>Amount paid: <strong>$${amount} CAD</strong></p>
        <p>Show this QR code at check-in:</p>
        <img src="${qrCode}" alt="Check-in QR code" width="160" height="160" />
        <p style="color:#666; font-size:13px;">See you on the board!</p>
      </div>
    `,
  };
}

module.exports = { sendMail, receiptEmail };
