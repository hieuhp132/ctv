const Notification = require("../models/Notification");

exports.list = async (req, res) => {
  try {
    const role = req.query.role || "all";
    const q = role === "all" ? {} : { role: { $in: [role, "all"] } };
    const items = await Notification.find(q).sort({ createdAt: 1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.push = async (req, res) => {
  try {
    const { role = "all", message } = req.body;
    if (!message) return res.status(400).json({ message: "Message required" });
    const n = await Notification.create({ role, message });
    res.status(201).json(n);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

























