import React from "react";
import Link from "next/link";

export const metadata = {
  title: "About Us | Mimi Mail",
  description: "Learn more about Mimi Mail, a minimalist anonymous message board for sharing feedback and cute messages.",
};

export default function AboutPage() {
  return (
    <main className="desktop">
      {/* Header/Navbar */}
      <header className="taskbar" style={{ maxWidth: "600px" }}>
        <div className="logo-container">
          <img src="/icon.png" alt="Mimi Mail Logo" style={{ width: "24px", height: "24px", objectFit: "contain" }} />
          <span className="logo-text">Mimi Mail</span>
        </div>
        <div className="nav-links">
          <Link href="/" className="retro-btn btn-white" style={{ padding: "5px 12px", fontSize: "12px" }}>
            Back Home
          </Link>
        </div>
      </header>

      {/* Main Content Card */}
      <section className="retro-window" style={{ maxWidth: "600px" }}>
        <div className="window-titlebar" style={{ backgroundColor: "var(--accent-primary)" }}>
          <div className="window-title">About Mimi Mail</div>
        </div>
        <div className="window-body" style={{ lineHeight: "1.6", fontWeight: 500, color: "#2C221E" }}>
          <h2 style={{ fontSize: "20px", fontWeight: 800, marginBottom: "14px" }}>Our Mission</h2>
          <p style={{ marginBottom: "16px", color: "#6E6865" }}>
            Mimi Mail is designed to provide a safe, minimalist, and lightweight space for people to collect constructive, sweet, or anonymous notes from their audience, friends, and peers.
          </p>
          <p style={{ marginBottom: "20px", color: "#6E6865" }}>
            Built using modern framework technologies (Next.js, React) and backed by safe database models, we prioritize user privacy, loading performance, and clean aesthetic design.
          </p>

          <h2 style={{ fontSize: "20px", fontWeight: 800, marginBottom: "14px" }}>Privacy & Safety</h2>
          <p style={{ marginBottom: "16px", color: "#6E6865" }}>
            Every inbox is private and protected by standard session authorization. We do not sell or monetize message content, and users have full authority to delete, filter, and answer notes directly from their personal dashboard.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer" style={{ maxWidth: "600px" }}>
        <div>&copy; 2026 Mimi Mail. All rights reserved.</div>
        <div className="footer-links">
          <a href="/about" className="footer-link">About Us</a>
          <a href="/terms" className="footer-link">Terms</a>
          <a href="/contact" className="footer-link">Contact Us</a>
        </div>
      </footer>
    </main>
  );
}
