import { useState } from "react";
import type { FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import Message from "../components/Message";
import { ApiError, getStoredToken, resendVerification } from "../lib/api";
import { useAuth } from "../lib/auth-context";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [needsVerification, setNeedsVerification] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (getStoredToken()) {
    return <Navigate to="/dashboard" replace />;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setInfo("");
    setNeedsVerification(false);
    setSubmitting(true);

    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (loginError) {
      if (loginError instanceof ApiError && loginError.status === 403) {
        setNeedsVerification(true);
      }

      setError(loginError instanceof Error ? loginError.message : "Login failed.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResend() {
    setError("");

    try {
      const data = await resendVerification(email);
      setNeedsVerification(false);
      setInfo(data.message);
    } catch (resendError) {
      setError(resendError instanceof Error ? resendError.message : "Could not resend email.");
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-card card auth-card-enhanced">
        <div className="auth-header">
          <span className="brand auth-brand">
            <span className="brand-mark">MV</span>
            MacroVanta
          </span>

          <div className="auth-copy">
            <h1>Welcome back</h1>
            <p className="auth-subtitle">Log in to keep tracking your macros.</p>
          </div>
        </div>

        {error && <Message kind="error">{error}</Message>}
        {info && <Message kind="success">{info}</Message>}

        {needsVerification && (
          <div className="message message-info">
            Your email is not verified yet.{" "}
            <button type="button" className="link-button" onClick={handleResend}>
              Resend verification email
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              autoComplete="email"
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Enter your email"
              required
            />
          </div>

          <div className="field">
            <label htmlFor="password">Password</label>
            <div className="password-field">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                autoComplete="current-password"
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword((current) => !current)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          <button type="submit" className="btn btn-block auth-submit" disabled={submitting}>
            {submitting ? "Logging in..." : "Log in"}
          </button>
        </form>

        <div className="auth-links">
          <Link to="/forgot-password">Forgot password?</Link>
          <span>
            New here? <Link to="/register">Create an account</Link>
          </span>
        </div>
      </div>
    </div>
  );
}
