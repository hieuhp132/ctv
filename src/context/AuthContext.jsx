// ===============================
// 📌 AuthProvider (CLEAN VERSION)
// ===============================

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext();

// 🎯 Session lưu theo tab
const LS_SESSION = "authSession";
const ONE_DAY = 24 * 60 * 60 * 1000;

// ===============================
// 📌 Helpers
// ===============================
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
    const data = {
      user,
      token,
      expiresAt: Date.now() + ONE_DAY
    };
    sessionStorage.setItem(LS_SESSION, JSON.stringify(data));
  } catch {}
}

function clearSession() {
  try {
    sessionStorage.removeItem(LS_SESSION);
  } catch {}
}

// ===============================
// 📌 AuthProvider
// ===============================
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const navigate = useNavigate();

  // 1️⃣ Khôi phục session từ sessionStorage
  useEffect(() => {
    const s = readSession();
    if (s?.user) {
      setUser(s.user);
    }
    setAuthReady(true);
  }, []);

  // 2️⃣ Auto logout khi session hết hạn
  useEffect(() => {
    const interval = setInterval(() => {
      const s = readSession();
      if (!s?.user) {
        if (user) {
          setUser(null);
          navigate("/login");
        }
      }
    }, 60 * 1000);

    return () => clearInterval(interval);
  }, [user]);

  // 3️⃣ LOGIN (backend login hoặc AuthCallback gọi)
  const login = (nextUser, token = null) => {
    setUser(nextUser);
    writeSession(nextUser, token);

    // Redirect theo role
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

  // 4️⃣ LOGOUT
  const logout = () => {
    setUser(null);
    clearSession();
    navigate("/login");
  };

  // 5️⃣ UPDATE SESSION
  const updateSession = (newUser, newToken = null) => {
    const s = readSession();
    const tokenToUse = newToken || s?.token;

    if (!tokenToUse) {
      console.warn("⚠ No token found for updateSession()");
      return;
    }

    writeSession(newUser, tokenToUse);
    setUser(newUser);
  };

  // Export value
  const value = useMemo(
    () => ({
      user,
      authReady,
      login,
      logout,
      updateSession,
      setUser
    }),
    [user, authReady]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
