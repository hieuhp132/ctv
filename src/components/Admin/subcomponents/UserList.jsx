import React, { useEffect, useState } from "react";
import { getUsersListL, removeUserByIdL, resetPasswordL } from "../../../api";


export default function UserList() {
  const [userList, setUserList] = useState([]);
  const [passwordInputs, setPasswordInputs] = useState({});

  useEffect(() => {
    const fetchUserList = async () => {
      try {
        const res = await getUsersListL();
        setUserList(Array.isArray(res) ? res : []);
      } catch {
        setUserList([]);
      }
    };
    fetchUserList();
  }, []);

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
      await resetPasswordL({
        email: user.email,
        newPassword
      });

      alert(`Password for ${user.email} reset successfully`);

      setPasswordInputs(prev => ({
        ...prev,
        [user._id]: ""
      }));
    } catch (err) {
      alert("Reset failed");
    }
  };

  const handlePasswordChange = (userId, value) => {
    setPasswordInputs(prev => ({
      ...prev,
      [userId]: value
    }));
  };

  return (
    <>
      <h2 style={{ marginTop: 50 }}>Users List:</h2>

      <div className="user-list">
        {userList.map(u => (
          <div key={u._id} className="user-card">
            <div><strong>Name:</strong> {u.name || "-"}</div>
            <div><strong>Email:</strong> {u.email || "-"}</div>
            <div><strong>Role:</strong> {u.role || "-"}</div>

            <div>
              <strong>New Password:</strong>
              <input
                type="password"
                placeholder="Enter new password"
                value={passwordInputs[u._id] || ""}
                onChange={(e) =>
                  handlePasswordChange(u._id, e.target.value)
                }
                className="password-input"
              />
            </div>

            <div className="user-actions">
              <button onClick={() => handleEdit(u, passwordInputs[u._id])}>
                Reset Password
              </button>
              <button
                onClick={() => handleDelete(u._id)}
                className="danger"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
