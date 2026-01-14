import React, { useEffect, useState } from "react";
import {
  getUsersListL,
  removeUserByIdL,
  resetPasswordL,
  updateUserStatusL,
} from "../../../api";
import "./UserList.css";

export default function UserList() {
  const [userList, setUserList] = useState([]);
  const [passwordInputs, setPasswordInputs] = useState({});
  const [searchText, setSearchText] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(12);


  /* ================= FETCH USERS ================= */
  const fetchUserList = async () => {
    try {
      const res = await getUsersListL();
      console.log("Fetched users:", res);
      setUserList(Array.isArray(res) ? res : []);
    } catch {
      setUserList([]);
    }
  };

  useEffect(() => {
    fetchUserList();
  }, []);

  /* ================= ACTION HANDLERS ================= */
  const handleStatusUpdate = async (userId, newStatus) => {
    try {
      await updateUserStatusL({ userId, newStatus });
      setUserList((prev) =>
        prev.map((u) =>
          u._id === userId ? { ...u, status: newStatus } : u
        )
      );
      setOpenDropdown(null);
    } catch {
      alert("Failed to update status");
    }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      await removeUserByIdL({ id: userId });
      setUserList((prev) => prev.filter((u) => u._id !== userId));
    
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
      setPasswordInputs((prev) => ({ ...prev, [user._id]: "" }));
    } catch {
      alert("Reset failed");
    }
  };

  const handlePasswordChange = (userId, value) => {
    setPasswordInputs((prev) => ({ ...prev, [userId]: value }));
  };

  const getStatusClass = (status) => {
    const s = String(status || "").toLowerCase().trim();
    if (s === "active") return "status-active";
    if (s === "pending") return "status-pending";
    if (s === "rejected") return "status-rejected";
    return "status-unknown";
  };

  /* ================= FILTER & PAGINATION ================= */
  const filtered = userList.filter((u) => {
    const q = String(searchText || "").toLowerCase();
    if (!q) return true;
    return (
      (u.name || "").toLowerCase().includes(q) ||
      (u.email || "").toLowerCase().includes(q) ||
      (u.role || "").toLowerCase().includes(q)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const startIdx = (currentPage - 1) * pageSize;
  const pageItems = filtered.slice(startIdx, startIdx + pageSize);

  /* ================= RENDER ================= */
  return (
    <div className="management-container">
      <h2 className="table-title">User Management</h2>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
        }}
      >
        <input
          type="search"
          placeholder="Search name, email or role..."
          value={searchText}
          onChange={(e) => {
            setSearchText(e.target.value);
            setCurrentPage(1);
          }}
          style={{
            padding: 8,
            borderRadius: 6,
            border: "1px solid #ddd",
            width: 320,
          }}
        />
        <div style={{ fontSize: 14, color: "#666" }}>
          Showing {filtered.length} users
        </div>
      </div>

      <div className="table-responsive">
        <table className="user-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Reset Password</th>
              <th className="text-center">Actions</th>
            </tr>
          </thead>

          <tbody>
            {pageItems.map((u) => (
              <tr key={u._id}>
                <td className="font-bold">{u.name || "-"}</td>
                <td>{u.email}</td>
                <td>
                  <span className={`role-tag ${u.role === "admin" ? "admin" : ""}`}>{u.role}</span>
                </td>
                <td>
                  <span
                    className={`status-badge ${getStatusClass(u.status)}`}
                  >
                    {u.status || "Unknown"}
                  </span>
                </td>

                <td>
                  <div className="password-box">
                    <input
                      type="password"
                      placeholder="New pass"
                      value={passwordInputs[u._id] || ""}
                      onChange={(e) =>
                        handlePasswordChange(u._id, e.target.value)
                      }
                    />
                    <button
                      className="btn-save"
                      onClick={() =>
                        handleEdit(u, passwordInputs[u._id])
                      }
                    >
                      Save
                    </button>
                  </div>
                </td>

                <td className="action-buttons">

                        <button
                          onClick={() =>
                            handleStatusUpdate(u._id, "Active")
                          }
                        >
                          Approve
                        </button>

                        <button
                          onClick={() =>
                            handleStatusUpdate(u._id, "Rejected")
                          }
                        >
                          Reject
                        </button>

                        <hr />

                        <button
                          className="delete-item"
                          onClick={() => handleDelete(u._id)}
                        >
                          Delete
                        </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {userList.length === 0 && (
          <p className="empty-msg">No users found.</p>
        )}
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: 12,
        }}
      >
        <div>
          <button
            onClick={() =>
              setCurrentPage((p) => Math.max(1, p - 1))
            }
            disabled={currentPage <= 1}
            style={{ padding: "6px 10px", marginRight: 8 }}
          >
            Previous
          </button>

          <button
            onClick={() =>
              setCurrentPage((p) =>
                Math.min(totalPages, p + 1)
              )
            }
            disabled={currentPage >= totalPages}
            style={{ padding: "6px 10px" }}
          >
            Next
          </button>
        </div>

        <div style={{ fontSize: 13, color: "#555" }}>
          Page {currentPage} / {totalPages}
        </div>
      </div>
    </div>
  );
}
