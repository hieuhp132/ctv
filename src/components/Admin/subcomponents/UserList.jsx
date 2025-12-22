import { useEffect, useState } from "react";
import { getUsersListL, resetPassword, removeUserById } from "../../../api";
import "./UserList.css";

export default function UserList() {
  const [userList, setUserList] = useState([]);
  const [passwordInputs, setPasswordInputs] = useState({}); // Lưu mật khẩu nhập cho từng user

  useEffect(() => {
    const fetchUserList = async () => {
      try {
        const res = await getUsersListL();
        console.log(res);
        setUserList(Array.isArray(res) ? res : []);
      } catch (error) {
        setUserList([]);
      }
    };

    fetchUserList();
  }, []);

  const handleDelete = async (userId) => {
    if (!window.confirm("Areee you sure you want to delete this user?")) return;

    try {
      await removeUserById({ id: userId });
      setUserList((prev) => prev.filter((user) => user.id !== userId));
      alert("User deleted successfully");
    } catch (err) {
      console.error("Delete error:", err);
      alert("Failed to delete user");
    }
    
  };

  const handleEdit = async (user) => {
    const newPassword = passwordInputs[user.id];
    if (!newPassword || newPassword.trim().length < 6) {
      alert("Please enter a valid new password (min 6 characters)");
      return;
    }

    try {
      await resetPassword({ email: user.email, password: newPassword });
      alert(`Password for ${user.email} reset successfully`);
      setPasswordInputs((prev) => ({ ...prev, [user.id]: "" })); // clear input
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  const handlePasswordChange = (userId, value) => {
    setPasswordInputs((prev) => ({ ...prev, [userId]: value }));
  };

  return (
    <>
      <h2 style={{ marginTop: 50 }}>Users List:</h2>
      <div className="user-list">
        {userList.map((u, index) => (
          <div key={u.id || index} className="user-card">
            <div><strong>Name:</strong> {u.name || "-"}</div>
            <div><strong>Email:</strong> {u.email || "-"}</div>
            <div><strong>Role:</strong> {u.role || "-"}</div>

            <div>
              <strong>New Password:</strong>
              <input
                type="password"
                placeholder="Enter new password"
                value={passwordInputs[u.id] || ""}
                onChange={(e) => handlePasswordChange(u.id, e.target.value)}
                className="password-input"
              />
            </div>

            <div className="user-actions">
              <button onClick={() => handleEdit(u)}>Reset Password</button>
              <button onClick={() => handleDelete(u.id)} className="danger">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
