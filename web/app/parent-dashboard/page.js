"use client";

import { useEffect, useState } from "react";
import { api } from "../../lib/api";

export default function ParentDashboard() {
  const [children, setChildren] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = typeof window !== "undefined" && localStorage.getItem("token");
    if (!token) {
      setError("Please log in from the registration page first.");
      return;
    }
    api
      .parentDashboard(token)
      .then((res) => setChildren(res.children))
      .catch((e) => setError(e.message));
  }, []);

  if (error)
    return (
      <div className="card">
        <p>{error}</p>
        <a href="/register" className="btn btn-primary">Go to registration →</a>
      </div>
    );
  if (!children) return <p>Loading…</p>;

  return (
    <div>
      <span className="coord-label">a1 · parent portal</span>
      <h1 style={{ fontSize: 32 }}>Parent Dashboard</h1>

      {children.length === 0 && <p>No children registered yet.</p>}

      {children.map((child) => (
        <div key={child.id} className="card" style={{ marginBottom: 20 }}>
          <h3>{child.name}</h3>

          <h4 style={{ fontSize: 13, color: "var(--slate)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Schedule
          </h4>
          {child.registrations.map((r) => (
            <div key={r.id} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--line)" }}>
              <span>{r.event.name} — {new Date(r.event.date).toLocaleDateString()}</span>
              <span className={`tag ${r.status === "CONFIRMED" ? "tag-live" : ""}`}>{r.status}</span>
            </div>
          ))}

          {child.coachNotes.length > 0 && (
            <>
              <h4 style={{ fontSize: 13, color: "var(--slate)", textTransform: "uppercase", letterSpacing: "0.06em", marginTop: 20 }}>
                Coach notes
              </h4>
              {child.coachNotes.map((n) => (
                <p key={n.id} style={{ fontSize: 14 }}>{n.note}</p>
              ))}
            </>
          )}

          {child.progress.length > 0 && (
            <>
              <h4 style={{ fontSize: 13, color: "var(--slate)", textTransform: "uppercase", letterSpacing: "0.06em", marginTop: 20 }}>
                Progress
              </h4>
              {child.progress.map((p) => (
                <p key={p.id} style={{ fontSize: 14 }}>
                  {p.lesson.title} — {p.completedAt ? "completed" : "in progress"}
                </p>
              ))}
            </>
          )}

          {child.badges.length > 0 && (
            <div style={{ marginTop: 16 }}>
              {child.badges.map((b) => (
                <span key={b.id} className="tag" style={{ marginRight: 8 }}>🏅 {b.name}</span>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
