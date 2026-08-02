"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface AnsweredMessage {
  id: number;
  message_text: string;
  reply_text: string;
  created_at: string;
  answered_at: string;
}

interface ProfileClientProps {
  username: string;
  initialAnswers: AnsweredMessage[];
  displayName?: string;
  bio?: string;
  initialTheme?: string;
}

export default function ProfileClient({ 
  username, 
  initialAnswers, 
  displayName, 
  bio,
  initialTheme = 'theme-peach'
}: ProfileClientProps) {
  const router = useRouter();
  const [messageText, setMessageText] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Toggle view state between sending note and seeing answers
  const [showAnswers, setShowAnswers] = useState(false);

  // Load theme on mount
  useEffect(() => {
    document.body.className = initialTheme;
  }, [initialTheme]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) return;

    setError("");
    setSuccess("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/messages/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, messageText: messageText.trim() }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send message");

      setSuccess("Your anonymous note was dropped successfully!");
      setMessageText("");
      setTimeout(() => setSuccess(""), 5000);
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Failed to send message");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="desktop">
      <header className="taskbar" style={{ maxWidth: "450px" }}>
        <div 
          className="logo-container" 
          onClick={() => router.push("/")} 
          style={{ cursor: "pointer" }}
        >
          <img src="/icon.png" alt="Mimi Mail Logo" style={{ width: "32px", height: "32px", objectFit: "contain", mixBlendMode: "multiply" }} />
          <span className="logo-text">Mimi Mail</span>
        </div>
        <div className="nav-links">
          <button 
            onClick={() => router.push("/?mode=register")} 
            className="retro-btn btn-white"
            style={{ padding: "5px 12px", fontSize: "12px" }}
          >
            Create My Own
          </button>
        </div>
      </header>

      <div style={{ width: "100%", maxWidth: "450px", display: "flex", flexDirection: "column", gap: "20px" }}>
        {/* Toggle view block */}
        {!showAnswers ? (
          <>
            {/* Send message box */}
            <section className="retro-window">
              <div className="window-titlebar" style={{ backgroundColor: "var(--accent-primary)" }}>
                <div className="window-title">
                  Note to {displayName || username}
                </div>
              </div>
              <div className="window-body">
                {bio && (
                  <p style={{ fontSize: "13px", marginBottom: "16px", fontWeight: 500, textAlign: "center", color: "#6E6865", lineHeight: "1.5" }}>
                    {bio}
                  </p>
                )}

                {error && (
                  <div className="retro-window" style={{ border: "1.5px solid #D9534F", marginBottom: "16px", boxShadow: "none" }}>
                    <div className="window-body" style={{ padding: "10px 14px", fontSize: "13px", backgroundColor: "#FDF7F7", fontWeight: 500 }}>
                      {error}
                    </div>
                  </div>
                )}

                {success && (
                  <div className="retro-window" style={{ border: "1.5px solid #5CB85C", marginBottom: "16px", boxShadow: "none" }}>
                    <div className="window-body" style={{ padding: "10px 14px", fontSize: "13px", backgroundColor: "#F7FDF7", fontWeight: 500 }}>
                      {success}
                    </div>
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  <div className="form-group" style={{ marginBottom: "16px" }}>
                    <textarea 
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      className="retro-input"
                      placeholder="Drop a nice message here... (it's anonymous!)"
                      rows={5}
                      maxLength={500}
                      required
                      disabled={submitting}
                      style={{ resize: "none" }}
                    />
                    <div style={{ textAlign: "right", fontSize: "11px", color: "#8A8480", marginTop: "4px" }}>
                      {messageText.length}/500 characters
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    className="retro-btn btn-primary" 
                    style={{ width: "100%", padding: "10px" }}
                    disabled={submitting}
                  >
                    {submitting ? "Sending..." : "Send Note Anonymously"}
                  </button>
                </form>
              </div>
            </section>

            <button 
              onClick={() => {
                setShowAnswers(true);
                setError("");
                setSuccess("");
              }} 
              className="retro-btn btn-white" 
              style={{ width: "100%", padding: "10px" }}
            >
              See Answer Board ({initialAnswers.length})
            </button>
          </>
        ) : (
          <>
            {/* Board of answered messages */}
            <section className="retro-window">
              <div className="window-titlebar" style={{ backgroundColor: "var(--accent-primary)" }}>
                <div className="window-title">
                  Answer Board
                </div>
              </div>
              <div className="window-body">
                <h3 style={{ fontSize: "15px", fontWeight: 700, marginBottom: "16px", borderBottom: "1.5px solid var(--border-color)", paddingBottom: "8px", letterSpacing: "-0.2px" }}>
                  Answered Letters ({initialAnswers.length})
                </h3>
                
                {initialAnswers.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "32px 0", color: "#8A8480", fontSize: "13px", fontWeight: 500 }}>
                    {displayName || username}  hasn&apos;t answered any letters yet. Check back later!
                  </div>
                ) : (
                  initialAnswers.map(ans => {
                    const noteNumber = initialAnswers.length - initialAnswers.findIndex(a => a.id === ans.id);
                    return (
                      <div key={ans.id} className="message-card" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                        {/* Top Row: Note ID header */}
                        <div>
                          <span style={{ fontWeight: 700, fontSize: "13px", color: "var(--border-color)" }}>Anonymous Note #{noteNumber}</span>
                        </div>

                        {/* Question Content */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                          <div className="message-text" style={{ fontSize: "15px", margin: 0 }}>“{ans.message_text}”</div>
                          <span style={{ fontSize: "11px", color: "#8A8480" }}>Asked: {new Date(ans.created_at).toLocaleString()}</span>
                        </div>

                        {/* Answer Section */}
                        <div style={{ 
                          borderLeft: "3.5px solid var(--accent-primary)", 
                          paddingLeft: "12px", 
                          marginTop: "4px",
                          display: "flex",
                          flexDirection: "column",
                          gap: "2px"
                        }}>
                          <div>
                            <span style={{ fontWeight: 800, fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.5px", color: "#7A706B", marginRight: "8px" }}>
                              {displayName || username}:
                            </span>
                            <span style={{ fontSize: "14px", fontWeight: 500, color: "#2C221E" }}>{ans.reply_text}</span>
                          </div>
                          <span style={{ fontSize: "11px", color: "#8A8480" }}>Answered: {new Date(ans.answered_at).toLocaleString()}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </section>

            <button 
              onClick={() => setShowAnswers(false)} 
              className="retro-btn btn-white" 
              style={{ width: "100%", padding: "10px" }}
            >
              Write a Note
            </button>
          </>
        )}
      </div>

      {/* Footer */}
      <footer className="footer" style={{ maxWidth: "450px" }}>
        <div>&copy; 2026 Mimi Mail.</div>
        <div className="footer-links">
          <a href="/about" className="footer-link">About Us</a>
          <a href="/terms" className="footer-link">Terms</a>
          <a href="/contact" className="footer-link">Contact Us</a>
        </div>
      </footer>
    </main>
  );
}
