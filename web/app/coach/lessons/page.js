"use client";

import { useEffect, useState } from "react";
import { api } from "../../../lib/api";

const BRACKETS = ["U9", "U13", "U16"];

export default function ManageLessonsPage() {
  const [token, setToken] = useState(null);
  const [creds, setCreds] = useState({ email: "", password: "" });
  const [loginError, setLoginError] = useState(null);

  const [courses, setCourses] = useState([]);
  const [events, setEvents] = useState([]);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  // Add-lesson-to-existing-course form
  const [targetCourseId, setTargetCourseId] = useState("");
  const [lessonTitle, setLessonTitle] = useState("");
  const [lessonVideoUrl, setLessonVideoUrl] = useState("");

  // New-course form
  const [newCourse, setNewCourse] = useState({ title: "", description: "", ageBracket: "U9", eventId: "" });
  const [firstLessonTitle, setFirstLessonTitle] = useState("");
  const [firstLessonVideoUrl, setFirstLessonVideoUrl] = useState("");

  useEffect(() => {
    const saved = typeof window !== "undefined" && localStorage.getItem("coachToken");
    if (saved) setToken(saved);
  }, []);

  useEffect(() => {
    refreshCourses();
    api.events().then(setEvents);
  }, []);

  function refreshCourses() {
    api.courses().then(setCourses);
  }

  async function handleLogin(e) {
    e.preventDefault();
    setLoginError(null);
    try {
      const res = await api.login(creds);
      if (res.user.role !== "ADMIN" && res.user.role !== "COACH") {
        throw new Error("This page is for coaches and admins only.");
      }
      localStorage.setItem("coachToken", res.token);
      setToken(res.token);
    } catch (err) {
      setLoginError(err.message);
    }
  }

  async function handleAddLesson(e) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    if (!targetCourseId) return setError("Pick a course first.");
    try {
      await api.addLesson(targetCourseId, { title: lessonTitle, videoUrl: lessonVideoUrl }, token);
      setLessonTitle("");
      setLessonVideoUrl("");
      setMessage("Lesson added.");
      refreshCourses();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleCreateCourse(e) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    try {
      await api.createCourse(
        {
          ...newCourse,
          eventId: newCourse.eventId || undefined,
          lessons: firstLessonTitle ? [{ title: firstLessonTitle, videoUrl: firstLessonVideoUrl }] : [],
        },
        token
      );
      setNewCourse({ title: "", description: "", ageBracket: "U9", eventId: "" });
      setFirstLessonTitle("");
      setFirstLessonVideoUrl("");
      setMessage("Course created.");
      refreshCourses();
    } catch (err) {
      setError(err.message);
    }
  }

  if (!token) {
    return (
      <div style={{ maxWidth: 380 }}>
        <span className="coord-label">a3 · manage lessons</span>
        <h1 style={{ fontSize: 28 }}>Coach / Admin sign in</h1>
        {loginError && <p style={{ color: "var(--burgundy)" }}>{loginError}</p>}
        <form onSubmit={handleLogin} className="card">
          <label>Email</label>
          <input required type="email" value={creds.email} onChange={(e) => setCreds({ ...creds, email: e.target.value })} />
          <label>Password</label>
          <input required type="password" value={creds.password} onChange={(e) => setCreds({ ...creds, password: e.target.value })} />
          <button className="btn btn-primary" style={{ marginTop: 16 }}>Sign in</button>
        </form>
      </div>
    );
  }

  return (
    <div>
      <span className="coord-label">a3 · manage lessons</span>
      <h1 style={{ fontSize: 32 }}>Add Lessons</h1>
      {error && <p style={{ color: "var(--burgundy)" }}>{error}</p>}
      {message && <p style={{ color: "var(--board-green)" }}>{message}</p>}

      <div className="card" style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: 16 }}>Add a lesson to an existing course</h3>
        <form onSubmit={handleAddLesson}>
          <label>Course</label>
          <select value={targetCourseId} onChange={(e) => setTargetCourseId(e.target.value)}>
            <option value="">Select a course</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>{c.title} ({c.ageBracket})</option>
            ))}
          </select>
          <label>Lesson title</label>
          <input required value={lessonTitle} onChange={(e) => setLessonTitle(e.target.value)} placeholder="e.g. The Sicilian Defense" />
          <label>YouTube link (set the video to Unlisted, not Public)</label>
          <input
            required
            type="url"
            value={lessonVideoUrl}
            onChange={(e) => setLessonVideoUrl(e.target.value)}
            placeholder="https://youtu.be/..."
          />
          <button className="btn btn-primary" style={{ marginTop: 16 }}>Add lesson</button>
        </form>
      </div>

      <div className="card">
        <h3 style={{ fontSize: 16 }}>Create a brand new course</h3>
        <form onSubmit={handleCreateCourse}>
          <label>Course title</label>
          <input required value={newCourse.title} onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })} placeholder="e.g. Endgame Essentials" />
          <label>Description</label>
          <textarea rows={2} value={newCourse.description} onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })} />
          <label>Age bracket</label>
          <select value={newCourse.ageBracket} onChange={(e) => setNewCourse({ ...newCourse, ageBracket: e.target.value })}>
            {BRACKETS.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
          <label>Unlock after registering for (optional — leave blank for open content)</label>
          <select value={newCourse.eventId} onChange={(e) => setNewCourse({ ...newCourse, eventId: e.target.value })}>
            <option value="">Open to everyone</option>
            {events.map((ev) => (
              <option key={ev.id} value={ev.id}>{ev.name}</option>
            ))}
          </select>

          <label>First lesson title (optional — you can add more later)</label>
          <input value={firstLessonTitle} onChange={(e) => setFirstLessonTitle(e.target.value)} placeholder="e.g. King and Pawn Endgames" />
          <label>First lesson YouTube link</label>
          <input type="url" value={firstLessonVideoUrl} onChange={(e) => setFirstLessonVideoUrl(e.target.value)} placeholder="https://youtu.be/..." />

          <button className="btn btn-primary" style={{ marginTop: 16 }}>Create course</button>
        </form>
      </div>

      <a href="/learning" className="btn" style={{ border: "1px solid var(--line)", marginTop: 20, display: "inline-block" }}>
        View public Learning page →
      </a>
    </div>
  );
}
