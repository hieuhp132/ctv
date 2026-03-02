import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../../../context/AuthContext.jsx";
import {
  updateBasicInfoOnServerL,
  fetchProfileFromServerL,
} from "../../../services/api.js";
import {
  FaEdit,
  FaSave,
  FaTimes,
  FaCreditCard,
  FaUser,
} from "react-icons/fa";
import "./Profile.css";
import Icons from "../../../components/Icons.jsx";

export default function ViewProfile() {
  const { user, updateUser } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const loadedRef = useRef(false); // ✅ chặn reload form khi edit

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
    ethAddress: "",
  });

  /* ================= LOAD PROFILE (ONLY ONCE) ================= */
  useEffect(() => {
    if (!user?._id || loadedRef.current) return;

    const loadProfile = async () => {
      const data = await fetchProfileFromServerL(user._id);
      if (!data) return;

      loadedRef.current = true;

      setBasicInfo({
        name: data.name || "",
        email: data.email || "",
        role: data.role || "",
        newPassword: "",
      });

      if (data.bankInfo) {
        setBankInfo((p) => ({ ...p, ...data.bankInfo }));
      }
    };

    loadProfile();
  }, [user?._id]);

  /* ================= HANDLERS ================= */
  const handleBasicChange = (e) => {
    const { name, value } = e.target;
    setBasicInfo((p) => ({ ...p, [name]: value }));
  };

  const handleBankChange = (e) => {
    const { name, value } = e.target;
    setBankInfo((p) => ({ ...p, [name]: value }));
  };

  /* ================= SAVE ================= */
  const handleSave = async () => {
    try {
      const addr = String(bankInfo.ethAddress || "").trim();
      if (addr && !/^0x[a-fA-F0-9]{40}$/.test(addr)) {
        alert("Invalid Ethereum address");
        return;
      }
      const payload = {
        name: basicInfo.name,
        email: basicInfo.email,
        bankInfo: { ...bankInfo },
      };

      if (basicInfo.newPassword) {
        payload.newPassword = basicInfo.newPassword;
      }
      console.log(payload);
      const res = await updateBasicInfoOnServerL(user._id, payload);

      if (res?.success) {
        const updated = await fetchProfileFromServerL(user._id);
        updateUser(updated); // ✅ update context CHỈ KHI SAVE
        setIsEditing(false);
      } else {
        alert("Update failed");
      }
    } catch (err) {
      console.error(err);
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
              onClick={() => {
                setIsEditing(false);
                loadedRef.current = false; // allow reload if needed
              }}
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
      <section className="card">
        <h3>
          <FaCreditCard /> Bank Information
        </h3>

        <div className="grid">
          {Object.entries(bankInfo).filter(([k]) => k !== "ethAddress").map(([key, value]) => (
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

       {/* WALLET */}
       <section className="card">
         <h3>
           <FaCreditCard /> Wallet /  About MetaMask Wallet
         </h3>
 
         <div className="grid">
           <div className="grid-item">
             <label>Ethereum Address</label>
             {isEditing ? (
               <input
                 name="ethAddress"
                 value={bankInfo.ethAddress || ""}
                 onChange={handleBankChange}
                 placeholder="0x..."
               />
 
             ) : (
               <>
               <span>{bankInfo.ethAddress || "—"}</span>
           
         <div className="grid">
           <div className="grid-item" style={{ gridColumn: "1 / -1" }}>
             <div className="note">
               <strong>MetaMask Wallet (Recommended)</strong><br />
               Non-custodial EVM wallet used to receive bounty payouts. This is where any bounties you earn will be paid to you in USDC.
               {/* <br /><br />
               <strong>Setup</strong>
               <ul>
                 <li>Install the extension from <span style={{fontWeight:600}}>metamask.io</span></li>
                 <li>Create a new wallet or import an existing one using your seed phrase</li>
                 <li>Store the seed phrase offline; never share it in chat/email</li>
                 <li>Select the intended EVM network (e.g., Ethereum Mainnet)</li>
                 <li>Copy your public address (starts with 0x…) and paste it in Ethereum Address field</li>
               </ul> */}
               {/* <strong>Security Best Practices</strong>
               <ul>
                 <li>Never disclose your seed phrase or private keys</li>
                 <li>Enable auto-lock and OS login protection</li>
                 <li>Optional: use a hardware wallet (Ledger/Trezor) via MetaMask</li>
                 <li>Run a small test USDC transfer before large payouts</li>
               </ul>
               <strong>Payouts & Fees</strong>
               <ul>
                 <li>Payouts are sent in USDC to the address provided</li>
                 <li>You may need a small amount of the network’s native token (e.g., ETH) to move funds</li>
               </ul> */}
               <br/><br/>
               <strong>More: </strong> <a href="https://metamask.io/">https://metamask.io/</a>
              
             </div>
           </div>
         </div></>
             )}
           </div>
         </div>
       </section>
 

      <Icons />
    </div>
  );
}
