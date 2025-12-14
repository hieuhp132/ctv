// src/components/AdminDashboard/JobCard.js
import React from "react";

export default function JobCard({ job, isInactive, savedJobs, user, onSaveToggle, onEdit, onDelete, onToggleStatus, navigate }) {
  const isSaved = savedJobs.some(j => j.id === job.id);

  let isPastDeadline = false;
  if (job.deadline) {
    const today = new Date();
    const deadlineDate = new Date(job.deadline);
    isPastDeadline = today > deadlineDate;
  }
  const effectiveStatus = isPastDeadline ? 'Inactive' : job.status;

  return (
    <div
      className="job-card"
      style={{
        position: 'relative',
        cursor: isInactive ? 'not-allowed' : 'pointer',
        filter: isInactive ? 'blur(2px) grayscale(0.5) opacity(0.7)' : 'none',
        pointerEvents: 'auto',
        transition: 'filter 0.2s',
      }}
      onClick={isInactive ? undefined : () => {
        const base = import.meta.env.BASE_URL || "/";
        const prefix = base === "/" ? "" : base.replace(/\/$/, "");
        navigate(`${prefix}/job/${job.id}`);
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div className="job-title" style={{ fontWeight: 600, fontSize: '1.1em' }}>{job.title}</div>
        <button
          title={isSaved ? "Saved" : "Save job"}
          style={{
            background: 'none', border: 'none', cursor: isInactive ? 'not-allowed' : 'pointer',
            fontSize: '1.5em', color: isSaved ? '#f60' : '#888',
            marginRight: '10px', marginLeft: '8px', verticalAlign: 'middle', width:'fit-content',
            pointerEvents: isInactive ? 'none' : 'auto'
          }}
          onClick={e => {
            e.stopPropagation();
            if (isInactive) return;
            onSaveToggle(job);
          }}
          disabled={isInactive}
        >
          {isSaved ? "★" : "☆"}
        </button>
      </div>
      <div style={{ fontSize: "13px", color: "#555", marginBottom: "6px" }}>
        <strong>Company:</strong> {job.company}
      </div>
      <div className="job-location-line" style={{ fontSize: "13px", color: "#555", marginBottom: "6px" }}>
          <strong>Location:</strong> {job.location}
      </div>
      <div className="job-meta">  
        <div>
          <strong>Salary:</strong> {job.salary || 'N/A'}
        </div>
        {job.bonus && <span className="job-bonus">Bonus: {job.bonus}</span>}
        {job.deadline && <span className="job-deadline">Deadline: {job.deadline}</span>}
        <span style={{marginLeft:8, fontWeight:'bold', color: effectiveStatus === 'Active' ? 'green' : 'red'}}>
          Status: {effectiveStatus}
          {isPastDeadline && <span style={{marginLeft:4, color:'#b00', fontWeight:'normal', fontSize:'12px'}}>(auto-inactive: deadline passed)</span>}
        </span>
      </div>
      <div style={{ fontSize: "12px", color: "#666", marginBottom: "6px" }}>
        <span>Vacancies: {job.vacancies}</span>
        <span style={{ marginLeft: 8 }}>Applicants: {job.applicants}</span>
        <span style={{ marginLeft: 8 }}>Online {job.onlineDaysAgo} days ago</span>
      </div>
      <div className="reward-line">
        <span className="reward-badge">USD {job.rewardCandidateUSD} /Candidate</span>
        <span className="reward-badge secondary">+USD {job.rewardInterviewUSD} /Interview</span>
      </div>
      <div className="job-actions">
        <button
          onClick={(e) => { e.stopPropagation(); onEdit(job); }}
          disabled={isInactive}
          style={{ pointerEvents: isInactive ? 'none' : 'auto', opacity: isInactive ? 0.5 : 1 }}
        >Edit</button>
        <button
          className="danger"
          onClick={(e) => { e.stopPropagation(); onDelete(job); }}
          style={{ pointerEvents: 'auto', opacity: 1 }}
        >Delete</button>
        <div style={{ display: 'inline-block', pointerEvents: 'auto', opacity: 1, filter: 'none' }}>
          <button
            style={{
              marginLeft: 8,
              background: job.status === 'Active' ? '#ffc107' : '#28a745',
              color: '#fff',
              border: 'none',
              borderRadius: 4,
              padding: '4px 10px',
              cursor: 'pointer',
              visibility: 'visible',
              position: 'relative',
              zIndex: 10,
            }}
            onClick={e => {
              e.stopPropagation();
              onToggleStatus(job);
            }}
          >
            {job.status === 'Active' ? 'Pause' : 'Resume'}
          </button>
        </div>
      </div>
    </div>
  );
}
