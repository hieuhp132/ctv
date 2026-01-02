import { useState } from "react";
import {
  FaUser, FaLock, FaEye, FaEyeSlash,
  FaEnvelope, FaFacebook, FaLinkedin
} from "react-icons/fa";

import fbIcon from "../../assets/fb.jpg";
import teleIcon from "../../assets/tele.png";

import { useAuth } from "../../context/AuthContext";
import { API_BASE, apiLogin, llogin } from "../../api";
import { supabase } from "../../supabaseClient";

import "./Login.css";

export default function Login() {
  const { login, user } = useAuth();

  // UI states
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);
  const [serverMessage, setServerMessage] = useState("");

  const [errors, setErrors] = useState({ username: "", password: "" });

  // reset password modal
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetMessage, setResetMessage] = useState("");
  const [resetLoading, setResetLoading] = useState(false);

  // ⚠️ Không sử dụng Supabase session trực tiếp ở Login.jsx
  // Vì AuthProvider sẽ xử lý SIGNED_IN rồi redirect luôn.

  /* 🔹 Google OAuth Login */
  const signInWithGoogle = async () => {
    try {
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
                redirectTo: `${window.location.origin}${import.meta.env.BASE_URL}auth/callback`
        }
      });
      
    } catch (err) {
      console.error("Google Login Error:", err);
    }
  };

/* 🔹 Manual email/password login */
const handleSubmit = async (e) => {
  e.preventDefault();
  setServerMessage("");

  const email = e.target.username.value.trim().toLowerCase();
  const password = e.target.password.value.trim();

  // validations...
  let newErrors = { username: "", password: "" };
  let hasError = false;

  if (!email) {
    newErrors.username = "Please enter email";
    hasError = true;
  }
  if (!password) {
    newErrors.password = "Please enter password";
    hasError = true;
  }

  setErrors(newErrors);
  if (hasError) {
    triggerShake();
    return;
  }

  setLoading(true);

  try {
    const { user, token } = await llogin(email, password); // 🔥 dùng API file riêng

    // Gọi AuthProvider login → tự lưu session + redirect
    login(user, token);

  } catch (err) {
    setServerMessage(err.message || "Login failed");
    triggerShake();
  }

  setLoading(false);
};

  /* 🔹 Reset password */
  const sendResetEmail = async () => {
    setResetMessage("");
    setResetLoading(true);

    try {
      const res = await fetch(`${API_BASE}/local/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail, password:"123456", responseWithEmail: true }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Reset failed");

      setResetMessage("✔ A new password has been sent to your email.");
    } catch (err) {
      setResetMessage("❌ " + err.message);
    }

    setResetLoading(false);
  };

  /* 🔹 Shake animation */
  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 550);
  };

  /* 🔹 Nếu đã đăng nhập → không cho vào lại login */
  if (user) {
    return (
      <div style={{ padding: "20px" }}>
        <h2>You are already logged in.</h2>
      </div>
    );
  }

  /* 🔹 UI Render */
  return (
    <div className="container">
      <div className={`shake-wrapper ${shake ? "is-shaking" : ""}`}>
        <form className="form" onSubmit={handleSubmit}>
          <div className="title">
            Welcome back!
            <div style={{ fontSize: "15px", marginTop: "10px", fontWeight: "bold" }}>
              Login to continue
            </div>
          </div>

          {/* EMAIL */}
          <div className="input-group">
            <label className="label" htmlFor="username">Email</label>
            <div className="input-wrapper">
              <FaUser className="icon" />
              <input type="text" id="username" name="username"
                placeholder="Enter email"
                className={errors.username ? "error" : ""}
              />
            </div>
          </div>
          {errors.username && <p className="error-message">{errors.username}</p>}

          {/* PASSWORD */}
          <div className="input-group">
            <label className="label" htmlFor="password">Password</label>
            <div className="input-wrapper">
              <FaLock className="icon" />
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                placeholder="Enter password"
                className={errors.password ? "error" : ""}
              />
              <span className="toggle-password" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>
          </div>
          {errors.password && <p className="error-message">{errors.password}</p>}

          {/* OPTIONS */}
          <div className="form-options">
            <div className="remember-me">
              <input type="checkbox" id="remember"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <label htmlFor="remember">Remember password</label>
            </div>

            <button type="submit" disabled={loading}>
              {loading ? <span className="spinner"></span> : "Login"}
            </button>
          </div>

          {/* FORGOT PASSWORD */}
          <div style={{ marginTop: "12px", textAlign: "right" }}>
            <span
              style={{ cursor: "pointer", color: "#007bff", textDecoration: "underline" }}
              onClick={() => setShowReset(true)}
            >
              Forgot password?
            </span>
          </div>

          {/* RESET PASSWORD MODAL */}
          {showReset && (
            <div className="modal-overlay">
              <div className="modal">
                <h3>Forgot your password?</h3>
                <p>Enter your email, and we'll send you a new one.</p>

                <input
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="Your email"
                  style={{ width: "100%", padding: "8px", margin: "10px 0" }}
                />

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                  <button onClick={() => setShowReset(false)} disabled={resetLoading}>Cancel</button>
                  <button onClick={sendResetEmail} disabled={resetLoading}>
                    {resetLoading ? <span className="spinner"></span> : "Send"}
                  </button>
                </div>

                {resetMessage && <p style={{ marginTop: "10px" }}>{resetMessage}</p>}
              </div>
            </div>
          )}

          {/* SERVER MESSAGE */}
          {serverMessage && (
            <p className={`server-message ${serverMessage.includes("success") ? "success" : "error"}`}>
              {serverMessage}
            </p>
          )}

          <div className="divider"><span>or</span></div>

          {/* SOCIAL LOGIN */}
          <div className="social-login">

            <button type="button" className="social-btn email" onClick={signInWithGoogle}>
              <FaEnvelope /> Login with Google
            </button>

            {/* <button type="button" className="social-btn facebook">
              <FaFacebook /> Facebook
            </button>

            <button type="button" className="social-btn linkedin">
              <FaLinkedin /> LinkedIn
            </button> */}

          </div>
        </form>
      </div>

      {/* FLOATING ICONS */}
      <div className="floating-icons">
        <a href="https://m.me/anttechasia" className="floating-icon">
          <img src={fbIcon} alt="" className="logo-img" />
        </a>
        <a href="https://t.me/anttechasia" className="floating-icon">
          <img src={teleIcon} alt="" className="logo-img" />
        </a>
      </div>
    </div>
  );
}
