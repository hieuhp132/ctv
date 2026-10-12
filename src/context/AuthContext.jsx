import { createContext, useContext, useEffect, useMemo, useState } from "react";

const AuthContext = createContext();

const LS_SESSION = "authSession";
const ONE_DAY = 24 * 60 * 60 * 1000;
const normalizeRole = (user) =>
  user?.role === "recruiter" ? { ...user, role: "recruiter_freelancer" } : user;

/* ===== session helpers ===== */
const readSession = () => {
  try {
    const raw = localStorage.getItem(LS_SESSION);
    if (!raw) return null;
    const s = JSON.parse(raw);
    if (Date.now() > s.expiresAt) {
      localStorage.removeItem(LS_SESSION);
      return null;
    }
    return s;
  } catch {
    return null;
  }
};

const writeSession = (user, token) => {
  const sessionData = JSON.stringify({
    user,
    token,
    expiresAt: Date.now() + ONE_DAY,
  });
  localStorage.setItem(LS_SESSION, sessionData);
};

const clearSession = () => {
  localStorage.removeItem(LS_SESSION);
};

/* ===== Provider ===== */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    const s = readSession();
    if (s?.user) {
      const normalizedUser = normalizeRole(s.user);
      setUser(normalizedUser);
      if (normalizedUser !== s.user) writeSession(normalizedUser, s.token);
    }
    setAuthReady(true);
  }, []);

  const login = (user, token) => {
    const normalizedUser = normalizeRole(user);
    setUser(normalizedUser);
    writeSession(normalizedUser, token);
  };

  const logout = () => {
    setUser(null);
    clearSession();
  };

  /* ✅ helper chuẩn */
  const updateUser = (newUser) => {
    const normalizedUser = normalizeRole(newUser);
    setUser(normalizedUser);

    const s = readSession();
    if (s) {
      writeSession(normalizedUser, s.token);
    }
  };

  const value = useMemo(
    () => ({
      user,
      authReady,
      login,
      logout,
      updateUser, // 👈 expose cái này
    }),
    [user, authReady],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}


export const useAuth = () => useContext(AuthContext);
