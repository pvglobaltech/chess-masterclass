"use client";

import { useEffect, useState } from "react";
import { api } from "../../lib/api";

export default function CoachConsole() {
  const [token, setToken] = useState(null);
  const [creds, setCreds] = useState({ email: "", password: "" });
  const [loginError, setLoginError] = useState(null);

  const [events, setEvents] = useState([]);
  const [eventId, setEventId] = useState("");
  const [roster, setRoster] = useState([]);
  const [rounds, setRounds] = useState([]);
  const [error, setError] = useState(null);

  const [pairingRows, setPairingRows] = useState([{ whiteChildId: "", blackChildId: "" }]);

  useEffect(() => {
    const saved = typeof window !== "undefined" && localStorage.getItem("coachToken");
    if (saved) setToken(saved);
  }, []);

  useEffect(() => {
    api.events().then(setEvents).catch((e) => setError(e.message));
  }, []);

  const selectedEvent = events.find((e) => e.id === eventId);
  const tournamentId = selectedEvent?.tournament?.id;

  async function refreshEventData() {
    const evs = await api.events();
    setEvents(evs);
  }

  useEffect(() => {
    if (!eventId || !token) return;
    api.roster(eventId, token).then(setRoster).catch((e) => setError(e.message));
  }, [eventId, token]);

  useEffect(() => {
    if (!tournamentId) return setRounds([]);
    const load = () => api.rounds(tournamentId).then(setRounds).catch((e) => setError(e.message));
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, [tournamentId]);

  async function handleLogin(e) {
    e.preventDefault();
    setLoginError(null);
    try {
      const res = await api.login(creds);
      if (res.user.role !== "ADMIN" && res.user.role !== "COACH") {
        throw new Error("This console is for coaches and admins only.");
      }
      localStorage.setItem("coachToken", res.token);
      setToken(res.token);
    } catch (err) {
      setLoginError(err.message);
    }
  }

  async function handleStartTournament() {
    setError(null);
    try {
      await api.startTournament(eventId, { name: `${selectedEvent.name} Tournament` }, token);
      await refreshEventData();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleCheckIn(registrationId) {
    setError(null);
    try {
      await api.checkin({ registrationId }, token);
      const updated = await api.roster(eventId, token);
      setRoster(updated);
    } catch (err) {
      setError(err.message);
    }
  }

  function updatePairingRow(index, field, value) {
    setPairingRows((rows) => rows.map((r, i) => (i === index ? { ...r, [field]: value } : r)));
  }

  function addPairingRow() {
    setPairingRows((rows) => [...rows, { whiteChildId: "", blackChildId: "" }]);
  }

  function removePairingRow(index) {
    setPairingRows((rows) => rows.filter((_, i) => i !== index));
  }

  async function handleCreateRound(e) {
    e.preventDefault();
    setError(null);
    const pairings = pairingRows
      .filter((r) => r.whiteChildId)
      .map((r, i) => ({
        boardNumber: i + 1,
        whiteChildId: r.whiteChildId,
        blackChildId: r.blackChildId || null,
      }));
    if (pairings.length === 0) return setError("Add at least one pairing with a white player selected.");

    try {
      await api.createRound(tournamentId, { pairings }, token);
      setPairingRows([{ whiteChildId: "", blackChildId: "" }]);
      const updated = await api.rounds(tournamentId);
      setRounds(updated);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleResult(pairingId, result) {
    setError(null);
    try {
      await api.submitResult(pairingId, { result }, token);
      const updated = await api.rounds(tournamentId);
      setRounds(updated);
    } catch (err) {
      setError(err.message);
    }
  }

  if (!token) {
    return (
      <div style={{ maxWidth: 380 }}>
        <span className="coord-label">a2 · coach console</span>
        <h1 style={{ fontSize: 28 }}>Coach / Admin sign in</h1>
        {loginError && <p style={{ color: "var(--burgundy)" }}>{loginError}</p>}
        <form onSubmit={handleLogin} className="card">
          <label>Email</label>
          <input required type="email" value={creds.email} onChange={(e) => setCreds({ ...creds, email: e.target.value })} />
          <label>Password</label>
          <input required type="password" value={creds.password} onChange={(e) => setCreds({ ...creds, password: e.target.value })} />
          <button className="btn btn-primary" style={{ marginTop: 16 }}>Sign in</button>
        </form>
        <p style={{ fontSize: 13, color: "var(--slate)" }}>Seed admin: admin@chessmasterclass.ca / password123</p>
      </div>
    );
  }

  return (
    <div>
      <span className="coord-label">a2 · coach console</span>
      <h1 style={{ fontSize: 32 }}>Run the Tournament</h1>
      <p style={{ marginTop: -8, marginBottom: 20 }}>
        <a href="/coach/lessons">Manage learning content →</a>
      </p>
      {error && <p style={{ color: "var(--burgundy)" }}>{error}</p>}

      <label>Event</label>
      <select value={eventId} onChange={(e) => setEventId(e.target.value)} style={{ maxWidth: 420, marginBottom: 20 }}>
        <option value="">Select an event</option>
        {events.map((ev) => (
          <option key={ev.id} value={ev.id}>{ev.name} — {new Date(ev.date).toLocaleDateString()}</option>
        ))}
      </select>

      {selectedEvent && !tournamentId && (
        <div className="card" style={{ marginBottom: 20 }}>
          <p>No tournament started yet for this event.</p>
          <button className="btn btn-primary" onClick={handleStartTournament}>Start Tournament</button>
        </div>
      )}

      {selectedEvent && tournamentId && (
        <>
          <div className="card" style={{ marginBottom: 20 }}>
            <h3 style={{ fontSize: 16 }}>Roster ({roster.length} confirmed)</h3>
            {roster.map((r) => (
              <div key={r.registrationId} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid var(--line)" }}>
                <span>{r.name}</span>
                {r.checkedInAt ? (
                  <span className="tag tag-live">checked in</span>
                ) : (
                  <button className="btn btn-brass" style={{ padding: "6px 12px", fontSize: 13 }} onClick={() => handleCheckIn(r.registrationId)}>
                    Check in
                  </button>
                )}
              </div>
            ))}
            {roster.length === 0 && <p style={{ color: "var(--slate)" }}>No confirmed registrations yet.</p>}
          </div>

          <div className="card" style={{ marginBottom: 20 }}>
            <h3 style={{ fontSize: 16 }}>New round — build pairings</h3>
            <form onSubmit={handleCreateRound}>
              {pairingRows.map((row, i) => (
                <div key={i} style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 10 }}>
                  <span className="data" style={{ width: 24 }}>{i + 1}</span>
                  <select
                    value={row.whiteChildId}
                    onChange={(e) => updatePairingRow(i, "whiteChildId", e.target.value)}
                    style={{ flex: 1 }}
                  >
                    <option value="">White…</option>
                    {roster.map((r) => (
                      <option key={r.childId} value={r.childId}>{r.name}</option>
                    ))}
                  </select>
                  <span style={{ color: "var(--slate)" }}>vs</span>
                  <select
                    value={row.blackChildId}
                    onChange={(e) => updatePairingRow(i, "blackChildId", e.target.value)}
                    style={{ flex: 1 }}
                  >
                    <option value="">— bye —</option>
                    {roster.map((r) => (
                      <option key={r.childId} value={r.childId}>{r.name}</option>
                    ))}
                  </select>
                  {pairingRows.length > 1 && (
                    <button type="button" onClick={() => removePairingRow(i)} style={{ background: "none", border: "none", color: "var(--burgundy)", cursor: "pointer" }}>
                      ✕
                    </button>
                  )}
                </div>
              ))}
              <div style={{ marginTop: 14, display: "flex", gap: 10 }}>
                <button type="button" className="btn" style={{ border: "1px solid var(--line)" }} onClick={addPairingRow}>
                  + Add board
                </button>
                <button className="btn btn-primary">Start round {rounds.length + 1}</button>
              </div>
            </form>
          </div>

          {rounds.map((round) => (
            <div key={round.id} className="card" style={{ marginBottom: 16 }}>
              <h3 style={{ fontSize: 16 }}>Round {round.number}</h3>
              {round.pairings.map((p) => (
                <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid var(--line)", flexWrap: "wrap", gap: 8 }}>
                  <span>
                    Board {p.boardNumber}: <strong>{p.whiteChild.name}</strong> vs {p.blackChild ? <strong>{p.blackChild.name}</strong> : <em>bye</em>}
                  </span>
                  {p.result !== "PENDING" ? (
                    <span className="tag tag-live">{p.result.replace("_", " ")}</span>
                  ) : p.blackChild ? (
                    <div style={{ display: "flex", gap: 6 }}>
                      <button className="btn" style={{ border: "1px solid var(--line)", padding: "6px 10px", fontSize: 13 }} onClick={() => handleResult(p.id, "WHITE_WIN")}>White wins</button>
                      <button className="btn" style={{ border: "1px solid var(--line)", padding: "6px 10px", fontSize: 13 }} onClick={() => handleResult(p.id, "DRAW")}>Draw</button>
                      <button className="btn" style={{ border: "1px solid var(--line)", padding: "6px 10px", fontSize: 13 }} onClick={() => handleResult(p.id, "BLACK_WIN")}>Black wins</button>
                    </div>
                  ) : (
                    <button className="btn" style={{ border: "1px solid var(--line)", padding: "6px 10px", fontSize: 13 }} onClick={() => handleResult(p.id, "WHITE_WIN")}>Award bye win</button>
                  )}
                </div>
              ))}
            </div>
          ))}

          <a href="/live" className="btn btn-primary">View public live standings →</a>
        </>
      )}
    </div>
  );
}