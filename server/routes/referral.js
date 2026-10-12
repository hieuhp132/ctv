const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth");
const role = require("../middlewares/role");
const uploadCV = require("../middlewares/cv");
const referralCtrl = require("../controllers/referral");

// Recruiter gửi referral (hỗ trợ upload CV multipart field "cv")
const recruiterRoles = ["recruiter", "recruiter_freelancer", "recruiter_fulltime"];
router.post("/", auth, role(recruiterRoles), uploadCV, referralCtrl.createReferral);

// Admin xem referral
router.get("/", auth, role(["admin", "lower_admin"]), referralCtrl.getReferrals);

// Recruiter xem referral của mình
router.get("/mine", auth, role(recruiterRoles), referralCtrl.getMyReferrals);

// Admin cập nhật trạng thái/bonus referral
router.put("/:id", auth, role(["admin", "lower_admin"]), referralCtrl.updateReferralStatus);

// Admin chốt deal (onboard/reject)
router.put("/:id/finalize", auth, role(["admin", "lower_admin"]), referralCtrl.finalizeReferral);

// Admin cập nhật các trường bổ sung của referral
router.put("/:id/fields", auth, role(["admin", "lower_admin"]), referralCtrl.updateReferralFields);

// Admin deletes a referral by ID
router.delete('/:id', auth, role(['admin', 'lower_admin']), referralCtrl.deleteReferral);

// Download CV (Admin + Recruiter đều được phép xem)
router.get("/:id/download", auth, role(["admin", "lower_admin", ...recruiterRoles]), referralCtrl.downloadCV);

module.exports = router;
