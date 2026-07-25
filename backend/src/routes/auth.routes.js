const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const prisma = require("../db");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

function sign(user) {
  return jwt.sign(
    { id: user.id, role: user.role, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: "30d" }
  );
}

// Parents self-register. Coaches/admins are seeded or promoted manually for now.
router.post("/register", async (req, res) => {
  const { name, email, password, phone, postalCode } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: "name, email, password are required" });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return res.status(409).json({ error: "Email already registered" });

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { name, email, passwordHash, phone, postalCode, role: "PARENT" },
  });

  res.status(201).json({ token: sign(user), user: { id: user.id, name: user.name, role: user.role } });
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(401).json({ error: "Invalid email or password" });

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return res.status(401).json({ error: "Invalid email or password" });

  res.json({ token: sign(user), user: { id: user.id, name: user.name, role: user.role } });
});

router.get("/me", requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (!user) return res.status(404).json({ error: "User not found" });
  const { passwordHash, ...safe } = user;
  res.json(safe);
});

module.exports = router;
