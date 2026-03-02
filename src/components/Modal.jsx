import React, { useEffect, useRef, useState } from "react";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import { QUILL_MODULES, QUILL_FORMATS } from "./editor/quillConfig.js";

export default function Modal({
  open,
  editingJob,
  jobForm,
  setJobForm,
  onSubmit,
  onClose,
}) {
  const titleRef = useRef(null);
  const [isDirty, setIsDirty] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");

  useEffect(() => {
    if (open) {
      setIsDirty(false);
      setActiveTab("basic"); // Reset về tab đầu khi mở
      setTimeout(() => titleRef.current?.focus(), 100);
    }
  }, [open]);

  if (!open) return null;

  const onChangeField = (e) => {
    const { name, value } = e.target;
    setIsDirty(true);
    setJobForm((prev) => ({ ...prev, [name]: value }));
  };

  const onChangeQuill = (field, value) => {
    setIsDirty(true);
    setJobForm((prev) => {
      const mapped = field === "requirements" ? "requirement" : field;
      const jd = { ...(prev.jobsdetail || {}), [mapped]: value };
      return { ...prev, jobsdetail: jd };
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Chuyển đổi các trường cần thiết sang Number khi submit
    onSubmit(jobForm);
  };

  const handleClose = () => {
    if (isDirty && !window.confirm("Discard changes?")) return;
    onClose();
  };

  return (
    <div style={overlayStyle}>
      {console.log("debug:", jobForm)}
      <div style={modalStyle}>
        {/* Header */}
        <div style={modalHeader}>
          <h3 style={{ margin: 0 }}>
            {editingJob ? "📝 Edit Job" : "✨ New Job Posting"}
          </h3>
          <button onClick={handleClose} style={closeButton}>
            &times;
          </button>
        </div>

        {/* Tab Navigation */}
        <div style={tabContainer}>
          <button
            type="button"
            style={activeTab === "basic" ? activeTabStyle : tabStyle}
            onClick={() => setActiveTab("basic")}
          >
            General Info
          </button>
          <button
            type="button"
            style={activeTab === "details" ? activeTabStyle : tabStyle}
            onClick={() => setActiveTab("details")}
          >
            Job Content
          </button>
        </div>

        <form onSubmit={handleSubmit} style={formContainer}>
          {/* TAB 1: BASIC INFO */}
          <div
            style={{
              display: activeTab === "basic" ? "flex" : "none",
              flexDirection: "column",
              gap: 16,
            }}
          >
            <div style={formGroupFull}>
              <label style={labelStyle}>Job Title *</label>
              <input
                ref={titleRef}
                name="title"
                value={jobForm.title}
                onChange={onChangeField}
                placeholder="e.g. Senior Frontend Developer"
                style={inputStyle}
                required
              />
            </div>

            <div style={inputGrid}>
              <div style={formGroup}>
                <label style={labelStyle}>Company *</label>
                <input
                  name="company"
                  value={jobForm.company}
                  onChange={onChangeField}
                  placeholder="Company name"
                  style={inputStyle}
                  required
                />
              </div>
              <div style={formGroup}>
                <label style={labelStyle}>Location *</label>
                <input
                  name="location"
                  value={jobForm.location}
                  onChange={onChangeField}
                  placeholder="City, Country"
                  style={inputStyle}
                  required
                />
              </div>
              <div style={formGroup}>
                <label style={labelStyle}>Salary *</label>
                <input
                  name="salary"
                  value={jobForm.salary}
                  onChange={onChangeField}
                  placeholder="e.g. $2000 - $4000"
                  style={inputStyle}
                  required
                />
              </div>
              <div style={formGroup}>
                <label style={labelStyle}>Deadline</label>
                <input
                  name="deadline"
                  value={jobForm.deadline}
                  onChange={onChangeField}
                  placeholder="YYYY-MM-DD"
                  style={inputStyle}
                />
              </div>
              <div style={formGroup}>
                <label style={labelStyle}>Reward Candidate (USD)</label>
                <input
                  type="text"
                  name="rewardCandidateUSD"
                  value={jobForm.rewardCandidateUSD}
                  onChange={onChangeField}
                  placeholder="0"
                  style={inputStyle}
                />
              </div>
              <div style={formGroup}>
                <label style={labelStyle}>Reward Interview (USD)</label>
                <input
                  type="text"
                  name="rewardInterviewUSD"
                  value={jobForm.rewardInterviewUSD}
                  onChange={onChangeField}
                  placeholder="0"
                  style={inputStyle}
                />
              </div>
              <div style={formGroup}>
                <label style={labelStyle}>Vacancies</label>
                <input
                  type="text"
                  name="vacancies"
                  value={jobForm.vacancies}
                  onChange={onChangeField}
                  placeholder="0"
                  style={inputStyle}
                />
              </div>
              <div style={formGroup}>
                <label style={labelStyle}>Applicants</label>
                <input
                  type="text"
                  name="applicants"
                  value={jobForm.applicants}
                  onChange={onChangeField}
                  placeholder="0"
                  style={inputStyle}
                />
              </div>
            </div>

            <div style={formGroupFull}>
              <label style={labelStyle}>Keywords</label>
              <input
                name="keywords"
                value={jobForm.keywords}
                onChange={onChangeField}
                placeholder="React, Node, AWS..."
                style={inputStyle}
              />
            </div>
          </div>

          {/* TAB 2: RICH TEXT EDITORS */}
          <div
            style={{
              display: activeTab === "details" ? "flex" : "none",
              flexDirection: "column",
              gap: 20,
            }}
          >
            <div style={quillGroup}>
              <label style={labelStyle}>Description</label>
              <ReactQuill
                value={jobForm.jobsdetail?.description}
                onChange={(v) => onChangeQuill("description", v)}
                modules={QUILL_MODULES}
                formats={QUILL_FORMATS}
              />
            </div>
            <div style={quillGroup}>
              <label style={labelStyle}>Requirements</label>
              <ReactQuill
                value={jobForm.jobsdetail?.requirement}
                onChange={(v) => onChangeQuill("requirements", v)}
                modules={QUILL_MODULES}
                formats={QUILL_FORMATS}
              />
            </div>
            <div style={quillGroup}>
              <label style={labelStyle}>Benefits</label>
              <ReactQuill
                value={jobForm.jobsdetail?.benefits}
                onChange={(v) => onChangeQuill("benefits", v)}
                modules={QUILL_MODULES}
                formats={QUILL_FORMATS}
              />
            </div>
            <div style={quillGroup}>
              <label style={labelStyle}>Other</label>
              <ReactQuill
                value={jobForm.jobsdetail?.other}
                onChange={(v) => onChangeQuill("other", v)}
                modules={QUILL_MODULES}
                formats={QUILL_FORMATS}
              />
            </div>
          </div>

          {/* Footer */}
          <div style={modalFooter}>
            <button type="button" onClick={handleClose} style={cancelBtn}>
              Cancel
            </button>
            <button type="submit" style={submitBtn}>
              {editingJob ? "Save Changes" : "Create Job"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ================= STYLES ================= */
const overlayStyle = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,.6)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1000,
  backdropFilter: "blur(2px)",
};

const modalStyle = {
  background: "#fff",
  borderRadius: 12,
  width: 750,
  maxHeight: "90vh",
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
  boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
};

const modalHeader = {
  padding: "16px 24px",
  borderBottom: "1px solid #eee",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

const tabContainer = {
  display: "flex",
  background: "#f9f9f9",
  borderBottom: "1px solid #eee",
};
const tabStyle = {
  flex: 1,
  padding: "12px",
  border: "none",
  background: "none",
  cursor: "pointer",
  color: "#666",
  fontWeight: "500",
};
const activeTabStyle = {
  ...tabStyle,
  color: "#007bff",
  borderBottom: "2px solid #007bff",
  background: "#fff",
};

const formContainer = { padding: "24px", overflowY: "auto", flex: 1 };
const inputGrid = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "16px",
};
const formGroup = { display: "flex", flexDirection: "column", gap: 4 };
const formGroupFull = { display: "flex", flexDirection: "column", gap: 4 };

const labelStyle = { fontSize: "13px", fontWeight: "600", color: "#555" };
const inputStyle = {
  padding: "10px",
  borderRadius: "6px",
  border: "1px solid #ccc",
  fontSize: "14px",
};
const quillGroup = { display: "flex", flexDirection: "column", gap: 8 };

const modalFooter = {
  padding: "16px 24px",
  borderTop: "1px solid #eee",
  display: "flex",
  justifyContent: "flex-end",
  gap: 12,
};
const cancelBtn = {
  padding: "8px 16px",
  borderRadius: "6px",
  border: "1px solid #ccc",
  background: "#fff",
  cursor: "pointer",
  color: "#374151",
};
const submitBtn = {
  padding: "8px 16px",
  borderRadius: "6px",
  border: "none",
  background: "#007bff",
  color: "#fff",
  cursor: "pointer",
  fontWeight: "600",
};
const closeButton = {
  background: "none",
  border: "none",
  fontSize: "20px",
  cursor: "pointer",
  color: "#999",
};
