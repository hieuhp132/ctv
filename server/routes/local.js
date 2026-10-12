const express = require("express");
const router = express.Router();
const localCtrl = require("../controllers/local");
const userManagement = require("../controllers/userManagement");
const authMiddleware = require("../middlewares/auth");
const recruiterRole = require("../middlewares/role");
const adminOnly = require("../middlewares/admin");

// ---------- USERS ----------
router.get("/users", localCtrl.getUsers);
router.get("/admin/users", ...adminOnly, userManagement.getUsers);
router.post("/admin/users", ...adminOnly, userManagement.createUser);
router.patch("/admin/users/:userId/role", ...adminOnly, userManagement.updateRole);
router.patch("/admin/users/:userId/status", ...adminOnly, userManagement.updateStatus);
router.put("/admin/users/:userId/password", ...adminOnly, userManagement.resetPassword);
router.delete("/admin/users/:userId", ...adminOnly, userManagement.deleteUser);
router.post("/users/reset", ...adminOnly, userManagement.resetPasswordByEmail);
router.post("/users/forgot-password", localCtrl.forgotPassword);
router.post("/login", localCtrl.doLogin);
router.post("/register", localCtrl.doRegister);
router.post("/register/recruiter-fulltime", localCtrl.doRegisterFulltime);
router.post("/users", ...adminOnly, userManagement.createUser);
router.delete("/users/:userId/remove", ...adminOnly, userManagement.deleteUser);
router.post("/users/update-status", ...adminOnly, userManagement.updateStatus);
router.get("/user-status", localCtrl.getUserStatus);
// To Implement:
router.get("/users/profile/:id", localCtrl.getProfile);
router.put("/users/updateBasicInfo/:id", authMiddleware, localCtrl.updateBasicInfo)

// ---------- JOBS ----------
router.get("/jobs", localCtrl.getJobs);
router.get("/job/:id", localCtrl.getJobById);
router.get("/jobs/status/:status", localCtrl.getJobsByStatus);
router.get("/jobs/reset", localCtrl.resetJobs);
router.post("/jobs", localCtrl.createJob);
router.delete("/jobs/:id/remove", localCtrl.removeJob);
// To implement:
router.put("/jobs/update/:id", localCtrl.updateJob);
router.post("/recruiter-fulltime/jobs", authMiddleware, recruiterRole(["recruiter_fulltime"]), localCtrl.createHiringManagerJob);
router.put("/recruiter-fulltime/jobs/:id", authMiddleware, recruiterRole(["recruiter_fulltime"]), localCtrl.updateHiringManagerJob);
router.put("/jobs/:id/save", localCtrl.saveJob);
router.put("/jobs/:id/unsave", localCtrl.unsaveJob);


// ---------- REFERRALS ----------
router.get("/referrals", localCtrl.getReferrals);
router.get("/referrals/hiring-manager", authMiddleware, recruiterRole(["recruiter_fulltime"]), localCtrl.getHiringManagerReferrals);
router.put("/referrals/hiring-manager/:id", authMiddleware, recruiterRole(["recruiter_fulltime"]), localCtrl.updateHiringManagerReferral);
router.get("/referrals/reset", localCtrl.resetReferrals);
router.post("/referrals", localCtrl.createReferral);
router.delete("/referrals/:id/remove", localCtrl.removeReferral);
router.put("/referrals/update/:id", localCtrl.updateReferral);
// To Implement:


// ---------- GENERIC FILE ----------
router.get("/read-local-file", (req, res) => {
    const { filename } = req.query;
    if (!filename) return res.status(400).json({ message: "filename required" });
    const data = localCtrl.readFile(filename);
    res.json(data);
});

router.post("/write-local-file", (req, res) => {
    const { filename, data } = req.body;
    if (!filename || !data) return res.status(400).json({ message: "filename and data required" });
    localCtrl.writeFile(filename, data);
    res.json({ message: "File written successfully", filename });
});

module.exports = router;
