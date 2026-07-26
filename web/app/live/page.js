"use client";

import { useEffect, useState } from "react";
import { api } from "../../lib/api";

export default function LivePage() {
  const [events, setEvents] = useState([]);
  const [tournamentId, setTournamentId] = useState("");
  const [standings, setStandings] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.events().then((evs) => {
      setEvents(evs);
      const first = evs.find((e) => e.tournament);
      if (first) setTournamentId(first.tournament.id);
    });
  }, []);

  useEffect(() => {
    if (!tournamentId) return;
    const load = () => api.standings(tournamentId).then(setStandings).catch((e) => setError(e.message));
    load();
    const interval = setInterval(load, 5000); // poll for "live" feel
    return () => clearInterval(interval);
  }, [tournamentId]);

  return (
    <div>
      <span className="coord-label">a2 · live tournament</span>
      <h1 style={{ fontSize: 32 }}>Live Standings</h1>

      {events.filter((e) => e.tournament).length > 1 && (
        <select value={tournamentId} onChange={(e) => setTournamentId(e.target.value)} style={{ maxWidth: 320, marginBottom: 20 }}>
          {events.filter((e) => e.tournament).map((e) => (
            <option key={e.tournament.id} value={e.tournament.id}>{e.name}</option>
          ))}
        </select>
      )}

      {error && <p>{error}</p>}
      {!standings && !error && <p>Loading live standings...</p>}

      {standings && (
        <div className="card">
          <p style={{ color: "var(--slate)", fontSize: 14 }}>
            Round {standings.roundsPlayed} · refreshes automatically
          </p>

          <div className="table-scroll">
            <table>
              <thead>
                <tr><th>Rank</th><th>Player</th><th>Points</th></tr>
              </thead>
              <tbody>
                {standings.standings.map((s, i) => (
                  <tr key={s.childId}>
                    <td className="data">{i + 1}</td>
                    <td>{s.name}</td>
                    <td className="data">{s.points}</td>
                  </tr>
                ))}
                {standings.standings.length === 0 && (
                  <tr><td colSpan={3} style={{ color: "var(--slate)" }}>No results entered yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {/* TODO(module-2): add a "projector mode" full-screen view and
          QR-code check-in scanner page for front-desk coaches */}
    </div>
  );
}