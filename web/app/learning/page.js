"use client";

import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { toEmbedUrl } from "../../lib/video";

export default function LearningPage() {
  const [courses, setCourses] = useState([]);
  const [token, setToken] = useState(null);
  const [children, setChildren] = useState([]);
  const [childId, setChildId] = useState("");

  const [expandedCourseId, setExpandedCourseId] = useState(null);
  const [lessonsByCourse, setLessonsByCourse] = useState({});
  const [loadingCourseId, setLoadingCourseId] = useState(null);

  useEffect(() => {
    api.courses().then(setCourses);
  }, []);

  useEffect(() => {
    const saved = typeof window !== "undefined" && localStorage.getItem("token");
    setToken(saved || null);
  }, []);

  useEffect(() => {
    if (!token) return;
    api.parentDashboard(token).then((res) => {
      setChildren(res.children);
      if (res.children.length === 1) setChildId(res.children[0].id);
    });
  }, [token]);

  async function handleViewLessons(course) {
    if (expandedCourseId === course.id) {
      setExpandedCourseId(null);
      return;
    }
    setExpandedCourseId(course.id);
    if (lessonsByCourse[course.id]) return;

    if (!token || !childId) return;

    setLoadingCourseId(course.id);
    try {
      const lessons = await api.courseLessons(childId, course.id, token);
      setLessonsByCourse((prev) => ({ ...prev, [course.id]: lessons }));
    } catch (err) {
      setLessonsByCourse((prev) => ({ ...prev, [course.id]: { locked: true, message: err.message } }));
    } finally {
      setLoadingCourseId(null);
    }
  }

  async function toggleComplete(courseId, lesson) {
    const completed = !lesson.progress?.[0]?.completedAt;
    await api.markProgress({ childId, lessonId: lesson.id, completed }, token);
    const updated = await api.courseLessons(childId, courseId, token);
    setLessonsByCourse((prev) => ({ ...prev, [courseId]: updated }));
  }

  return (
    <div>
      <span className="coord-label">a3 · learning platform</span>
      <h1 style={{ fontSize: 32 }}>After-Class Access</h1>
      <p style={{ color: "var(--slate)", maxWidth: 520 }}>
        Videos from every MasterClass, unlocked once your child is registered for the matching event.
      </p>

      {token && children.length > 1 && (
        <>
          <label>Viewing as</label>
          <select value={childId} onChange={(e) => setChildId(e.target.value)} style={{ maxWidth: 320, marginBottom: 16 }}>
            <option value="">Select a child</option>
            {children.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </>
      )}

      {courses.map((course) => {
        const isOpen = expandedCourseId === course.id;
        const data = lessonsByCourse[course.id];

        return (
          <div key={course.id} className="card" style={{ marginTop: 20 }}>
            <span className="tag">{course.ageBracket}</span>
            <h3>{course.title}</h3>
            <p style={{ color: "var(--slate)", fontSize: 14 }}>{course.description}</p>
            <p style={{ color: "var(--slate)", fontSize: 13 }}>{course.lessons.length} lesson(s)</p>

            <button className="btn" style={{ border: "1px solid var(--line)" }} onClick={() => handleViewLessons(course)}>
              {isOpen ? "Hide lessons" : "View lessons"}
            </button>

            {isOpen && (
              <div style={{ marginTop: 16 }}>
                {!token && (
                  <p style={{ color: "var(--slate)" }}>
                    <a href="/register">Register</a> your child for this MasterClass to unlock these lessons.
                  </p>
                )}

                {token && !childId && (
                  <p style={{ color: "var(--slate)" }}>Select which child above to view their lessons.</p>
                )}

                {token && childId && loadingCourseId === course.id && <p>Loading…</p>}

                {token && childId && data?.locked && (
                  <p style={{ color: "var(--burgundy)" }}>
                    {data.message} — <a href="/register">register for this event</a> to unlock it.
                  </p>
                )}

                {token && childId && Array.isArray(data) && (
                  <div>
                    {data.map((lesson) => {
                      const embedUrl = toEmbedUrl(lesson.videoUrl);
                      const completed = !!lesson.progress?.[0]?.completedAt;
                      return (
                        <div key={lesson.id} style={{ padding: "14px 0", borderBottom: "1px solid var(--line)" }}>
                          <p style={{ fontWeight: 600, margin: "0 0 8px" }}>{lesson.title}</p>

                          {embedUrl ? (
                            <div style={{ position: "relative", paddingBottom: "56.25%", height: 0, marginBottom: 10 }}>
                              <iframe
                                src={embedUrl}
                                title={lesson.title}
                                allowFullScreen
                                style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: 0, borderRadius: 8 }}
                              />
                            </div>
                          ) : lesson.videoUrl ? (
                            <a href={lesson.videoUrl} target="_blank" rel="noopener noreferrer" className="btn btn-brass" style={{ marginBottom: 10, display: "inline-block" }}>
                              Watch video ↗
                            </a>
                          ) : (
                            <p style={{ color: "var(--slate)", fontSize: 13 }}>Video coming soon.</p>
                          )}

                          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14 }}>
                            <input type="checkbox" style={{ width: "auto" }} checked={completed} onChange={() => toggleComplete(course.id, lesson)} />
                            Mark as watched
                          </label>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {courses.length === 0 && <p>No courses published yet.</p>}

      <p style={{ marginTop: 32 }}>
        Want to test what you've learned? Try the <a href="/quiz">Chess Rules Test</a> and earn a badge.
      </p>
    </div>
  );
}