const express = require("express");
const prisma = require("../db");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();

router.post("/feedback", requireAuth, async (req, res) => {
  const { eventId, rating, comments } = req.body;
  const feedback = await prisma.feedbackForm.create({
    data: { eventId, parentId: req.user.id, rating, comments },
  });
  res.status(201).json(feedback);
});

// The "grant officer's dream" view: how many kids, which age brackets,
// where they're coming from, and whether they come back.
router.get("/summary", requireAuth, requireRole("ADMIN"), async (req, res) => {
  const registrations = await prisma.registration.findMany({
    include: { child: { include: { parent: true } }, event: true },
  });

  const byAgeBracket = {};
  const byPostalCode = {};
  const childEventCount = {};

  for (const r of registrations) {
    byAgeBracket[r.ageBracket] = (byAgeBracket[r.ageBracket] || 0) + 1;
    const zip = r.child.parent.postalCode || "unknown";
    byPostalCode[zip] = (byPostalCode[zip] || 0) + 1;
    childEventCount[r.childId] = (childEventCount[r.childId] || 0) + 1;
  }

  const uniqueChildren = Object.keys(childEventCount).length;
  const returningChildren = Object.values(childEventCount).filter((n) => n > 1).length;
  const retentionRate = uniqueChildren ? Math.round((returningChildren / uniqueChildren) * 100) : 0;

  const avgRating = await prisma.feedbackForm.aggregate({ _avg: { rating: true } });

  res.json({
    totalRegistrations: registrations.length,
    uniqueChildrenServed: uniqueChildren,
    retentionRatePercent: retentionRate,
    byAgeBracket,
    byPostalCode,
    averageFeedbackRating: avgRating._avg.rating,
  });
});

// CSV export for funder reports: "We served 120 kids age 6-16 this quarter."
router.get("/export.csv", requireAuth, requireRole("ADMIN"), async (req, res) => {
  const registrations = await prisma.registration.findMany({
    include: { child: { include: { parent: true } }, event: true },
  });

  const header = "event,date,childName,ageBracket,postalCode,status,paymentStatus,checkedIn\n";
  const rows = registrations
    .map((r) =>
      [
        r.event.name,
        r.event.date.toISOString().slice(0, 10),
        r.child.name,
        r.ageBracket,
        r.child.parent.postalCode || "",
        r.status,
        r.paymentStatus,
        r.checkedInAt ? "yes" : "no",
      ].join(",")
    )
    .join("\n");

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment; filename=masterclass-report.csv");
  res.send(header + rows);
});

module.exports = router;
