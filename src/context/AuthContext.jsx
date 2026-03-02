import { createContext, useContext, useEffect, useMemo, useState } from "react";

const AuthContext = createContext();

const LS_SESSION = "authSession";
const ONE_DAY = 24 * 60 * 60 * 1000;

/* ===== session helpers ===== */
const readSession = () => {
  try {
    const raw = sessionStorage.getItem(LS_SESSION);
    if (!raw) return null;
    const s = JSON.parse(raw);
    if (Date.now() > s.expiresAt) return null;
    return s;
  } catch {
    return null;
  }
};

const writeSession = (user, token) => {
  sessionStorage.setItem(
    LS_SESSION,
    JSON.stringify({
      user,
      token,
      expiresAt: Date.now() + ONE_DAY,
    }),
  );
};

const clearSession = () => sessionStorage.removeItem(LS_SESSION);

/* ===== Provider ===== */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    const s = readSession();
    if (s?.user) setUser(s.user);
    setAuthReady(true);
  }, []);

  const login = (user, token) => {
    setUser(user);
    writeSession(user, token);
  };

  const logout = () => {
    setUser(null);
    clearSession();
  };

  /* ✅ helper chuẩn */
  const updateUser = (newUser) => {
    setUser(newUser);

    const s = readSession();
    if (s) {
      writeSession(newUser, s.token);
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
