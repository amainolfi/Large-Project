import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import Message from "../components/Message";
import { resetPassword } from "../lib/api";

const PASSWORD_HINT =
  "At least 8 characters with uppercase, lowercase, a number, and a special character.";

export default function ResetPasswordPage() {
  const { token } = useParams<{ token: string }>();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);

    try {
      await resetPassword(token || "", newPassword);
      setDone(true);
    } catch (resetError) {
      setError(resetError instanceof Error ? resetError.message : "Reset failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-card card">
        <h1>Reset password</h1>
        {done ? (
          <>
            <Message kind="success">Password reset successfully. You can now log in.</Message>
            <div className="auth-links">
              <Link to="/">Go to login</Link>
            </div>
          </>
        ) : (
          <>
            {error && <Message kind="error">{error}</Message>}
            <form onSubmit={handleSubmit}>
              <div className="field">
                <label htmlFor="newPassword">New password</label>
                <input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  autoComplete="new-password"
                  onChange={(event) => setNewPassword(event.target.value)}
                  required
                />
                <p className="field-hint">{PASSWORD_HINT}</p>
              </div>
              <div className="field">
                <label htmlFor="confirmPassword">Confirm new password</label>
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
                {submitting ? "Resetting…" : "Reset password"}
              </button>
            </form>
            <div className="auth-links">
              <Link to="/">Back to login</Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
