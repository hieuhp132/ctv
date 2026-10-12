const { randomUUID } = require("crypto");
const bcrypt = require("bcrypt");
const { readFile, writeFile } = require("../utils/fileStore");

const VALID_ROLES = ["admin", "lower_admin", "recruiter", "recruiter_freelancer", "recruiter_fulltime", "candidate"];
const VALID_STATUSES = ["Pending", "Active", "Rejected"];
const isFullAdmin = (admin) => admin.role === "admin";
const canManageTarget = (admin, user) =>
  isFullAdmin(admin) || !["admin", "lower_admin"].includes(user.role);

const toSafeUser = ({ password, ...user }) => user;
const readUsers = () => {
  const users = readFile("users.json");
  return Array.isArray(users) ? users : [];
};

const parseCommission = (value) => {
  if (value === null || value === undefined || value === "") return null;
  const match = String(value).match(/[-+]?(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d+)?/);
  if (!match) return null;
  const amount = Number(match[0].replace(/,/g, ""));
  return Number.isFinite(amount) ? amount : null;
};

const getCommissionEarnedByRecruiter = (users) => {
  const recruiters = users.filter((user) =>
    ["recruiter", "recruiter_freelancer"].includes(user.role)
  );
  const recruiterKeys = new Map();
  recruiters.forEach((user) => {
    const keys = [user._id || user.id, user.email]
      .filter(Boolean)
      .map((key) => String(key).toLowerCase());
    keys.forEach((key) => recruiterKeys.set(key, user._id || user.id));
  });

  const earned = new Map(recruiters.map((user) => [String(user._id || user.id), 0]));
  const referrals = readFile("referrals.json");

  if (!Array.isArray(referrals)) return earned;
  referrals.forEach((referral) => {
    if (!["hired", "onboard"].includes(String(referral.status || "").toLowerCase())) return;
    const recruiterValue = referral.recruiter && typeof referral.recruiter === "object"
      ? referral.recruiter._id || referral.recruiter.id || referral.recruiter.email
      : referral.recruiter;
    const recruiterId = recruiterKeys.get(String(recruiterValue || "").toLowerCase());
    if (!recruiterId) return;

    const amount = parseCommission(referral.bonus);
    if (amount === null || amount <= 0) return;

    earned.set(String(recruiterId), (earned.get(String(recruiterId)) || 0) + amount);
  });
  return earned;
};

const getUsers = (req, res) => {
  const users = readUsers();
  const commissionEarned = getCommissionEarnedByRecruiter(users);
  const visibleUsers = users
    .filter((user) => canManageTarget(req.admin, user))
    .sort(
      (left, right) =>
        new Date(right.createdAt || right.updatedAt || 0) -
        new Date(left.createdAt || left.updatedAt || 0)
    )
    .map((user) => ({
      ...toSafeUser(user),
      commissionEarned: commissionEarned.get(String(user._id || user.id)) ?? 0,
    }));

  res.json({ success: true, data: visibleUsers });
};

const createUser = async (req, res) => {
  const name = String(req.body.name || "").trim();
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "");
  const role = req.body.role || "recruiter_freelancer";
  const status = req.body.status || "Pending";

  if (!name || name.length > 100) {
    return res.status(400).json({ success: false, message: "Name is required and must be at most 100 characters" });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    return res.status(400).json({ success: false, message: "A valid email address is required" });
  }
  if (password.length < 8) {
    return res.status(400).json({ success: false, message: "Password must be at least 8 characters" });
  }
  if (!VALID_ROLES.includes(role)) {
    return res.status(400).json({ success: false, message: "Invalid role" });
  }
  if (!isFullAdmin(req.admin) && !["recruiter", "recruiter_freelancer", "recruiter_fulltime", "candidate"].includes(role)) {
    return res.status(403).json({ success: false, message: "Lower admins can only create recruiter or candidate accounts" });
  }
  if (!VALID_STATUSES.includes(status)) {
    return res.status(400).json({ success: false, message: "Invalid status" });
  }

  const users = readUsers();
  if (users.some((user) => String(user.email).toLowerCase() === email)) {
    return res.status(409).json({ success: false, message: "A user with this email already exists" });
  }

  try {
    const user = {
      _id: randomUUID(),
      name,
      email,
      password: await bcrypt.hash(password, 10),
      role,
      status,
      credit: 0,
      jobs: [],
      createdAt: new Date().toISOString(),
    };

    users.push(user);
    writeFile("users.json", users);
    return res.status(201).json({ success: true, user: toSafeUser(user) });
  } catch (error) {
    console.error("Admin create user failed:", error);
    return res.status(500).json({ success: false, message: "Failed to create user" });
  }
};

const updateRole = (req, res) => {
  const { userId } = req.params;
  const { role } = req.body;
  if (!VALID_ROLES.includes(role)) {
    return res.status(400).json({ success: false, message: "Invalid role" });
  }
  if (!isFullAdmin(req.admin) && !["recruiter", "recruiter_freelancer", "recruiter_fulltime", "candidate"].includes(role)) {
    return res.status(403).json({ success: false, message: "Lower admins can only assign recruiter or candidate roles" });
  }

  const users = readUsers();
  const user = users.find((entry) => String(entry._id) === String(userId));
  if (!user) return res.status(404).json({ success: false, message: "User not found" });
  if (!canManageTarget(req.admin, user)) {
    return res.status(403).json({ success: false, message: "Lower admins cannot manage admin accounts" });
  }
  if (String(user._id) === String(req.admin._id)) {
    return res.status(400).json({ success: false, message: "You cannot change your own role" });
  }
  if (user.role === "admin" && role !== "admin" && user.status === "Active") {
    const activeAdmins = users.filter((entry) => entry.role === "admin" && entry.status === "Active");
    if (activeAdmins.length <= 1) {
      return res.status(400).json({ success: false, message: "At least one active admin must remain" });
    }
  }

  user.role = role;
  user.updatedAt = new Date().toISOString();
  writeFile("users.json", users);
  return res.json({ success: true, user: toSafeUser(user) });
};

const updateStatus = (req, res) => {
  const userId = req.params.userId || req.body.userId;
  const status = req.body.status || req.body.newStatus;
  if (!VALID_STATUSES.includes(status)) {
    return res.status(400).json({ success: false, message: "Invalid status" });
  }

  const users = readUsers();
  const user = users.find((entry) => String(entry._id) === String(userId));
  if (!user) return res.status(404).json({ success: false, message: "User not found" });
  if (!canManageTarget(req.admin, user)) {
    return res.status(403).json({ success: false, message: "Lower admins cannot manage admin accounts" });
  }
  if (String(user._id) === String(req.admin._id) && status !== "Active") {
    return res.status(400).json({ success: false, message: "You cannot deactivate your own account" });
  }
  if (user.role === "admin" && user.status === "Active" && status !== "Active") {
    const activeAdmins = users.filter((entry) => entry.role === "admin" && entry.status === "Active");
    if (activeAdmins.length <= 1) {
      return res.status(400).json({ success: false, message: "At least one active admin must remain" });
    }
  }

  user.status = status;
  user.updatedAt = new Date().toISOString();
  writeFile("users.json", users);
  return res.json({ success: true, user: toSafeUser(user) });
};

const resetPassword = async (req, res) => {
  const { userId } = req.params;
  const password = String(req.body.password || "");
  if (password.length < 8) {
    return res.status(400).json({ success: false, message: "Password must be at least 8 characters" });
  }

  const users = readUsers();
  const user = users.find((entry) => String(entry._id) === String(userId));
  if (!user) return res.status(404).json({ success: false, message: "User not found" });
  if (!canManageTarget(req.admin, user)) {
    return res.status(403).json({ success: false, message: "Lower admins cannot manage admin accounts" });
  }

  try {
    user.password = await bcrypt.hash(password, 10);
    user.updatedAt = new Date().toISOString();
    writeFile("users.json", users);
    return res.json({ success: true, user: toSafeUser(user) });
  } catch (error) {
    console.error("Admin reset password failed:", error);
    return res.status(500).json({ success: false, message: "Failed to reset password" });
  }
};

const resetPasswordByEmail = (req, res) => {
  const email = String(req.body.email || "").trim().toLowerCase();
  const users = readUsers();
  const user = users.find((entry) => String(entry.email || "").toLowerCase() === email);
  if (!user) return res.status(404).json({ success: false, message: "User not found" });

  req.params.userId = String(user._id);
  req.body.password = req.body.newPassword;
  return resetPassword(req, res);
};

const deleteUser = (req, res) => {
  const { userId } = req.params;
  const users = readUsers();
  const userIndex = users.findIndex((entry) => String(entry._id) === String(userId));
  if (userIndex === -1) return res.status(404).json({ success: false, message: "User not found" });

  const user = users[userIndex];
  if (!canManageTarget(req.admin, user)) {
    return res.status(403).json({ success: false, message: "Lower admins cannot manage admin accounts" });
  }
  if (String(user._id) === String(req.admin._id)) {
    return res.status(400).json({ success: false, message: "You cannot delete your own account" });
  }
  if (user.role === "admin" && user.status === "Active") {
    const activeAdmins = users.filter((entry) => entry.role === "admin" && entry.status === "Active");
    if (activeAdmins.length <= 1) {
      return res.status(400).json({ success: false, message: "At least one active admin must remain" });
    }
  }

  users.splice(userIndex, 1);
  writeFile("users.json", users);
  return res.json({ success: true, message: "User deleted" });
};

module.exports = {
  getUsers,
  createUser,
  updateRole,
  updateStatus,
  resetPassword,
  resetPasswordByEmail,
  deleteUser,
};
