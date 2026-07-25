const express = require("express");
const prisma = require("../db");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();

router.get("/sponsors", async (req, res) => {
  const { eventId } = req.query;
  const sponsors = await prisma.sponsor.findMany({
    where: eventId ? { eventId } : undefined,
    orderBy: { tier: "desc" },
  });
  res.json(sponsors);
});

router.post("/sponsors", requireAuth, requireRole("ADMIN"), async (req, res) => {
  const sponsor = await prisma.sponsor.create({ data: req.body });
  res.status(201).json(sponsor);
});

router.post("/donations", async (req, res) => {
  const { sponsorId, donorName, amountCents, message } = req.body;
  const donation = await prisma.donation.create({
    data: { sponsorId, donorName, amountCents, message },
  });
  res.status(201).json(donation);
  // TODO(module-4): send a "thank you for your donation" email/SMS here,
  // and cc the org director. Same hook point covers post-event thank-yous.
});

// Simple CBT-style "Chess Rules Test" — right answers earn a badge.
const CHESS_RULES_QUIZ = [
  { id: "q1", question: "How does a knight move?", options: ["Diagonally any distance", "L-shape: 2+1 squares", "Only forward one square", "Any direction one square"], answer: 1 },
  { id: "q2", question: "What is 'check'?", options: ["The king is under attack", "A draw offer", "Capturing a pawn", "Castling move"], answer: 0 },
  { id: "q3", question: "Can a pawn move backward?", options: ["Yes, always", "Only when capturing", "No, never", "Only in the endgame"], answer: 2 },
];

router.get("/quiz", (_req, res) => {
  res.json(CHESS_RULES_QUIZ.map(({ answer, ...q }) => q)); // hide answers
});

router.post("/quiz/submit", requireAuth, async (req, res) => {
  const { childId, answers } = req.body; // { q1: 1, q2: 0, q3: 2 }
  const correct = CHESS_RULES_QUIZ.filter((q) => answers[q.id] === q.answer).length;
  const passed = correct === CHESS_RULES_QUIZ.length;

  let badge = null;
  if (passed) {
    badge = await prisma.badge.create({
      data: { childId, name: "Chess Rules Champion" },
    });
  }
  res.json({ score: `${correct}/${CHESS_RULES_QUIZ.length}`, passed, badge });
});

module.exports = router;
