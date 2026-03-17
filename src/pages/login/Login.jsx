import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { motion } from "framer-motion";
import { Eye, EyeOff, TrendingUp, ArrowLeft } from "lucide-react";
import { API_BASE, llogin } from "../../services/api";
import { supabase } from "../../services/supabase";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import ParticleBackground from "../../components/ParticleBackground";
import EarthObject from "../../components/EarthObject";
import { FaUser, FaLock, FaEnvelope, FaFacebook, FaLinkedin } from "react-icons/fa";
import fbIcon from "../../assets/fb.jpg";
import teleIcon from "../../assets/tele.png";

const LoginPage = () => {
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

  // ================= AUTO FILL WHEN RETURN TO LOGIN =================
  useEffect(() => {
    const remembered = localStorage.getItem("rememberMe") === "true";
    if (!remembered) {
      setEmail("");
      setPassword("");
      return;
    }
    const remEmail = localStorage.getItem("rememberEmail");
    const remPassword = localStorage.getItem("rememberPassword");
    if (remEmail) setEmail(remEmail);
    if (remPassword) setPassword(remPassword);
  }, [rememberMe]);

  useEffect(() => {
    if (user) {
      if (user.role === "admin") navigate("/admin/jobs");
      else if (user.role === "recruiter") navigate("/recruiter/jobs");
      else navigate("/");
    }
  }, [user, navigate]);


  const onGoToSignup = () => {
    navigate("/signup");
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
      const res = await fetch(`${API_BASE}/local/users/reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail, newPassword: "123456", responseWithEmail: true }),
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
      setErrorMsg("Please enter email and password");
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
        if (apiUser.role === "admin") navigate("/admin/jobs");
        else if (apiUser.role === "recruiter") navigate("/recruiter/jobs");
        else navigate("/");
      }
    } catch (err) {
      const msg = err.message || "Login failed";
      setErrorMsg(msg);
      setServerMessage(msg);
      triggerShake();

      if (
        msg.includes("chờ Admin phê duyệt") ||
        msg.includes("bị từ chối truy cập")
      ) {
        localStorage.setItem("pendingEmail", email);
        navigate("/pending");
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 font-sans relative overflow-hidden">
      <ParticleBackground />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1, x: shake ? [-10, 10, -10, 10, 0] : 0 }}
        transition={{ x: { duration: 0.4 } }}
        className="w-full max-w-[1000px] relative z-10 flex flex-col md:flex-row backdrop-blur-xl bg-white/10 border border-white/20 rounded-[40px] shadow-2xl overflow-hidden min-h-[600px]"
      >
        <button
          onClick={() => navigate("/")}
          className="absolute top-6 left-6 z-50 text-white/50 hover:text-white transition-colors flex items-center gap-2 text-sm font-medium"
        >
          <ArrowLeft size={16} /> Home
        </button>

        {/* Left Side */}
        <div className="flex-1 p-8 md:p-12 lg:p-16 flex flex-col justify-center border-r border-white/10">
          <div className="max-w-md w-full mx-auto">
            <div className="mb-10">

              <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">
                AntTech Asia
              </h1>

              <p className="text-white/60 text-sm">
                Welcome Back, Please login to your account !
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
              className="space-y-6"
            >
              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-white/40 tracking-wider ml-1">
                  Email address
                </label>

                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm text-white outline-none"
                  placeholder="name@company.com"
                />
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-white/40 tracking-wider ml-1">
                  Password
                </label>

                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) =>
                      setPassword(e.target.value)
                    }
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm text-white outline-none"
                    placeholder="••••••••"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(!showPassword)
                    }
                    className="absolute right-5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
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
              <div className="flex items-center justify-between text-xs">
                <label className="flex items-center gap-2 cursor-pointer text-white/60 hover:text-white">
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
                  className="text-primary font-bold hover:text-primary/80"
                >
                  Forgot password?
                </a>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 rounded-2xl text-white font-bold text-sm uppercase tracking-widest shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98] mt-4 bg-gradient-to-r from-[#FF465E] to-[#FFA63D] flex justify-center items-center"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  "LOGIN TO DASHBOARD"
                )}
              </button>
            </form>

            <div className="mt-8 relative flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/20"></div>
              </div>
              <div className="relative px-4 backdrop-blur-xl text-white/40 text-xs">
                or
              </div>
            </div>

            {/* <button
                type="button"
                onClick={signInWithGoogle}
                className="w-full mt-6 py-4 rounded-2xl text-white font-bold text-sm shadow-xl transition-all hover:bg-white/10 active:scale-[0.98] bg-white/5 border border-white/10 flex justify-center items-center gap-2"
              >
                <FaEnvelope className="text-xl" /> Login with Google
            </button> */}

            <div className="mt-8 pt-6 border-t border-white/10 text-center">
              <p className="text-white/40 text-xs">
                Don't have an account?{" "}
                <button
                  onClick={onGoToSignup}
                  className="text-white font-medium hover:underline"
                >
                  Sign up
                </button>
              </p>
            </div>

            <div className="flex justify-center gap-4 mt-6">
              <a href="https://m.me/anttechasia" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                <img src={fbIcon} alt="FB" className="w-6 h-6 rounded-full" />
              </a>
              <a href="https://t.me/anttechasia" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                <img src={teleIcon} alt="TELE" className="w-6 h-6 rounded-full" />
              </a>
            </div>

            {/* RESET PASSWORD MODAL */}
            {showReset && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="bg-[#1a1c23] border border-white/10 p-8 rounded-3xl w-full max-w-md shadow-2xl"
                >
                  <h3 className="text-2xl font-bold text-white mb-2">Forgot your password?</h3>
                  <p className="text-white/60 text-sm mb-6">Enter your email, and we'll send you a new one.</p>

                  <input
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="Your email address"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-sm text-white outline-none mb-6 focus:border-primary/50 transition-colors"
                  />

                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => setShowReset(false)}
                      disabled={resetLoading}
                      className="px-6 py-3 rounded-xl text-white/60 font-semibold hover:bg-white/5 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={sendResetEmail}
                      disabled={resetLoading}
                      className="px-6 py-3 rounded-xl text-white font-bold bg-gradient-to-r from-[#FF465E] to-[#FFA63D] shadow-lg hover:shadow-primary/20 transition-all flex items-center justify-center min-w-[100px]"
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
        <div className="flex-1 relative hidden md:flex items-center justify-center bg-black/20 overflow-hidden">
          <div className="absolute inset-0 z-0">
            <EarthObject />
          </div>

          <div className="relative z-10 text-center p-12 pointer-events-none">
            <h2 className="text-5xl font-bold text-white mb-4 opacity-80">
              Global Talent
            </h2>

            <p className="text-white/40 text-lg max-w-xs mx-auto">
              Connecting the world's best engineers with visionary companies.
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
