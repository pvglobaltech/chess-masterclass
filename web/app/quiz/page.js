"use client";

import { useEffect, useState } from "react";
import { api } from "../../lib/api";

export default function QuizPage() {
  const [token, setToken] = useState(null);
  const [children, setChildren] = useState([]);
  const [childId, setChildId] = useState("");
  const [quiz, setQuiz] = useState([]);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const saved = typeof window !== "undefined" && localStorage.getItem("token");
    setToken(saved || null);
  }, []);

  useEffect(() => {
    api.quiz().then(setQuiz).catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    if (!token) return;
    api
      .parentDashboard(token)
      .then((res) => {
        setChildren(res.children);
        if (res.children.length === 1) setChildId(res.children[0].id);
      })
      .catch((e) => setError(e.message));
  }, [token]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    if (!childId) return setError("Select which child is taking the test.");
    if (Object.keys(answers).length < quiz.length) return setError("Answer every question first.");

    try {
      const res = await api.submitQuiz({ childId, answers }, token);
      setResult(res);
    } catch (err) {
      setError(err.message);
    }
  }

  if (!token) {
    return (
      <div className="card" style={{ maxWidth: 420 }}>
        <span className="coord-label">a4 · chess rules test</span>
        <h1 style={{ fontSize: 28 }}>Chess Rules Test</h1>
        <p style={{ color: "var(--slate)" }}>
          Register your child first, then come back here to take the quiz and earn a badge.
        </p>
        <a href="/register" className="btn btn-primary">Register your child →</a>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 520 }}>
      <span className="coord-label">a4 · chess rules test</span>
      <h1 style={{ fontSize: 32 }}>Chess Rules Test</h1>
      <p style={{ color: "var(--slate)" }}>Answer all three correctly to earn a badge.</p>

      {error && <p style={{ color: "var(--burgundy)" }}>{error}</p>}

      {result ? (
        <div className="card">
          <p>Score: {result.score}</p>
          {result.passed ? (
            <p>🏅 Badge earned: {result.badge.name} — check the parent dashboard!</p>
          ) : (
            <>
              <p>Not quite — try again to earn the badge.</p>
              <button className="btn btn-primary" onClick={() => { setResult(null); setAnswers({}); }}>
                Try again
              </button>
            </>
          )}
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          {children.length > 1 && (
            <>
              <label>Which child is taking the test?</label>
              <select value={childId} onChange={(e) => setChildId(e.target.value)} style={{ marginBottom: 16 }}>
                <option value="">Select a child</option>
                {children.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </>
          )}

          {quiz.map((q) => (
            <div key={q.id} className="card" style={{ marginBottom: 14 }}>
              <p style={{ fontWeight: 600, marginTop: 0 }}>{q.question}</p>
              {q.options.map((opt, i) => (
                <label key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: "var(--ink)", marginTop: 0, marginBottom: 8 }}>
                  <input
                    type="radio"
                    name={q.id}
                    style={{ width: "auto" }}
                    checked={answers[q.id] === i}
                    onChange={() => setAnswers({ ...answers, [q.id]: i })}
                  />
                  {opt}
                </label>
              ))}
            </div>
          ))}

          {quiz.length > 0 && (
            <button className="btn btn-brass">Submit answers</button>
          )}
        </form>
      )}
    </div>
  );
}