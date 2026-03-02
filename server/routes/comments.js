const express = require("express");
const router = express.Router();
const commentsCtrl = require("../controllers/comments");

// Comments CRUD operations
router.get("/comments/:jobId", commentsCtrl.getComments);
router.post("/comments/:jobId", commentsCtrl.addComment);
router.put("/comments/:jobId/:commentId", commentsCtrl.updateComment);
router.delete("/comments/:jobId/:commentId", commentsCtrl.deleteComment);

// Replies on comments
router.post("/comments/:jobId/:commentId/replies", commentsCtrl.addReply);
router.delete("/comments/:jobId/:commentId/replies/:replyId", commentsCtrl.deleteReply);

// Activities - get notifications
router.get("/activities", commentsCtrl.getActivities);
router.post("/activities", commentsCtrl.logActivity);

module.exports = router;
