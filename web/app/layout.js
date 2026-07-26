import "./globals.css";

export const metadata = {
  title: "Chess MasterClass",
  description: "Registration, live results, learning, sponsors, and reporting — in one place.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <div className="container">
          <nav className="nav">
            <div className="nav-brand">♞ Chess MasterClass</div>

            <input type="checkbox" id="nav-toggle" className="nav-toggle-checkbox" />
            <label htmlFor="nav-toggle" className="nav-toggle-label" aria-label="Menu">
              ☰
            </label>

            <div className="nav-links">
              <a href="/">Register</a>
              <a href="/parent-dashboard">Parent Dashboard</a>
              <a href="/live">Live Tournament</a>
              <a href="/coach">Coach Console</a>
              <a href="/learning">Learning</a>
              <a href="/sponsors">Sponsors</a>
              <a href="/admin/reports">Reports</a>
            </div>
          </nav>
        </div>
        <main className="container" style={{ paddingTop: 40, paddingBottom: 80 }}>
          {children}
        </main>
      </body>
    </html>
  );
}