const Stripe = require("stripe");

if (!process.env.STRIPE_SECRET_KEY) {
  console.warn(
    "[stripe] STRIPE_SECRET_KEY is not set — payments will fail until it's added to .env"
  );
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_missing", {
  apiVersion: "2024-06-20",
});

module.exports = stripe;
