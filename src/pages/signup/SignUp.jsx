import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FaUser, FaLock, FaEnvelope, FaEye, FaEyeSlash } from "react-icons/fa";
import { API_BASE, lregister } from "../../services/api";
//import {lregister} from "../../supabaseClient";

export default function SignUp() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [promodeCode, setPromodeCode] = useState("");
  const [errors, setErrors] = useState({});
  const [isShaking, setIsShaking] = useState(false);
  const [serverMessage, setServerMessage] = useState("");

  const navigate = useNavigate();
  const usernameRef = useRef(null);
  const emailRef = useRef(null);
  const passwordRef = useRef(null);
  const confirmRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerMessage("");

    const username = e.target.username.value.trim();
    const email = e.target.email.value.trim();
    const password = e.target.password.value.trim();
    const confirmPassword = e.target.confirmPassword.value.trim();

    const newErrors = {};
    let hasError = false;

    if (!username) {
      newErrors.username = "Please enter username";
      hasError = true;
    }
    if (!email) {
      newErrors.email = "Please enter email";
      hasError = true;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Invalid email";
      hasError = true;
    }
    if (!password) {
      newErrors.password = "Please enter password";
      hasError = true;
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
      hasError = true;
    }
    if (!confirmPassword) {
      newErrors.confirmPassword = "Please confirm password";
      hasError = true;
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "Password confirmation does not match";
      hasError = true;
    }

    setErrors(newErrors);

    if (hasError) {
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);

      if (newErrors.username) usernameRef.current.focus();
      else if (newErrors.email) emailRef.current.focus();
      else if (newErrors.password) passwordRef.current.focus();
      else if (newErrors.confirmPassword) confirmRef.current.focus();

      return;
    }

    setIsSubmitting(true);

    try {
      const response = await lregister({
        name: username,
        email,
        password,
        promoCode: promodeCode || null,
      });
      console.log(response);
      // setServerMessage("Đăng ký thành công!");
      localStorage.setItem("pendingEmail", email); // Lưu email vào máy người dùng
      navigate("/pending");
      e.target.reset();
    } catch (err) {
      setServerMessage(err.message || "Signup failed");
    }

    setIsSubmitting(false);
  };

  return (
    <div className="container">
      <form
        className={`form ${isShaking ? "shake" : ""}`}
        onSubmit={handleSubmit}
      >
        <p className="title">
          <strong>Create new account</strong>
        </p>

        {/* Username */}
        <div className="input-group">
          <label className="label" htmlFor="username">
            Username
          </label>
          <div className="input-wrapper">
            <FaUser className="icon" />
            <input
              ref={usernameRef}
              id="username"
              name="username"
              type="text"
              placeholder="Enter username"
              className={errors.username ? "error" : ""}
            />
          </div>
        </div>
        {errors.username && <p className="error-message">{errors.username}</p>}

        {/* Email */}
        <div className="input-group">
          <label className="label" htmlFor="email">
            Email
          </label>
          <div className="input-wrapper">
            <FaEnvelope className="icon" />
            <input
              ref={emailRef}
              id="email"
              name="email"
              type="email"
              placeholder="Enter email"
              className={errors.email ? "error" : ""}
            />
          </div>
        </div>
        {errors.email && <p className="error-message">{errors.email}</p>}

        {/* Password */}
        <div className="input-group">
          <label className="label" htmlFor="password">
            Password
          </label>
          <div className="input-wrapper">
            <FaLock className="icon" />
            <input
              ref={passwordRef}
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter password"
              className={errors.password ? "error" : ""}
            />
            <span
              className="toggle-password"
              onClick={() => setShowPassword((s) => !s)}
              aria-hidden
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>
        </div>
        {errors.password && <p className="error-message">{errors.password}</p>}

        {/* Confirm Password */}
        <div className="input-group">
          <label className="label" htmlFor="confirmPassword">
            Confirm password
          </label>
          <div className="input-wrapper">
            <FaLock className="icon" />
            <input
              ref={confirmRef}
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirm ? "text" : "password"}
              placeholder="Re-enter password"
              className={errors.confirmPassword ? "error" : ""}
            />
            <span
              className="toggle-password"
              onClick={() => setShowConfirm((s) => !s)}
              aria-hidden
            >
              {showConfirm ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>
        </div>
        {errors.confirmPassword && (
          <p className="error-message">{errors.confirmPassword}</p>
        )}

        {/* CTV checkbox + submit */}
        <div className="form-options">
          <div className="remember-me">
            <input
              id="promodeCode"
              name="promodeCode"
              type="input"
              value={promodeCode}
              onChange={(e) => setPromodeCode(e.target.value)}
              style={{
                borderRadius: 4,
                border: "2px solid rgba(255, 165, 0, 0.6)",
                width: "30%",
              }}
            />
            <label htmlFor="promodeCode">Promodecode (Optional)</label>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            style={{ width: "50%" }}
          >
            {isSubmitting ? <span className="spinner"></span> : "Sign Up"}
          </button>
        </div>

        {/* Server response message */}
        {serverMessage && (
          <p
            className={`server-message ${serverMessage.includes("thành công") ? "success" : "error"}`}
          >
            {serverMessage}
          </p>
        )}
      </form>
    </div>
  );
}
