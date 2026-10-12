import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Bell,
  Bookmark,
  BriefcaseBusiness,
  LayoutDashboard,
  Moon,
  Network,
  Sun,
  UserRound,
  UsersRound,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";
import { useTheme } from "../../context/ThemeContext.jsx";
import { getRoleLabel, ROLE_NAV_ITEMS, ROLE_ROUTES } from "../../routes/roleRoutes.js";
import Notifications from "../../components/Notifications.jsx";
import "./NavbarV1.css";

function getRoleNavIcon(label) {
  if (/dashboard|statistics/i.test(label)) return LayoutDashboard;
  if (/jobs/i.test(label)) return BriefcaseBusiness;
  if (/candidates|users/i.test(label)) return UsersRound;
  if (/saved/i.test(label)) return Bookmark;
  if (/notifications/i.test(label)) return Bell;
  return LayoutDashboard;
}

export default function NavbarV1() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const accountRef = useRef(null);
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const isFulltimePortal =
    location.pathname.startsWith("/company") ||
    location.pathname.startsWith("/employee") ||
    location.pathname.includes("recruiter-fulltime");
  const loginPath = isFulltimePortal
    ? "/employee/login"
    : "/recruiter/login";
  const signupPath = isFulltimePortal
    ? "/employee/signup"
    : "/recruiter/signup";
  const roleItems = ROLE_NAV_ITEMS[user?.role] || [];

  useEffect(() => {
    if (!accountMenuOpen) return undefined;

    const closeAccountMenu = (event) => {
      if (event.type === "keydown" && event.key === "Escape") {
        setAccountMenuOpen(false);
      } else if (
        event.type === "mousedown" &&
        accountRef.current &&
        !accountRef.current.contains(event.target)
      ) {
        setAccountMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", closeAccountMenu);
    document.addEventListener("keydown", closeAccountMenu);
    return () => {
      document.removeEventListener("mousedown", closeAccountMenu);
      document.removeEventListener("keydown", closeAccountMenu);
    };
  }, [accountMenuOpen]);

  useEffect(() => {
    if (!notificationsOpen) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setNotificationsOpen(false);
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [notificationsOpen]);

  const closeMobileMenu = () => setMobileMenuOpen(false);
  const dashboardPath =
    ROLE_ROUTES[user?.role]?.dashboard || ROLE_ROUTES[user?.role]?.jobs || "/";
  const profilePath = ROLE_ROUTES[user?.role]?.profile || null;
  const notificationsPath = ROLE_ROUTES[user?.role]?.notification || null;
  const isCurrentRoute = (path) =>
    location.pathname === path ||
    (path !== dashboardPath && location.pathname.startsWith(`${path}/`));

  const handleLogout = () => {
    const loggedOutLoginPath =
      user?.role === "recruiter_fulltime"
        ? "/employee/login"
        : "/recruiter/login";
    logout();
    setAccountMenuOpen(false);
    closeMobileMenu();
    navigate(loggedOutLoginPath);
  };

  return (
    <>
    <header className={`navbar-v1${user ? " navbar-v1--authenticated" : ""}`}>
      <div className="navbar-v1__inner">
        <a className="navbar-v1__brand" href="/" aria-label="ANT TECH home">
          <span className="navbar-v1__logo" aria-hidden="true">
            <Network size={19} strokeWidth={2} />
          </span>
          <span className="navbar-v1__brand-copy">
            <span className="navbar-v1__brand-name">
              ANT <span>TECH</span>
            </span>
            <span className="navbar-v1__tagline">
              {user?.role
              ? `${getRoleLabel(user.role)} workspace`
                : isFulltimePortal ? "Recruitment workspace" : "Recruiter network"}
            </span>
          </span>
        </a>

        {!user ? (
          <nav className="navbar-v1__links" aria-label="Main navigation">
            <Link className="navbar-v1__link" to="/freelancer" target="_blank" rel="noopener noreferrer">
              <UsersRound size={15} /> Freelancer
            </Link>
            <Link className="navbar-v1__link" to="/company" target="_blank" rel="noopener noreferrer">
              <BriefcaseBusiness size={15} /> Employee
            </Link>
            <Link className="navbar-v1__link" to="/" target="_blank" rel="noopener noreferrer">
              Choose portal
            </Link>
          </nav>
        ) : (
          <nav className="navbar-v1__role-links" aria-label="Workspace navigation">
            {roleItems.map((item) => {
              const RoleIcon = getRoleNavIcon(item.label);
              return (
                <Link
                  className={isCurrentRoute(item.path) ? "is-active" : ""}
                  key={item.path}
                  to={item.path}
                >
                  <RoleIcon className="navbar-v1__role-icon" size={16} aria-hidden="true" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        )}

        <div className="navbar-v1__actions">
          {!user && (
            <>
              <Link className="navbar-v1__portfolio" to={signupPath}>
                {isFulltimePortal ? "Create account" : "Join the network"}
              </Link>
            </>
          )}
          <button
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
            className="navbar-v1__theme-toggle"
            onClick={toggleTheme}
            title={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
            type="button"
          >
            {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
          </button>
          {user ? (
            <div className="navbar-v1__account" ref={accountRef}>
              {notificationsPath && (
                <button
                  aria-expanded={notificationsOpen}
                  aria-label="Open activity feed"
                  className={`navbar-v1__notification-link${notificationsOpen ? " is-active" : ""}`}
                  onClick={() => setNotificationsOpen(true)}
                  title="Activity feed"
                  type="button"
                >
                  <Bell size={17} aria-hidden="true" />
                </button>
              )}
              {roleItems.length === 0 && (
                <Link className="navbar-v1__dashboard-link" to={dashboardPath}>
                  Dashboard
                </Link>
              )}
              <button
                aria-expanded={accountMenuOpen}
                aria-label="Open account menu"
                className="navbar-v1__account-toggle"
                onClick={() => setAccountMenuOpen((open) => !open)}
                type="button"
              >
                <span className="navbar-v1__account-avatar" aria-hidden="true">
                  <UserRound size={17} />
                </span>
                <span className="navbar-v1__account-name">
                  {user.name || user.email || "Account"}
                </span>
                <i className="fa-solid fa-chevron-down" aria-hidden="true" />
              </button>
              {accountMenuOpen && (
                <div className="navbar-v1__account-menu">
                  {profilePath && (
                    <Link to={profilePath} onClick={() => setAccountMenuOpen(false)}>
                      My profile
                    </Link>
                  )}
                  {roleItems
                    .filter((item) => item.path !== dashboardPath)
                    .map((item) => (
                      <Link
                        className={isCurrentRoute(item.path) ? "is-active" : ""}
                        key={item.path}
                        onClick={() => setAccountMenuOpen(false)}
                        to={item.path}
                      >
                        {item.label}
                      </Link>
                    ))}
                  {roleItems.length === 0 && (
                    <Link to={dashboardPath}>Dashboard</Link>
                  )}
                  <button onClick={handleLogout} type="button">
                    Log out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="navbar-v1__auth-links">
              <Link className="navbar-v1__login-link" to={loginPath}>
                Log in
              </Link>
              <Link className="navbar-v1__signup-link" to={signupPath}>
                Sign up
              </Link>
            </div>
          )}
          <button
            aria-expanded={mobileMenuOpen}
            aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            className="navbar-v1__menu-toggle"
            onClick={() => setMobileMenuOpen((open) => !open)}
            type="button"
          >
            <i
              className={`fa-solid ${mobileMenuOpen ? "fa-xmark" : "fa-bars"}`}
              aria-hidden="true"
            />
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <nav className="navbar-v1__mobile-menu" aria-label="Mobile navigation">
          {user ? (
            roleItems.map((item) => (
              <Link
                className={`navbar-v1__mobile-role-link ${isCurrentRoute(item.path) ? "is-active" : ""}`}
                key={item.path}
                onClick={closeMobileMenu}
                to={item.path}
              >
                {item.label}
              </Link>
            ))
          ) : (
            <>
              <Link className="navbar-v1__link" to="/freelancer" target="_blank" rel="noopener noreferrer" onClick={closeMobileMenu}>
                <UsersRound size={15} /> Freelancer
              </Link>
              <Link className="navbar-v1__link" to="/company" target="_blank" rel="noopener noreferrer" onClick={closeMobileMenu}>
                <BriefcaseBusiness size={15} /> Employee
              </Link>
              <Link className="navbar-v1__link" to="/" target="_blank" rel="noopener noreferrer" onClick={closeMobileMenu}>
                Choose portal
              </Link>
            </>
          )}
          <button
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
            className="navbar-v1__mobile-theme-toggle"
            onClick={toggleTheme}
            type="button"
          >
            {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
            Switch to {theme === "dark" ? "light" : "dark"} theme
          </button>
          {user ? (
            <>
              {notificationsPath && (
                <button
                  className="navbar-v1__mobile-role-link"
                  onClick={() => {
                    closeMobileMenu();
                    setNotificationsOpen(true);
                  }}
                  type="button"
                >
                  <Bell size={16} aria-hidden="true" />
                  Activity Feed
                </button>
              )}
              <div className="navbar-v1__mobile-account">
                <div className="navbar-v1__mobile-account-info">
                  <span className="navbar-v1__account-avatar" aria-hidden="true">
                    {(user.name || user.email || "U").slice(0, 1).toUpperCase()}
                  </span>
                  <span>
                    <strong>{user.name || "Account"}</strong>
                    <small>{getRoleLabel(user.role) || user.email}</small>
                  </span>
                </div>
                {profilePath && (
                  <Link to={profilePath} onClick={closeMobileMenu}>My profile</Link>
                )}
                <button onClick={handleLogout} type="button">Log out</button>
              </div>
            </>
          ) : (
            <div className="navbar-v1__mobile-auth">
              <Link className="navbar-v1__login-link" to={loginPath} onClick={closeMobileMenu}>
                Log in
              </Link>
              <Link className="navbar-v1__signup-link" to={signupPath} onClick={closeMobileMenu}>
                Sign up
              </Link>
            </div>
          )}
        </nav>
      )}
    </header>
    {notificationsPath && (
      <Notifications
        isOpen={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
      />
    )}
    </>
  );
}
