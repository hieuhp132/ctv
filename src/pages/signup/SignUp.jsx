import ParticleBackground from "../../components/ParticleBackground";
import EarthObject from "../../components/EarthObject";
import { useState } from "react";
import { Eye, EyeOff, TrendingUp, UserPlus, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { lregister } from "../../services/api";

const SignUp = ({ onSignup }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [serverMessage, setServerMessage] = useState("");
  const navigate = useNavigate();

  const triggerShake = () => {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 500);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerMessage("");
    setError("");

    if (!name.trim()) {
      setError("Please enter your name");
      triggerShake();
      return;
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email");
      triggerShake();
      return;
    }
    if (!password || password.length < 6) {
      setError("Password must be at least 6 characters");
      triggerShake();
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      triggerShake();
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await lregister({
        name: name.trim(),
        email: email.trim(),
        password,
        promoCode: promoCode || null,
      });
      console.log(response);
      localStorage.setItem("pendingEmail", email.trim());
      navigate("/pending");
      e.target.reset();
    } catch (err) {
      setError(err.message || "Signup failed");
      triggerShake();
    }
    setIsSubmitting(false);
  };

  const onBackToLogin = () => {
    navigate("/login");
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 font-sans relative overflow-hidden">
      <ParticleBackground />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1, x: isShaking ? [-10, 10, -10, 10, 0] : 0 }}
        transition={{ x: { duration: 0.4 } }}
        className="w-full max-w-[1000px] relative z-10 flex flex-col md:flex-row backdrop-blur-xl bg-white/10 border border-white/20 rounded-[40px] shadow-2xl overflow-hidden min-h-[600px]"
      >
        <button
          onClick={() => navigate("/")}
          className="absolute top-6 left-6 z-50 text-white/50 hover:text-white transition-colors flex items-center gap-2 text-sm font-medium"
        >
          <ArrowLeft size={16} /> Home
        </button>

        {/* Left Side - Form */}
        <div className="flex-1 p-8 md:p-12 lg:p-16 flex flex-col justify-center border-r border-white/10">
          <div className="max-w-md w-full mx-auto">
            <div className="mb-10">

              <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">
                Create Account
              </h1>

              <p className="text-white/60 text-sm">
                Join AntTech ATS and start managing talent globally
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
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
                <label className="text-[10px] uppercase font-bold text-white/40 tracking-wider ml-1">
                  Full Name
                </label>

                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm text-white outline-none"
                  placeholder="John Doe"
                />
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-white/40 tracking-wider ml-1">
                  Email address
                </label>

                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm text-white outline-none"
                  placeholder="name@company.com"
                />
              </div>

              {/* Passwords */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-white/40 tracking-wider ml-1">
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

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-white/40 tracking-wider ml-1">
                    Confirm Password
                  </label>

                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) =>
                      setConfirmPassword(e.target.value)
                    }
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm text-white outline-none"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {/* Promocode */}
              <div className="space-y-1.5 mt-2">
                <label className="text-[10px] uppercase font-bold text-white/40 tracking-wider ml-1">
                  Promo Code (Optional)
                </label>

                <input
                  type="text"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm text-white outline-none"
                  placeholder="Enter referral code"
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 rounded-2xl text-white font-bold text-sm uppercase tracking-widest shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98] mt-4 bg-gradient-to-r from-[#FF465E] to-[#FFA63D] flex justify-center items-center"
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  "CREATE ACCOUNT"
                )}
              </button>
            </form>

            <div className="mt-8 pt-8 border-t border-white/10 text-center">
              <p className="text-white/40 text-xs">
                Already have an account?{" "}
                <button
                  onClick={onBackToLogin}
                  className="text-white font-medium hover:underline"
                >
                  Log in
                </button>
              </p>
            </div>
          </div>
        </div>

        {/* Right Side */}
        <div className="flex-1 relative hidden md:flex items-center justify-center bg-black/20 overflow-hidden">
          <div className="absolute inset-0 z-0">
            <EarthObject />
          </div>

          <div className="relative z-10 text-center p-12 pointer-events-none">
            <h2 className="text-5xl font-bold text-white mb-4 opacity-80">
              Join the Network
            </h2>

            <p className="text-white/40 text-lg max-w-xs mx-auto">
              Access a global pool of elite talent and streamline your hiring process.
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