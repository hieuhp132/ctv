const authMiddleware = require("./auth");
const { readFile } = require("../utils/fileStore");

const requireActiveAdmin = (req, res, next) => {
  const users = readFile("users.json");
  const user = users.find(
    (entry) => String(entry._id) === String(req.user.id)
  );

  if (!user || !["admin", "lower_admin"].includes(user.role) || user.status !== "Active") {
    return res.status(403).json({ success: false, message: "Admin access required" });
  }

  req.admin = user;
  next();
};

module.exports = [authMiddleware, requireActiveAdmin];
