import { logAccess } from "../services/accessLog.service.js";

export function accessLogMiddleware(req, res, next) {
  res.on("finish", () => {
    if (!req.user) return;

    logAccess({
      userId: req.user._id,
      email: req.user.email,
      role: req.user.role,
      action: "visit",
      path: req.originalUrl,
      method: req.method,
    });
  });

  next();
}
