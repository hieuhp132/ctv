import Navbar from "../pages/navbar/Navbar.jsx";
import { Outlet } from "react-router-dom";
import NavbarV1 from "../pages/navbar/NavbarV1.jsx";
import Footer from "./Footer.jsx";
import { useLocation } from "react-router-dom";
export default function Layout({ children }) {
  const { pathname } = useLocation();
  const isAuthPage = pathname.startsWith("/login") || pathname.startsWith("/signup");

  return (
    <>
      {/* <Navbar /> */}
      {!isAuthPage && <NavbarV1 />}
      <main>
        <Outlet />
      </main>
    </>
  );
}
