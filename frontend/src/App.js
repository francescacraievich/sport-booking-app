import { useEffect, useState, useRef } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  NavLink,
} from "react-router-dom";

import { api } from "./apiClient";
import { getToken, clearToken } from "./session";
import "./App.css";

// Pages
import AccountPage from "./pages/AccountPage";
import TournamentsPage from "./pages/TournamentsPage";
import FieldsPage from "./pages/FieldsPage";
import SearchPage from "./pages/SearchPage";

// Root component: handles auth state, header, navigation and routing
export default function App() {
  const [user, setUser] = useState(null);
  const [checked, setChecked] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // On mount, check if a valid token exists and restore the session
  useEffect(() => {
    async function checkAuth() {
      const token = getToken();
      if (!token) { setChecked(true); return; }
      try {
        const data = await api.whoami();
        setUser(data?.user || null);
      } catch {
        clearToken();
        setUser(null);
      } finally {
        setChecked(true);
      }
    }
    checkAuth();
  }, []);

  // close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleLogout() {
    clearToken();
    setUser(null);
    setShowDropdown(false);
  }

  if (!checked) {
    return (
      <div className="App">
        <div className="container">
          <div className="card">Checking authentication...</div>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <div className="App">
        <header className="main-header">
          <div className="main-header-top">
            <div>
              <h1 className="main-title">Sport Booking App</h1>
              <p>Book fields and manage your tournaments</p>
            </div>

            {/* USER DROPDOWN */}
            <div className="user-status" ref={dropdownRef}>
              {user ? (
                <button
                  className="user-status-btn"
                  onClick={() => setShowDropdown(v => !v)}
                >
                  Hi, <strong>{user.username}</strong>
                </button>
              ) : (
                <span className="user-status-btn user-status-passive">Not logged in</span>
              )}

              {showDropdown && user && (
                <div className="user-dropdown">
                  <p className="dropdown-name">{user.name} {user.surname}</p>
                  <p className="dropdown-username">@{user.username}</p>
                  <button className="btn btn-danger dropdown-logout" onClick={handleLogout}>
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>

          <nav className="main-nav">
            <NavLink to="/auth" className={({ isActive }) => isActive ? "nav-tab active" : "nav-tab"}>
              Account
            </NavLink>
            <NavLink to="/tournaments" className={({ isActive }) => isActive ? "nav-tab active" : "nav-tab"}>
              Tournaments
            </NavLink>
            <NavLink to="/fields" className={({ isActive }) => isActive ? "nav-tab active" : "nav-tab"}>
              Fields
            </NavLink>
            <NavLink to="/search" className={({ isActive }) => isActive ? "nav-tab active" : "nav-tab"}>
              Search
            </NavLink>
          </nav>
        </header>

        <div className="container">
          <Routes>
            <Route path="/" element={<Navigate to="/auth" replace />} />
            <Route path="/auth" element={<AccountPage user={user} setUser={setUser} />} />
            <Route path="/tournaments" element={<TournamentsPage user={user} />} />
            <Route path="/fields" element={<FieldsPage user={user} />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="*" element={<div className="card">Page not found</div>} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}
