const { readFile } = require("../utils/fileStore");
const mongoose = require("mongoose");
const User = require("../models/User");

const roleMiddleware = (roles) => async (req, res, next) => {
  try {
    const users = readFile("users.json");
    let user = users.find((entry) => String(entry._id) === String(req.user.id));
    const isLocalUser = Boolean(user);

    if (!user && mongoose.isValidObjectId(req.user.id)) {
      user = await User.findById(req.user.id).select("role status").lean();
    }

    if (
      !user ||
      (isLocalUser && user.status !== "Active") ||
      (user.status && user.status !== "Active") ||
      !roles.includes(user.role)
    ) {
      return res.status(403).json({ message: "Forbidden" });
    }

    req.user.role = user.role;
    next();
  } catch (error) {
    console.error("Role authorization failed:", error);
    return res.status(500).json({ message: "Unable to verify user permissions" });
  }
};

module.exports = roleMiddleware;