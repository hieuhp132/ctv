import { useEffect, useMemo, useState } from "react";
import {
  Download,
  Search,
  ShieldCheck,
  UserPlus,
  Users,
  UserRound,
  UserRoundCog,
  KeyRound,
  Landmark,
  X,
  RefreshCw,
  Trash2,
} from "lucide-react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { useAuth } from "../../../context/AuthContext.jsx";
import { getRoleLabel } from "../../../routes/roleRoutes.js";
import {
  createAdminUserL,
  deleteAdminUserL,
  getAdminUsersL,
  resetAdminUserPasswordL,
  updateAdminUserRoleL,
  updateAdminUserStatusL,
} from "../../../services/api.js";
import "./UserList.css";

const PAGE_SIZE = 10;
const ADMIN_ROLES = [
  { id: "admin", label: "Admins", icon: ShieldCheck, description: "Full workspace access" },
  { id: "lower_admin", label: "Lower admins", icon: UserRoundCog, description: "Admin workspace, limited user access" },
  { id: "recruiter_freelancer", label: "Freelance recruiters", icon: UserRoundCog, description: "Refer candidates and track commissions" },
  { id: "recruiter_fulltime", label: "Employees", icon: UserRoundCog, description: "Manage hiring workflows and talent" },
  { id: "candidate", label: "Candidates", icon: UserRound, description: "Access candidate features" },
];
const LOWER_ADMIN_ROLES = ADMIN_ROLES.filter(({ id }) => ["recruiter_freelancer", "recruiter_fulltime", "candidate"].includes(id));
const STATUSES = ["Active", "Pending", "Rejected"];
const EMPTY_FORM = {
  name: "",
  email: "",
  password: "",
  role: "recruiter_freelancer",
  status: "Pending",
};

const getInitials = (name, email) =>
  String(name || email || "U")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

const formatDate = (date) => {
  if (!date) return "—";
  const parsed = new Date(date);
  return Number.isNaN(parsed.getTime())
    ? "—"
    : parsed.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
};
const formatCommission = (amount) => {
  const value = Number(amount);
  if (!Number.isFinite(value) || value <= 0) return "$0";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
};
const getUpdatedDate = (user) => user.updatedAt || user.createdAt;

export default function UsersManagement() {
  const { user: currentUser } = useAuth();
  const isFullAdmin = currentUser?.role === "admin";
  const visibleRoles = isFullAdmin ? ADMIN_ROLES : LOWER_ADMIN_ROLES;
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [actionError, setActionError] = useState("");
  const [notice, setNotice] = useState("");
  const [busyUserId, setBusyUserId] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [bankInfoUser, setBankInfoUser] = useState(null);
  const [passwordUser, setPasswordUser] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);

  const loadUsers = async () => {
    setLoading(true);
    setLoadError("");
    try {
      const result = await getAdminUsersL();
      setUsers(Array.isArray(result) ? result : []);
    } catch (error) {
      setLoadError(error.message || "Unable to load users.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const counts = useMemo(
    () => ({
      total: users.length,
      ...Object.fromEntries(ADMIN_ROLES.map(({ id }) => [id, users.filter((user) => user.role === id).length])),
    }),
    [users],
  );

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();
    return users.filter((user) => {
      const matchesQuery =
        !query ||
        String(user.name || "").toLowerCase().includes(query) ||
        String(user.email || "").toLowerCase().includes(query);
      return (
        matchesQuery &&
        (roleFilter === "all" || user.role === roleFilter) &&
        (statusFilter === "all" || user.status === statusFilter)
      );
    });
  }, [users, search, roleFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));
  const pageUsers = filteredUsers.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [search, roleFilter, statusFilter]);

  useEffect(() => {
    if (!showCreateModal && !passwordUser && !bankInfoUser) return undefined;
    const closeOnEscape = (event) => {
      if (event.key !== "Escape") return;
      if (showCreateModal && !creating) setShowCreateModal(false);
      else if (passwordUser && !savingPassword) setPasswordUser(null);
      else if (bankInfoUser) setBankInfoUser(null);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [showCreateModal, passwordUser, bankInfoUser, creating, savingPassword]);

  const updateUser = async (userId, request) => {
    setBusyUserId(userId);
    setActionError("");
    setNotice("");
    try {
      const result = await request();
      setUsers((current) =>
        current.map((user) => (user._id === userId ? { ...user, ...result.user } : user)),
      );
      setNotice("User access updated.");
    } catch (error) {
      setActionError(error.message || "Unable to update this user.");
    } finally {
      setBusyUserId("");
    }
  };

  const handleCreate = async (event) => {
    event.preventDefault();
    setCreating(true);
    setCreateError("");
    try {
      const result = await createAdminUserL(form);
      setUsers((current) => [result.user, ...current]);
      setShowCreateModal(false);
      setForm(EMPTY_FORM);
      setNotice("User created successfully.");
    } catch (error) {
      setCreateError(error.message || "Unable to create this user.");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (user) => {
    if (!window.confirm(`Delete ${user.name || user.email}? This action cannot be undone.`)) return;
    setBusyUserId(user._id);
    setActionError("");
    setNotice("");
    try {
      await deleteAdminUserL(user._id);
      setUsers((current) => current.filter((entry) => entry._id !== user._id));
      setNotice("User deleted.");
    } catch (error) {
      setActionError(error.message || "Unable to delete this user.");
    } finally {
      setBusyUserId("");
    }
  };

  const handleResetPassword = async (event) => {
    event.preventDefault();
    if (!passwordUser) return;
    setSavingPassword(true);
    setPasswordError("");
    setActionError("");
    setNotice("");
    try {
      await resetAdminUserPasswordL(passwordUser._id, newPassword);
      setPasswordUser(null);
      setNewPassword("");
      setNotice(`Password reset for ${passwordUser.email}.`);
    } catch (error) {
      setPasswordError(error.message || "Unable to reset this password.");
    } finally {
      setSavingPassword(false);
    }
  };

  const exportUsers = () => {
    const rows = filteredUsers.map((user) => ({
      Name: user.name || "",
      Email: user.email || "",
      Role: getRoleLabel(user.role),
      Status: user.status || "",
      "Commission earned": ["recruiter", "recruiter_freelancer"].includes(user.role)
        ? Number(user.commissionEarned) || 0
        : "",
      "Updated at": formatDate(getUpdatedDate(user)),
      "Bank account holder": user.bankInfo?.accountHolderName || "",
      "Bank": user.bankInfo?.bankName || "",
      "Account number": user.bankInfo?.accountNumber || "",
      "IBAN / SWIFT": user.bankInfo?.ibanSwiftCode || "",
    }));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(rows), "Users");
    const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    saveAs(
      new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
      `users-${new Date().toISOString().slice(0, 10)}.xlsx`,
    );
  };

  return (
    <main className="user-management">
      <header className="user-management__header">
        <div>
          <p className="user-management__eyebrow">ADMIN WORKSPACE</p>
          <h1>User management</h1>
          <p className="user-management__subtitle">
            Manage accounts, roles and access to your workspace.
          </p>
        </div>
        <div className="user-management__header-actions">
          <button
            className="um-button um-button--secondary"
            type="button"
            onClick={exportUsers}
            disabled={!filteredUsers.length}
          >
            <Download size={16} aria-hidden="true" />
            Export
          </button>
          <button
            className="um-button um-button--primary"
            type="button"
            onClick={() => {
              setCreateError("");
              setShowCreateModal(true);
            }}
          >
            <UserPlus size={17} aria-hidden="true" />
            Add user
          </button>
        </div>
      </header>

      <section className="user-management__stats" aria-label="User totals by role">
        <button
          type="button"
          className={`um-stat-card${roleFilter === "all" ? " is-selected" : ""}`}
          onClick={() => setRoleFilter("all")}
        >
          <span className="um-stat-card__icon um-stat-card__icon--total"><Users size={19} /></span>
          <span className="um-stat-card__copy">
            <span className="um-stat-card__label">Total users</span>
            <strong>{counts.total}</strong>
          </span>
        </button>
        {visibleRoles.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            className={`um-stat-card${roleFilter === id ? " is-selected" : ""}`}
            onClick={() => setRoleFilter(id)}
          >
            <span className={`um-stat-card__icon um-stat-card__icon--${id}`}><Icon size={19} /></span>
            <span className="um-stat-card__copy">
              <span className="um-stat-card__label">{label}</span>
              <strong>{counts[id]}</strong>
            </span>
          </button>
        ))}
      </section>

      <section className="um-panel" aria-label="User directory">
        <div className="um-panel__heading">
          <div>
            <h2>All users</h2>
            <p>Assign roles and manage account status.</p>
          </div>
          <button className="um-icon-button" type="button" onClick={loadUsers} disabled={loading} aria-label="Refresh users">
            <RefreshCw size={17} className={loading ? "um-spin" : ""} />
          </button>
        </div>

        <div className="um-toolbar">
          <label className="um-search">
            <Search size={17} aria-hidden="true" />
            <span className="um-sr-only">Search by name or email</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search name or email"
            />
          </label>
          <label className="um-filter">
            <span className="um-sr-only">Filter by status</span>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="all">All statuses</option>
              {STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
            </select>
          </label>
          <span className="um-results-count">
            {filteredUsers.length} {filteredUsers.length === 1 ? "user" : "users"}
          </span>
        </div>

        {(actionError || loadError) && (
          <div className="um-alert um-alert--error" role="alert">
            {actionError || loadError}
            {loadError && <button type="button" onClick={loadUsers}>Try again</button>}
          </div>
        )}

        {passwordUser && (
          <div className="um-modal-backdrop" onMouseDown={(event) => {
            if (event.target === event.currentTarget && !savingPassword) setPasswordUser(null);
          }}>
            <section className="um-modal" role="dialog" aria-modal="true" aria-labelledby="um-password-title">
              <header className="um-modal__header">
                <div>
                  <span className="um-modal__icon"><KeyRound size={20} /></span>
                  <div>
                    <h2 id="um-password-title">Reset password</h2>
                    <p>Set a temporary password for {passwordUser.email}.</p>
                  </div>
                </div>
                <button className="um-icon-button" type="button" onClick={() => setPasswordUser(null)} disabled={savingPassword} aria-label="Close">
                  <X size={18} />
                </button>
              </header>
              <form className="um-form" onSubmit={handleResetPassword}>
                <label>
                  New temporary password
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    required
                    minLength="8"
                    autoComplete="new-password"
                    autoFocus
                  />
                  <small>At least 8 characters. The password is stored securely as a hash.</small>
                </label>
                {passwordError && <p className="um-form__error" role="alert">{passwordError}</p>}
                <footer className="um-form__actions">
                  <button className="um-button um-button--secondary" type="button" onClick={() => setPasswordUser(null)} disabled={savingPassword}>Cancel</button>
                  <button className="um-button um-button--primary" type="submit" disabled={savingPassword}>
                    {savingPassword ? "Saving…" : "Save password"}
                  </button>
                </footer>
              </form>
            </section>
          </div>
        )}

        {bankInfoUser && (
          <div className="um-modal-backdrop" onMouseDown={(event) => {
            if (event.target === event.currentTarget) setBankInfoUser(null);
          }}>
            <section className="um-modal" role="dialog" aria-modal="true" aria-labelledby="um-bank-title">
              <header className="um-modal__header">
                <div>
                  <span className="um-modal__icon"><Landmark size={20} /></span>
                  <div>
                    <h2 id="um-bank-title">Bank information</h2>
                    <p>{bankInfoUser.name || bankInfoUser.email}</p>
                  </div>
                </div>
                <button className="um-icon-button" type="button" onClick={() => setBankInfoUser(null)} aria-label="Close">
                  <X size={18} />
                </button>
              </header>
              <dl className="um-bank-details">
                {[
                  ["Account holder", bankInfoUser.bankInfo?.accountHolderName],
                  ["Bank", bankInfoUser.bankInfo?.bankName],
                  ["Branch", bankInfoUser.bankInfo?.branchName],
                  ["Account number", bankInfoUser.bankInfo?.accountNumber],
                  ["IBAN / SWIFT", bankInfoUser.bankInfo?.ibanSwiftCode],
                  ["Currency", bankInfoUser.bankInfo?.currency],
                  ["Registered email", bankInfoUser.bankInfo?.registeredEmail],
                  ["Registered phone", bankInfoUser.bankInfo?.registeredPhone],
                ].map(([label, value]) => (
                  <div key={label}>
                    <dt>{label}</dt>
                    <dd>{value || "—"}</dd>
                  </div>
                ))}
              </dl>
              <footer className="um-form__actions um-bank-details__actions">
                <button className="um-button um-button--secondary" type="button" onClick={() => setBankInfoUser(null)}>Close</button>
              </footer>
            </section>
          </div>
        )}
        {notice && <div className="um-alert um-alert--success" role="status">{notice}</div>}

        <div className="um-table-wrap">
          <table className="um-table">
            <thead>
              <tr>
                <th scope="col">User</th>
                <th scope="col">Role &amp; access</th>
                <th scope="col">Status</th>
                <th scope="col">Commission earned</th>
                <th scope="col">Updated</th>
                <th scope="col"><span className="um-sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td className="um-table__message" colSpan="6">Loading users…</td></tr>
              ) : pageUsers.length ? pageUsers.map((user) => {
                const isBusy = busyUserId === user._id;
                const isCurrentUser = String(currentUser?._id) === String(user._id);
                const roleDescription = ADMIN_ROLES.find((role) => role.id === user.role)?.description || "Custom access";
                return (
                  <tr key={user._id}>
                    <td>
                      <div className="um-user">
                        <span className="um-avatar" aria-hidden="true">{getInitials(user.name, user.email)}</span>
                        <span className="um-user__details">
                          <strong>{user.name || "Unnamed user"}{isCurrentUser && <span className="um-you">You</span>}</strong>
                          <span>{user.email}</span>
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className="um-access">
                        <select
                          className={`um-select um-role-select um-role-select--${user.role}`}
                          value={user.role || ""}
                          onChange={(event) => updateUser(
                            user._id,
                            () => updateAdminUserRoleL(user._id, event.target.value),
                          )}
                          disabled={isBusy || isCurrentUser}
                          aria-label={`Role for ${user.name || user.email}`}
                        >
                          {visibleRoles.map(({ id, label }) => (
                            <option key={id} value={id}>                            {ADMIN_ROLES.find((role) => role.id === id)?.label.replace(/s$/, "")}</option>
                          ))}
                        </select>
                        <span>{roleDescription}</span>
                      </div>
                    </td>
                    <td>
                      <select
                        className={`um-select um-status-select um-status-select--${String(user.status || "unknown").toLowerCase()}`}
                        value={STATUSES.includes(user.status) ? user.status : "Pending"}
                        onChange={(event) => updateUser(
                          user._id,
                          () => updateAdminUserStatusL(user._id, event.target.value),
                        )}
                        disabled={isBusy || isCurrentUser}
                        aria-label={`Status for ${user.name || user.email}`}
                      >
                        {STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
                      </select>
                    </td>
                    <td className="um-commission-earned">
                      {["recruiter", "recruiter_freelancer"].includes(user.role)
                        ? formatCommission(user.commissionEarned)
                        : "—"}
                    </td>
                    <td className="um-date">{formatDate(getUpdatedDate(user))}</td>
                    <td className="um-row-actions">
                      <button
                        className="um-icon-button"
                        type="button"
                        onClick={() => {
                          setNewPassword("");
                          setPasswordError("");
                          setPasswordUser(user);
                        }}
                        disabled={isBusy}
                        aria-label={`Reset password for ${user.name || user.email}`}
                        title="Reset password"
                      >
                        <KeyRound size={15} />
                      </button>
                      <button
                        className="um-icon-button"
                        type="button"
                        onClick={() => setBankInfoUser(user)}
                        disabled={!user.bankInfo || isBusy}
                        aria-label={`View bank information for ${user.name || user.email}`}
                        title={user.bankInfo ? "View bank information" : "No bank information"}
                      >
                        <Landmark size={15} />
                      </button>
                      <button
                        className="um-icon-button um-icon-button--danger"
                        type="button"
                        onClick={() => handleDelete(user)}
                        disabled={isBusy || isCurrentUser}
                        aria-label={`Delete ${user.name || user.email}`}
                        title={isCurrentUser ? "You cannot delete your own account" : "Delete user"}
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td className="um-table__message" colSpan="6">
                    {loadError ? "Users could not be loaded." : "No users match your search."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <footer className="um-pagination">
          <span>Showing {filteredUsers.length ? (page - 1) * PAGE_SIZE + 1 : 0}–{Math.min(page * PAGE_SIZE, filteredUsers.length)} of {filteredUsers.length}</span>
          <div>
            <button type="button" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={page <= 1}>Previous</button>
            <span>Page {page} of {totalPages}</span>
            <button type="button" onClick={() => setPage((value) => Math.min(totalPages, value + 1))} disabled={page >= totalPages}>Next</button>
          </div>
        </footer>
      </section>

      <aside className="um-permissions-note">
        <ShieldCheck size={17} aria-hidden="true" />
        <span><strong>Role-based access</strong> — role changes take effect immediately and are enforced by the server.</span>
      </aside>

      {showCreateModal && (
        <div className="um-modal-backdrop" onMouseDown={(event) => {
          if (event.target === event.currentTarget && !creating) setShowCreateModal(false);
        }}>
          <section className="um-modal" role="dialog" aria-modal="true" aria-labelledby="um-create-title">
            <header className="um-modal__header">
              <div>
                <span className="um-modal__icon"><UserPlus size={20} /></span>
                <div>
                  <h2 id="um-create-title">Add a user</h2>
                  <p>Create an account and choose its initial access.</p>
                </div>
              </div>
              <button className="um-icon-button" type="button" onClick={() => setShowCreateModal(false)} disabled={creating} aria-label="Close">
                <X size={18} />
              </button>
            </header>
            <form className="um-form" onSubmit={handleCreate}>
              <label>
                Full name
                <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required maxLength="100" autoFocus />
              </label>
              <label>
                Email address
                <input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required maxLength="254" />
              </label>
              <label>
                Temporary password
                <input type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} required minLength="8" autoComplete="new-password" />
                <small>At least 8 characters. The password is stored securely as a hash.</small>
              </label>
              <div className="um-form__row">
                <label>
                  Role
                  <select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })}>
                    {visibleRoles.map(({ id, label }) => <option key={id} value={id}>{label.replace(/s$/, "")}</option>)}
                  </select>
                </label>
                <label>
                  Initial status
                  <select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>
                    {STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
                  </select>
                </label>
              </div>
              {createError && <p className="um-form__error" role="alert">{createError}</p>}
              <footer className="um-form__actions">
                <button className="um-button um-button--secondary" type="button" onClick={() => setShowCreateModal(false)} disabled={creating}>Cancel</button>
                <button className="um-button um-button--primary" type="submit" disabled={creating}>
                  {creating ? "Creating…" : "Create user"}
                </button>
              </footer>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}
