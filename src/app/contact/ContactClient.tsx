"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ContactClient() {
  const router = useRouter();
  const [category, setCategory] = useState("question");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  useEffect(() => {
    const savedTheme = localStorage.getItem("mimi-theme") || "theme-peach";
    const savedDark = localStorage.getItem("mimi-dark") === "true";
    document.body.className = `${savedTheme} ${savedDark ? "dark-mode" : ""}`;
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, message: message.trim() }),
      });

      if (!res.ok) {
        throw new Error("Failed to send contact message");
      }

      setSuccess("Thank you! Your message has been sent successfully.");
      setMessage("");
      
      // Clear success banner after 3 seconds
      setTimeout(() => {
        setSuccess("");
      }, 3000);
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="desktop">
      {/* Header/Navbar */}
      <header className="taskbar" style={{ maxWidth: "500px" }}>
        <div className="logo-container" onClick={() => router.push("/")} style={{ cursor: "pointer" }}>
          <img src="/icon.png" alt="Mimi Mail Logo" style={{ width: "32px", height: "32px", objectFit: "contain", mixBlendMode: "multiply" }} />
          <span className="logo-text">
            Mimi Mail
          </span>
        </div>
        <div className="nav-links">
          <button 
            onClick={() => router.push("/")} 
            className="retro-btn btn-white"
            style={{ padding: "5px 12px", fontSize: "12px" }}
          >
            Back Home
          </button>
        </div>
      </header>

      {/* Main Form Box */}
      <section className="retro-window" style={{ maxWidth: "500px" }}>
        <div className="window-titlebar" style={{ backgroundColor: "var(--accent-primary)" }}>
          <div className="window-title">
            Contact Us
          </div>
        </div>

        <div className="window-body" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {success && (
            <div className="retro-window" style={{ border: "1.5px solid #5CB85C", boxShadow: "none" }}>
              <div className="window-body" style={{ padding: "10px 14px", fontSize: "13px", backgroundColor: "#F7FDF7", color: "#5CB85C", fontWeight: 600 }}>
                {success}
              </div>
            </div>
          )}

          {error && (
            <div className="retro-window" style={{ border: "1.5px solid #D9534F", boxShadow: "none" }}>
              <div className="window-body" style={{ padding: "10px 14px", fontSize: "13px", backgroundColor: "#FDF7F7", color: "#D9534F", fontWeight: 600 }}>
                {error}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" htmlFor="category">What is this regarding?</label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="retro-input"
                style={{ cursor: "pointer" }}
                disabled={isLoading}
              >
                <option value="question">Question</option>
                <option value="concern">Concern</option>
                <option value="suggestion">Suggestion</option>
                <option value="review">Review</option>
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" htmlFor="message">Your Message</label>
              <textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message here..."
                className="retro-input"
                rows={5}
                maxLength={1000}
                required
                disabled={isLoading}
                style={{ resize: "none" }}
              />
              <div style={{ textAlign: "right", fontSize: "11px", color: "#8A8480", marginTop: "4px" }}>
                {message.length}/1000 characters
              </div>
            </div>

            <button
              type="submit"
              className="retro-btn btn-primary"
              style={{ padding: "10px", width: "100%" }}
              disabled={isLoading || !message.trim()}
            >
              {isLoading ? "Sending..." : "Send Message"}
            </button>
          </form>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer" style={{ maxWidth: "500px" }}>
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
