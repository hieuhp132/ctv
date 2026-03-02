import React, { useEffect, useState } from "react";
import {
  getUsersListL,
  removeUserByIdL,
  resetPasswordL,
  updateUserStatusL,
} from "../../../services/api.js";
import "./UserList.css";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export function UserList() {
  const [userList, setUserList] = useState([]);
  const [passwordInputs, setPasswordInputs] = useState({});
  const [searchText, setSearchText] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(12);
  const [selectedUser, setSelectedUser] = useState(null);

  /* ================= FETCH USERS ================= */
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

  /* ================= ACTION HANDLERS ================= */
  const handleStatusUpdate = async (userId, newStatus) => {
    try {
      await updateUserStatusL({ userId, newStatus });
      setUserList((prev) =>
        prev.map((u) =>
          u._id === userId ? { ...u, status: newStatus } : u
        )
      );
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

  /* ================= EXPORT TO EXCEL ================= */
  const handleExportExcel = () => {
    if (!userList.length) {
      alert("No data to export");
      return;
    }

    const exportData = userList.map((u) => ({
      "Name": u.name || "",
      "Email": u.email || "",
      "Role": u.role || "",
      "Status": u.status || "",
      "Bank Account Holder": u.bankInfo?.accountHolderName || "",
      "Bank Name": u.bankInfo?.bankName || "",
      "Branch Name": u.bankInfo?.branchName || "",
      "Account Number": u.bankInfo?.accountNumber || "",
      "IBAN / SWIFT": u.bankInfo?.ibanSwiftCode || "",
      "Currency": u.bankInfo?.currency || "",
      "Registered Email": u.bankInfo?.registeredEmail || "",
      "Registered Phone": u.bankInfo?.registeredPhone || "",
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Users");

    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    saveAs(blob, `user-management-${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  /* ================= RENDER ================= */
  return (
    <div className="management-container">
      <div style={{display:"flex", justifyContent:"space-between"}}> 
        <h2 className="table-title">User Management</h2>

        <button
          onClick={handleExportExcel}
          style={{
            padding: "6px 12px",
            fontWeight: 600,
            cursor: "pointer",
            marginBottom: "1rem"
          }}
        >
          Export Excel
        </button>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
        }}
      >
       
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
              <th>Bank Info</th>
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
                  <span className={`status-badge ${getStatusClass(u.status)}`}>
                    {u.status || "Unknown"}
                  </span>
                </td>
                <td>
                  <div
                    onClick={() => setSelectedUser(u)}
                    style={{ cursor: "pointer", color: "#1d4ed8", textDecoration: "underline" }}
                  >
                    View
                  </div>
                </td>
                <td>
                  <div className="password-box">
                    <input
                      type="password"
                      placeholder="New pass"
                      value={passwordInputs[u._id] || ""}
                      onChange={(e) => handlePasswordChange(u._id, e.target.value)}
                    />
                    <button
                      className="btn-save"
                      onClick={() => handleEdit(u, passwordInputs[u._id])}
                    >
                      Save
                    </button>
                  </div>
                </td>
                <td className="action-buttons">
                  <button onClick={() => handleStatusUpdate(u._id, "Active")}>Approve</button>
                  <button onClick={() => handleStatusUpdate(u._id, "Rejected")}>Reject</button>
                  <hr />
                  <button className="delete-item" onClick={() => handleDelete(u._id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {selectedUser && (
          <div className="bank-info-overlay" onClick={() => setSelectedUser(null)}>
            <div className="bank-info-modal" onClick={(e) => e.stopPropagation()}>
              <h3>Bank Information</h3>
              {selectedUser.bankInfo ? (
                <div className="bank-info-list">
                  <p><strong>Account Holder:</strong> {selectedUser.bankInfo.accountHolderName}</p>
                  <p><strong>Bank Name:</strong> {selectedUser.bankInfo.bankName}</p>
                  <p><strong>Branch:</strong> {selectedUser.bankInfo.branchName}</p>
                  <p><strong>Account Number:</strong> {selectedUser.bankInfo.accountNumber}</p>
                  <p><strong>IBAN / Swift:</strong> {selectedUser.bankInfo.ibanSwiftCode}</p>
                  <p><strong>Currency:</strong> {selectedUser.bankInfo.currency}</p>
                  <p><strong>Registered Email:</strong> {selectedUser.bankInfo.registeredEmail}</p>
                  <p><strong>Registered Phone:</strong> {selectedUser.bankInfo.registeredPhone}</p>
                </div>
              ) : (
                <p>No bank information</p>
              )}
              <button className="btn-close" onClick={() => setSelectedUser(null)}>Close</button>
            </div>
          </div>
        )}

        {userList.length === 0 && <p className="empty-msg">No users found.</p>}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
        <div>
          <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage <= 1} style={{ padding: "6px 10px", marginRight: 8 }}>Previous</button>
          <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages} style={{ padding: "6px 10px" }}>Next</button>
        </div>
        <div style={{ fontSize: 13, color: "#555" }}>Page {currentPage} / {totalPages}</div>
      </div>
    </div>
  );
}


export default function UsersManagement() {
    return (
        <div className="dashboard-container">
            <UserList />
        </div>
    );
}
