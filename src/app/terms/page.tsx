import React from "react";
import Link from "next/link";

export const metadata = {
  title: "Terms of Service | Mimi Mail",
  description: "Read our terms of service, conditions, and user agreement details.",
};

export default function TermsPage() {
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
          <div className="window-title">Terms & Conditions</div>
        </div>
        <div className="window-body" style={{ lineHeight: "1.6", fontWeight: 500, color: "#2C221E" }}>
          <h2 style={{ fontSize: "18px", fontWeight: 800, marginBottom: "10px" }}>1. Acceptance of Terms</h2>
          <p style={{ marginBottom: "16px", color: "#6E6865", fontSize: "14px" }}>
            By registering for an account or using the Mimi Mail anonymous message board service, you agree to comply with and be bound by these Terms & Conditions. If you do not agree, please discontinue use.
          </p>

          <h2 style={{ fontSize: "18px", fontWeight: 800, marginBottom: "10px" }}>2. Responsible Usage</h2>
          <p style={{ marginBottom: "16px", color: "#6E6865", fontSize: "14px" }}>
            Users are solely responsible for all answers posted on their board. You agree not to use Mimi Mail to transmit any unlawful, threatening, abusive, harassing, defamatory, or otherwise objectionable material.
          </p>

          <h2 style={{ fontSize: "18px", fontWeight: 800, marginBottom: "10px" }}>3. Data Privacy</h2>
          <p style={{ marginBottom: "16px", color: "#6E6865", fontSize: "14px" }}>
            All messages are sent anonymously. We collect emails and passwords for account creation and secure session authentication only. Your data is stored in our database, and we never share or sell your information to third parties.
          </p>

          <h2 style={{ fontSize: "18px", fontWeight: 800, marginBottom: "10px" }}>4. Termination</h2>
          <p style={{ marginBottom: "8px", color: "#6E6865", fontSize: "14px" }}>
            We reserve the right to suspend or terminate user accounts that violate our terms or engage in abusive platform usage without prior notice.
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
