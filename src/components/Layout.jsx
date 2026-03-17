import Navbar from "../pages/navbar/Navbar.jsx";
import { Outlet } from "react-router-dom";
import Footer from "./Footer.jsx";
export default function Layout({ children }) {
  return (
    <>
      <Navbar />
      <main className="pt-20">
        <Outlet />
      </main>
    </>
  );
}
