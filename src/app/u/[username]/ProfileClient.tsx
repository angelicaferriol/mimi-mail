"use client";

import React, { useState } from "react";
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
}

export default function ProfileClient({ username, initialAnswers }: ProfileClientProps) {
  const router = useRouter();
  const [messageText, setMessageText] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

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

      setSuccess("Your anonymous note was dropped successfully! 🐰");
      setMessageText("");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="desktop">
      {/* Header/Taskbar */}
      <header className="taskbar">
        <div className="logo-container">
          <span style={{ fontSize: "28px" }}>✉️</span>
          <span className="logo-text">Mimi Mail Board</span>
        </div>
        <div className="nav-links">
          <button 
            onClick={() => router.push("/")} 
            className="retro-btn btn-white"
            style={{ padding: "6px 12px", fontSize: "13px" }}
          >
            Create My Own Board
          </button>
        </div>
      </header>

      <div className="grid-2">
        {/* Send message box */}
        <section className="retro-window">
          <div className="window-titlebar" style={{ backgroundColor: "var(--accent-teal)" }}>
            <div className="window-title">
              <span>✍️</span> Note to {username}
            </div>
            <div className="window-controls">
              <button className="window-btn">-</button>
              <button className="window-btn">▢</button>
              <button className="window-btn close-btn">✕</button>
            </div>
          </div>
          <div className="window-body">
            <div className="mascot-container">
              <div className="mascot-bunny" style={{ fontSize: "40px" }}>🐰💌</div>
            </div>
            <p style={{ fontSize: "14px", marginBottom: "16px", fontStyle: "italic", textAlign: "center" }}>
              Leave a sweet, funny, or anonymous note for {username} below! It is 100% anonymous.
            </p>

            {error && (
              <div className="retro-window" style={{ border: "2px solid #D9534F", marginBottom: "16px", borderRadius: "8px" }}>
                <div className="window-titlebar" style={{ backgroundColor: "#D9534F", padding: "4px 8px", borderBottom: "2px solid #2C221E" }}>
                  <span style={{ color: "#FFF", fontSize: "12px", fontWeight: "bold" }}>⚠️ Error</span>
                </div>
                <div className="window-body" style={{ padding: "8px", fontSize: "13px", backgroundColor: "#FDF7F7" }}>
                  {error}
                </div>
              </div>
            )}

            {success && (
              <div className="retro-window" style={{ border: "2px solid #5CB85C", marginBottom: "16px", borderRadius: "8px" }}>
                <div className="window-titlebar" style={{ backgroundColor: "#5CB85C", padding: "4px 8px", borderBottom: "2px solid #2C221E" }}>
                  <span style={{ color: "#FFF", fontSize: "12px", fontWeight: "bold" }}>✔️ Success</span>
                </div>
                <div className="window-body" style={{ padding: "8px", fontSize: "13px", backgroundColor: "#F7FDF7" }}>
                  {success}
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-group" style={{ marginBottom: "20px" }}>
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
              </div>

              <button 
                type="submit" 
                className="retro-btn btn-teal" 
                style={{ width: "100%", padding: "12px" }}
                disabled={submitting}
              >
                {submitting ? "Sending..." : "Send Note Anonymously"}
              </button>
            </form>
          </div>
        </section>

        {/* Board of answered messages */}
        <section className="retro-window">
          <div className="window-titlebar" style={{ backgroundColor: "var(--accent-purple)" }}>
            <div className="window-title">
              <span>🌟</span> Answer Board
            </div>
            <div className="window-controls">
              <button className="window-btn">-</button>
              <button className="window-btn">▢</button>
              <button className="window-btn close-btn">✕</button>
            </div>
          </div>
          <div className="window-body">
            <h3 style={{ fontSize: "15px", marginBottom: "16px", borderBottom: "3px solid var(--border-color)", paddingBottom: "8px" }}>
              Answered Letters ({initialAnswers.length})
            </h3>
            
            {initialAnswers.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 0", color: "#666", fontSize: "14px" }}>
                🐰 {username} hasn't answered any letters yet. Check back later!
              </div>
            ) : (
              initialAnswers.map(ans => (
                <div key={ans.id} className="message-card">
                  <div className="message-text">“{ans.message_text}”</div>
                  
                  <div className="reply-section">
                    <div className="reply-title">{username}'s Answer:</div>
                    <div className="reply-text">{ans.reply_text}</div>
                  </div>

                  <div className="message-meta" style={{ marginTop: "12px" }}>
                    <span>Anonymous</span>
                    <span>{new Date(ans.answered_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
