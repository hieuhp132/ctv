import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import "./Comments.css";

import { API_BASE } from "../services/api.js";

export default function Comments({ jobId, isAdmin }) {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");
  const [loading, setLoading] = useState(true);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [isReplySubmitting, setIsReplySubmitting] = useState(false);

  // Load comments from API
  useEffect(() => {
    if (!jobId) return;
    loadComments();
  }, [jobId]);

  const loadComments = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/comments/comments/${jobId}`);
      const data = await res.json();
      if (data.success) setComments(data.comments || []);
    } catch (err) {
      console.error("Error loading comments:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim() || !user) return;

    try {
      setIsSubmitting(true);
      const res = await fetch(`${API_BASE}/api/comments/comments/${jobId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: commentText,
          author: user.name || user.email,
          authorRole: user.role,
          userId: user.id || user.email,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setComments((s) => [data.comment, ...s]);
        setCommentText("");
      } else {
        alert("Failed to add comment: " + data.message);
      }
    } catch (err) {
      console.error("Error adding comment:", err);
      alert("Failed to add comment");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteComment = async (id) => {
    if (!window.confirm("Are you sure you want to delete this comment?")) return;
    try {
      const res = await fetch(`${API_BASE}/api/comments/comments/${jobId}/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id || user.email, isAdmin }),
      });
      const data = await res.json();
      if (data.success) setComments((s) => s.filter((c) => c.id !== id));
      else alert("Failed to delete comment: " + data.message);
    } catch (err) {
      console.error("Error deleting comment:", err);
      alert("Failed to delete comment");
    }
  };

  const handleEditComment = (id) => {
    const comment = comments.find((c) => c.id === id);
    if (comment) {
      setEditingId(id);
      setEditText(comment.text);
    }
  };

  const handleSaveEdit = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/api/comments/comments/${jobId}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: editText, userId: user.id || user.email }),
      });
      const data = await res.json();
      if (data.success) {
        setComments((s) => s.map((c) => (c.id === id ? { ...c, text: editText, editedAt: new Date().toISOString() } : c)));
        setEditingId(null);
        setEditText("");
      } else {
        alert("Failed to update comment: " + data.message);
      }
    } catch (err) {
      console.error("Error updating comment:", err);
      alert("Failed to update comment");
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
    return date.toLocaleDateString();
  };

  const handleAddReply = async (e, commentId) => {
    e.preventDefault();
    if (!replyText.trim() || !user) return;

    try {
      setIsReplySubmitting(true);
      const res = await fetch(`${API_BASE}/api/comments/comments/${jobId}/${commentId}/replies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: replyText,
          author: user.name || user.email,
          authorRole: user.role,
          userId: user.id || user.email,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setComments((s) =>
          s.map((c) =>
            c.id === commentId
              ? { ...c, replies: [...(c.replies || []), data.reply] }
              : c
          )
        );
        setReplyText("");
        setReplyingTo(null);
      } else {
        alert("Failed to add reply: " + data.message);
      }
    } catch (err) {
      console.error("Error adding reply:", err);
      alert("Failed to add reply");
    } finally {
      setIsReplySubmitting(false);
    }
  };

  const getAvatarInitials = (name) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) return (
    <div className="comments-section">
      <h3>Comments & Discussion</h3>
      <p className="no-comments">Loading comments...</p>
    </div>
  );

  return (
    <div className="comments-section">
      <h3>Comments & Discussion</h3>

      <div className="comments-list">
        {comments.length === 0 ? (
          <p className="no-comments">No comments yet. Be the first to comment!</p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id}>
              <div className="comment-item">
                <div className="comment-avatar">{getAvatarInitials(comment.author)}</div>
                <div className="comment-content">
                  <div className="comment-header">
                    <div className="comment-meta">
                      <span className="author-name">{comment.author}</span>
                      <span className="comment-time">{formatDate(comment.timestamp)}{comment.editedAt && " (edited)"}</span>
                    </div>
                    {(isAdmin || user?.id === comment.userId || user?.email === comment.userId) && (
                      <div className="comment-actions">
                        {editingId !== comment.id && (<button onClick={() => handleEditComment(comment.id)} className="btn-edit" title="Edit">Edit</button>)}
                        <button onClick={() => handleDeleteComment(comment.id)} className="btn-delete" title="Delete">Delete</button>
                      </div>
                    )}
                  </div>

                  {editingId === comment.id ? (
                    <div className="edit-comment">
                      <textarea value={editText} onChange={(e) => setEditText(e.target.value)} rows="3" />
                      <div className="edit-actions">
                        <button onClick={() => handleSaveEdit(comment.id)} className="btn-save">Save</button>
                        <button onClick={() => setEditingId(null)} className="btn-cancel">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <p className="comment-text">{comment.text}</p>
                  )}

                  <div className="comment-actions">
                    {isAdmin && (
                      <button onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)} className="btn-reply">
                        {replyingTo === comment.id ? "Cancel" : "Reply"}
                      </button>
                    )}
                  </div>

                  {replyingTo === comment.id && (
                    <form className="reply-form" onSubmit={(e) => handleAddReply(e, comment.id)}>
                      <textarea placeholder="Add admin reply..." value={replyText} onChange={(e) => setReplyText(e.target.value)} rows="2" />
                      <div className="reply-form-actions">
                        <button type="submit" disabled={isReplySubmitting || !replyText.trim()} className="btn-submit-reply">{isReplySubmitting ? "Sending..." : "Send Reply"}</button>
                        <button type="button" onClick={() => setReplyingTo(null)} className="btn-cancel-reply">Cancel</button>
                      </div>
                    </form>
                  )}
                </div>
              </div>

              {comment.replies && comment.replies.length > 0 && (
                <div className="replies-container">
                  {comment.replies.map((reply) => (
                    <div key={reply.id} className="reply-item">
                      <div className="comment-avatar">✓</div>
                      <div className="comment-content">
                        <div className="comment-header">
                          <div className="comment-meta">
                            <span className="author-name">{reply.author}</span>
                            <span className="comment-time">{formatDate(reply.timestamp)}</span>
                          </div>
                        </div>
                        <p className="comment-text">{reply.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      
      {user && (
        <form className="add-comment-form" onSubmit={handleAddComment}>
          <textarea placeholder="Add a comment..." value={commentText} onChange={(e) => setCommentText(e.target.value)} rows="3" />
          <button type="submit" disabled={isSubmitting || !commentText.trim()} className="btn-submit">{isSubmitting ? "Posting..." : "Post Comment"}</button>
        </form>
      )}
      
    </div>
  );
}
