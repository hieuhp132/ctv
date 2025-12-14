// src/router.js
import React, { createContext, useContext, useState } from "react";

const RouterContext = createContext();

function stripBase(pathname) {
  const base = (import.meta?.env?.BASE_URL || "/").replace(/\/$/, "");
  if (base === "") return pathname;
  return pathname.startsWith(base) ? pathname.slice(base.length) || "/" : pathname;
}

function withBase(path) {
  const base = import.meta?.env?.BASE_URL || "/";
  if (base === "/") return path;
  return `${base.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
}

export function Router({ children }) {
  const [path, setPath] = useState(stripBase(window.location.pathname));

  React.useEffect(() => {
    const handler = () => setPath(stripBase(window.location.pathname));
    window.addEventListener("popstate", handler);
    return () => window.removeEventListener("popstate", handler);
  }, []);

  const navigate = (to) => {
    const target = withBase(to);
    window.history.pushState({}, "", target);
    setPath(stripBase(new URL(target, window.location.origin).pathname));
  };

  return (
    <RouterContext.Provider value={{ path, navigate }}>
      {children}
    </RouterContext.Provider>
  );
}

export function Route({ path, children }) {
  const { path: current } = useContext(RouterContext);
  return current === path ? children : null;
}

export function Link({ to, children }) {
  const { navigate } = useContext(RouterContext);
  return (
    <a
      href={withBase(to)}
      onClick={(e) => {
        e.preventDefault();
        navigate(to);
      }}
    >
      {children}
    </a>
  );
}
