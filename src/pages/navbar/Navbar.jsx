import React, { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import "./Navbar.css";
import logoImg from "/logo.jpeg";
import { MdNotifications } from "react-icons/md";
import { Menu, X } from "lucide-react";
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
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-border-light">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* LEFT LOGO */}
            <div className="flex items-center gap-2 cursor-pointer" onClick={goHome}>
              <div className="w-10 h-10 flex items-center justify-center">
                <img src={logoImg} alt="Logo" className="w-full h-full object-contain" />
              </div>
              <span className="text-2xl font-display font-bold text-text-dark tracking-tight"></span>
            </div>

            {/* MIDDLE LINKS */}
     

            {/* RIGHT DESKTOP */}
            <div className="hidden md:flex items-center gap-4">
              {!user ? (
                <>
                  <button className="text-sm font-medium text-text-dark hover:text-primary transition-colors" onClick={() => navigate("/login")}>
                    Log in
                  </button>
                  <button className="text-sm font-medium text-text-dark hover:text-primary transition-colors" onClick={() => navigate("/signup")}>
                    Sign Up
                  </button>
                </>
              ) : (
                <div className="flex items-center gap-6">
                  {/* NOTIFICATIONS */}
                  <button
                    className="relative text-text-medium hover:text-primary transition-colors"
                    onClick={() => setNotificationsOpen(true)}
                    title="Notifications"
                  >
                    <MdNotifications size={24} />
                  </button>

                  {/* PROFILE */}
                  <div className="relative" ref={dropdownRef}>
                    <div className="flex items-center gap-3 cursor-pointer" onClick={() => setOpen((o) => !o)}>

                      <img
                        src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || "User")}&background=FF5E62&color=fff`}
                        alt="avatar"
                        className="w-10 h-10 shadow-sm rounded-xl"
                      />
                      <span className="text-sm font-bold text-text-dark hidden lg:block">{user.name}</span>
                    </div>

                    {open && (
                      <ul className="absolute right-0 mt-3 w-56 bg-white border border-border-light rounded-2xl shadow-xl py-2 z-50 overflow-hidden">
                        <li className="px-4 py-2 hover:bg-bg-gray cursor-pointer text-sm font-semibold text-text-dark transition-colors" onClick={() => navigate(`${user.role}/profile`)}>
                          View Profile
                        </li>
                        <div className="h-px bg-border-light my-1" />
                        {roleMenus.map((item) => (
                          <li
                            key={item.path}
                            className={`px-4 py-2 hover:bg-bg-gray cursor-pointer text-sm transition-colors ${isActive(item.path) ? "text-primary font-bold" : "text-text-dark font-medium"}`}
                            onClick={() => navigate(item.path)}
                          >
                            {item.label}
                          </li>
                        ))}
                        <div className="h-px bg-border-light my-1" />
                        <li className="px-4 py-2 hover:bg-red-50 text-red-600 font-bold cursor-pointer text-sm transition-colors" onClick={handleLogout}>
                          Logout
                        </li>
                      </ul>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* MOBILE TOGGLE */}
            <div className="md:hidden">
              <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-text-medium p-2">
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* MOBILE MENU */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-border-light px-4 pt-2 pb-6 space-y-1 shadow-2xl">
            <a href="" onClick={() => navigate(`/${user?.role}/jobs`)} className="block px-3 py-4 text-base font-medium text-text-medium border-b border-gray-50">Find Jobs</a>
            <a href="" onClick={() => alert("Comming soon")} className="block px-3 py-4 text-base font-medium text-text-medium border-b border-gray-50">For Companies</a>
            <a href="" onClick={() => alert("Comming soon")} className="block px-3 py-4 text-base font-medium text-text-medium border-b border-gray-50">Headhunters</a>
            <a href="" onClick={() => alert("Comming soon")} className="block px-3 py-4 text-base font-medium text-text-medium border-b border-gray-50">Resources</a>

            {!user ? (
              <div className="pt-4 flex flex-col gap-3">
                <button onClick={() => { navigate("/login"); setMobileMenuOpen(false); }} className="w-full btn-secondary">Log in</button>
                <button onClick={() => { navigate("/signup"); setMobileMenuOpen(false); }} className="w-full btn-primary">Sign Up</button>
              </div>
            ) : (
              <div className="pt-4 flex flex-col gap-2">
                <div className="flex items-center gap-3 px-3 py-2 mb-2">
                  <img
                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || "User")}&background=FF5E62&color=fff`}
                    alt="avatar"
                    className="w-10 h-10 shadow-sm rounded-xl"
                  />
                  <div>
                    <div className="text-sm font-bold text-text-dark">{user.name}</div>
                    <div className="text-xs text-text-light capitalize">{user.role}</div>
                  </div>
                </div>
                {user.role === "admin" && (
                  <div className="px-3 pb-2 text-xs font-bold text-primary tracking-wider uppercase">Credit: 0$</div>
                )}
                <button onClick={() => { navigate(`${user.role}/profile`); setMobileMenuOpen(false); }} className="w-full text-left px-3 py-3 text-sm font-semibold text-text-dark bg-bg-gray rounded-xl">View Profile</button>
                {roleMenus.map(item => (
                  <button key={item.path} onClick={() => { navigate(item.path); setMobileMenuOpen(false); }} className={`w-full text-left px-3 py-3 text-sm rounded-xl ${isActive(item.path) ? "text-white bg-primary font-bold" : "text-text-dark font-medium hover:bg-bg-gray"}`}>{item.label}</button>
                ))}
                <button onClick={() => { handleLogout(); setMobileMenuOpen(false); }} className="w-full text-left px-3 py-3 text-sm font-bold text-red-600 bg-red-50 rounded-xl mt-2">Logout</button>
              </div>
            )}
          </div>
        )}
      </nav>

      {/* OVERLAYS */}
      <Notifications
        isOpen={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
      />
    </>
  );
}
