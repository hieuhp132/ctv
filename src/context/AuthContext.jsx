import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getUserStatusL } from "../api";

const AuthContext = createContext();

const LS_SESSION = "authSession";
const ONE_DAY = 24 * 60 * 60 * 1000;

// ================= Helpers =================
function readSession() {
  try {
    const raw = sessionStorage.getItem(LS_SESSION);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data || !data.expiresAt) return null;
    if (Date.now() > data.expiresAt) return null;
    return data;
  } catch {
    return null;
  }
}

function writeSession(user, token) {
  try {
    sessionStorage.setItem(
      LS_SESSION,
      JSON.stringify({
        user,
        token,
        expiresAt: Date.now() + ONE_DAY
      })
    );
  } catch {}
}

function clearSession() {
  try {
    sessionStorage.removeItem(LS_SESSION);
  } catch {}
}

// ================= AuthProvider =================
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const navigate = useNavigate();

  // 1️⃣ Restore session
  useEffect(() => {
    const s = readSession();
    if (s?.user) setUser(s.user);
    setAuthReady(true);
  }, []);

  // 2️⃣ Poll backend để sync user status
  useEffect(() => {
    if (!user?.email) return;

    const interval = setInterval(async () => {
      try {
        const res = await getUserStatusL(user.email);
        const freshUser = res.user;

        if (!freshUser) return;

        // Nếu status thay đổi
        if (freshUser.status !== user.status) {
          setUser(freshUser);
          writeSession(freshUser, readSession()?.token);

          // Redirect ngay khi không Active
          if (freshUser.status === "Pending" || freshUser.status === "Rejected") {
            navigate("/pending");
          } 
          // Nếu Active → redirect theo role (nếu đang ở Pending)
          else if (freshUser.status === "Active") {
            switch (freshUser.role) {
              case "admin":
                navigate("/admin/overview");
                break;
              case "recruiter":
                navigate("/recruiter/programmsview");
                break;
              case "candidate":
                navigate("/candidate/home");
                break;
              default:
                navigate("/home");
            }
          }
        }
      } catch (err) {
        console.error("❌ Sync user status failed", err);
      }
    }, 5000);

    // Call ngay lần đầu
    (async () => {
      try {
        const res = await getUserStatusL(user.email);
        const freshUser = res.user;
        if (freshUser && freshUser.status !== user.status) {
          setUser(freshUser);
          writeSession(freshUser, readSession()?.token);
        }
      } catch {}
    })();

    return () => clearInterval(interval);
  }, [user?.email, navigate, user]);

  // 3️⃣ Auto logout khi session hết hạn
  useEffect(() => {
    const interval = setInterval(() => {
      const s = readSession();
      if (!s?.user && user) {
        setUser(null);
        navigate("/login");
      }
    }, 60 * 1000);

    return () => clearInterval(interval);
  }, [user, navigate]);

  // ================= Login / Logout =================
  const login = (nextUser, token = null) => {
    setUser(nextUser);
    writeSession(nextUser, token);

    if (nextUser.status === "Pending" || nextUser.status === "Rejected") {
      navigate("/pending");
      return;
    }

    switch (nextUser.role) {
      case "admin":
        navigate("/admin/overview");
        break;
      case "recruiter":
        navigate("/recruiter/programmsview");
        break;
      case "candidate":
        navigate("/candidate/home");
        break;
      default:
        navigate("/home");
    }
  };

  const logout = () => {
    setUser(null);
    clearSession();
    navigate("/login");
  };

  const updateSession = (newUser, newToken = null) => {
    const s = readSession();
    const tokenToUse = newToken || s?.token;
    if (!tokenToUse) return;
    setUser(newUser);
    writeSession(newUser, tokenToUse);
  };

  const value = useMemo(
    () => ({ user, authReady, login, logout, updateSession, setUser }),
    [user, authReady]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
