"use client";

import { useEffect, useState } from "react";
import { api } from "../../lib/api";

const BRACKETS = { U9: "6-9", U13: "10-13", U16: "14-16" };

export default function RegisterPage() {
  const [events, setEvents] = useState([]);
  const [step, setStep] = useState("account"); // account -> child -> waiver -> done
  const [token, setToken] = useState(null);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const [account, setAccount] = useState({ name: "", email: "", password: "", postalCode: "" });
  const [child, setChild] = useState({ childName: "", childDob: "" });
  const [eventId, setEventId] = useState("");
  const [waiverAccepted, setWaiverAccepted] = useState(false);

  useEffect(() => {
    api.events().then(setEvents).catch((e) => setError(e.message));
  }, []);

  async function handleAccount(e) {
    e.preventDefault();
    setError(null);
    try {
      const res = await api.register(account);
      setToken(res.token);
      localStorage.setItem("token", res.token);
      setStep("child");
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleFinish(e) {
    e.preventDefault();
    setError(null);
    try {
      const res = await api.registerForEvent(
        eventId,
        { ...child, waiverAccepted },
        token
      );
      setResult(res);
      setStep("done");
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div style={{ maxWidth: 480 }}>
      <span className="coord-label">a1 · event registration</span>
      <h1 style={{ fontSize: 32 }}>Register for the MasterClass</h1>
      {error && (
        <p className="card" style={{ borderColor: "var(--burgundy)", color: "var(--burgundy)" }}>
          {error}
        </p>
      )}

      {step === "account" && (
        <form onSubmit={handleAccount} className="card">
          <label>Parent / guardian name</label>
          <input required value={account.name} onChange={(e) => setAccount({ ...account, name: e.target.value })} />
          <label>Email</label>
          <input required type="email" value={account.email} onChange={(e) => setAccount({ ...account, email: e.target.value })} />
          <label>Password</label>
          <input required type="password" value={account.password} onChange={(e) => setAccount({ ...account, password: e.target.value })} />
          <label>Postal code (helps the org report where families come from)</label>
          <input value={account.postalCode} onChange={(e) => setAccount({ ...account, postalCode: e.target.value })} />
          <button className="btn btn-primary" style={{ marginTop: 20 }}>Continue</button>
        </form>
      )}

      {step === "child" && (
        <form onSubmit={handleFinish} className="card">
          <label>Event</label>
          <select required value={eventId} onChange={(e) => setEventId(e.target.value)}>
            <option value="">Select an event</option>
            {events.map((ev) => (
              <option key={ev.id} value={ev.id}>
                {ev.name} — {new Date(ev.date).toLocaleDateString()} ({ev._count.registrations}/{ev.capacity} spots)
              </option>
            ))}
          </select>
          <label>Child's name</label>
          <input required value={child.childName} onChange={(e) => setChild({ ...child, childName: e.target.value })} />
          <label>Child's date of birth</label>
          <input required type="date" value={child.childDob} onChange={(e) => setChild({ ...child, childDob: e.target.value })} />
          <p style={{ fontSize: 13, color: "var(--slate)", marginTop: 12 }}>
            Age brackets: {Object.entries(BRACKETS).map(([k, v]) => `${v}`).join(" · ")} — assigned automatically from date of birth.
          </p>
          <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 16 }}>
            <input
              type="checkbox"
              style={{ width: "auto" }}
              checked={waiverAccepted}
              onChange={(e) => setWaiverAccepted(e.target.checked)}
            />
            I have read and accept the participation waiver.
            {/* TODO(module-1): replace checkbox with a real e-signed PDF waiver */}
          </label>
          <button className="btn btn-primary" style={{ marginTop: 20 }}>Register & continue to payment</button>
        </form>
      )}

      {step === "done" && result && (
        <div className="card">
          <span className={`tag ${result.status === "WAITLISTED" ? "" : "tag-live"}`}>
            {result.status}
          </span>
          <h3>You're on the list!</h3>
          <p style={{ color: "var(--slate)" }}>
            {result.status === "CONFIRMED"
              ? "Your spot is confirmed. A receipt and check-in QR code are on your parent dashboard."
              : "The event is full, so your child is on the waitlist — we'll confirm automatically if a spot opens."}
          </p>
          <a href="/parent-dashboard" className="btn btn-primary">Go to parent dashboard →</a>
        </div>
      )}
    </div>
  );
}
