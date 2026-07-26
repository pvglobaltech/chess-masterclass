const express = require("express");
const prisma = require("../db");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();

// QR check-in at the venue: front desk scans, this marks attendance.
router.post("/checkin", requireAuth, requireRole("COACH", "ADMIN"), async (req, res) => {
  const { registrationId } = req.body;
  const registration = await prisma.registration.update({
    where: { id: registrationId },
    data: { checkedInAt: new Date() },
  });
  res.json(registration);
});

router.post(
  "/events/:eventId/tournament",
  requireAuth,
  requireRole("COACH", "ADMIN"),
  async (req, res) => {
    const { eventId } = req.params;
    const { name } = req.body;
    const tournament = await prisma.tournament.upsert({
      where: { eventId },
      update: { status: "LIVE" },
      create: { eventId, name: name || "MasterClass Tournament", status: "LIVE" },
    });
    res.status(201).json(tournament);
  }
);

router.post(
  "/tournaments/:id/rounds",
  requireAuth,
  requireRole("COACH", "ADMIN"),
  async (req, res) => {
    const { id } = req.params;
    const { pairings } = req.body; // [{ boardNumber, whiteChildId, blackChildId }]

    const lastRound = await prisma.round.findFirst({
      where: { tournamentId: id },
      orderBy: { number: "desc" },
    });
    const round = await prisma.round.create({
      data: {
        tournamentId: id,
        number: (lastRound?.number || 0) + 1,
        pairings: { create: pairings },
      },
      include: { pairings: true },
    });
    res.status(201).json(round);
  }
);

router.post(
  "/pairings/:id/result",
  requireAuth,
  requireRole("COACH", "ADMIN"),
  async (req, res) => {
    const { id } = req.params;
    const { result } = req.body; // WHITE_WIN | BLACK_WIN | DRAW
    const pairing = await prisma.pairing.update({ where: { id }, data: { result } });
    res.json(pairing);
  }
);

// Live standings: recomputed on read from pairing results, so it's always
// accurate to the second a coach submits a result — no separate sync job needed.
router.get("/tournaments/:id/standings", async (req, res) => {
  const { id } = req.params;
  const rounds = await prisma.round.findMany({
    where: { tournamentId: id },
    include: { pairings: { include: { whiteChild: true, blackChild: true } } },
  });

  const points = {}; // childId -> { name, points }
  const bump = (childId, name, amount) => {
    if (!childId) return;
    points[childId] = points[childId] || { name, points: 0 };
    points[childId].points += amount;
  };

  for (const round of rounds) {
    for (const p of round.pairings) {
      if (p.result === "PENDING") continue;
      if (p.result === "DRAW") {
        bump(p.whiteChildId, p.whiteChild.name, 0.5);
        bump(p.blackChildId, p.blackChild?.name, 0.5);
      } else if (p.result === "WHITE_WIN") {
        bump(p.whiteChildId, p.whiteChild.name, 1);
      } else if (p.result === "BLACK_WIN") {
        bump(p.blackChildId, p.blackChild?.name, 1);
      }
    }
  }

  const standings = Object.entries(points)
    .map(([childId, v]) => ({ childId, ...v }))
    .sort((a, b) => b.points - a.points);

  res.json({ roundsPlayed: rounds.length, standings });
  // TODO(module-2): once the event is COMPLETE, generate a PDF certificate
  // per child from `standings` and email/push it to their parent.
});

// Full rounds + pairings for a tournament, used by the coach console to
// show what's pending and let a coach tap a result in for each board.
router.get("/tournaments/:id/rounds", async (req, res) => {
  const { id } = req.params;
  const rounds = await prisma.round.findMany({
    where: { tournamentId: id },
    orderBy: { number: "asc" },
    include: { pairings: { include: { whiteChild: true, blackChild: true }, orderBy: { boardNumber: "asc" } } },
  });
  res.json(rounds);
});

module.exports = router;
