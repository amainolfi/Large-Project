import { useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import Message from "../components/Message";
import { forgotPassword } from "../lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [devToken, setDevToken] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setMessage("");
    setSubmitting(true);

    try {
      const data = await forgotPassword(email);
      setMessage(data.message);
      setDevToken(data.developmentToken || "");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Request failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-card card">
        <h1>Forgot password</h1>
        <p className="auth-subtitle">
          Enter your email and we will send you a link to reset your password.
        </p>
        {error && <Message kind="error">{error}</Message>}
        {message && <Message kind="success">{message}</Message>}
        {devToken && (
          <Message kind="info">
            Development mode: <Link to={`/reset-password/${devToken}`}>reset now</Link>
          </Message>
        )}
        <form onSubmit={handleSubmit}>
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
          <button type="submit" className="btn btn-block" disabled={submitting}>
            {submitting ? "Sending…" : "Send reset link"}
          </button>
        </form>
        <div className="auth-links">
          <Link to="/">Back to login</Link>
        </div>
      </div>
    </div>
  );
}
