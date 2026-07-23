import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import Message from "../components/Message";
import { changePassword, clearSession, deleteAccount, updateProfile } from "../lib/api";
import { useAuth } from "../lib/auth-context";

const PASSWORD_HINT =
  "At least 8 characters with uppercase, lowercase, a number, and a special character.";

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();

  const [firstName, setFirstName] = useState(user?.firstName || "");
  const [lastName, setLastName] = useState(user?.lastName || "");
  const [profileMessage, setProfileMessage] = useState("");
  const [profileError, setProfileError] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const [deleteText, setDeleteText] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [deleting, setDeleting] = useState(false);

  async function handleProfileSubmit(event: FormEvent) {
    event.preventDefault();
    setProfileMessage("");
    setProfileError("");

    try {
      const data = await updateProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim()
      });
      updateUser(data.user);
      setProfileMessage(data.message);
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : "Could not update profile.");
    }
  }

  async function handlePasswordSubmit(event: FormEvent) {
    event.preventDefault();
    setPasswordMessage("");
    setPasswordError("");

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }

    try {
      const data = await changePassword(currentPassword, newPassword);
      setPasswordMessage(data.message);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      setPasswordError(error instanceof Error ? error.message : "Could not change password.");
    }
  }

  async function handleDeleteAccount() {
    setDeleteError("");

    if (deleteText !== "DELETE") {
      setDeleteError('Type "DELETE" exactly before deleting your account.');
      return;
    }

    const confirmed = window.confirm(
      "Permanently delete your MacroVanta account and all associated data? This cannot be undone."
    );

    if (!confirmed) return;

    setDeleting(true);

    try {
      await deleteAccount();
      clearSession();
      navigate("/");
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : "Could not delete account.");
      setDeleting(false);
    }
  }

  return (
    <Layout>
      <div className="page-head">
        <div>
          <h1>Profile</h1>
          <p className="page-subtitle">{user?.email}</p>
        </div>
      </div>

      <div className="profile-grid">
        <div className="card">
          <h2>Your details</h2>
          {profileMessage && <Message kind="success">{profileMessage}</Message>}
          {profileError && <Message kind="error">{profileError}</Message>}
          <form onSubmit={handleProfileSubmit}>
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
            <button type="submit" className="btn">
              Save changes
            </button>
          </form>
        </div>

        <div className="card">
          <h2>Change password</h2>
          {passwordMessage && <Message kind="success">{passwordMessage}</Message>}
          {passwordError && <Message kind="error">{passwordError}</Message>}
          <form onSubmit={handlePasswordSubmit}>
            <div className="field">
              <label htmlFor="currentPassword">Current password</label>
              <input
                id="currentPassword"
                type="password"
                value={currentPassword}
                autoComplete="current-password"
                onChange={(event) => setCurrentPassword(event.target.value)}
                required
              />
            </div>
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
            <button type="submit" className="btn">
              Change password
            </button>
          </form>
        </div>

        <div className="card danger-card">
          <h2>Delete account</h2>
          <p className="card-note">
            This permanently removes your account and all nutrition, hydration, sleep, and cardio
            data. This cannot be undone.
          </p>
          {deleteError && <Message kind="error">{deleteError}</Message>}
          <div className="field">
            <label htmlFor="deleteConfirm">
              Type <strong>DELETE</strong> to confirm
            </label>
            <input
              id="deleteConfirm"
              type="text"
              value={deleteText}
              onChange={(event) => setDeleteText(event.target.value)}
            />
          </div>
          <button
            type="button"
            className="btn btn-danger"
            disabled={deleteText !== "DELETE" || deleting}
            onClick={handleDeleteAccount}
          >
            {deleting ? "Deleting…" : "Delete my account"}
          </button>
        </div>
      </div>
    </Layout>
  );
}
