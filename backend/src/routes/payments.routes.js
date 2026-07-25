const express = require("express");
const prisma = require("../db");
const stripe = require("../lib/stripe");
const { sendMail, receiptEmail } = require("../lib/mailer");

const router = express.Router();

// IMPORTANT: this route needs the raw request body (not JSON-parsed) to
// verify the Stripe signature. server.js mounts this router at the exact
// path "/webhooks/stripe" with express.raw() applied ONLY to that path —
// applying express.raw() globally would break every other JSON route.
router.post("/", async (req, res) => {
  const signature = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("[stripe webhook] signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const registrationId = session.metadata?.registrationId;
    if (registrationId) {
      const registration = await prisma.registration.update({
        where: { id: registrationId },
        data: { paymentStatus: "PAID", paymentRef: session.payment_intent },
        include: { child: { include: { parent: true } }, event: true },
      });

      const { subject, html } = receiptEmail({
        parentName: registration.child.parent.name,
        childName: registration.child.name,
        eventName: registration.event.name,
        amountCents: session.amount_total,
        qrCode: registration.qrCode,
      });
      await sendMail({ to: registration.child.parent.email, subject, html });
    }
  }

  res.json({ received: true });
});

module.exports = router;
