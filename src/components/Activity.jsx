import React, { useState, useEffect, useRef } from "react";
import { API_BASE } from "../services/api.js";
import "./Activity.css";

export default function Activity({ jobId, showAll = false }) {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    loadActivities();
    const id = setInterval(loadActivities, 10000); // Poll every 10 seconds
    return () => {
      mounted.current = false;
      clearInterval(id);
    };
  }, [jobId, showAll]);

  const loadActivities = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/comments/activities?limit=50`);
      const data = await res.json();
      
      if (!mounted.current) return;

      if (data.success) {
        // If showAll is true or no jobId provided, show all activities (system-wide)
        // Otherwise filter by jobId (for job detail page)
        const list = showAll || !jobId
          ? data.activities || []
          : (data.activities || []).filter(
              (a) => a.metadata?.jobId === jobId || a.jobId === jobId
            );
        setActivities(list);
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
      view: "👁️",
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
      view: "#6b7280",
    };
    return colors[type] || "#6b7280";
  };

  if (loading && activities.length === 0) {
    return (
      <div className="activity-section">
        <h3>Activity Timeline</h3>
        <p className="no-activities">Loading activities...</p>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="activity-section">
        <h3>Activity Timeline</h3>
        <p className="no-activities">No activities yet</p>
      </div>
    );
  }

  return (
    <div className="activity-section">
      <h3>Activity Timeline</h3>
      <div className="activity-timeline">
        {activities.map((activity) => (
          <div key={activity.id} className="activity-item">
            <div
              className="activity-icon"
              style={{ backgroundColor: getActivityColor(activity.type) }}
            >
              {getActivityIcon(activity.type)}
            </div>
            <div className="activity-content">
              <p className="activity-description">{activity.description}</p>
              {activity.metadata?.details && (
                <p className="activity-details">{activity.metadata.details}</p>
              )}
              <span className="activity-time">{formatDate(activity.timestamp)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
