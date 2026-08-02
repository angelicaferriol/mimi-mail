"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LandingPage() {
  const router = useRouter();
  
  // Auth view states
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Email verification PIN states
  const [showVerify, setShowVerify] = useState(false);
  const [verifyEmail, setVerifyEmail] = useState("");
  const [verifyPin, setVerifyPin] = useState("");
  const [resendingPin, setResendingPin] = useState(false);

  // Forgot password states
  const [forgotStep, setForgotStep] = useState<"none" | "email" | "reset">("none");
  const [showForgotLink, setShowForgotLink] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotPin, setForgotPin] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Welcome view states
  const [view, setView] = useState<"welcome" | "auth">("welcome");
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Load theme on mount & check session
  useEffect(() => {
    const savedTheme = localStorage.getItem("mimi-theme") || "theme-peach";
    const savedDark = localStorage.getItem("mimi-dark") === "true";
    document.body.className = `${savedTheme} ${savedDark ? "dark-mode" : ""}`;

    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((data) => {
        if (data.loggedIn) {
          setIsLoggedIn(true);
        }
      })
      .catch((err) => console.error("Session check failed:", err));

    const params = new URLSearchParams(window.location.search);
    if (params.get("mode") === "register") {
      setView("auth");
      setIsLogin(false);
    }
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
        if (data.needsVerification) {
          setVerifyEmail(data.email || email);
          setShowVerify(true);
        }
        if (data.showForgotPassword) {
          setShowForgotLink(true);
          setForgotEmail(data.email || email);
        }
        throw new Error(data.error || "Something went wrong");
      }

      if (isLogin) {
        router.push("/dashboard");
      } else {
        if (data.needsVerification) {
          setVerifyEmail(data.email || email);
          setShowVerify(true);
          setSuccess("Account registered! Please check your email for the verification code.");
          setTimeout(() => setSuccess(""), 5000);
        } else {
          setSuccess("Account created successfully! Logging you in...");
          setTimeout(() => {
            router.push("/dashboard");
          }, 1500);
        }
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Something went wrong";
      setError(message);
      setTimeout(() => {
        setError((prev) => prev === message ? "" : prev);
      }, 5000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: verifyEmail, pin: verifyPin }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Verification failed");

      setSuccess("Account verified successfully! Logging you in...");
      setTimeout(() => {
        router.push("/dashboard");
      }, 1500);
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Verification failed");
      setTimeout(() => setError(""), 5000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendPin = async () => {
    setResendingPin(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/auth/verify", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: verifyEmail }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Resend failed");
      setSuccess("A new verification code has been sent!");
      setTimeout(() => setSuccess(""), 5000);
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Resend failed");
      setTimeout(() => setError(""), 5000);
    } finally {
      setResendingPin(false);
    }
  };

  const handleForgotPasswordEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Request failed");
      setSuccess("If the email is registered, a password reset code has been sent.");
      setTimeout(() => setSuccess(""), 5000);
      setForgotStep("reset");
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Request failed");
      setTimeout(() => setError(""), 5000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail, pin: forgotPin, password: newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Password reset failed");
      setSuccess("Password updated successfully! Please log in.");
      setTimeout(() => setSuccess(""), 5000);
      setForgotStep("none");
      setIsLogin(true);
      setShowForgotLink(false);
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Password reset failed");
      setTimeout(() => setError(""), 5000);
    } finally {
      setIsLoading(false);
    }
  };

  const getWindowTitle = () => {
    if (showVerify) return "Email Verification";
    if (forgotStep === "email") return "Request Password Reset";
    if (forgotStep === "reset") return "Reset Password";
    return isLogin ? "Log In" : "Register";
  };

  return (
    <main className="desktop">
      {/* Header/Navbar */}
      {view === "auth" && (
        <header className="taskbar" style={{ maxWidth: "420px" }}>
          <div 
            className="logo-container" 
            onClick={() => {
              if (isLoggedIn) {
                router.push("/dashboard");
              } else {
                setView("welcome");
              }
            }}
            style={{ cursor: "pointer" }}
          >
            <img src="/icon.png" alt="Mimi Mail Logo" style={{ width: "32px", height: "32px", objectFit: "contain", mixBlendMode: "multiply" }} />
            <h1 className="logo-text">Mimi Mail</h1>
          </div>
          <div className="nav-links">
            <button 
              onClick={() => {
                setIsLogin(true);
                setShowVerify(false);
                setForgotStep("none");
              }} 
              className={`retro-btn ${isLogin && !showVerify && forgotStep === "none" ? 'btn-primary' : 'btn-white'}`}
              style={{ padding: '5px 12px', fontSize: '13px' }}
            >
              Log In
            </button>
            <button 
              onClick={() => {
                setIsLogin(false);
                setShowVerify(false);
                setForgotStep("none");
              }} 
              className={`retro-btn ${!isLogin && !showVerify && forgotStep === "none" ? 'btn-primary' : 'btn-white'}`}
              style={{ padding: '5px 12px', fontSize: '13px' }}
            >
              Sign Up
            </button>
          </div>
        </header>
      )}

      {view === "welcome" ? (
        <div className="welcome-container" style={{ maxWidth: "420px", marginTop: "5%" }}>
          <img src="/icon.png" alt="Mimi Mail Mascot" className="welcome-img" />
          <h1 className="welcome-title">Mimi Mail</h1>
          <p className="welcome-desc">
            Share your mailbox, receive anonymous notes, and publish replies!
          </p>
          <div className="welcome-btn-container">
            <button 
              onClick={() => {
                setIsLogin(false);
                setView("auth");
              }} 
              className="retro-btn btn-primary"
              style={{ padding: '10px 16px', fontSize: '13.5px', fontWeight: 'bold', width: '100%', whiteSpace: 'nowrap' }}
            >
              Let&apos;s get started
            </button>
            <button 
              onClick={() => {
                setIsLogin(true);
                setView("auth");
              }} 
              className="retro-btn btn-white"
              style={{ padding: '10px 16px', fontSize: '13.5px', fontWeight: 'bold', width: '100%', whiteSpace: 'nowrap' }}
            >
              I already have an account
            </button>
          </div>
          <p className="welcome-terms">
            By continuing, you agree to Mimi Mail&apos;s <a href="/terms" target="_blank" rel="noopener noreferrer">Terms of Service</a>.
          </p>
        </div>
      ) : (
        /* Auth Box */
        <section className="retro-window" style={{ maxWidth: "420px" }}>
        <div className="window-titlebar" style={{ backgroundColor: "var(--accent-primary)" }}>
          <div className="window-title">
            {getWindowTitle()}
          </div>
        </div>

        <div className="window-body">
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

          {/* VIEW 1: Email Verification PIN Form */}
          {showVerify ? (
            <form onSubmit={handleVerifySubmit}>
              <p style={{ fontSize: "12px", color: "#6E6865", marginBottom: "14px", lineHeight: "1.4" }}>
                We&apos;ve sent a 6-digit confirmation code to <strong>{verifyEmail}</strong>. Please enter the code below to verify your account:
              </p>
              <div className="form-group">
                <label className="form-label" htmlFor="verifyPin">6-Digit Code</label>
                <input 
                  type="text" 
                  id="verifyPin" 
                  className="retro-input"
                  placeholder="123456"
                  maxLength={6}
                  value={verifyPin}
                  onChange={(e) => setVerifyPin(e.target.value.replace(/[^0-9]/g, ""))}
                  required
                  disabled={isLoading}
                  style={{ letterSpacing: "4px", fontSize: "18px", textAlign: "center" }}
                />
              </div>

              <button 
                type="submit" 
                className="retro-btn btn-primary"
                style={{ width: "100%", padding: "10px", marginBottom: "10px" }}
                disabled={isLoading || verifyPin.length < 6}
              >
                {isLoading ? "Verifying..." : "Verify Code"}
              </button>

              <button 
                type="button" 
                onClick={handleResendPin}
                className="retro-btn btn-white"
                style={{ width: "100%", padding: "10px" }}
                disabled={resendingPin || isLoading}
              >
                {resendingPin ? "Resending..." : "Resend Code"}
              </button>
            </form>
          ) : forgotStep === "email" ? (
            /* VIEW 2: Forgot Password Request Form */
            <form onSubmit={handleForgotPasswordEmailSubmit}>
              <p style={{ fontSize: "12px", color: "#6E6865", marginBottom: "14px", lineHeight: "1.4" }}>
                Enter your registered email address below, and we&apos;ll send you a PIN code to reset your password:
              </p>
              <div className="form-group">
                <label className="form-label" htmlFor="forgotEmail">Email Address</label>
                <input 
                  type="email" 
                  id="forgotEmail" 
                  className="retro-input"
                  placeholder="email@domain.com"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>

              <button 
                type="submit" 
                className="retro-btn btn-primary"
                style={{ width: "100%", padding: "10px", marginBottom: "10px" }}
                disabled={isLoading}
              >
                {isLoading ? "Sending..." : "Request Reset PIN"}
              </button>

              <button 
                type="button" 
                onClick={() => setForgotStep("none")}
                className="retro-btn btn-white"
                style={{ width: "100%", padding: "10px" }}
                disabled={isLoading}
              >
                Cancel
              </button>
            </form>
          ) : forgotStep === "reset" ? (
            /* VIEW 3: Reset Password Form */
            <form onSubmit={handleResetPasswordSubmit}>
              <p style={{ fontSize: "12px", color: "#6E6865", marginBottom: "14px", lineHeight: "1.4" }}>
                We&apos;ve sent a 6-digit reset code to <strong>{forgotEmail}</strong>. Enter the PIN and your new password below:
              </p>
              
              <div className="form-group">
                <label className="form-label" htmlFor="forgotPin">6-Digit Reset Code</label>
                <input 
                  type="text" 
                  id="forgotPin" 
                  className="retro-input"
                  placeholder="123456"
                  maxLength={6}
                  value={forgotPin}
                  onChange={(e) => setForgotPin(e.target.value.replace(/[^0-9]/g, ""))}
                  required
                  disabled={isLoading}
                  style={{ letterSpacing: "4px", fontSize: "18px", textAlign: "center" }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: "20px" }}>
                <label className="form-label" htmlFor="newPassword">New Password</label>
                <div style={{ position: "relative", width: "100%" }}>
                  <input 
                    type={showNewPassword ? "text" : "password"} 
                    id="newPassword" 
                    className="retro-input"
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    style={{ paddingRight: "40px" }}
                    required
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    style={{
                      position: "absolute",
                      right: "12px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: "0",
                      color: "var(--border-color)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      opacity: 0.7
                    }}
                    title={showNewPassword ? "Hide password" : "Show password"}
                  >
                    {showNewPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <button 
                type="submit" 
                className="retro-btn btn-primary"
                style={{ width: "100%", padding: "10px", marginBottom: "10px" }}
                disabled={isLoading || forgotPin.length < 6}
              >
                {isLoading ? "Resetting..." : "Reset Password"}
              </button>

              <button 
                type="button" 
                onClick={() => setForgotStep("email")}
                className="retro-btn btn-white"
                style={{ width: "100%", padding: "10px" }}
                disabled={isLoading}
              >
                Back
              </button>
            </form>
          ) : (
            /* VIEW 4: Login / Registration Form */
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

              <div className="form-group" style={{ marginBottom: isLogin ? "8px" : "20px" }}>
                <label className="form-label" htmlFor="password">Password</label>
                <div style={{ position: "relative", width: "100%" }}>
                  <input 
                    type={showPassword ? "text" : "password"} 
                    id="password" 
                    className="retro-input"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{ paddingRight: "40px" }}
                    required
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: "absolute",
                      right: "12px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: "0",
                      color: "var(--border-color)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      opacity: 0.7
                    }}
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {isLogin && (showForgotLink || true) && (
                <div style={{ textAlign: "right", marginBottom: "20px" }}>
                  <button
                    type="button"
                    onClick={() => {
                      setForgotStep("email");
                      setError("");
                      setSuccess("");
                    }}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "#8A8480",
                      textDecoration: "underline"
                    }}
                  >
                    Forgot Password?
                  </button>
                </div>
              )}

              <button 
                type="submit" 
                className="retro-btn btn-primary"
                style={{ width: "100%", padding: "10px" }}
                disabled={isLoading}
              >
                {isLoading ? "Loading..." : isLogin ? "Open My Mailbox" : "Create My Account"}
              </button>
            </form>
          )}

          {!showVerify && forgotStep === "none" && (
            <div style={{ marginTop: "16px", textAlign: "center", fontSize: "13px", fontWeight: 500, color: "#6E6865" }}>
              {isLogin ? (
                <p>
                  Don&apos;t have an account?{" "}
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
          )}
        </div>
      </section>
      )}

      {/* Footer */}
      <footer className="footer" style={{ maxWidth: "420px" }}>
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
