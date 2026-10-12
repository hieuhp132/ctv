import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { motion } from "framer-motion";
import { Eye, EyeOff, TrendingUp, ArrowLeft } from "lucide-react";
import { API_BASE, llogin } from "../../services/api";
import { supabase } from "../../services/supabase";
import { useAuth } from "../../context/AuthContext";
import { ROLE_ROUTES } from "../../routes/roleRoutes";
import { useNavigate } from "react-router-dom";
import ParticleBackground from "../../components/ParticleBackground";
import EarthObject from "../../components/EarthObject";
import { FaUser, FaLock, FaEnvelope, FaFacebook, FaLinkedin } from "react-icons/fa";
import fbIcon from "../../assets/fb.jpg";
import teleIcon from "../../assets/tele.png";
import "./AuthPages.css";

const LoginPage = ({ recruiterType = "freelancer" }) => {
  const isFulltimeRecruiter = recruiterType === "fulltime";
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const navigate = useNavigate();
  const { login, user } = useAuth();

  // ================= REMEMBER ME =================
  const [rememberMe, setRememberMe] = useState(
    localStorage.getItem("rememberMe") === "true"
  );

  // UI states
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);
  const [serverMessage, setServerMessage] = useState("");

  // Reset password modal
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetMessage, setResetMessage] = useState("");
  const [resetLoading, setResetLoading] = useState(false);

  // ================= AUTO FILL ON FIRST LOAD =================
  useEffect(() => {
    const remembered = localStorage.getItem("rememberMe") === "true";
    if (!remembered) return;
    const remEmail = localStorage.getItem("rememberEmail");
    const remPassword = localStorage.getItem("rememberPassword");
    if (remEmail) setEmail(remEmail);
    if (remPassword) setPassword(remPassword);
  }, []);

  useEffect(() => {
    if (user) {
      if (user.status !== "Active") navigate("/pending");
      else navigate(ROLE_ROUTES[user.role]?.dashboard || ROLE_ROUTES[user.role]?.jobs || "/");
    }
  }, [user, navigate]);


  const onGoToSignup = () => {
    navigate(isFulltimeRecruiter ? "/employee/signup" : "/recruiter/signup");
  };

  /* 🔹 Google OAuth Login */
  const signInWithGoogle = async () => {
    try {
      if (supabase) {
        await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo: `${window.location.origin}${import.meta.env.BASE_URL}auth/callback`,
          },
        });
      }
    } catch (err) {
      console.error("Google Login Error:", err);
    }
  };

  /* 🔹 Reset password */
  const sendResetEmail = async () => {
    setResetMessage("");
    setResetLoading(true);
    try {
      const res = await fetch(`${API_BASE}/local/users/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Reset failed");
      setResetMessage("✔ A new password has been sent to your email.");
    } catch (err) {
      setResetMessage("❌ " + err.message);
    }
    setResetLoading(false);
  };

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 550);
  };

  const onLogin = async () => {
    if (!email || !password) {
      setErrorMsg("Please enter your email and password.");
      triggerShake();
      return;
    }

    setErrorMsg("");
    setServerMessage("");
    setLoading(true);
    try {
      const { user: apiUser, token } = await llogin(email.trim().toLowerCase(), password);

      if (rememberMe) {
        localStorage.setItem("rememberMe", "true");
        localStorage.setItem("rememberEmail", email);
        localStorage.setItem("rememberPassword", password);
      } else {
        localStorage.removeItem("rememberMe");
        localStorage.removeItem("rememberEmail");
        localStorage.removeItem("rememberPassword");
      }

      login(apiUser, token);

      if (apiUser.status !== "Active") {
        navigate("/pending");
      } else {
        navigate(ROLE_ROUTES[apiUser.role]?.dashboard || ROLE_ROUTES[apiUser.role]?.jobs || "/");
      }
    } catch (err) {
      const msg = err.message || "Login failed";
      setErrorMsg(msg);
      setServerMessage(msg);
      triggerShake();

      if (
        msg.includes("Account pending") ||
        msg.includes("Account denied")
      ) {
        localStorage.setItem("pendingEmail", email);
        navigate("/pending");
      }
    }
    setLoading(false);
  };

  return (
    <div className={`auth-page ${isFulltimeRecruiter ? "auth-page--fulltime" : "auth-page--freelancer"}`}>
      <ParticleBackground />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1, x: shake ? [-10, 10, -10, 10, 0] : 0 }}
        transition={{ x: { duration: 0.4 } }}
        className="auth-card"
      >
        <button
          onClick={() => navigate(isFulltimeRecruiter ? "/company" : "/freelancer")}
          className="auth-home-link"
        >
          <ArrowLeft size={16} /> Home
        </button>

        {/* Left Side */}
        <div className="auth-content">
          <div className="auth-form-column">
            <div className="auth-heading">

              <h1>
                {isFulltimeRecruiter ? "Employee Sign In" : "AntTech Asia"}
              </h1>

              <p>
                {isFulltimeRecruiter
                  ? "Log in to manage your team's hiring activity."
                  : "Welcome Back, Please login to your account !"}
              </p>
            </div>

            {errorMsg && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-2xl text-sm mb-6">
                {errorMsg}
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                onLogin();
              }}
              className="auth-form"
            >
              {/* Email */}
              <div className="space-y-1.5">
                <label>
                  Email address
                </label>

                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="auth-input"
                  placeholder="name@company.com"
                />
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label>
                  Password
                </label>

                <div className="auth-password-field">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) =>
                      setPassword(e.target.value)
                    }
                    className="auth-input"
                    placeholder="••••••••"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(!showPassword)
                    }
                    className="auth-password-toggle"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Remember */}
              <div className="auth-options">
                <label className="auth-remember">
                  <input
                    type="checkbox"
                    className="rounded border-white/20 bg-white/5"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span>Remember me</span>
                </label>

                <a
                  href="#"
                  onClick={(e) => { e.preventDefault(); setShowReset(true); }}
                  className="auth-inline-link"
                >
                  Forgot password?
                </a>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="auth-submit"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  "LOG IN"
                )}
              </button>
            </form>

            {/* <button
                type="button"
                onClick={signInWithGoogle}
                className="w-full mt-6 py-4 rounded-2xl text-white font-bold text-sm shadow-xl transition-all hover:bg-white/10 active:scale-[0.98] bg-white/5 border border-white/10 flex justify-center items-center gap-2"
              >
                <FaEnvelope className="text-xl" /> Login with Google
            </button> */}

            <div className="auth-switcher">
              <p>
                Don’t have an account?{" "}
                <button
                  onClick={onGoToSignup}
                  className="auth-inline-link"
                >
                  Sign up
                </button>
              </p>
              <p>
                {isFulltimeRecruiter ? "Are you a freelance recruiter?" : "Are you an employee?"}{" "}
                <button
                  className="auth-inline-link"
                  onClick={() => navigate(isFulltimeRecruiter ? "/recruiter/login" : "/employee/login")}
                  type="button"
                >
                  {isFulltimeRecruiter ? "Switch to Freelance Recruiter" : "Switch to Employee"}
                </button>
              </p>
            </div>

            <div className="auth-social-links">
              <a href="https://m.me/anttechasia" aria-label="ANT TECH on Facebook">
                <img src={fbIcon} alt="FB" className="w-6 h-6 rounded-full" />
              </a>
              <a href="https://t.me/anttechasia" aria-label="ANT TECH on Telegram">
                <img src={teleIcon} alt="TELE" className="w-6 h-6 rounded-full" />
              </a>
            </div>

            {/* RESET PASSWORD MODAL */}
            {showReset && (
              <div className="auth-reset-overlay">
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="auth-reset-dialog"
                >
                  <h3>Forgot your password?</h3>
                  <p>Enter your email to receive instructions to reset your password.</p>

                  <input
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="Email address"
                    className="auth-input"
                  />

                  <div className="auth-reset-actions">
                    <button
                      onClick={() => setShowReset(false)}
                      disabled={resetLoading}
                      className="auth-reset-cancel"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={sendResetEmail}
                      disabled={resetLoading}
                      className="auth-reset-send"
                    >
                      {resetLoading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : "Send"}
                    </button>
                  </div>

                  {resetMessage && (
                    <p className={`mt-6 text-sm ${resetMessage.includes("❌") ? "text-red-400" : "text-green-400"}`}>
                      {resetMessage}
                    </p>
                  )}
                </motion.div>
              </div>
            )}
          </div>
        </div>

        {/* Right Side */}
        <div className="auth-visual">
          <div className="absolute inset-0 z-0">
            <EarthObject />
          </div>

          <div className="auth-visual-copy">
            <h2>
              {isFulltimeRecruiter ? "Hire with Ant Tech" : "Global Talent"}
            </h2>

            <p>
              {isFulltimeRecruiter
                ? "Build your candidate pipeline and manage your team's hiring process."
                : "Connecting the world's best engineers with visionary companies."}
            </p>
          </div>

          <div className="absolute w-[400px] h-[400px] border border-white/5 rounded-full animate-pulse" />
          <div className="absolute w-[500px] h-[500px] border border-white/5 rounded-full animate-ping [animation-duration:3s]" />
        </div>
      </motion.div>

      {/* Decorative blur */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.1, 0.2, 0.1],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/20 blur-[120px] rounded-full pointer-events-none"
      />

      <motion.div
        animate={{
          scale: [1.2, 1, 1.2],
          opacity: [0.1, 0.2, 0.1],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-accent/20 blur-[120px] rounded-full pointer-events-none"
      />
    </div>
  );
};

export default LoginPage;
