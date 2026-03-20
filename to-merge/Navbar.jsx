import React, { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import "./Navbar.css";
import logoImg from "logo.jpeg";
import { MdMessage, MdNotifications, MdMenu, MdClose } from "react-icons/md";
import Messenger from "../../components/Messenger.jsx";
import Notifications from "../../components/Notifications.jsx";
import { getUnreadMessages } from "../../services/api.js";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [messengerOpen, setMessengerOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const dropdownRef = useRef(null);

  /* ================= LOAD UNREAD MESSAGES ================= */
  const loadUnread = async () => {
    try {
      const res = await getUnreadMessages();
      setUnreadCount(res?.unreadCount ?? 0);
    } catch (err) {
      console.error("Failed to load unread messages", err);
    }
  };

  useEffect(() => {
    if (user) loadUnread();
  }, [user]);

  /* ================= AUTO CLOSE OVERLAYS ON ROUTE CHANGE ================= */
  useEffect(() => {
    setMessengerOpen(false);
    setNotificationsOpen(false);
    setOpen(false);
    setMobileMenuOpen(false);
  }, [location.pathname]);

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

  /* ================= HANDLERS ================= */
  const handleLogout = () => {
    setMessengerOpen(false);
    setNotificationsOpen(false);
    logout();
    navigate("/login");
  };

  const isActive = (path) => location.pathname === path;

  const homePath = user?.role === "admin" ? "/admin" : "/dashboard";
  const goHome = () => navigate(homePath);

  const menuItemsByRole = {
    admin: [
      { label: "Dashboard", path: "/admin/jobs" },
      { label: "Statistics", path: "/admin/statistics" },
      { label: "Candidate Management", path: "/admin/candidates" },
      { label: "Saved Jobs", path: "/admin/saved-jobs" },
    ],
    recruiter: [
      { label: "Dashboard", path: "/recruiter/jobs" },
      // { label: "My Brand", path: "/my-brand" },
      { label: "My Candidates", path: "/recruiter/candidates" },
      { label: "Saved Jobs", path: "/recruiter/saved-jobs" },
    ],
    authenticated: [{ label: "Dashboard", path: "/dashboard" }],
  };

  const roleMenus = menuItemsByRole[user?.role] || [];

  /* ================= RENDER ================= */
  return (
    <>
      <header className="navbar">
        <div className="navbar-inner">
          {/* LEFT */}
          <div className="navbar-left">
            <button className="logo-btn" onClick={goHome}>
              <img src={logoImg} alt="Logo" className="logo-img" />
            </button>
          </div>

          {/* RIGHT */}
          <div className="navbar-right">
            {!user ? (
              <div className="auth-actions">
                <button className="nav-btn" onClick={() => navigate("/login")}>
                  Login
                </button>
                <button className="nav-btn" onClick={() => navigate("/signup")}>
                  Sign up
                </button>
                <button className="nav-btn" onClick={() => navigate("/home")}>
                  Home
                </button>
              </div>
            ) : (
              <div className="navbar-actions">
                {/* MESSENGER */}
                {/* <button
                  className="icon-btn messenger-btn"
                  onClick={() => setMessengerOpen(true)}
                  title="Messages"
                >
                  <MdMessage size={20} />
                  {unreadCount > 0 && (
                    <span className="badge">{unreadCount}</span>
                  )}
                </button> */}

                {/* NOTIFICATIONS */}
                <button
                  className="icon-btn notifications-btn"
                  onClick={() => setNotificationsOpen(true)}
                  title="Notifications"
                >
                  <MdNotifications size={20} />
                </button>

                {/* PROFILE */}
                <div className="profile-dropdown" ref={dropdownRef}>
                  {user.role === "admin" && (
                    <span className="stat-pill">Credit: 0$</span>
                  )}

                  <div
                    className="profile-box"
                    onClick={() => setOpen((o) => !o)}
                  >
                    <img
                      src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                        user.name || "User",
                      )}&background=FF5E62&color=fff`}
                      alt="avatar"
                      className="avatar"
                    />
                    <span className="username">{user.name}</span>
                  </div>

                  <ul className={`dropdown-menu ${open ? "open" : ""}`}>
                    <li
                      className={isActive("/profile") ? "active" : ""}
                      onClick={() => navigate(`${user.role}/profile`)}
                    >
                      View Profile
                    </li>

                    <div className="dropdown-divider" />

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
              </div>
            )}

            <button className="mobile-toggle" onClick={() => setMobileMenuOpen(true)}>
              <MdMenu size={22} />
            </button>
          </div>
        </div>
      </header>

      {mobileMenuOpen && (
        <div className="mobile-menu" onClick={() => setMobileMenuOpen(false)}>
          <div className="mobile-menu-panel" onClick={(e) => e.stopPropagation()}>
            <button className="mobile-close" onClick={() => setMobileMenuOpen(false)}>
              <MdClose size={20} />
            </button>
            {!user ? (
              <>
                <button className="mobile-item" onClick={() => { navigate("/"); setMobileMenuOpen(false); }}>Home</button>
                <button className="mobile-item" onClick={() => { navigate("/login"); setMobileMenuOpen(false); }}>Login</button>
                <button className="mobile-item primary" onClick={() => { navigate("/signup"); setMobileMenuOpen(false); }}>Signup</button>
              </>
            ) : (
              <>
                <button className="mobile-item" onClick={() => { navigate(`${user.role}/profile`); setMobileMenuOpen(false); }}>Profile</button>
                {(Array.isArray(menuItemsByRole[user.role]) ? menuItemsByRole[user.role] : []).map((item) => (
                  <button key={item.path} className="mobile-item" onClick={() => { navigate(item.path); setMobileMenuOpen(false); }}>
                    {item.label}
                  </button>
                ))}
                <button className="mobile-item danger" onClick={() => { handleLogout(); setMobileMenuOpen(false); }}>Logout</button>
              </>
            )}
          </div>
        </div>
      )}

      {/* OVERLAYS */}
      {/* <Messenger
        isOpen={messengerOpen}
        onClose={() => setMessengerOpen(false)}
      /> */}

      <Notifications
        isOpen={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
      />
    </>
  );
}
