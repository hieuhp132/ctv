import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  updateBasicInfoOnServer,
  fetchProfileFromServerL,
} from "../../api";
import {
  FaEdit,
  FaSave,
  FaTimes,
  FaCreditCard,
  FaUser,
} from "react-icons/fa";
import "./ViewProfile.css";
import Icons from "../Icons";

export default function ViewProfile() {
  const { user, setUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);

  const [basicInfo, setBasicInfo] = useState({
    name: "",
    email: "",
    role: "",
    newPassword: "",
  });

  const [bankInfo, setBankInfo] = useState({
    accountHolderName: "",
    bankName: "",
    branchName: "",
    accountNumber: "",
    ibanSwiftCode: "",
    currency: "VNĐ",
    registeredEmail: "",
    registeredPhone: "",
  });

  /* ===== LOAD PROFILE ===== */
  useEffect(() => {
    if (!user?._id) return;

    const loadProfile = async () => {
      const data = await fetchProfileFromServerL(user._id);
      if (data) {
        setUser(data);
        setBasicInfo({
          name: data.name || "",
          email: data.email || "",
          role: data.role || "",
          newPassword: "",
        });

        if (data.bankInfo) {
          setBankInfo((prev) => ({ ...prev, ...data.bankInfo }));
        }
      }
    };

    loadProfile();
  }, [user?._id]);

  const handleBasicChange = (e) => {
    const { name, value } = e.target;
    setBasicInfo((p) => ({ ...p, [name]: value }));
  };

  const handleBankChange = (e) => {
    const { name, value } = e.target;
    setBankInfo((p) => ({ ...p, [name]: value }));
  };

  const handleSave = async () => {
    try {
      const res = await updateBasicInfoOnServer(basicInfo);
      if (res?.success) {
        const updated = await fetchProfileFromServerL(user._id);
        setUser(updated);
        setIsEditing(false);
      }
    } catch {
      alert("Update failed");
    }
  };

  if (!user) return null;

  return (
    <div className="profile-page">
      {/* HEADER */}
      <div className="profile-header">
        <div>
          <h2>My Profile</h2>
          <p className="subtitle">
            Manage your personal & payment information
          </p>
        </div>

        {!isEditing ? (
          <button className="btn primary" onClick={() => setIsEditing(true)}>
            <FaEdit /> Edit
          </button>
        ) : (
          <div className="action-group">
            <button className="btn success" onClick={handleSave}>
              <FaSave /> Save
            </button>
            <button
              className="btn danger"
              onClick={() => setIsEditing(false)}
            >
              <FaTimes /> Cancel
            </button>
          </div>
        )}
      </div>

      {/* BASIC INFO */}
      <section className="card">
        <h3>
          <FaUser /> Basic Information
        </h3>

        <div className="grid">
          <div className="grid-item">
            <label>Name</label>
            {isEditing ? (
              <input
                name="name"
                value={basicInfo.name}
                onChange={handleBasicChange}
              />
            ) : (
              <span>{basicInfo.name || "-"}</span>
            )}
          </div>

          <div className="grid-item">
            <label>Email</label>
            {isEditing ? (
              <input
                name="email"
                value={basicInfo.email}
                onChange={handleBasicChange}
              />
            ) : (
              <span>{basicInfo.email || "-"}</span>
            )}
          </div>

          <div className="grid-item">
            <label>Role</label>
            <span className={`badge ${basicInfo.role}`}>
              {basicInfo.role}
            </span>
          </div>

          {isEditing && (
            <div className="grid-item">
              <label>New Password</label>
              <input
                type="password"
                name="newPassword"
                value={basicInfo.newPassword}
                onChange={handleBasicChange}
                placeholder="Leave empty to keep current"
              />
            </div>
          )}
        </div>
      </section>

      {/* BANK INFO */}
      {user.role === "recruiter" && (
        <section className="card">
          <h3>
            <FaCreditCard /> Bank Information
          </h3>

          <div className="grid">
            {Object.entries(bankInfo).map(([key, value]) => (
              <div className="grid-item" key={key}>
                <label>{key.replace(/([A-Z])/g, " $1")}</label>
                {isEditing ? (
                  <input
                    name={key}
                    value={value}
                    onChange={handleBankChange}
                  />
                ) : (
                  <span>{value || "—"}</span>
                )}
              </div>
            ))}
          </div>

          <div className="note">
            By saving, you confirm the information is accurate and valid.
          </div>
        </section>
      )}

      <Icons />
    </div>
  );
}
