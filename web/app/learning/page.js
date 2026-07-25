"use client";

import { useEffect, useState } from "react";
import { api } from "../../lib/api";

export default function LearningPage() {
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    api.courses().then(setCourses);
  }, []);

  return (
    <div>
      <span className="coord-label">a3 · learning platform</span>
      <h1 style={{ fontSize: 32 }}>After-Class Access</h1>
      <p style={{ color: "var(--slate)", maxWidth: 520 }}>
        Videos and puzzles from every MasterClass, unlocked once your child is
        registered for the matching event.
      </p>

      {courses.map((course) => (
        <div key={course.id} className="card" style={{ marginTop: 20 }}>
          <span className="tag">{course.ageBracket}</span>
          <h3>{course.title}</h3>
          <p style={{ color: "var(--slate)", fontSize: 14 }}>{course.description}</p>
          {course.lessons.map((lesson) => (
            <div key={lesson.id} style={{ padding: "10px 0", borderBottom: "1px solid var(--line)" }}>
              {lesson.title}
              {/* TODO(module-3): replace with an embedded video player once
                  real hosted video URLs replace the placeholders */}
            </div>
          ))}
        </div>
      ))}

      {courses.length === 0 && <p>No courses published yet.</p>}
    </div>
  );
}
