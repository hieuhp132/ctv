// Pending.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Clock, ShieldCheck, ArrowLeft, XCircle, Mail, HelpCircle } from "lucide-react";
import { getUserStatusL } from "../../services/api"; // Backend API call
import { useAuth } from "../../context/AuthContext";
import "./Pending.css";

export default function Pending() {
  const navigate = useNavigate();
  const { user, login, logout } = useAuth(); // Include logout from AuthContext
  const [status, setStatus] = useState(user?.status || "Pending");
  const [elapsedTime, setElapsedTime] = useState(0);

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

    // Track elapsed time
    const timeInterval = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);

    // Poll API every 5 seconds
    const statusInterval = setInterval(checkStatus, 5000);
    // Call immediately on first render
    checkStatus();

    return () => {
      clearInterval(timeInterval);
      clearInterval(statusInterval);
    };
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
      <div className="pending-container rejected-container">
        <div className="pending-card rejected">
          <div className="icon-wrapper error-icon">
            <div className="pulse-ring error"></div>
            <XCircle color="#ef4444" size={60} />
          </div>
          <h1 className="title error-title">Access Denied</h1>
          <p className="description">
            Sorry, your registration request has been rejected by the Admin. 
            Please contact support for more details.
          </p>
          <div className="contact-buttons">
            <a href="mailto:support@example.com" className="contact-link">
              <Mail size={18} /> Email Support
            </a>
            <a href="https://help.example.com" className="contact-link" target="_blank" rel="noopener noreferrer">
              <HelpCircle size={18} /> Help Center
            </a>
          </div>
          <button className="back-button secondary" onClick={handleResetAndLogin}>
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
        <p className="email-text">
          Account: <strong>{user?.email}</strong>
        </p>
        <p className="description">
          Your registration is under review. The system will automatically redirect once approved.
        </p>
        
        <div className="status-steps">
          <div className="step completed">
            <div className="step-icon">
              <ShieldCheck size={20} />
            </div>
            <div className="step-content">
              <span className="step-title">Registration Successful</span>
              <span className="step-subtitle">Account created and verified</span>
            </div>
          </div>
          <div className="step processing">
            <div className="step-icon">
              <div className="spinner-small"></div>
            </div>
            <div className="step-content">
              <span className="step-title">Admin is verifying...</span>
              <span className="step-subtitle">Awaiting approval from administrator</span>
            </div>
          </div>
          <div className="step pending">
            <div className="step-icon">
              <Clock size={20} />
            </div>
            <div className="step-content">
              <span className="step-title">Account Activation</span>
              <span className="step-subtitle">Will be redirected automatically</span>
            </div>
          </div>
        </div>

        <div className="info-box">
          <p className="info-text">
            ⏱️ Time elapsed: <strong>{Math.floor(elapsedTime / 60)}m {elapsedTime % 60}s</strong>
          </p>
          <p className="info-hint">The process usually takes 1-2 hours. Thanks for your patience!</p>
        </div>

        <button className="back-button" onClick={handleResetAndLogin}>
          <ArrowLeft size={18} /> Back to Login
        </button>
      </div>
    </div>
  );
}

