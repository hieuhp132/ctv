const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth");
const role = require("../middlewares/role");
const ctrl = require("../controllers/metrics");

router.get("/balances", auth, ctrl.balances);
router.get("/recruiter-dashboard", auth, role(["recruiter", "recruiter_freelancer", "recruiter_fulltime"]), ctrl.recruiterDashboard);

module.exports = router;























