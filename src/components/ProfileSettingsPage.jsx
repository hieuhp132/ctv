import { useEffect, useRef, useState } from "react";
import {
  Landmark,
  LockKeyhole,
  Moon,
  Pencil,
  Save,
  SlidersHorizontal,
  Sun,
  UserRound,
  Wallet,
  X,
  Shield,
} from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { getRoleLabel } from "../routes/roleRoutes.js";
import { useTheme } from "../context/ThemeContext.jsx";
import Icons from "./Icons.jsx";
import {
  fetchProfileFromServerL,
  updateBasicInfoOnServerL,
} from "../services/api.js";
import "../styles/ProfilePage.css";

const createBankInfo = (bankInfo = {}) => ({
  accountHolderName: "",
  bankName: "",
  branchName: "",
  accountNumber: "",
  ibanSwiftCode: "",
  currency: "VND",
  registeredEmail: "",
  registeredPhone: "",
  ethAddress: "",
  ...bankInfo,
});

const getInitials = (name) =>
  String(name || "")
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "U";

function ProfileField({
  id,
  label,
  value,
  editing,
  onChange,
  type = "text",
  placeholder,
  readOnly = false,
}) {
  return (
    <div className="profile-field">
      <label htmlFor={id}>{label}</label>
      {editing && !readOnly ? (
        <input
          id={id}
          name={id}
          type={type}
          value={value || ""}
          onChange={onChange}
          placeholder={placeholder}
        />
      ) : (
        <div
          id={id}
          className={`profile-field-value${readOnly ? " is-readonly" : ""}`}
        >
          {value || "—"}
        </div>
      )}
    </div>
  );
}

function SectionHeading({ icon: Icon, title, subtitle, onEdit, editing }) {
  return (
    <div className="profile-section-heading">
      <span className="profile-section-icon" aria-hidden="true">
        <Icon size={18} />
      </span>
      <div className="profile-section-copy">
        <h3>{title}</h3>
        <p>{subtitle}</p>
      </div>
      {onEdit && !editing && (
        <button
          type="button"
          className="profile-section-edit"
          onClick={onEdit}
        >
          <Pencil size={14} />
          Edit
        </button>
      )}
    </div>
  );
}

export default function ProfileSettingsPage() {
  const { user, updateUser } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const loadedRef = useRef(false);
  const originalProfileRef = useRef(null);
  const [isEditing, setIsEditing] = useState(false);
  const [activeSection, setActiveSection] = useState("profile-personal");
  const [basicInfo, setBasicInfo] = useState({
    name: "",
    email: "",
    role: "",
    newPassword: "",
  });
  const [bankInfo, setBankInfo] = useState(() => createBankInfo());

  useEffect(() => {
    if (!user?._id || loadedRef.current) return;

    const loadProfile = async () => {
      try {
        const data = await fetchProfileFromServerL(user._id);
        if (!data) return;

        const nextBasicInfo = {
          name: data.name || "",
          email: data.email || "",
          role: data.role || "",
          newPassword: "",
        };
        const nextBankInfo = createBankInfo(data.bankInfo);

        setBasicInfo(nextBasicInfo);
        setBankInfo(nextBankInfo);
        originalProfileRef.current = {
          basicInfo: nextBasicInfo,
          bankInfo: nextBankInfo,
        };
        loadedRef.current = true;
      } catch (error) {
        console.error("Unable to load profile information.", error);
        alert("Unable to load profile information.");
      }
    };

    loadProfile();
  }, [user?._id]);

  const handleBasicChange = (event) => {
    const { name, value } = event.target;
    setBasicInfo((current) => ({ ...current, [name]: value }));
  };

  const handleBankChange = (event) => {
    const { name, value } = event.target;
    setBankInfo((current) => ({ ...current, [name]: value }));
  };

  const handleSave = async () => {
    try {
      const address = String(bankInfo.ethAddress || "").trim();
      if (address && !/^0x[a-fA-F0-9]{40}$/.test(address)) {
        alert("Invalid Ethereum address");
        return;
      }

      const payload = {
        name: basicInfo.name,
        email: basicInfo.email,
        bankInfo,
      };
      if (basicInfo.newPassword) payload.newPassword = basicInfo.newPassword;

      const result = await updateBasicInfoOnServerL(user._id, payload);
      if (!result?.success) {
        alert("Update failed");
        return;
      }

      const updatedProfile = await fetchProfileFromServerL(user._id);
      if (updatedProfile) updateUser(updatedProfile);
      const savedBasicInfo = {
        ...basicInfo,
        name: updatedProfile?.name || basicInfo.name,
        email: updatedProfile?.email || basicInfo.email,
        role: updatedProfile?.role || basicInfo.role,
        newPassword: "",
      };
      const savedBankInfo = createBankInfo(updatedProfile?.bankInfo || bankInfo);
      setBasicInfo(savedBasicInfo);
      setBankInfo(savedBankInfo);
      originalProfileRef.current = {
        basicInfo: savedBasicInfo,
        bankInfo: savedBankInfo,
      };
      setIsEditing(false);
    } catch (error) {
      console.error("Unable to update profile information.", error);
      alert("Update failed");
    }
  };

  const cancelEditing = () => {
    if (originalProfileRef.current) {
      setBasicInfo(originalProfileRef.current.basicInfo);
      setBankInfo(originalProfileRef.current.bankInfo);
    }
    setIsEditing(false);
  };

  const beginEditing = (sectionId) => {
    setIsEditing(true);
    if (sectionId) {
      document
        .getElementById(sectionId)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  if (!user) return null;

  const navItems = [
    {
      id: "profile-personal",
      label: "My Profile",
      detail: "Personal information",
      icon: UserRound,
    },
    {
      id: "profile-security",
      label: "Security",
      detail: "Password & account protection",
      icon: Shield,
    },
    {
      id: "profile-bank",
      label: "Bank Details",
      detail: "Payout and payment information",
      icon: Landmark,
    },
    {
      id: "profile-preferences",
      label: "Preferences",
      detail: "Display and theme settings",
      icon: SlidersHorizontal,
    },
  ];

  return (
    <main className="profile-page">
      <header className="profile-page-heading">
        <h1>Account Settings</h1>
        <p>Manage your profile, security, payment details and preferences.</p>
      </header>

      <div className="profile-settings-layout">
        <aside className="profile-settings-sidebar" aria-label="Profile settings">
          <nav>
            {navItems.map(({ id, label, detail, icon: Icon }) => (
              <a
                className={`profile-settings-nav-item${activeSection === id ? " is-active" : ""}`}
                href={`#${id}`}
                key={id}
                aria-current={activeSection === id ? "location" : undefined}
                onClick={() => setActiveSection(id)}
              >
                <span className="profile-settings-nav-icon">
                  <Icon size={18} />
                </span>
                <span className="profile-settings-nav-copy">
                  <strong>{label}</strong>
                  <small>{detail}</small>
                </span>
              </a>
            ))}
          </nav>
        </aside>

        <div className="profile-settings-content">
          <section className="profile-account-summary" aria-label="Account summary">
            <div className="profile-summary-identity">
              <span className="profile-summary-avatar" aria-hidden="true">
                {getInitials(basicInfo.name)}
              </span>
              <div>
                <h2>{basicInfo.name || "Your profile"}</h2>
                <p>{basicInfo.email || "Add an email address"}</p>
                <span className="profile-role-badge">
                  {getRoleLabel(basicInfo.role) || "Member"}
                </span>
              </div>
            </div>
            {!isEditing ? (
              <button
                type="button"
                className="profile-primary-button"
                onClick={() => beginEditing("profile-personal")}
              >
                <Pencil size={15} />
                Edit Profile
              </button>
            ) : (
              <div className="profile-edit-actions">
                <button
                  type="button"
                  className="profile-primary-button"
                  onClick={handleSave}
                >
                  <Save size={15} />
                  Save
                </button>
                <button
                  type="button"
                  className="profile-secondary-button"
                  onClick={cancelEditing}
                >
                  <X size={15} />
                  Cancel
                </button>
              </div>
            )}
          </section>

          <section className="profile-settings-card" id="profile-personal">
            <SectionHeading
              icon={UserRound}
              title="Personal Information"
              subtitle="Your basic account information."
              onEdit={() => beginEditing("profile-personal")}
              editing={isEditing}
            />
            <div className="profile-fields-grid">
              <ProfileField
                id="name"
                label="Full name"
                value={basicInfo.name}
                editing={isEditing}
                onChange={handleBasicChange}
              />
              <ProfileField
                id="role"
                label="Role"
                value={basicInfo.role}
                readOnly
              />
              <ProfileField
                id="email"
                label="Email address"
                value={basicInfo.email}
                editing={isEditing}
                onChange={handleBasicChange}
                type="email"
              />
              <ProfileField
                id="registeredPhone"
                label="Phone number"
                value={bankInfo.registeredPhone}
                editing={isEditing}
                onChange={handleBankChange}
                type="tel"
              />
            </div>
          </section>

          <section className="profile-settings-card" id="profile-bank">
            <SectionHeading
              icon={Landmark}
              title="Bank Information"
              subtitle="Your payout account and banking details."
              onEdit={() => beginEditing("profile-bank")}
              editing={isEditing}
            />
            <div className="profile-fields-grid">
              <ProfileField
                id="accountHolderName"
                label="Account holder name"
                value={bankInfo.accountHolderName}
                editing={isEditing}
                onChange={handleBankChange}
              />
              <ProfileField
                id="accountNumber"
                label="Account number"
                value={bankInfo.accountNumber}
                editing={isEditing}
                onChange={handleBankChange}
              />
              <ProfileField
                id="bankName"
                label="Bank name"
                value={bankInfo.bankName}
                editing={isEditing}
                onChange={handleBankChange}
              />
              <ProfileField
                id="ibanSwiftCode"
                label="IBAN / SWIFT code"
                value={bankInfo.ibanSwiftCode}
                editing={isEditing}
                onChange={handleBankChange}
              />
              <ProfileField
                id="branchName"
                label="Branch name"
                value={bankInfo.branchName}
                editing={isEditing}
                onChange={handleBankChange}
              />
              <ProfileField
                id="currency"
                label="Currency"
                value={bankInfo.currency}
                editing={isEditing}
                onChange={handleBankChange}
              />
            </div>
            <div className="profile-wallet-row">
              <span className="profile-section-icon" aria-hidden="true">
                <Wallet size={17} />
              </span>
              <ProfileField
                id="ethAddress"
                label="Ethereum payout wallet"
                value={bankInfo.ethAddress}
                editing={isEditing}
                onChange={handleBankChange}
                placeholder="0x..."
              />
            </div>
            <p className="profile-card-note">
              By saving, you confirm your payout information is accurate and valid.
            </p>
          </section>

          <section className="profile-settings-card" id="profile-security">
            <SectionHeading
              icon={Shield}
              title="Security"
              subtitle="Keep your account secure."
              onEdit={() => beginEditing("profile-security")}
              editing={isEditing}
            />
            <div className="profile-security-row">
              <span className="profile-settings-nav-icon">
                <LockKeyhole size={17} />
              </span>
              <div className="profile-security-copy">
                <strong>Change password</strong>
                <span>Update your password regularly to keep your account secure.</span>
              </div>
              {isEditing ? (
                <input
                  className="profile-password-input"
                  id="newPassword"
                  name="newPassword"
                  type="password"
                  value={basicInfo.newPassword}
                  onChange={handleBasicChange}
                  placeholder="New password"
                  aria-label="New password"
                />
              ) : (
                <button
                  type="button"
                  className="profile-row-action"
                  onClick={() => beginEditing("profile-security")}
                  aria-label="Edit password"
                >
                  <Pencil size={14} />
                </button>
              )}
            </div>
          </section>

          <section className="profile-settings-card" id="profile-preferences">
            <SectionHeading
              icon={SlidersHorizontal}
              title="Preferences"
              subtitle="Display and appearance settings."
            />
            <div className="profile-preference-row">
              <span className="profile-settings-nav-icon">
                {theme === "dark" ? <Moon size={17} /> : <Sun size={17} />}
              </span>
              <div className="profile-security-copy">
                <strong>Appearance</strong>
                <span>Choose the theme used across your workspace.</span>
              </div>
              <button
                type="button"
                className="profile-theme-toggle"
                onClick={toggleTheme}
                aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
              >
                {theme === "dark" ? "Dark" : "Light"}
              </button>
            </div>
          </section>
        </div>
      </div>
      <Icons />
    </main>
  );
}
