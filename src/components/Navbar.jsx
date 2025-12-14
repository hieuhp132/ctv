import React, { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Navbar.css";
import { getBalances } from "../api";
import logoImg from "../assets/logo.png";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);
  const [balances, setBalances] = useState({ adminCredit: 0 });

  /* ================= FETCH BALANCE (ADMIN) ================= */
  useEffect(() => {
    if (user?.role === "admin") {
      getBalances().then(setBalances);
    }
  }, [user]);

  /* ================= CLOSE DROPDOWN ================= */
  useEffect(() => {
    const close = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
      if (e.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isActive = (path) => location.pathname === path;

  /* ================= ROLE BASED HOME ================= */
  const homePath = user?.role === "admin" ? "/admin" : "/dashboard";
  const goHome = () => navigate(homePath);

  /* ================= ROLE BASED MENU ================= */
  const menuItemsByRole = {
    admin: [
      { label: "Dashboard", path: "/admin" },
      // { label: "Admin Dashboard Beta", path: "/admin-dashboard" },
      // { label: "User Management", path: "/user-management" },
      { label: "Candidate Management", path: "/candidate-management" },
      { label: "Saved Jobs", path: "/admin/saved-jobs" },
    ],
    recruiter: [
      { label: "Dashboard", path: "/dashboard" },
      { label: "My Brand", path: "/my-brand" },
      { label: "My Candidates", path: "/my-candidates" },
      { label: "Saved Jobs", path: "/saved-jobs" },
    ],
    authenticated: [
      { label: "Dashboard", path: "/dashboard" },
    ],
  };

  const roleMenus = menuItemsByRole[user?.role] || [];

  return (
    <header className="navbar">
      <div className="navbar-inner">
        {/* LEFT */}
        <div className="navbar-left">
          <button className="logo-btn" onClick={goHome}>
            <img src={logoImg} alt="Logo" className="logo-img" />
            <span className="logo">Ant-Tech Asia</span>
          </button>
        </div>

        {/* RIGHT */}
        <div className="navbar-right">
          {!user ? null : (
            <div className="profile-dropdown" ref={dropdownRef}>
              {/* ADMIN CREDIT */}
              {user.role === "admin" && (
                <span className="stat-pill">
                  Credit: {balances.adminCredit}$
                </span>
              )}

              {/* PROFILE BOX */}
              <div
                className="profile-box"
                onClick={() => setOpen((o) => !o)}
                role="button"
                tabIndex={0}
                aria-haspopup="menu"
                aria-expanded={open}
              >
                <img
                  src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                    user.name || "User"
                  )}&background=FF5E62&color=fff`}
                  alt="avatar"
                  className="avatar"
                />
                <span className="username">{user.name}</span>
              </div>

              {/* DROPDOWN */}
              <ul className={`dropdown-menu ${open ? "open" : ""}`}>
                <li
                  className={isActive("/profile") ? "active" : ""}
                  onClick={() => navigate("/profile")}
                >
                  View Profile
                </li>

                <div className="dropdown-divider" />

                {/* ROLE BASED LINKS */}
                {roleMenus.map((item) => (
                  <li
                    key={item.path}
                    className={isActive(item.path) ? "active" : ""}
                    onClick={() => navigate(item.path)}
                  >
                    {item.label}
                  </li>
                ))}

                <div className="dropdown-divider" />

                <li className="danger" onClick={handleLogout}>
                  Logout
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
