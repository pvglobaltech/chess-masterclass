export default function Home() {
  return (
    <div>
      <span className="coord-label">a1 · registration opens now</span>
      <h1 style={{ fontSize: 48, maxWidth: 640 }}>
        A master class for young players, ages 6 to 16.
      </h1>
      <p style={{ fontSize: 18, color: "var(--slate)", maxWidth: 560, marginBottom: 28 }}>
        One place to register, pay, and follow your child's progress — from their
        first move to their first tournament certificate.
      </p>
      <a href="/register" className="btn btn-primary">
        Register your child →
      </a>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 16,
          marginTop: 56,
        }}
      >
        {[
          ["a2", "Live Tournament", "Follow standings from the lobby or at home.", "/live"],
          ["a3", "Learning Platform", "Videos, puzzles, and progress after class.", "/learning"],
          ["a4", "Sponsors", "See who makes the MasterClass possible.", "/sponsors"],
        ].map(([coord, title, desc, href]) => (
          <a key={coord} href={href} className="card" style={{ textDecoration: "none", color: "inherit" }}>
            <span className="coord-label">{coord}</span>
            <h3 style={{ fontSize: 18 }}>{title}</h3>
            <p style={{ color: "var(--slate)", fontSize: 14, margin: 0 }}>{desc}</p>
          </a>
        ))}
      </div>
    </div>
  );
}
