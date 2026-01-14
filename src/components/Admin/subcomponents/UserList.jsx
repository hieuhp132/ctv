import React, { useEffect, useState } from "react";
// Giả định bạn đã thêm updateUserStatusL vào file api.js
import { getUsersListL, removeUserByIdL, resetPasswordL, updateUserStatusL } from "../../../api"; 
import "./UserList.css";

export default function UserList() {
  const [userList, setUserList] = useState([]);
  const [passwordInputs, setPasswordInputs] = useState({});

  const fetchUserList = async () => {
    try {
      const res = await getUsersListL();
      setUserList(Array.isArray(res) ? res : []);
    } catch {
      setUserList([]);
    }
  };

  useEffect(() => {
    fetchUserList();
  }, []);

  // --- HÀM XỬ LÝ DUYỆT / TỪ CHỐI ---
  const handleStatusUpdate = async (userId, newStatus) => {
    try {
      await updateUserStatusL({ userId, newStatus });
      alert(`User status updated to ${newStatus}`);
      
      // Cập nhật lại UI tại chỗ
      setUserList(prev => prev.map(u => 
        u._id === userId ? { ...u, status: newStatus } : u
      ));
    } catch (err) {
      alert("Failed to update status");
    }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      await removeUserByIdL({ id: userId });
      setUserList(prev => prev.filter(u => u._id !== userId));
      alert("User deleted successfully");
    } catch {
      alert("Failed to delete user");
    }
  };

  const handleEdit = async (user, newPassword) => {
    if (!newPassword || newPassword.trim().length < 6) {
      alert("Password must be at least 6 characters");
      return;
    }
    try {
      await resetPasswordL({ email: user.email, newPassword });
      alert(`Password for ${user.email} reset successfully`);
      setPasswordInputs(prev => ({ ...prev, [user._id]: "" }));
    } catch (err) {
      alert("Reset failed");
    }
  };

  const handlePasswordChange = (userId, value) => {
    setPasswordInputs(prev => ({ ...prev, [userId]: value }));
  };

  // Hàm trả về màu sắc cho nhãn trạng thái
  const getStatusClass = (status) => {
    switch (status) {
      case "Active": return "status-active";
      case "Pending": return "status-pending";
      case "Rejected": return "status-rejected";
      default: return "";
    }
  };

  return (
    <>
      <h2 style={{ marginTop: 50 }}>Users Management:</h2>

      <div className="user-list">
        {userList.map(u => (
          <div key={u._id} className="user-card">
            <div><strong>Name:</strong> {u.name || "-"}</div>
            <div><strong>Email:</strong> {u.email || "-"}</div>
            <div><strong>Role:</strong> {u.role || "-"}</div>
            
            {/* HIỂN THỊ TRẠNG THÁI */}
            <div>
              
              {u.status && (
                <>
                  <strong>Status: </strong>
                  <span className={`status-badge ${getStatusClass(u.status)}`}>
                    {u.status}
                  </span>
                </>
              )}
            </div>

            <div>
              <strong>New Password:</strong>
              <input
                type="password"
                placeholder="Enter new password"
                value={passwordInputs[u._id] || ""}
                onChange={(e) => handlePasswordChange(u._id, e.target.value)}
                className="password-input"
              />
            </div>

            <div className="user-actions">
              {/* NÚT DUYỆT (Chỉ hiện nếu chưa Active) */}
                <button className="approve-btn" onClick={() => handleStatusUpdate(u._id, "Active")}>
                  Approve
                </button>
              
                <button className="reject-btn" onClick={() => handleStatusUpdate(u._id, "Rejected")}>
                  Reject
                </button>

              <button onClick={() => handleEdit(u, passwordInputs[u._id])}>
                Reset Pass
              </button>
              
              <button onClick={() => handleDelete(u._id)} className="danger">
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}