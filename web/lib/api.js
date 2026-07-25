const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

async function request(path, { method = "GET", body, token } = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

export const api = {
  register: (body) => request("/auth/register", { method: "POST", body }),
  login: (body) => request("/auth/login", { method: "POST", body }),
  me: (token) => request("/auth/me", { token }),

  events: () => request("/events"),
  registerForEvent: (eventId, body, token) =>
    request(`/events/${eventId}/register`, { method: "POST", body, token }),
  parentDashboard: (token) => request("/parent/dashboard", { token }),

  standings: (tournamentId) => request(`/tournaments/${tournamentId}/standings`),

  courses: (ageBracket) => request(`/courses${ageBracket ? `?ageBracket=${ageBracket}` : ""}`),

  sponsors: (eventId) => request(`/sponsors${eventId ? `?eventId=${eventId}` : ""}`),
  quiz: () => request("/quiz"),
  submitQuiz: (body, token) => request("/quiz/submit", { method: "POST", body, token }),

  reportSummary: (token) => request("/summary", { token }),
};

export { API_URL };
