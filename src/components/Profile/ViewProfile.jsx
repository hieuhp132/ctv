import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { getBalances, updateBasicInfoOnServer, fetchProfileFromServer} from "../../api";
import { FaEdit, FaSave, FaTimes, FaCreditCard, FaUser, FaEye, FaEyeSlash} from "react-icons/fa";
import "./ViewProfile.css";
import Icons from "../Icons";

export default function ViewProfile() {
  const { user, setUser } = useAuth();
  const balances = getBalances();
  const ctvId = user?.email || user?.id || "recruiter";
  const bonus = user?.role === "recruiter" ? (balances.ctvBonusById?.[ctvId] || 0) : undefined;

  const [isEditing, setIsEditing] = useState(false);
  const [bankInfo, setBankInfo] = useState({
    accountHolderName: "",
    bankName: "",
    branchName: "",
    accountNumber: "",
    ibanSwiftCode: "",
    currency: "VNĐ",
    registeredEmail: "",
    registeredPhone: ""
  });
  const [basicInfo, setBasicInfo] = useState({
    name: user?.name || "",
    email: user?.email || "",
    role: user?.role || "",
    password: user?.password || "",
    newPassword: ""
  });

  useEffect(() => {
    // Load saved bank info from localStorage
    const fetchData = async () => {
      const userdata = await fetchProfileFromServer();
      if (userdata) {
        setUser(userdata); // Update user context with fetched data
        setBasicInfo({
          name: userdata.name || "",
          email: userdata.email || "",
          role: userdata.role || "",
          //password: userdata.password || "",
          //newPassword: ""
        });
      }
      //const savedBankInfo = localStorage.getItem(`bankInfo_${ctvId}`);
      //if (savedBankInfo) {
        //setBankInfo(JSON.parse(savedBankInfo));
      //}
    };
    fetchData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setBankInfo(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleBasicInfoChange = (e) => {
    const { name, value } = e.target;
    setBasicInfo((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

 const handleBasicInfoSave = async () => {
  try {
    const response = await updateBasicInfoOnServer(basicInfo);
    if (response.success) {
      alert("Basic information updated successfully on server!");

      // Fetch updated profile
      const updatedProfile = await fetchProfileFromServer();

      if (updatedProfile) {
        setBasicInfo({
          name: updatedProfile.name,
          email: updatedProfile.email,
          role: updatedProfile.role,
          //password: updatedProfile.password
        });

        console.log("Updated profile fetched:", updatedProfile);
        console.log("Updating user context with new profile data.");
        // Update user context
        setUser(updatedProfile);
      } else {
        console.error("Failed to fetch updated profile.");
        alert("Failed to fetch updated profile from server.");
      }
    }
  } catch (error) {
    console.error("Error updating basic information on server:", error);
    alert("An error occurred while updating basic information on server.");
  } finally {
    setIsEditing(false);
  }
};

  const handleCancel = () => {
    // Reload from localStorage
    const savedBankInfo = localStorage.getItem(`bankInfo_${ctvId}`);
    if (savedBankInfo) {
      setBankInfo(JSON.parse(savedBankInfo));
    }
    setIsEditing(false);
  };

  if (!user) return null;

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h2>Profile Information</h2>
        <div className="profile-actions">
          {!isEditing ? (
            <button 
              onClick={() => setIsEditing(true)} 
              className="btn-edit"
              title="Edit bank information"
            >
              <FaEdit /> Edit Profile
            </button>
          ) : (
            <div className="edit-actions">
              <button onClick={handleBasicInfoSave} className="btn-save">
                <FaSave /> Save
              </button>
              <button onClick={handleCancel} className="btn-cancel">
                <FaTimes /> Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="profile-content">
        {/* Basic Information */}
        <div className="info-section">
          <h3><FaUser className="section-icon" /> Basic Information</h3>
          {isEditing ? (
            <div className="info-grid">
              <div className="info-item">
                <label htmlFor="name">Name:</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={basicInfo.name}
                  onChange={handleBasicInfoChange}
                />
              </div>
              <div className="info-item">
                <label htmlFor="email">Email:</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={basicInfo.email}
                  onChange={handleBasicInfoChange}
                />
              </div>
              <div className="info-item">
                <label htmlFor="role">Role:</label>
                <input
                  type="text"
                  id="role"
                  name="role"
                  value={basicInfo.role}
                  onChange={handleBasicInfoChange}
                  disabled
                />
              </div>
              <div className="info-item">
                <label htmlFor="password">Give new password:</label>
                <input
                  type="password"
                  id="newPassword"
                  name="newPassword"
                  value={basicInfo.newPassword || ""}
                  onChange={handleBasicInfoChange}
                  placeholder="Enter new password"
                />
              </div>
            </div>
          ) : (
            <div className="info-grid">
              <div className="info-item">
                <label>Name:</label>
                <span>{basicInfo.name || "-"}</span>
              </div>
              <div className="info-item">
                <label>Email:</label>
                <span>{basicInfo.email || "-"}</span>
              </div>
              <div className="info-item">
                <label>Role:</label>
                <span className={`role-badge ${basicInfo.role}`}>{basicInfo.role}</span>
              </div>
              <div className="info-item">
                <label>Password:</label>
                <span>{user.password || "---------"}</span>
              </div>            
            </div>
              
          )}
        </div>

        {/* Bank Account Information */}
        {user.role === "recruiter" && (
          <div className="info-section">
            <h3><FaCreditCard className="section-icon" /> Bank Account Information (for Commission Payment)</h3>
            
            {isEditing ? (
              <div className="bank-form">
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="accountHolderName">Account Holder Name *</label>
                    <input
                      type="text"
                      id="accountHolderName"
                      name="accountHolderName"
                      value={bankInfo.accountHolderName}
                      onChange={handleInputChange}
                      placeholder="Must match ID/Passport name"
                      required
                    />
                    <small>Must match CMND/CCCD/Passport name</small>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="bankName">Bank Name *</label>
                    <input
                      type="text"
                      id="bankName"
                      name="bankName"
                      value={bankInfo.bankName}
                      onChange={handleInputChange}
                      placeholder="e.g., Vietcombank, Techcombank"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="branchName">Branch Name / Branch Code</label>
                    <input
                      type="text"
                      id="branchName"
                      name="branchName"
                      value={bankInfo.branchName}
                      onChange={handleInputChange}
                      placeholder="Branch where account was opened"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="accountNumber">Account Number *</label>
                    <input
                      type="text"
                      id="accountNumber"
                      name="accountNumber"
                      value={bankInfo.accountNumber}
                      onChange={handleInputChange}
                      placeholder="Bank account number"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="ibanSwiftCode">IBAN / SWIFT Code</label>
                    <input
                      type="text"
                      id="ibanSwiftCode"
                      name="ibanSwiftCode"
                      value={bankInfo.ibanSwiftCode}
                      onChange={handleInputChange}
                      placeholder="Required for international payments"
                    />
                    <small>Required if international payment</small>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="currency">Currency *</label>
                    <select
                      id="currency"
                      name="currency"
                      value={bankInfo.currency}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="VNĐ">VNĐ (Vietnamese Dong)</option>
                      <option value="USD">USD (US Dollar)</option>
                      <option value="EUR">EUR (Euro)</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="registeredEmail">Registered Email *</label>
                    <input
                      type="email"
                      id="registeredEmail"
                      name="registeredEmail"
                      value={bankInfo.registeredEmail}
                      onChange={handleInputChange}
                      placeholder="Contact email for payment issues"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="registeredPhone">Registered Phone *</label>
                    <input
                      type="tel"
                      id="registeredPhone"
                      name="registeredPhone"
                      value={bankInfo.registeredPhone}
                      onChange={handleInputChange}
                      placeholder="Contact phone for payment issues"
                      required
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="bank-info-display">
                <div className="info-grid">
                  <div className="info-item">
                    <label>Account Holder Name:</label>
                    <span>{bankInfo.accountHolderName || "Not provided"}</span>
                  </div>
                  <div className="info-item">
                    <label>Bank Name:</label>
                    <span>{bankInfo.bankName || "Not provided"}</span>
                  </div>
                  <div className="info-item">
                    <label>Branch Name:</label>
                    <span>{bankInfo.branchName || "Not provided"}</span>
                  </div>
                  <div className="info-item">
                    <label>Account Number:</label>
                    <span className="account-number">{bankInfo.accountNumber || "Not provided"}</span>
                  </div>
                  <div className="info-item">
                    <label>IBAN / SWIFT Code:</label>
                    <span>{bankInfo.ibanSwiftCode || "Not provided"}</span>
                  </div>
                  <div className="info-item">
                    <label>Currency:</label>
                    <span className="currency-badge">{bankInfo.currency}</span>
                  </div>
                  <div className="info-item">
                    <label>Contact Email:</label>
                    <span>{bankInfo.registeredEmail || "Not provided"}</span>
                  </div>
                  <div className="info-item">
                    <label>Contact Phone:</label>
                    <span>{bankInfo.registeredPhone || "Not provided"}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Commitment Statement */}
            <div className="commitment-section">
              <div className="commitment-box">
                <h4>📋 Commitment Statement</h4>
                <p>
                  "The Collaborator confirms that the above banking information is accurate and will immediately inform Ant-Tech Asia in case of any change."
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
      <Icons />
    </div>
  );
}
