"use client";

import { useEffect, useState } from "react";
import { api, API_URL } from "../../../lib/api";

export default function ReportsPage() {
  const [token, setToken] = useState(null);
  const [creds, setCreds] = useState({ email: "", password: "" });
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const saved = typeof window !== "undefined" && localStorage.getItem("adminToken");
    if (saved) setToken(saved);
  }, []);

  useEffect(() => {
    if (!token) return;
    api.reportSummary(token).then(setSummary).catch((e) => setError(e.message));
  }, [token]);

  async function handleLogin(e) {
    e.preventDefault();
    setError(null);
    try {
      const res = await api.login(creds);
      if (res.user.role !== "ADMIN") throw new Error("This dashboard is admin-only.");
      localStorage.setItem("adminToken", res.token);
      setToken(res.token);
    } catch (err) {
      setError(err.message);
    }
  }

  if (!token) {
    return (
      <div style={{ maxWidth: 380 }}>
        <span className="coord-label">a5 · reporting for grants</span>
        <h1 style={{ fontSize: 28 }}>Admin sign in</h1>
        {error && <p style={{ color: "var(--burgundy)" }}>{error}</p>}
        <form onSubmit={handleLogin} className="card">
          <label>Email</label>
          <input required type="email" value={creds.email} onChange={(e) => setCreds({ ...creds, email: e.target.value })} />
          <label>Password</label>
          <input required type="password" value={creds.password} onChange={(e) => setCreds({ ...creds, password: e.target.value })} />
          <button className="btn btn-primary" style={{ marginTop: 16 }}>Sign in</button>
        </form>
        //<p style={{ fontSize: 13, color: "var(--slate)" }}>Seed admin: admin@chessmasterclass.ca / password123</p>
      </div>
    );
  }

  if (error) return <p>{error}</p>;
  if (!summary) return <p>Loading…</p>;

  return (
    <div>
      <span className="coord-label">a5 · reporting for grants</span>
      <h1 style={{ fontSize: 32 }}>Grant Reporting Dashboard</h1>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginBottom: 24 }}>
        <Stat label="Kids served" value={summary.uniqueChildrenServed} />
        <Stat label="Total registrations" value={summary.totalRegistrations} />
        <Stat label="Retention rate" value={`${summary.retentionRatePercent}%`} />
        <Stat label="Avg. feedback rating" value={summary.averageFeedbackRating ? summary.averageFeedbackRating.toFixed(1) : "—"} />
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <h3 style={{ fontSize: 16 }}>By age bracket</h3>
        {Object.entries(summary.byAgeBracket).map(([bracket, count]) => (
          <div key={bracket} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0" }}>
            <span>{bracket}</span>
            <span className="data">{count}</span>
          </div>
        ))}
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <h3 style={{ fontSize: 16 }}>By postal code</h3>
        {Object.entries(summary.byPostalCode).map(([zip, count]) => (
          <div key={zip} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0" }}>
            <span>{zip}</span>
            <span className="data">{count}</span>
          </div>
        ))}
      </div>

      <a
        className="btn btn-primary"
        href={`${API_URL}/export.csv`}
        onClick={(e) => {
          e.preventDefault();
          fetch(`${API_URL}/export.csv`, { headers: { Authorization: `Bearer ${token}` } })
            .then((r) => r.blob())
            .then((blob) => {
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = "masterclass-report.csv";
              a.click();
            });
        }}
      >
        Export CSV for funders
      </a>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="card">
      <div style={{ fontSize: 28, fontFamily: "var(--font-display)" }}>{value}</div>
      <div style={{ fontSize: 12, color: "var(--slate)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</div>
    </div>
  );
}
