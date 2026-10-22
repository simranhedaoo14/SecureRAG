
import { useState } from "react";
import {
  ShieldCheck,
  LockKeyhole,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck as ShieldIcon,
} from "lucide-react";
import "./Login.css";

export default function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    try {
    const response = await fetch("http://localhost:8001/api/login", {
        method: "POST",
        headers: {
        "Content-Type": "application/json",
        },
        body: JSON.stringify({
        email: email.trim(),
        password,
        }),
    });

    const data = await response.json();

    if (!response.ok) {
        setError(data.detail || "Login failed. Check your credentials.");
        return;
    }

    onLogin?.(data);
    } catch {
    setError("Cannot connect to the server. Please try again.");
}
  }

  return (
    <main className="login-page">
      <section className="login-visual">
        <div className="login-brand">
          <div className="login-brand-icon">
            <ShieldCheck size={25} />
          </div>
          <span>SecureRAG</span>
          <span className="login-brand-tag">AI SECURITY</span>
        </div>

        <div className="login-hero">
          <div className="login-eyebrow">
            <span className="login-live-dot" />
            INTELLIGENT KNOWLEDGE PROTECTION
          </div>

          <h1>
            Your knowledge.
            <br />
            <span>Your control.</span>
          </h1>

          <p>
            Secure access to AI-powered knowledge retrieval,
            built with authorization and security at its core.
          </p>

          <div className="login-feature-list">
            <div>
              <ShieldCheck size={19} />
              <span>Permission-aware AI retrieval</span>
            </div>
            <div>
              <LockKeyhole size={19} />
              <span>Controlled document access</span>
            </div>
            <div>
              <ShieldIcon size={19} />
              <span>Security-focused AI assistance</span>
            </div>
          </div>
        </div>

        <div className="login-visual-footer">
          <span>SECURITY-FIRST AI</span>
          <span>•</span>
          <span>PRIVATE KNOWLEDGE</span>
        </div>
      </section>

      <section className="login-panel">
        <div className="login-form-wrap">
          <div className="login-mobile-brand">
            <ShieldCheck size={23} /> SecureRAG
          </div>

          <div className="login-heading">
            <span className="login-section-label">WELCOME BACK</span>
            <h2>Sign in to your workspace</h2>
            <p>Enter your credentials to continue securely.</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            <label htmlFor="login-email">Email address</label>
            <div className="login-input-wrap">
              <Mail size={18} />
              <input
                id="login-email"
                type="email"
                autoComplete="username"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="login-password-heading">
              <label htmlFor="login-password">Password</label>
            </div>

            <div className="login-input-wrap">
              <LockKeyhole size={18} />
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="login-eye-button"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {error && (
              <div className="login-error" role="alert">
                {error}
              </div>
            )}

            <button type="submit" className="login-submit">
              Sign in <ArrowRight size={18} />
            </button>
          </form>

          <div className="login-security-note">
            <LockKeyhole size={16} />
            <span>Your workspace access is protected.</span>
          </div>

          <p className="login-demo-note">
             Secure sign-in · Access based on your authenticated account
          </p>
        </div>

        <footer className="login-panel-footer">
          SecureRAG · Security-aware AI knowledge assistant
        </footer>
      </section>
    </main>
  );
}
