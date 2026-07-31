"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LandingPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Check if session exists on load
  useEffect(() => {
    // We can do a quick check via an API or cookies if we want,
    // or just let dashboard handle it.
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    const endpoint = isLogin ? "/api/auth/login" : "/api/auth/register";
    const payload = isLogin 
      ? { loginId: email, password } 
      : { username, email, password };

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Something went wrong");
      }

      if (isLogin) {
        router.push("/dashboard");
      } else {
        setSuccess("Account created successfully! Logging you in...");
        setTimeout(() => {
          router.push("/dashboard");
        }, 1500);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="desktop">
      {/* Header/Taskbar */}
      <header className="taskbar">
        <div className="logo-container">
          <span style={{ fontSize: "28px" }}>✉️</span>
          <h1 className="logo-text">Mimi Mail</h1>
        </div>
        <div className="nav-links">
          <button 
            onClick={() => setIsLogin(true)} 
            className={`retro-btn ${isLogin ? 'btn-peach' : 'btn-white'}`}
            style={{ padding: '6px 12px', fontSize: '14px' }}
          >
            Log In
          </button>
          <button 
            onClick={() => setIsLogin(false)} 
            className={`retro-btn ${!isLogin ? 'btn-peach' : 'btn-white'}`}
            style={{ padding: '6px 12px', fontSize: '14px' }}
          >
            Sign Up
          </button>
        </div>
      </header>

      {/* Mascot Section */}
      <div className="mascot-container">
        <div className="mascot-bunny" style={{ fontSize: "50px", textAlign: "center" }}>
          🐰
        </div>
      </div>

      {/* Auth Window */}
      <section className="retro-window" style={{ maxWidth: "450px" }}>
        <div className="window-titlebar" style={{ backgroundColor: isLogin ? "var(--accent-pink)" : "var(--accent-teal)" }}>
          <div className="window-title">
            <span>💾</span>
            {isLogin ? "Login.exe" : "Register.exe"}
          </div>
          <div className="window-controls">
            <button className="window-btn">-</button>
            <button className="window-btn">▢</button>
            <button className="window-btn close-btn">✕</button>
          </div>
        </div>

        <div className="window-body">
          <p style={{ marginBottom: "16px", fontSize: "14px", textAlign: "center", fontStyle: "italic" }}>
            {isLogin 
              ? "Welcome back! Enter your credentials to view your inbox."
              : "Claim your unique username and start receiving anonymous sweet notes!"}
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

          <form onSubmit={handleAuth}>
            {!isLogin && (
              <div className="form-group">
                <label className="form-label" htmlFor="username">Choose Username</label>
                <input 
                  type="text" 
                  id="username" 
                  className="retro-input"
                  placeholder="e.g., mimi_bunny"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required={!isLogin}
                  disabled={isLoading}
                />
              </div>
            )}

            <div className="form-group">
              <label className="form-label" htmlFor="email">
                {isLogin ? "Username or Email" : "Email Address"}
              </label>
              <input 
                type="text" 
                id="email" 
                className="retro-input"
                placeholder={isLogin ? "Username or email" : "email@domain.com"}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <div className="form-group" style={{ marginBottom: "24px" }}>
              <label className="form-label" htmlFor="password">Password</label>
              <input 
                type="password" 
                id="password" 
                className="retro-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <button 
              type="submit" 
              className={`retro-btn ${isLogin ? "btn-pink" : "btn-teal"}`}
              style={{ width: "100%", padding: "12px" }}
              disabled={isLoading}
            >
              {isLoading ? "Loading..." : isLogin ? "Open My Mailbox" : "Create My Account"}
            </button>
          </form>

          <div style={{ marginTop: "16px", textAlign: "center", fontSize: "13px" }}>
            {isLogin ? (
              <p>
                Don't have an account?{" "}
                <span 
                  onClick={() => setIsLogin(false)} 
                  style={{ textDecoration: "underline", cursor: "pointer", fontWeight: "bold" }}
                >
                  Create one here
                </span>
              </p>
            ) : (
              <p>
                Already have an account?{" "}
                <span 
                  onClick={() => setIsLogin(true)} 
                  style={{ textDecoration: "underline", cursor: "pointer", fontWeight: "bold" }}
                >
                  Log in here
                </span>
              </p>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
