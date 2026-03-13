import React from "react";
import { useNavigate, Link } from "react-router-dom";
import { BsBookmark, BsBookmarkFill } from "react-icons/bs";

export default function Card({
  job,
  isInactive,
  onSaveToggle,
  onEdit,
  onDelete,
  onToggleStatus,
  onSharedJob,
  onSubmitCandidate,
  role
}) {
  const navigate = useNavigate();
  const isPureNumber = (v) =>
    typeof v === "number" ||
    (typeof v === "string" && /^[0-9]+$/.test(v.trim()));

  const normalizeReward = (v) => {
    if (isPureNumber(v)) {
      const n = Number(v);
      return `USD ${n} / Headhunter`;
    }
    if (typeof v === "string" && v.trim()) {
      return v; // text tự do
    }
    return "USD 0 / Headhunter";
  };

  const normalizeInterviewReward = (v) => {
    if (isPureNumber(v)) {
      const n = Number(v);
      return `USD ${n} / Interview`;
    }
    if (typeof v === "string" && v.trim()) {
      return v;
    }
    return "USD 0 / Interview";
  };

  const textPreview = (() => {
    const html =
      job.jobsdetail?.description ||
      job.description ||
      "";
    const tmp = document.createElement("div");
    tmp.innerHTML = html;
    const t = tmp.textContent || tmp.innerText || "";
    return t.replace(/\s+/g, " ").trim().slice(0, 180);
  })();

  const jobUrl = `/${role}/job/${job._id}`;

  return (
    <div
      className="job-card"
      style={{
        position: "relative",
        cursor: isInactive ? "not-allowed" : "pointer",
        filter: isInactive ? "" : "none",
        pointerEvents: "auto",
        padding: 0, // Remove padding from card to let Link fill it
      }}
    >
      <Link
        to={jobUrl}
        style={{
          display: "block",
          padding: "16px", // Restore padding inside Link
          textDecoration: "none",
          color: "inherit",
          height: "100%",
        }}
        onClick={(e) => {
          if (isInactive) e.preventDefault();
        }}
      >
        {/* HEADER */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div
            className="job-title"
            style={{ 
              fontWeight: 600, 
              fontSize: "1.1em",
            }}
          >
            {job.title}
          </div>

          {/* SAVE */}
          <button
            className={`save-btn ${job.isSaved ? "saved" : ""}`}
            onClick={(e) => {
              e.preventDefault(); // Prevent Link navigation
              e.stopPropagation();
              onSaveToggle(job);
            }}
          >
            {job.isSaved ? <BsBookmarkFill /> : <BsBookmark />}
          </button>
        </div>

        {/* INFO */}
        <div style={{ fontSize: 13, color: "#555", marginBottom: 6 }}>
          <strong>Company:</strong> {job.company}
        </div>

        <div style={{ fontSize: 13, color: "#555", marginBottom: 6 }}>
          <strong>Location:</strong> {job.location}
        </div>

        <div className="job-meta">
          <div>
            <strong style={{ marginRight: 4, fontSize: 13, color: "#555", }}>Salary:</strong> {job.salary || "N/A"}
          </div>

          {job.deadline && (
            <span className="job-deadline" style={{ fontSize: 13, color: "#555", }}>Deadline: {job.deadline}</span>
          )}

          <span
            style={{
              fontWeight: "bold",
              color: isInactive ? "red" : "green",
            }}
          >
            Status: {isInactive ? "Inactive" : "Active"}
          </span>
        </div>

        <div style={{ fontSize: 12, color: "#666", marginBottom: 6 }}>
          <span>Vacancies: {job.vacancies}</span>
          <span style={{ marginLeft: 8 }}>Applicants: {job.applicants}</span>
        </div>

        {/* {textPreview && (
          <div style={{ fontSize: 13, color: "#444", marginBottom: 10 }}>
            {textPreview}...
          </div>
        )} */}

        {/* REWARD */}

        <div className="reward-line">
          <span className="reward-badge">
            {normalizeReward(job.rewardCandidateUSD)}
          </span>

          <span className="reward-badge secondary">
            {normalizeInterviewReward(job.rewardInterviewUSD)}
          </span>

          {job.bonus && <span className="job-bonus">{job.bonus}</span>}
        </div>

        {/* ACTIONS */}
        <div className="job-actions">
          {role === "admin" && (
            <>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onEdit(job);
                }}
              >
                Edit
              </button>

              <button
                className="danger"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onDelete(job);
                }}
              >
                Delete
              </button>

              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onToggleStatus(job);
                }}
              >
                {job.status === "Active" ? "Pause" : "Resume"}
              </button>
            </>
          )}

          {role === "recruiter" && (
            <>
              {/* <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onSharedJob(job);
                }}
              >
                Share
              </button> */}
              <button
                className="primary"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onSubmitCandidate(job);
                }}
              >
                Submit
              </button>
            </>
          )}
        </div>
      </Link>
    </div>
  );
}
