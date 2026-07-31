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

  // Load theme on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem("mimi-theme") || "theme-peach";
    const savedDark = localStorage.getItem("mimi-dark") === "true";
    document.body.className = `${savedTheme} ${savedDark ? "dark-mode" : ""}`;
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
      {/* Header/Navbar */}
      <header className="taskbar" style={{ maxWidth: "420px" }}>
        <div className="logo-container">
          <h1 className="logo-text">Mini Mail</h1>
        </div>
        <div className="nav-links">
          <button 
            onClick={() => setIsLogin(true)} 
            className={`retro-btn ${isLogin ? 'btn-primary' : 'btn-white'}`}
            style={{ padding: '5px 12px', fontSize: '13px' }}
          >
            Log In
          </button>
          <button 
            onClick={() => setIsLogin(false)} 
            className={`retro-btn ${!isLogin ? 'btn-primary' : 'btn-white'}`}
            style={{ padding: '5px 12px', fontSize: '13px' }}
          >
            Sign Up
          </button>
        </div>
      </header>

      {/* Auth Box */}
      <section className="retro-window" style={{ maxWidth: "420px" }}>
        <div className="window-titlebar" style={{ backgroundColor: "var(--accent-primary)" }}>
          <div className="window-title">
            {isLogin ? "Log In" : "Register"}
          </div>
        </div>

        <div className="window-body">

          {error && (
            <div className="retro-window" style={{ border: "1.5px solid #D9534F", marginBottom: "16px", boxShadow: "none" }}>
              <div className="window-body" style={{ padding: "10px 14px", fontSize: "13px", backgroundColor: "#FDF7F7", fontWeight: 500 }}>
                Error: {error}
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

            <div className="form-group" style={{ marginBottom: "20px" }}>
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
              className="retro-btn btn-primary"
              style={{ width: "100%", padding: "10px" }}
              disabled={isLoading}
            >
              {isLoading ? "Loading..." : isLogin ? "Open My Mailbox" : "Create My Account"}
            </button>
          </form>

          <div style={{ marginTop: "16px", textAlign: "center", fontSize: "13px", fontWeight: 500, color: "#6E6865" }}>
            {isLogin ? (
              <p>
                Don't have an account?{" "}
                <span 
                  onClick={() => setIsLogin(false)} 
                  style={{ textDecoration: "underline", cursor: "pointer", fontWeight: "bold", color: "var(--border-color)" }}
                >
                  Create one here
                </span>
              </p>
            ) : (
              <p>
                Already have an account?{" "}
                <span 
                  onClick={() => setIsLogin(true)} 
                  style={{ textDecoration: "underline", cursor: "pointer", fontWeight: "bold", color: "var(--border-color)" }}
                >
                  Log in here
                </span>
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer" style={{ maxWidth: "420px" }}>
        <div>&copy; 2026 Mimi Mail.</div>
        <div className="footer-links">
          <a href="/about" className="footer-link">About Us</a>
          <a href="/terms" className="footer-link">Terms</a>
        </div>
      </footer>
    </main>
  );
}
