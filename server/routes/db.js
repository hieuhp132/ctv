const express = require("express");
const router = express.Router();
const {showCollections, showUsers, resetUsers, doLogin, doRegister, resetPassword, forgotPassword, removeUser} = require("../controllers/db");
const authMiddleware = require("../middlewares/auth");
const role = require("../middlewares/role");

router.get("/collections", showCollections);
router.get("/users", authMiddleware, role(["admin"]), showUsers);
router.delete("/users/reset", authMiddleware, role(["admin"]), resetUsers);
router.post("/users/login", doLogin);
router.post("/users/signup", doRegister);
router.post("/users/resetPassword", authMiddleware, role(["admin"]), resetPassword);
router.post("/users/forgotPassword", forgotPassword)
router.delete("/user/:userId/remove", authMiddleware, role(["admin"]), removeUser);
module.exports = router;
