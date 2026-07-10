import { useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import Message from "../components/Message";
import { register } from "../lib/api";

const PASSWORD_HINT =
  "At least 8 characters with uppercase, lowercase, a number, and a special character.";

function isStrongPassword(password: string): boolean {
  return (
    password.length >= 8 &&
    /[a-z]/.test(password) &&
    /[A-Z]/.test(password) &&
    /\d/.test(password) &&
    /[^A-Za-z0-9]/.test(password)
  );
}

export default function RegisterPage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [devToken, setDevToken] = useState("");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");

    if (!isStrongPassword(password)) {
      setError(PASSWORD_HINT);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);

    try {
      const data = await register({ firstName, lastName, email, password });
      setRegistered(true);
      setDevToken(data.developmentToken || "");
    } catch (registerError) {
      setError(registerError instanceof Error ? registerError.message : "Registration failed.");
    } finally {
      setSubmitting(false);
    }
  }

  if (registered) {
    return (
      <div className="auth-shell">
        <div className="auth-card card">
          <h1>Check your email</h1>
          <Message kind="success">
            Account created! We sent a verification link to <strong>{email}</strong>. Verify your
            email, then log in.
          </Message>
          {devToken && (
            <Message kind="info">
              Development mode: <Link to={`/verify-email/${devToken}`}>verify now</Link>
            </Message>
          )}
          <div className="auth-links">
            <Link to="/">Back to login</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-shell">
      <div className="auth-card card">
        <span className="brand auth-brand">
          <span className="brand-mark">MV</span>
          MacroVanta
        </span>
        <h1>Create your account</h1>
        <p className="auth-subtitle">Track calories, macros, and sodium in one place.</p>
        {error && <Message kind="error">{error}</Message>}
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="field">
              <label htmlFor="firstName">First name</label>
              <input
                id="firstName"
                type="text"
                value={firstName}
                maxLength={50}
                onChange={(event) => setFirstName(event.target.value)}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="lastName">Last name</label>
              <input
                id="lastName"
                type="text"
                value={lastName}
                maxLength={50}
                onChange={(event) => setLastName(event.target.value)}
                required
              />
            </div>
          </div>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              autoComplete="email"
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              autoComplete="new-password"
              onChange={(event) => setPassword(event.target.value)}
              required
            />
            <p className="field-hint">{PASSWORD_HINT}</p>
          </div>
          <div className="field">
            <label htmlFor="confirmPassword">Confirm password</label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              autoComplete="new-password"
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn btn-block" disabled={submitting}>
            {submitting ? "Creating account…" : "Create account"}
          </button>
        </form>
        <div className="auth-links">
          <span>
            Already have an account? <Link to="/">Log in</Link>
          </span>
        </div>
      </div>
    </div>
  );
}
