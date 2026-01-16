// Pending.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Clock, ShieldCheck, ArrowLeft, XCircle } from "lucide-react";
import { getUserStatusL } from "../api"; // Backend API call
import { useAuth } from "../context/AuthContext";
import "./Pending.css";

export default function Pending() {
  const navigate = useNavigate();
  const { user, login, logout } = useAuth(); // Include logout from AuthContext
  const [status, setStatus] = useState(user?.status || "Pending");

  useEffect(() => {
    if (!user?.email) return;

    const checkStatus = async () => {
      try {
        const res = await getUserStatusL(user.email);
        const { status: freshStatus, user: freshUser, token } = res;
        
        // If account is Active → login + redirect
        if (freshStatus === "Active" && token && freshUser) {
          login(freshUser, token);
          return;
        }

        // If account is Rejected
        if (freshStatus === "Rejected") {
          setStatus("Rejected");
        }
      } catch (err) {
        console.error("Check status failed", err);
      }
    };

    // Poll API every 5 seconds
    const interval = setInterval(checkStatus, 5000);
    // Call immediately on first render
    checkStatus();

    return () => clearInterval(interval);
  }, [user?.email, login]);

  // Reset all data and go back to login
  const handleResetAndLogin = () => {
    // 1️⃣ Clear sessionStorage + localStorage
    sessionStorage.clear();
    localStorage.clear();

    // 2️⃣ Reset AuthContext state
    if (logout) logout();

    // 3️⃣ Redirect to login
    navigate("/login");
  };

  // If status is Rejected → show warning
  if (status === "Rejected") {
    return (
      <div className="pending-container">
        <div className="pending-card rejected">
          <div className="icon-wrapper">
            <XCircle color="#ef4444" size={60} />
          </div>
          <h1 className="title" style={{ color: "#ef4444" }}>Access Denied</h1>
          <p className="description">
            Sorry, your registration request has been rejected by the Admin. 
            Please contact support for more details.
          </p>
          <button className="back-button" onClick={handleResetAndLogin}>
            <ArrowLeft size={18} /> Back to Login
          </button>
        </div>
      </div>
    );
  }

  // If status is Pending → show waiting message
  return (
    <div className="pending-container">
      <div className="pending-card">
        <div className="icon-wrapper">
          <div className="pulse-ring"></div>
          <Clock className="main-icon" size={48} />
        </div>
        <h1 className="title">Pending Approval</h1>
        <p className="description">
          The account <strong>{user?.email}</strong> is under review. 
          The system will automatically redirect once completed.
        </p>
        <div className="status-steps">
          <div className="step completed">
            <ShieldCheck size={20} />
            <span>Registration Successful</span>
          </div>
          <div className="step processing">
            <div className="spinner-small"></div>
            <span>Admin is verifying...</span>
          </div>
        </div>
        <button className="back-button" onClick={handleResetAndLogin}>
          <ArrowLeft size={18} /> Back to Login
        </button>
      </div>
    </div>
  );
}
