import React, { useEffect, useState, useRef } from "react";
import "./Notifications.css";
import { IoClose } from "react-icons/io5";
import { API_BASE } from "../services/api.js";

export default function Notifications({ isOpen, onClose }) {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    if (isOpen) {
      loadActivities();
      const id = setInterval(loadActivities, 5000); // Poll every 5 seconds
      return () => {
        mounted.current = false;
        clearInterval(id);
      };
    }
    return () => {
      mounted.current = false;
    };
  }, [isOpen]);

  const loadActivities = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/comments/activities?limit=30`);
      const data = await res.json();
      
      if (!mounted.current) return;

      if (data.success) {
        setActivities(data.activities || []);
      }
    } catch (err) {
      console.error("Error loading activities:", err);
    } finally {
      if (mounted.current) setLoading(false);
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
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const getActivityIcon = (type) => {
    const icons = {
      comment: "💬",
      reply: "↩️",
      job_created: "📝",
      job_updated: "✏️",
      job_deleted: "🗑️",
      job_status_changed: "🔄",
      referral_created: "👥",
      referral_updated: "📋",
      referral_deleted: "🗑️",
      candidate_updated: "👤",
      candidate_status_changed: "🎯",
      create: "📝",
      edit: "✏️",
      delete: "🗑️",
      submit: "📤",
      approve: "✅",
      reject: "❌",
      upload: "📁",
      download: "📥",
      status_change: "🔄",
    };
    return icons[type] || "📌";
  };

  const getActivityColor = (type) => {
    const colors = {
      comment: "#8b5cf6",
      reply: "#8b5cf6",
      job_created: "#10b981",
      job_updated: "#f59e0b",
      job_deleted: "#ef4444",
      job_status_changed: "#3b82f6",
      referral_created: "#06b6d4",
      referral_updated: "#f59e0b",
      referral_deleted: "#ef4444",
      candidate_updated: "#06b6d4",
      candidate_status_changed: "#3b82f6",
      create: "#10b981",
      edit: "#f59e0b",
      delete: "#ef4444",
      submit: "#3b82f6",
      approve: "#10b981",
      reject: "#ef4444",
      upload: "#06b6d4",
      download: "#3b82f6",
      status_change: "#f59e0b",
    };
    return colors[type] || "#6b7280";
  };

  if (!isOpen) return null;

  return (
    <div className="notifications-overlay" onClick={onClose}>
      <div
        className="notifications-container"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="notifications-header">
          <div className="header-title">
            <h2>Activity Feed</h2>
            <span className="unread-badge">{activities.length}</span>
          </div>
          <button className="close-btn" onClick={onClose}>
            <IoClose size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="notifications-content">
          {loading && activities.length === 0 ? (
            <div className="empty-state">Loading activities...</div>
          ) : activities.length === 0 ? (
            <div className="empty-state">No activities yet</div>
          ) : (
            <div className="notifications-list">
              {activities.map((activity) => (
                <div key={activity.id} className="notification-item">
                  <div
                    className="notif-icon"
                    style={{ backgroundColor: getActivityColor(activity.type) }}
                  >
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="notif-content">
                    <h4>{activity.description}</h4>
                    {activity.metadata?.details && (
                      <p className="notif-details">{activity.metadata.details}</p>
                    )}
                    <span className="notif-time">
                      {formatDate(activity.timestamp)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
