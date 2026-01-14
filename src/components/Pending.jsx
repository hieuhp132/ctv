// Pending.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Clock, ShieldCheck, ArrowLeft, XCircle } from "lucide-react";
import { getUserStatusL } from "../api"; // Hàm gọi API backend
import { useAuth } from "../context/AuthContext";
import "./Pending.css";

export default function Pending() {
  const navigate = useNavigate();
  const { user, login, logout } = useAuth(); // Thêm logout từ AuthContext
  const [status, setStatus] = useState(user?.status || "Pending");

  useEffect(() => {
    if (!user?.email) return;

    const checkStatus = async () => {
      try {
        const res = await getUserStatusL(user.email);
        const { status: freshStatus, user: freshUser, token } = res;
        
        // Nếu tài khoản Active → login + redirect
        if (freshStatus === "Active" && token && freshUser) {
          login(freshUser, token);
          return;
        }

        // Nếu bị từ chối
        if (freshStatus === "Rejected") {
          setStatus("Rejected");
        }
      } catch (err) {
        console.error("Check status failed", err);
      }
    };

    // Poll API mỗi 5 giây
    const interval = setInterval(checkStatus, 5000);
    // Call ngay lần đầu để không phải chờ 5s
    checkStatus();

    return () => clearInterval(interval);
  }, [user?.email, login]);

  // Hàm reset toàn bộ dữ liệu và quay lại login
  const handleResetAndLogin = () => {
    // 1️⃣ Xoá sessionStorage + localStorage
    sessionStorage.clear();
    localStorage.clear();

    // 2️⃣ Reset state AuthContext
    if (logout) logout();

    // 3️⃣ Redirect về login
    navigate("/login");
  };

  // Nếu status Rejected → hiển thị cảnh báo
  if (status === "Rejected") {
    return (
      <div className="pending-container">
        <div className="pending-card rejected">
          <div className="icon-wrapper">
            <XCircle color="#ef4444" size={60} />
          </div>
          <h1 className="title" style={{ color: "#ef4444" }}>Truy cập bị từ chối</h1>
          <p className="description">
            Rất tiếc, yêu cầu đăng ký của bạn đã bị Admin từ chối. 
            Vui lòng liên hệ hỗ trợ để biết thêm chi tiết.
          </p>
          <button className="back-button" onClick={handleResetAndLogin}>
            <ArrowLeft size={18} /> Quay lại Đăng nhập
          </button>
        </div>
      </div>
    );
  }

  // Nếu đang Pending → hiển thị chờ phê duyệt
  return (
    <div className="pending-container">
      <div className="pending-card">
        <div className="icon-wrapper">
          <div className="pulse-ring"></div>
          <Clock className="main-icon" size={48} />
        </div>
        <h1 className="title">Đang chờ phê duyệt</h1>
        <p className="description">
          Tài khoản <strong>{user?.email}</strong> đang được kiểm tra. 
          Hệ thống sẽ tự động chuyển hướng khi hoàn tất.
        </p>
        <div className="status-steps">
          <div className="step completed">
            <ShieldCheck size={20} />
            <span>Đăng ký thành công</span>
          </div>
          <div className="step processing">
            <div className="spinner-small"></div>
            <span>Admin đang xác minh...</span>
          </div>
        </div>
        <button className="back-button" onClick={handleResetAndLogin}>
          <ArrowLeft size={18} /> Quay lại Đăng nhập
        </button>
      </div>
    </div>
  );
}
