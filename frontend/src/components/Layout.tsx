import type { ReactNode } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";

export default function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/");
  }

  return (
    <div className="app-shell">
      <header className="navbar">
        <div className="navbar-inner">
          <span className="brand">
            <span className="brand-mark">MV</span>
            MacroVanta
          </span>
          <nav className="nav-links">
            <NavLink to="/dashboard">Dashboard</NavLink>
            <NavLink to="/history">History</NavLink>
            <NavLink to="/goals">Goals</NavLink>
            <NavLink to="/profile">Profile</NavLink>
          </nav>
          <div className="nav-user">
            {user && (
              <span className="nav-user-name">
                {user.firstName} {user.lastName}
              </span>
            )}
            <button type="button" className="btn btn-outline btn-sm" onClick={handleLogout}>
              Sign out
            </button>
          </div>
        </div>
      </header>
      <main className="page">{children}</main>
    </div>
  );
}
