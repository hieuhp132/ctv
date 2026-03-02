const { writeFile, readFile } = require("../utils/fileStore.js");

// ========== COMMENTS ==========

const getComments = (req, res) => {
  try {
    const { jobId } = req.params;
    
    if (!jobId) {
      return res.status(400).json({ success: false, message: "jobId is required" });
    }

    const jobs = readFile("jobs.json") || [];
    const job = jobs.find(j => j._id === jobId);

    if (!job) {
      return res.status(404).json({ success: false, message: "Job not found" });
    }

    const comments = job.comments || [];
    res.json({ success: true, comments });
  } catch (err) {
    console.error("getComments error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const addComment = (req, res) => {
  try {
    const { jobId } = req.params;
    const { text, author, authorRole, userId } = req.body;

    if (!jobId || !text || !author || !authorRole || !userId) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const jobs = readFile("jobs.json") || [];
    const jobIndex = jobs.findIndex(j => j._id === jobId);

    if (jobIndex === -1) {
      return res.status(404).json({ success: false, message: "Job not found" });
    }

    if (!jobs[jobIndex].comments) {
      jobs[jobIndex].comments = [];
    }

    const newComment = {
      id: Date.now().toString(),
      text,
      author,
      authorRole,
      userId,
      timestamp: new Date().toISOString(),
      editedAt: null
    };

    jobs[jobIndex].comments.unshift(newComment);
    jobs[jobIndex].updatedAt = new Date().toISOString();

    writeFile("jobs.json", jobs);

    // Log activity
    logActivityInternal("comment", `${author} added a comment on job "${jobs[jobIndex].title}"`, {
      jobId,
      commentId: newComment.id,
      author,
      authorRole
    });

    res.json({ success: true, comment: newComment });
  } catch (err) {
    console.error("addComment error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const updateComment = (req, res) => {
  try {
    const { jobId, commentId } = req.params;
    const { text, userId } = req.body;

    if (!jobId || !commentId || !text) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const jobs = readFile("jobs.json") || [];
    const jobIndex = jobs.findIndex(j => j._id === jobId);

    if (jobIndex === -1) {
      return res.status(404).json({ success: false, message: "Job not found" });
    }

    const commentIndex = (jobs[jobIndex].comments || []).findIndex(c => c.id === commentId);

    if (commentIndex === -1) {
      return res.status(404).json({ success: false, message: "Comment not found" });
    }

    const comment = jobs[jobIndex].comments[commentIndex];

    // Check authorization
    if (comment.userId !== userId && !req.user?.isAdmin) {
      return res.status(403).json({ success: false, message: "Not authorized to edit this comment" });
    }

    comment.text = text;
    comment.editedAt = new Date().toISOString();

    jobs[jobIndex].updatedAt = new Date().toISOString();
    writeFile("jobs.json", jobs);

    res.json({ success: true, comment });
  } catch (err) {
    console.error("updateComment error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const deleteComment = (req, res) => {
  try {
    console.log("Delete comment function called");

    const { jobId, commentId } = req.params;
    const { userId, isAdmin } = req.body;

    if (!jobId || !commentId) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const jobs = readFile("jobs.json") || [];
    const jobIndex = jobs.findIndex(j => j._id === jobId);

    if (jobIndex === -1) {
      return res.status(404).json({ success: false, message: "Job not found" });
    }

    const commentIndex = (jobs[jobIndex].comments || []).findIndex(c => c.id === commentId);

    if (commentIndex === -1) {
      return res.status(404).json({ success: false, message: "Comment not found" });
    }

    const comment = jobs[jobIndex].comments[commentIndex];

    // Check authorization
    if (comment.userId !== userId && !isAdmin) {
      return res.status(403).json({ success: false, message: "Not authorized to delete this comment" });
    }

    jobs[jobIndex].comments.splice(commentIndex, 1);
    jobs[jobIndex].updatedAt = new Date().toISOString();

    writeFile("jobs.json", jobs);

    // Log activity
    logActivityInternal(
      "delete_comment",
      `${comment.author} deleted a comment on job "${jobs[jobIndex].title}"`,
      {
        jobId,
        commentId,
        author: comment.author,
        authorRole: comment.authorRole
      }
    );

    res.json({ success: true, message: "Comment deleted" });
  } catch (err) {
    console.error("deleteComment error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ========== REPLIES ==========

const addReply = (req, res) => {
  try {
    const { jobId, commentId } = req.params;
    const { text, author, authorRole, userId } = req.body;

    if (!jobId || !commentId || !text || !author || !authorRole || !userId) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    // Only admins can add replies
    if (authorRole !== "admin") {
      return res.status(403).json({ success: false, message: "Only admins can add replies" });
    }

    const jobs = readFile("jobs.json") || [];
    const jobIndex = jobs.findIndex(j => j._id === jobId);

    if (jobIndex === -1) {
      return res.status(404).json({ success: false, message: "Job not found" });
    }

    const commentIndex = (jobs[jobIndex].comments || []).findIndex(c => c.id === commentId);

    if (commentIndex === -1) {
      return res.status(404).json({ success: false, message: "Comment not found" });
    }

    if (!jobs[jobIndex].comments[commentIndex].replies) {
      jobs[jobIndex].comments[commentIndex].replies = [];
    }

    const newReply = {
      id: Date.now().toString(),
      text,
      author,
      authorRole,
      userId,
      timestamp: new Date().toISOString()
    };

    jobs[jobIndex].comments[commentIndex].replies.push(newReply);
    jobs[jobIndex].updatedAt = new Date().toISOString();

    writeFile("jobs.json", jobs);

    // Log activity
    logActivityInternal(
      "reply",
      `${author} replied to a comment on job "${jobs[jobIndex].title}"`,
      {
        jobId,
        commentId,
        replyId: newReply.id,
        author,
        authorRole
      }
    );

    res.json({ success: true, reply: newReply });
  } catch (err) {
    console.error("addReply error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const deleteReply = (req, res) => {
  try {
    const { jobId, commentId, replyId } = req.params;
    const { userId, isAdmin } = req.body;

    if (!jobId || !commentId || !replyId) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const jobs = readFile("jobs.json") || [];
    const jobIndex = jobs.findIndex(j => j._id === jobId);

    if (jobIndex === -1) {
      return res.status(404).json({ success: false, message: "Job not found" });
    }

    const commentIndex = (jobs[jobIndex].comments || []).findIndex(c => c.id === commentId);

    if (commentIndex === -1) {
      return res.status(404).json({ success: false, message: "Comment not found" });
    }

    const replyIndex = (jobs[jobIndex].comments[commentIndex].replies || []).findIndex(r => r.id === replyId);

    if (replyIndex === -1) {
      return res.status(404).json({ success: false, message: "Reply not found" });
    }

    const reply = jobs[jobIndex].comments[commentIndex].replies[replyIndex];

    // Check authorization
    if (reply.userId !== userId && !isAdmin) {
      return res.status(403).json({ success: false, message: "Not authorized to delete this reply" });
    }

    jobs[jobIndex].comments[commentIndex].replies.splice(replyIndex, 1);
    jobs[jobIndex].updatedAt = new Date().toISOString();

    writeFile("jobs.json", jobs);

    res.json({ success: true, message: "Reply deleted" });
  } catch (err) {
    console.error("deleteReply error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const getActivities = (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    
    let activities = [];
    try {
      activities = readFile("activities.json") || [];
    } catch (err) {
      activities = [];
    }

    // Sort by timestamp descending and paginate
    const sorted = activities
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(parseInt(offset), parseInt(offset) + parseInt(limit));

    res.json({ success: true, activities: sorted, total: activities.length });
  } catch (err) {
    console.error("getActivities error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const logActivity = (req, res) => {
  try {
    const { type, description, metadata } = req.body;

    if (!type || !description) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const activity = {
      id: Date.now().toString(),
      type,
      description,
      metadata: metadata || {},
      timestamp: new Date().toISOString()
    };

    const activities = readFile("activities.json") || [];
    activities.unshift(activity);

    // Keep only last 1000 activities
    if (activities.length > 1000) {
      activities.splice(1000);
    }

    writeFile("activities.json", activities);

    res.json({ success: true, activity });
  } catch (err) {
    console.error("logActivity error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Internal function to log activities
const logActivityInternal = (type, description, metadata = {}) => {
  try {
    const activity = {
      id: Date.now().toString(),
      type,
      description,
      metadata,
      timestamp: new Date().toISOString()
    };

    const activities = readFile("activities.json") || [];
    activities.unshift(activity);

    // Keep only last 1000 activities
    if (activities.length > 1000) {
      activities.splice(1000);
    }

    writeFile("activities.json", activities);
  } catch (err) {
    console.error("logActivityInternal error:", err);
  }
};

module.exports = {
  // Comments
  getComments,
  addComment,
  updateComment,
  deleteComment,
  // Replies
  addReply,
  deleteReply,
  // Activities
  getActivities,
  logActivity,
  logActivityInternal
};
