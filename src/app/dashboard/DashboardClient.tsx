"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Message {
  id: number;
  message_text: string;
  reply_text: string | null;
  is_answered: number;
  created_at: string;
  answered_at: string | null;
}

interface DashboardClientProps {
  username: string;
  initialMessages: Message[];
  initialDisplayName: string;
  initialBio: string;
}

export default function DashboardClient({ 
  username, 
  initialMessages, 
  initialDisplayName, 
  initialBio 
}: DashboardClientProps) {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [filter, setFilter] = useState<"all" | "unanswered" | "answered">("unanswered");
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");
  const [copySuccess, setCopySuccess] = useState(false);
  const [submittingReply, setSubmittingReply] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  // Theme state
  const [theme, setTheme] = useState("theme-peach");

  // Profile states
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [bio, setBio] = useState(initialBio);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState("");
  const [profileError, setProfileError] = useState("");
  const [deletingAccount, setDeletingAccount] = useState(false);

  // Collapsible toggle
  const [showSettings, setShowSettings] = useState(false);

  // Success alert for answering a note
  const [answerSuccess, setAnswerSuccess] = useState("");

  // Custom confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {}
  });

  const [showTutorial, setShowTutorial] = useState(false);

  // Load and sync theme on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem("mimi-theme") || "theme-peach";
    document.body.className = savedTheme;
    const themeTimer = window.setTimeout(() => setTheme(savedTheme), 0);

    // Show tutorial if not dismissed
    const dismissed = localStorage.getItem("mimi_tutorial_dismissed");
    const tutorialTimer = window.setTimeout(() => {
      if (!dismissed) {
        setShowTutorial(true);
      }
    }, 0);

    setMounted(true);
    return () => {
      window.clearTimeout(themeTimer);
      window.clearTimeout(tutorialTimer);
    };
  }, []);

  const dismissTutorial = () => {
    setShowTutorial(false);
    localStorage.setItem("mimi_tutorial_dismissed", "true");
  };

  const changeTheme = (newTheme: string) => {
    setTheme(newTheme);
    localStorage.setItem("mimi-theme", newTheme);
    document.body.className = newTheme;
  };

  const [sharingLink, setSharingLink] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSharingLink(`${window.location.protocol}//${window.location.host}/u/${username}`);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [username]);

  const handleCopy = () => {
    navigator.clipboard.writeText(sharingLink);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const executeLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/");
      router.refresh();
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const triggerLogoutConfirm = () => {
    setConfirmDialog({
      isOpen: true,
      title: "Log Out",
      message: "Are you sure you want to log out of your mailbox?",
      onConfirm: executeLogout
    });
  };

  const executeDeleteAccount = async () => {
    setDeletingAccount(true);
    try {
      const res = await fetch("/api/profile/delete", { method: "POST" });
      if (!res.ok) throw new Error("Failed to delete account");
      router.push("/");
      router.refresh();
    } catch (error: unknown) {
      alert(error instanceof Error ? error.message : "An error occurred during account deletion.");
      setDeletingAccount(false);
    }
  };

  const triggerDeleteAccountConfirm = () => {
    setConfirmDialog({
      isOpen: true,
      title: "Delete Account",
      message: "Are you sure you want to permanently delete your account? This will erase all your messages, replies, and profile data. This action cannot be undone.",
      onConfirm: executeDeleteAccount
    });
  };

  const executeDeleteMessage = async (messageId: number) => {
    try {
      const res = await fetch("/api/messages/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId }),
      });
      if (!res.ok) throw new Error("Failed to delete note");
      setMessages(prev => prev.filter(m => m.id !== messageId));
      setAnswerSuccess("Note deleted successfully.");
      setTimeout(() => setAnswerSuccess(""), 5000);
    } catch (error: unknown) {
      alert(error instanceof Error ? error.message : "An error occurred while deleting the note.");
    }
  };

  const triggerDeleteMessageConfirm = (messageId: number) => {
    setConfirmDialog({
      isOpen: true,
      title: "Delete Note",
      message: "Are you sure you want to delete this note? This action cannot be undone.",
      onConfirm: () => executeDeleteMessage(messageId)
    });
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileSuccess("");
    setProfileError("");
    try {
      const res = await fetch("/api/profile/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName, bio }),
      });
      if (!res.ok) throw new Error("Failed to update profile settings");
      setProfileSuccess("Profile updated successfully!");
      router.refresh();
      setTimeout(() => setProfileSuccess(""), 3000);
    } catch (error: unknown) {
      setProfileError(error instanceof Error ? error.message : "Failed to update profile settings");
      setTimeout(() => setProfileError(""), 3000);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleReplySubmit = async (e: React.FormEvent, messageId: number) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    setSubmittingReply(true);
    setAnswerSuccess("");
    try {
      const res = await fetch("/api/messages/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId, replyText: replyText.trim() }),
      });

      if (!res.ok) throw new Error("Failed to post reply");

      const now = new Date().toISOString();

      // Update local state
      setMessages(prev => 
        prev.map(msg => 
          msg.id === messageId 
            ? { ...msg, is_answered: 1, reply_text: replyText.trim(), answered_at: now } 
            : msg
        )
      );
      setReplyingTo(null);
      setReplyText("");
      setAnswerSuccess("Your answer has been posted successfully!");
      // Auto-hide alert after 5 seconds
      setTimeout(() => setAnswerSuccess(""), 5000);
    } catch {
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
      {/* Navbar Header */}
      <header className="taskbar" style={{ maxWidth: "600px" }}>
        <div className="logo-container">
          <img src="/icon.png" alt="Mimi Mail Logo" style={{ width: "32px", height: "32px", objectFit: "contain", mixBlendMode: "multiply" }} />
          <span className="logo-text">Mimi Mail</span>
        </div>
        <div className="nav-links">
          <button 
            onClick={() => {
              setShowSettings(!showSettings);
              setProfileSuccess("");
              setProfileError("");
            }} 
            className="retro-btn btn-white" 
            style={{ padding: "5px 12px", fontSize: "12px" }}
          >
            {showSettings ? "Inbox" : "Settings"}
          </button>
        </div>
      </header>

      <div style={{ width: "100%", maxWidth: "600px", display: "flex", flexDirection: "column", gap: "20px" }}>
        {!showSettings && (showTutorial || messages.length === 0) && (
          <div style={{ 
            border: "1.5px dashed var(--border-color)", 
            borderRadius: "12px", 
            padding: "12px 16px", 
            position: "relative",
            backgroundColor: "#FAF7F4",
            marginBottom: "10px"
          }}>
            <button 
              onClick={dismissTutorial}
              style={{ 
                position: "absolute",
                right: "12px",
                top: "10px",
                background: "none", 
                border: "none", 
                cursor: "pointer", 
                fontWeight: "bold", 
                fontSize: "14px", 
                color: "#8A8480"
              }}
              title="Close guide"
            >
              ✕
            </button>
            <h3 style={{ fontSize: "13px", fontWeight: 700, marginBottom: "4px", color: "var(--border-color)" }}>
              Welcome to Mimi Mail!
            </h3>
            <p style={{ fontSize: "12px", color: "var(--text-muted, #6E6865)", lineHeight: 1.4, fontWeight: 500, paddingRight: "20px" }}>
              To start receiving anonymous messages, click the <strong>Settings</strong> button above, copy your personal sharing link, and share it with your friends!
            </p>
          </div>
        )}

        {/* Consolidated Profile & Settings Panel (Exclusive View) */}
        {showSettings ? (
          <section className="retro-window">
            <div className="window-titlebar" style={{ backgroundColor: "var(--accent-primary)" }}>
              <div className="window-title">
                Profile & Settings
              </div>
            </div>
            <div className="window-body" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              {/* Share Link */}
              <div>
                <h3 style={{ fontSize: "14px", fontWeight: 700, marginBottom: "8px" }}>Share Link</h3>
                <div style={{ display: "flex", gap: "10px" }}>
                  <input 
                    type="text" 
                    readOnly 
                    value={sharingLink} 
                    className="retro-input" 
                    style={{ backgroundColor: "#F7F3EE", cursor: "default", flexGrow: 1 }}
                  />
                  <button onClick={handleCopy} className={`retro-btn ${copySuccess ? 'btn-white' : 'btn-primary'}`} style={{ padding: "8px 16px", whiteSpace: "nowrap" }}>
                    {copySuccess ? "Copied!" : "Copy Link"}
                  </button>
                </div>
              </div>

              <hr style={{ border: "0", borderTop: "1.5px solid #EBE7E4" }} />

              {/* Edit Profile */}
              <form onSubmit={handleProfileUpdate} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <h3 style={{ fontSize: "14px", fontWeight: 700 }}>Edit Profile Details</h3>
                {profileSuccess && (
                  <div className="retro-window" style={{ border: "1.5px solid #5CB85C", boxShadow: "none" }}>
                    <div className="window-body" style={{ padding: "10px 14px", fontSize: "13px", backgroundColor: "#F7FDF7", color: "#5CB85C", fontWeight: 600 }}>
                      {profileSuccess}
                    </div>
                  </div>
                )}
                {profileError && (
                  <div className="retro-window" style={{ border: "1.5px solid #D9534F", boxShadow: "none" }}>
                    <div className="window-body" style={{ padding: "10px 14px", fontSize: "13px", backgroundColor: "#FDF7F7", color: "#D9534F", fontWeight: 600 }}>
                      Error: {profileError}
                    </div>
                  </div>
                )}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Display Name</label>
                  <input 
                    type="text" 
                    className="retro-input" 
                    placeholder={username}
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    maxLength={50}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Bio / Description</label>
                  <textarea 
                    className="retro-input" 
                    placeholder="Leave a note..."
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={3}
                    maxLength={200}
                    style={{ resize: "none" }}
                  />
                </div>
                <button 
                  type="submit" 
                  className="retro-btn btn-primary" 
                  disabled={savingProfile}
                  style={{ alignSelf: "flex-start", padding: "8px 20px" }}
                >
                  {savingProfile ? "Saving..." : "Save Profile"}
                </button>
              </form>

              <hr style={{ border: "0", borderTop: "1.5px solid #EBE7E4" }} />

              {/* Theme Settings */}
              <div>
                <h3 style={{ fontSize: "14px", fontWeight: 700, marginBottom: "8px" }}>Color Theme</h3>
                <div className="theme-picker">
                  <button 
                    onClick={() => changeTheme("theme-peach")} 
                    className={`theme-dot ${theme === "theme-peach" ? "active" : ""}`}
                    style={{ backgroundColor: "var(--accent-peach)" }}
                    title="Peach"
                  />
                  <button 
                    onClick={() => changeTheme("theme-green")} 
                    className={`theme-dot ${theme === "theme-green" ? "active" : ""}`}
                    style={{ backgroundColor: "var(--accent-green)" }}
                    title="Sage Green"
                  />
                  <button 
                    onClick={() => changeTheme("theme-purple")} 
                    className={`theme-dot ${theme === "theme-purple" ? "active" : ""}`}
                    style={{ backgroundColor: "var(--accent-purple)" }}
                    title="Lavender"
                  />
                  <button 
                    onClick={() => changeTheme("theme-yellow")} 
                    className={`theme-dot ${theme === "theme-yellow" ? "active" : ""}`}
                    style={{ backgroundColor: "var(--accent-yellow)" }}
                    title="Muted Yellow"
                  />
                </div>
              </div>
              <hr style={{ border: "0", borderTop: "1.5px solid #EBE7E4" }} />
              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                <button 
                  onClick={triggerLogoutConfirm} 
                  className="retro-btn btn-white" 
                  style={{ padding: "8px 20px" }}
                >
                  Log Out
                </button>
                <button 
                  onClick={triggerDeleteAccountConfirm} 
                  disabled={deletingAccount}
                  className="retro-btn btn-white" 
                  style={{ padding: "8px 20px", color: "#D9534F", borderColor: "#D9534F" }}
                >
                  {deletingAccount ? "Deleting Account..." : "Delete Account"}
                </button>
              </div>
            </div>
          </section>
        ) : (
          /* Mail / Inbox Panel */
          <section className="retro-window">
            <div className="window-titlebar" style={{ backgroundColor: "var(--accent-primary)" }}>
              <div className="window-title">
                Inbox
              </div>
            </div>
            <div className="window-body">
              {/* Answer Success Banner */}
              {answerSuccess && (
                <div className="retro-window" style={{ border: "1.5px solid #5CB85C", marginBottom: "18px", boxShadow: "none" }}>
                  <div className="window-body" style={{ padding: "10px 14px", fontSize: "13px", backgroundColor: "#F7FDF7", fontWeight: 600, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span>{answerSuccess}</span>
                    <button 
                      onClick={() => setAnswerSuccess("")} 
                      style={{ background: "none", border: "none", cursor: "pointer", fontWeight: "bold", fontSize: "14px", color: "#5CB85C" }}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              )}

              {/* Filter Tabs */}
              <div style={{ display: "flex", gap: "8px", marginBottom: "18px" }}>
                <button 
                  onClick={() => setFilter("unanswered")} 
                  className={`retro-btn ${filter === 'unanswered' ? 'btn-primary' : 'btn-white'}`}
                  style={{ padding: "5px 12px", fontSize: "12px" }}
                >
                  Unanswered ({messages.filter(m => !m.is_answered).length})
                </button>
                <button 
                  onClick={() => setFilter("answered")} 
                  className={`retro-btn ${filter === 'answered' ? 'btn-primary' : 'btn-white'}`}
                  style={{ padding: "5px 12px", fontSize: "12px" }}
                >
                  Answered ({messages.filter(m => m.is_answered).length})
                </button>
                <button 
                  onClick={() => setFilter("all")} 
                  className={`retro-btn ${filter === 'all' ? 'btn-primary' : 'btn-white'}`}
                  style={{ padding: "5px 12px", fontSize: "12px" }}
                >
                  All
                </button>
              </div>

              {/* Message List */}
              {filteredMessages.length === 0 ? (
                <div style={{ textAlign: "center", padding: "32px 0", color: "#8A8480", fontSize: "13px", fontWeight: 500 }}>
                  No {filter === "all" ? "" : filter} messages.
                </div>
              ) : (
                filteredMessages.map(msg => {
                  const noteNumber = messages.length - messages.findIndex(m => m.id === msg.id);
                  return (
                    <div key={msg.id} className="message-card" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      {/* Top Row: Note ID header and Delete Action */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontWeight: 700, fontSize: "13px", color: "var(--border-color)" }}>Anonymous Note #{noteNumber}</span>
                      <button 
                        onClick={() => triggerDeleteMessageConfirm(msg.id)} 
                        className="retro-btn btn-white"
                        style={{ 
                          padding: "6px 8px", 
                          color: "#D9534F", 
                          borderColor: "#D9534F",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center"
                        }}
                        title="Delete Note"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6"></polyline>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                          <line x1="10" y1="11" x2="10" y2="17"></line>
                          <line x1="14" y1="11" x2="14" y2="17"></line>
                        </svg>
                      </button>
                    </div>

                    {/* Question Content */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                      <div className="message-text" style={{ fontSize: "15px", margin: 0 }}>“{msg.message_text}”</div>
                      <span style={{ fontSize: "11px", color: "#8A8480" }}>Asked: {mounted ? new Date(msg.created_at).toLocaleString() : ""}</span>
                    </div>

                    {/* Answer Section */}
                    {msg.is_answered === 1 ? (
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
                          <span style={{ fontSize: "14px", fontWeight: 500, color: "#2C221E" }}>{msg.reply_text}</span>
                        </div>
                        {msg.answered_at && (
                          <span style={{ fontSize: "11px", color: "#8A8480" }}>Answered: {mounted && msg.answered_at ? new Date(msg.answered_at).toLocaleString() : ""}</span>
                        )}
                      </div>
                    ) : (
                      <div style={{ marginTop: "4px" }}>
                        {replyingTo === msg.id ? (
                          <form onSubmit={(e) => handleReplySubmit(e, msg.id)} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                            <textarea 
                              value={replyText} 
                              onChange={(e) => setReplyText(e.target.value)}
                              placeholder="Write your answer..." 
                              className="retro-input"
                              rows={3}
                              maxLength={500}
                              required
                              disabled={submittingReply}
                            />
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
                              <span style={{ fontSize: "11px", color: "#8A8480" }}>
                                {replyText.length}/500 characters
                              </span>
                              <div style={{ display: "flex", gap: "8px" }}>
                                <button 
                                  type="button" 
                                  onClick={() => { setReplyingTo(null); setReplyText(""); }} 
                                  className="retro-btn btn-white"
                                  style={{ padding: "5px 10px", fontSize: "11px" }}
                                disabled={submittingReply}
                              >
                                Cancel
                              </button>
                              <button 
                                type="submit" 
                                className="retro-btn btn-primary"
                                style={{ padding: "5px 10px", fontSize: "11px" }}
                                disabled={submittingReply}
                              >
                                {submittingReply ? "Posting..." : "Post Answer"}
                              </button>
                            </div>
                          </div>
                        </form>
                        ) : (
                          <button 
                            onClick={() => { setReplyingTo(msg.id); setReplyText(""); }} 
                            className="retro-btn btn-primary"
                            style={{ padding: "5px 12px", fontSize: "11px" }}
                          >
                            Answer Note
                          </button>
                        )}
                      </div>
                    )}
                    </div>
                  );
                })
              )}
            </div>
          </section>
        )}
      </div>

      {/* Custom Confirmation Modal Dialog */}
      {confirmDialog.isOpen && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(44, 34, 30, 0.4)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
          padding: "20px"
        }}>
          <section className="retro-window" style={{ maxWidth: "400px", margin: 0 }}>
            <div className="window-titlebar" style={{ backgroundColor: "var(--accent-primary)" }}>
              <div className="window-title">{confirmDialog.title}</div>
            </div>
            <div className="window-body">
              <p style={{ fontSize: "14px", lineHeight: "1.5", marginBottom: "20px", fontWeight: 500, color: "#6E6865" }}>
                {confirmDialog.message}
              </p>
              <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                <button 
                  onClick={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))} 
                  className="retro-btn btn-white"
                  style={{ padding: "8px 16px", fontSize: "13px" }}
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    confirmDialog.onConfirm();
                    setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                  }} 
                  className="retro-btn btn-primary"
                  style={{ padding: "8px 16px", fontSize: "13px" }}
                >
                  Confirm
                </button>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* Footer */}
      <footer className="footer" style={{ maxWidth: "600px" }}>
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
