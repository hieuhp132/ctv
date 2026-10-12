const express = require('express');
const router = express.Router();
const {getProfile, getAllJobs, getJobById, createJob, updateJob, deleteJob, login, updateBasicInfo, changePassword} = require('../controllers/auth');
const authMiddleWare = require('../middlewares/auth');

//Route api/auth

router.put('/user/updateBasicInfo', authMiddleWare, updateBasicInfo);
router.get('/user/profile', authMiddleWare, getProfile);
router.put('/user/change-password', authMiddleWare, changePassword);

// Route: /api/auth
router.get("/user/jobs", authMiddleWare, getAllJobs);
router.get("/user/:id", authMiddleWare, getJobById);
router.post("/user/create", authMiddleWare, createJob);
router.put("/user/:id", authMiddleWare, updateJob);
router.delete("/user/:id", authMiddleWare, deleteJob);


module.exports = router;
