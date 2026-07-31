"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

interface Message {
  id: number;
  message_text: string;
  reply_text: string | null;
  is_answered: number;
  created_at: string;
}

interface DashboardClientProps {
  username: string;
  initialMessages: Message[];
}

export default function DashboardClient({ username, initialMessages }: DashboardClientProps) {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [filter, setFilter] = useState<"all" | "unanswered" | "answered">("unanswered");
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");
  const [copySuccess, setCopySuccess] = useState(false);
  const [submittingReply, setSubmittingReply] = useState(false);

  // Generate sharing link
  const sharingLink = typeof window !== "undefined" 
    ? `${window.location.protocol}//${window.location.host}/u/${username}` 
    : "";

  const handleCopy = () => {
    navigator.clipboard.writeText(sharingLink);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/");
      router.refresh();
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const handleReplySubmit = async (e: React.FormEvent, messageId: number) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    setSubmittingReply(true);
    try {
      const res = await fetch("/api/messages/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId, replyText: replyText.trim() }),
      });

      if (!res.ok) throw new Error("Failed to post reply");

      // Update local state
      setMessages(prev => 
        prev.map(msg => 
          msg.id === messageId 
            ? { ...msg, is_answered: 1, reply_text: replyText.trim() } 
            : msg
        )
      );
      setReplyingTo(null);
      setReplyText("");
    } catch (err) {
      alert("Error saving reply. Please try again.");
    } finally {
      setSubmittingReply(false);
    }
  };

  const filteredMessages = messages.filter(msg => {
    if (filter === "unanswered") return msg.is_answered === 0;
    if (filter === "answered") return msg.is_answered === 1;
    return true;
  });

  return (
    <main className="desktop">
      {/* Taskbar / Navigation */}
      <header className="taskbar">
        <div className="logo-container">
          <span style={{ fontSize: "28px" }}>✉️</span>
          <span className="logo-text">Mimi Mail Dashboard</span>
        </div>
        <div className="nav-links">
          <span style={{ fontWeight: "bold", fontSize: "14px", marginRight: "8px" }}>
            Hi, 🐰 {username}!
          </span>
          <button onClick={handleLogout} className="retro-btn btn-white" style={{ padding: "6px 12px", fontSize: "13px" }}>
            Log Out
          </button>
        </div>
      </header>

      <div className="grid-2">
        {/* Profile / Sharing Panel */}
        <section className="retro-window">
          <div className="window-titlebar" style={{ backgroundColor: "var(--accent-yellow)" }}>
            <div className="window-title">
              <span>🔗</span> ShareLink.sys
            </div>
            <div className="window-controls">
              <button className="window-btn">-</button>
              <button className="window-btn">▢</button>
              <button className="window-btn close-btn">✕</button>
            </div>
          </div>
          <div className="window-body" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <p style={{ fontSize: "14px", lineHeight: "1.4" }}>
              Share your link on Instagram, Twitter, TikTok, or anywhere! Anyone visiting can drop anonymous notes.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <input 
                type="text" 
                readOnly 
                value={sharingLink} 
                className="retro-input" 
                style={{ backgroundColor: "#EEE", cursor: "default" }}
              />
              <button onClick={handleCopy} className={`retro-btn ${copySuccess ? 'btn-teal' : 'btn-peach'}`}>
                {copySuccess ? "Copied! ✔️" : "Copy Shared Link"}
              </button>
            </div>

            <div className="retro-window" style={{ marginTop: "12px", borderStyle: "dashed" }}>
              <div className="window-body" style={{ padding: "12px", textAlign: "center", fontSize: "13px" }}>
                <span>💡 Tip:</span> Open your shared link in an incognito tab to test writing an anonymous note to yourself!
              </div>
            </div>
          </div>
        </section>

        {/* Mail / Inbox Panel */}
        <section className="retro-window">
          <div className="window-titlebar" style={{ backgroundColor: "var(--accent-pink)" }}>
            <div className="window-title">
              <span>📬</span> Inbox.exe
            </div>
            <div className="window-controls">
              <button className="window-btn">-</button>
              <button className="window-btn">▢</button>
              <button className="window-btn close-btn">✕</button>
            </div>
          </div>
          <div className="window-body">
            {/* Filter Tabs */}
            <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
              <button 
                onClick={() => setFilter("unanswered")} 
                className={`retro-btn ${filter === 'unanswered' ? 'btn-pink' : 'btn-white'}`}
                style={{ padding: "6px 12px", fontSize: "13px" }}
              >
                Unanswered ({messages.filter(m => !m.is_answered).length})
              </button>
              <button 
                onClick={() => setFilter("answered")} 
                className={`retro-btn ${filter === 'answered' ? 'btn-pink' : 'btn-white'}`}
                style={{ padding: "6px 12px", fontSize: "13px" }}
              >
                Answered ({messages.filter(m => m.is_answered).length})
              </button>
              <button 
                onClick={() => setFilter("all")} 
                className={`retro-btn ${filter === 'all' ? 'btn-pink' : 'btn-white'}`}
                style={{ padding: "6px 12px", fontSize: "13px" }}
              >
                All
              </button>
            </div>

            {/* Message List */}
            {filteredMessages.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 0", color: "#666", fontSize: "14px" }}>
                <span>📭</span> No {filter === "all" ? "" : filter} messages here.
              </div>
            ) : (
              filteredMessages.map(msg => (
                <div key={msg.id} className="message-card">
                  <div className="message-text">“{msg.message_text}”</div>
                  
                  {msg.is_answered === 1 ? (
                    <div className="reply-section">
                      <div className="reply-title">Your Answer:</div>
                      <div className="reply-text">{msg.reply_text}</div>
                    </div>
                  ) : (
                    <div>
                      {replyingTo === msg.id ? (
                        <form onSubmit={(e) => handleReplySubmit(e, msg.id)} className="reply-section" style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                          <textarea 
                            value={replyText} 
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder="Write your cute answer here..." 
                            className="retro-input"
                            rows={3}
                            maxLength={500}
                            required
                            disabled={submittingReply}
                          />
                          <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                            <button 
                              type="button" 
                              onClick={() => { setReplyingTo(null); setReplyText(""); }} 
                              className="retro-btn btn-white"
                              style={{ padding: "6px 12px", fontSize: "12px" }}
                              disabled={submittingReply}
                            >
                              Cancel
                            </button>
                            <button 
                              type="submit" 
                              className="retro-btn btn-teal"
                              style={{ padding: "6px 12px", fontSize: "12px" }}
                              disabled={submittingReply}
                            >
                              {submittingReply ? "Posting..." : "Post Answer"}
                            </button>
                          </div>
                        </form>
                      ) : (
                        <button 
                          onClick={() => { setReplyingTo(msg.id); setReplyText(""); }} 
                          className="retro-btn btn-purple"
                          style={{ padding: "6px 12px", fontSize: "12px", marginTop: "8px" }}
                        >
                          ✍️ Answer Note
                        </button>
                      )}
                    </div>
                  )}

                  <div className="message-meta" style={{ marginTop: "12px" }}>
                    <span>Anonymous Note</span>
                    <span>{new Date(msg.created_at).toLocaleDateString()}</span>
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
