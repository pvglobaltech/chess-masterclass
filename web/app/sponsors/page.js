"use client";

import { useEffect, useState } from "react";
import { api } from "../../lib/api";

export default function SponsorsPage() {
  const [sponsors, setSponsors] = useState([]);
  const [donorName, setDonorName] = useState("");
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [thanks, setThanks] = useState(false);

  useEffect(() => {
    api.sponsors().then(setSponsors);
  }, []);

  async function handleDonate(e) {
    e.preventDefault();
    await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/donations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ donorName, amountCents: Math.round(Number(amount) * 100), message }),
    });
    setThanks(true);
  }

  return (
    <div>
      <span className="coord-label">a4 · sponsors & marketing</span>
      <h1 style={{ fontSize: 32 }}>Our Sponsors</h1>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 32 }}>
        {sponsors.map((s) => (
          <div key={s.id} className="card" style={{ padding: "12px 20px" }}>
            <span className="tag" style={{ marginBottom: 8 }}>{s.tier}</span>
            <div>{s.name}</div>
          </div>
        ))}
        {sponsors.length === 0 && <p style={{ color: "var(--slate)" }}>No sponsors listed yet.</p>}
      </div>

      <div className="card" style={{ maxWidth: 420 }}>
        <h3>Support the next MasterClass</h3>
        {thanks ? (
          <p>Thank you! A confirmation has been sent. 🙏</p>
        ) : (
          <form onSubmit={handleDonate}>
            <label>Your name (optional)</label>
            <input value={donorName} onChange={(e) => setDonorName(e.target.value)} />
            <label>Amount (CAD)</label>
            <input required type="number" min="1" value={amount} onChange={(e) => setAmount(e.target.value)} />
            <label>Message (optional)</label>
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={3} />
            <button className="btn btn-brass" style={{ marginTop: 16 }}>Donate</button>
            {/* TODO(module-4): swap this for a real Stripe donation checkout */}
          </form>
        )}
      </div>

      <p style={{ marginTop: 32 }}>
       Kids can also test their knowledge with the <a href="/quiz">Chess Rules Test</a> and earn a badge.
      </p>
    </div>
  );
}
