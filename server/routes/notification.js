const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth");
const role = require("../middlewares/role");
const ctrl = require("../controllers/notification");

router.get("/", auth, ctrl.list);
router.post("/", auth, role(["admin", "lower_admin"]), ctrl.push);

module.exports = router;
























