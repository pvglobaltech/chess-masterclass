require("dotenv").config();
const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth.routes");
const registrationRoutes = require("./routes/registration.routes"); // Module 1
const paymentsRoutes = require("./routes/payments.routes");         // Module 1 (Stripe webhook)
const tournamentRoutes = require("./routes/tournament.routes");     // Module 2
const learningRoutes = require("./routes/learning.routes");         // Module 3
const sponsorRoutes = require("./routes/sponsor.routes");           // Module 4
const reportsRoutes = require("./routes/reports.routes");           // Module 5

const app = express();
app.use(cors({ origin: process.env.CLIENT_ORIGIN || "*" }));

// Stripe needs the raw, unparsed body to verify webhook signatures.
// Scoped to this exact path only — and registered BEFORE express.json()
// below — so no other route is affected by the raw body parsing.
app.use("/webhooks/stripe", express.raw({ type: "application/json" }), paymentsRoutes);

app.use(express.json());

app.get("/health", (_req, res) => res.json({ ok: true }));

app.use("/auth", authRoutes);
app.use("/", registrationRoutes);
app.use("/", tournamentRoutes);
app.use("/", learningRoutes);
app.use("/", sponsorRoutes);
app.use("/", reportsRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Something went wrong" });
});

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`Chess MasterClass API running on :${port}`));
