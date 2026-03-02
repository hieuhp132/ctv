const express = require("express");
const router = express.Router();
const localCtrl = require("../controllers/local");

// ---------- USERS ----------
router.get("/users", localCtrl.getUsers);
router.post("/users/reset", localCtrl.resetPassword);
router.post("/login", localCtrl.doLogin);
router.post("/register", localCtrl.doRegister);
router.post("/users", localCtrl.createUser);
router.delete("/users/:userId/remove", localCtrl.removeUser);
router.post("/users/update-status", localCtrl.updateUserStatus);
router.get("/user-status", localCtrl.getUserStatus);
router.get("/users/:id", localCtrl.getUserById);
// To Implement:
router.get("/users/profile/:id", localCtrl.getProfile);
router.put("/users/updateBasicInfo/:id", localCtrl.updateBasicInfo)

// ---------- JOBS ----------
router.get("/jobs", localCtrl.getJobs);
router.get("/job/:id", localCtrl.getJobById);
router.get("/jobs/status/:status", localCtrl.getJobsByStatus);
router.get("/jobs/reset", localCtrl.resetJobs);
router.post("/jobs", localCtrl.createJob);
router.delete("/jobs/:id/remove", localCtrl.removeJob);
// To implement:
router.put("/jobs/update/:id", localCtrl.updateJob);
router.put("/jobs/:id/save", localCtrl.saveJob);
router.put("/jobs/:id/unsave", localCtrl.unsaveJob);


// ---------- REFERRALS ----------
router.get("/referrals", localCtrl.getReferrals);
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
