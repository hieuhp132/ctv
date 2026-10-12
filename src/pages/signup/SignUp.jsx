import ParticleBackground from "../../components/ParticleBackground";
import EarthObject from "../../components/EarthObject";
import { useState } from "react";
import { Eye, EyeOff, TrendingUp, UserPlus, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { lregister } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import "../login/AuthPages.css";

const SignUp = ({ recruiterType = "freelancer" }) => {
  const isFulltimeRecruiter = recruiterType === "fulltime";
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [serverMessage, setServerMessage] = useState("");
  const navigate = useNavigate();
  const { login } = useAuth();

  const triggerShake = () => {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 500);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerMessage("");
    setError("");

    if (!name.trim()) {
      setError("Please enter your full name.");
      triggerShake();
      return;
    }
    if (isFulltimeRecruiter && !company.trim()) {
      setError("Please enter your company name.");
      triggerShake();
      return;
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address.");
      triggerShake();
      return;
    }
    if (!password || password.length < 6) {
      setError("Your password must be at least 6 characters long.");
      triggerShake();
      return;
    }
    if (password !== confirmPassword) {
      setError("Your passwords do not match.");
      triggerShake();
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await lregister({
        name: name.trim(),
        email: email.trim(),
        password,
        company: company.trim(),
        promoCode: promoCode || null,
        recruiterType,
      });
      localStorage.setItem("pendingEmail", email.trim());
      login(response.user);
      navigate("/pending");
      e.target.reset();
    } catch (err) {
      setError(err.message || "Unable to create your account.");
      triggerShake();
    }
    setIsSubmitting(false);
  };

  const onBackToLogin = () => {
    navigate(isFulltimeRecruiter ? "/employee/login" : "/recruiter/login");
  }

  return (
    <div className={`auth-page ${isFulltimeRecruiter ? "auth-page--fulltime" : "auth-page--freelancer"}`}>
      <ParticleBackground />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1, x: isShaking ? [-10, 10, -10, 10, 0] : 0 }}
        transition={{ x: { duration: 0.4 } }}
        className="auth-card"
      >
        <button
          onClick={() => navigate(isFulltimeRecruiter ? "/company" : "/freelancer")}
          className="auth-home-link"
        >
          <ArrowLeft size={16} /> Home
        </button>

        {/* Left Side - Form */}
        <div className="auth-content">
          <div className="auth-form-column">
            <div className="auth-heading">

              <h1>
                {isFulltimeRecruiter ? "Create an Employee Account" : "Create Account"}
              </h1>

              <p>
                {isFulltimeRecruiter
                  ? "Create a workspace for your in-house hiring team."
                  : "Join AntTech ATS and start managing talent globally"}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="auth-form">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-500/20 border border-red-500/50 text-red-200 text-xs p-3 rounded-xl text-center"
                >
                  {error}
                </motion.div>
              )}

              {/* Name */}
              <div className="space-y-1.5">
                <label>
                  Full name
                </label>

                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="auth-input"
                  placeholder="Alex Morgan"
                />
              </div>

              {isFulltimeRecruiter && (
                <div className="space-y-1.5">
                  <label>
                    Company name
                  </label>
                  <input
                    type="text"
                    required
                    value={company}
                    onChange={(event) => setCompany(event.target.value)}
                    className="auth-input"
                    placeholder="Your company"
                  />
                </div>
              )}

              {/* Email */}
              <div className="space-y-1.5">
                <label>
                  Email address
                </label>

                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="auth-input"
                  placeholder="name@company.com"
                />
              </div>

              {/* Passwords */}
              <div className="auth-password-grid">
                <div className="space-y-1.5">
                  <label>
                    Password
                  </label>

                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
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

                <div className="space-y-1.5">
                  <label>
                    Confirm password
                  </label>

                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) =>
                      setConfirmPassword(e.target.value)
                    }
                    className="auth-input"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {/* Freelancer referral code */}
              {!isFulltimeRecruiter && <div className="space-y-1.5 mt-2">
                <label>
                  Referral code (optional)
                </label>

                <input
                  type="text"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  className="auth-input"
                  placeholder="Enter referral code"
                />
              </div>}

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="auth-submit"
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  isFulltimeRecruiter ? "CREATE EMPLOYEE ACCOUNT" : "CREATE FREELANCE RECRUITER ACCOUNT"
                )}
              </button>
            </form>

            <div className="auth-switcher">
              <p>
                Already have an account?{" "}
                <button
                  onClick={onBackToLogin}
                  className="auth-inline-link"
                >
                  Log in
                </button>
              </p>
              <p>
                {isFulltimeRecruiter ? "Are you a freelance recruiter? " : "Are you an employee? "}
                <button
                  onClick={() => navigate(isFulltimeRecruiter ? "/recruiter/signup" : "/employee/signup")}
                  className="auth-inline-link"
                  type="button"
                >
                  {isFulltimeRecruiter ? "Join as a Freelance Recruiter" : "Join as an Employee"}
                </button>
              </p>
            </div>
          </div>
        </div>

        {/* Right Side */}
        <div className="auth-visual">
          <div className="absolute inset-0 z-0">
            <EarthObject />
          </div>

          <div className="auth-visual-copy">
            <h2>
              {isFulltimeRecruiter ? "Your Hiring Workspace" : "Join the Network"}
            </h2>

            <p>
              {isFulltimeRecruiter
                ? "Manage your pipeline, track candidates, and work with your hiring team."
                : "Access a global pool of elite talent and streamline your hiring process."}
            </p>
          </div>

          <div className="absolute w-[400px] h-[400px] border border-white/5 rounded-full animate-pulse" />
          <div className="absolute w-[500px] h-[500px] border border-white/5 rounded-full animate-ping [animation-duration:3s]" />
        </div>
      </motion.div>
    </div>
  );
};

export default SignUp;