const express = require("express");
const QRCode = require("qrcode");
const { v4: uuid } = require("uuid");
const prisma = require("../db");
const stripe = require("../lib/stripe");
const { sendMail, receiptEmail } = require("../lib/mailer");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

function ageBracketFor(dob) {
  const age = Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 3600 * 1000));
  if (age <= 9) return "U9";
  if (age <= 13) return "U13";
  return "U16";
}

router.get("/events", async (_req, res) => {
  const events = await prisma.event.findMany({
    orderBy: { date: "asc" },
    include: {
      _count: { select: { registrations: true } },
      tournament: { select: { id: true, status: true } },
    },
  });
  res.json(events);
});

// Register (or add) a child, then register them for an event.
// Handles capacity + waitlist automatically.
router.post("/events/:eventId/register", requireAuth, async (req, res) => {
  const { eventId } = req.params;
  const { childId, childName, childDob, notes, waiverAccepted } = req.body;

  if (!waiverAccepted) {
    return res.status(400).json({ error: "Waiver must be accepted to register" });
  }

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: { _count: { select: { registrations: true } } },
  });
  if (!event) return res.status(404).json({ error: "Event not found" });

  const child = childId
    ? await prisma.child.findUnique({ where: { id: childId } })
    : await prisma.child.create({
        data: { parentId: req.user.id, name: childName, dob: new Date(childDob), notes },
      });
  if (!child) return res.status(404).json({ error: "Child not found" });

  const confirmedCount = event._count.registrations;
  const status = confirmedCount < event.capacity ? "CONFIRMED" : "WAITLISTED";
  const qrCode = await QRCode.toDataURL(uuid()); // scanned at Module 2 check-in

  const registration = await prisma.registration.upsert({
    where: { eventId_childId: { eventId, childId: child.id } },
    update: {},
    create: {
      eventId,
      childId: child.id,
      ageBracket: ageBracketFor(child.dob),
      status,
      waiverSignedAt: new Date(),
      qrCode,
      paymentStatus: event.priceCents === 0 ? "PAID" : "UNPAID",
    },
  });

  // Free event: confirm immediately and send the receipt now.
  if (event.priceCents === 0) {
    const parent = await prisma.user.findUnique({ where: { id: req.user.id } });
    const { subject, html } = receiptEmail({
      parentName: parent.name,
      childName: child.name,
      eventName: event.name,
      amountCents: 0,
      qrCode,
    });
    await sendMail({ to: parent.email, subject, html });
    return res.status(201).json({ registration, status, checkoutUrl: null });
  }

  // Paid event: try real Stripe Checkout. If no Stripe account is connected
  // yet (STRIPE_SECRET_KEY missing/placeholder), fall back to a manual-pay
  // flow instead of breaking registration entirely — the org can keep taking
  // e-transfer/cash at the door until the client's Stripe key is added, and
  // nothing else needs to change in the code once it is.
  const stripeConfigured =
    process.env.STRIPE_SECRET_KEY &&
    !process.env.STRIPE_SECRET_KEY.includes("sk_test_missing") &&
    !process.env.STRIPE_SECRET_KEY.includes("...");

  if (!stripeConfigured) {
    const parent = await prisma.user.findUnique({ where: { id: req.user.id } });
    const { subject, html } = receiptEmail({
      parentName: parent.name,
      childName: child.name,
      eventName: event.name,
      amountCents: event.priceCents,
      qrCode,
    });
    await sendMail({
      to: parent.email,
      subject,
      html: html.replace(
        "Amount paid:",
        "Amount due (pay at check-in or by e-transfer — online payment coming soon):"
      ),
    });
    return res.status(201).json({ registration, status, checkoutUrl: null, payAtDoor: true });
  }

  // Paid event, Stripe live: create a real Checkout session. The registration
  // is held (status set above) but paymentStatus stays UNPAID until the
  // `checkout.session.completed` webhook fires — see payments.routes.js.
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "cad",
          product_data: { name: `${event.name} — ${child.name}` },
          unit_amount: event.priceCents,
        },
        quantity: 1,
      },
    ],
    metadata: { registrationId: registration.id },
    success_url: `${process.env.STRIPE_SUCCESS_URL}?registrationId=${registration.id}`,
    cancel_url: process.env.STRIPE_CANCEL_URL,
  });

  res.status(201).json({ registration, status, checkoutUrl: session.url });
});

// Parent dashboard: children, upcoming schedule, coach notes, progress snapshot.
router.get("/parent/dashboard", requireAuth, async (req, res) => {
  const children = await prisma.child.findMany({
    where: { parentId: req.user.id },
    include: {
      registrations: { include: { event: true } },
      coachNotes: { orderBy: { createdAt: "desc" }, take: 5 },
      progress: { include: { lesson: true } },
      badges: true,
    },
  });
  res.json({ children });
});

module.exports = router;