import React, { useState, useEffect, useMemo } from "react";
import "./Dashboard.css";
import {
  fetchAllJobs,
  fetchSavedJobsL,
  saveJobL,
  unsaveJobL,
  createSubmissionL,
  uploadFile,
} from "../api";
import { useAuth } from "../context/AuthContext";
import Icons from "./Icons";

/* ================= HELPERS ================= */
const asArray = (v) => (Array.isArray(v) ? v : []);
const getJobId = (job) => job?._id || job?.id;

/* ================= COMPONENT ================= */
export default function Dashboard() {
  const { user } = useAuth();
  const recruiterId = user?._id || user?.id || user?.email;

  const [jobs, setJobs] = useState([]);
  const [savedJobIds, setSavedJobIds] = useState(new Set());
  const [loading, setLoading] = useState(true);

  /* ===== SUBMIT MODAL ===== */
  const [showSubmit, setShowSubmit] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingCV, setUploadingCV] = useState(false);
  const [cvFile, setCvFile] = useState(null);

  const [candidateForm, setCandidateForm] = useState({
    candidateName: "",
    candidateEmail: "",
    candidatePhone: "",
    linkedin: "",
    portfolio: "",
    suitability: "",
  });

  /* ================= LOAD DATA ================= */
  const loadData = async () => {
    setLoading(true);
    try {
      const jobsRes = await fetchAllJobs();
      const jobsArray = asArray(jobsRes?.jobs).map((job) => ({
        ...job,
        _id: getJobId(job),
      }));

      let savedIds = new Set();
      if (recruiterId) {
        const savedRes = await fetchSavedJobsL(recruiterId);
        asArray(savedRes?.jobs).forEach((j) => {
          const id = j.jobId || j._id;
          if (id) savedIds.add(id);
        });
      }

      setSavedJobIds(savedIds);

      setJobs(
        jobsArray.map((job) => ({
          ...job,
          isSaved: savedIds.has(job._id),
        }))
      );
    } catch (err) {
      console.error("Load jobs failed", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  /* ================= SAVE / UNSAVE ================= */
  const handleSaveUnsaveJob = async (job) => {
    if (!recruiterId) return;
    const jobId = job._id;

    let next = new Set(savedJobIds);

    if (job.isSaved) {
      await unsaveJobL(jobId, recruiterId);
      next.delete(jobId);
    } else {
      await saveJobL(jobId, recruiterId);
      next.add(jobId);
    }

    setSavedJobIds(next);
    setJobs((prev) =>
      prev.map((j) =>
        j._id === jobId ? { ...j, isSaved: !j.isSaved } : j
      )
    );
  };

  /* ================= SUBMIT ================= */
  const uploadCV = async () => {
    if (!cvFile) return null;
    setUploadingCV(true);
    try {
      const res = await uploadFile(cvFile);
      console.log("UPLOAD RES:", res);
      return res?.url || null;
    } finally {
      setUploadingCV(false);
    }
  };

 const handleSubmitCandidate = async () => {
  if (!selectedJob || !recruiterId) return;

  if (!candidateForm.candidateName || !candidateForm.candidateEmail) {
    alert("Name & Email are required");
    return;
  }

  if (!cvFile) {
    alert("Please upload CV");
    return;
  }

  try {
    setIsSubmitting(true);

    // ✅ 1. Upload CV trước
    const uploadRes = await uploadCV();
    if (!uploadRes) {
      alert("CV upload failed");
      return;
    }

    const cvUrl = uploadRes.url; // 👈 FIX Ở ĐÂY

    // ✅ 2. Submit referral
    await createSubmissionL({
      job: selectedJob._id,
      recruiterId,
      ...candidateForm,
      cvUrl,
    });

    alert("Candidate submitted successfully");

    setShowSubmit(false);
    setCvFile(null);
    setCandidateForm({
      candidateName: "",
      candidateEmail: "",
      candidatePhone: "",
      linkedin: "",
      portfolio: "",
      suitability: "",
    });
  } catch (err) {
    console.error("SUBMIT ERROR:", err);
    alert("Submit failed");
  } finally {
    setIsSubmitting(false);
  }
};


  /* ================= RENDER ================= */
  return (
    <div className="dashboard-container">
      <h2>Active Jobs</h2>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="job-list">
          {jobs.map((job) => (
            <div key={job._id} className="job-card">
              <div className="job-card-header">
                <div>
                  <h3>{job.title}</h3>
                  <p>{job.company}</p>
                </div>

                <button
                  className={`save-btn ${job.isSaved ? "saved" : ""}`}
                  onClick={() => handleSaveUnsaveJob(job)}
                >
                  {job.isSaved ? "★" : "☆"}
                </button>
              </div>

              <div>📍 {job.location}</div>
              <div>💲 {job.salary || "N/A"}</div>

              <button
                className="submit-btn"
                onClick={() => {
                  setSelectedJob(job);
                  setShowSubmit(true);
                }}
              >
                Submit Candidate
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ================= SUBMIT MODAL ================= */}
      {showSubmit && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Submit Candidate</h3>

            {[
              ["Candidate Name", "candidateName"],
              ["Email", "candidateEmail"],
              ["Phone", "candidatePhone"],
              ["LinkedIn", "linkedin"],
              ["Portfolio", "portfolio"],
            ].map(([label, key]) => (
              <div className="form-group" key={key}>
                <label>{label}</label>
                <input
                  value={candidateForm[key]}
                  onChange={(e) =>
                    setCandidateForm((f) => ({
                      ...f,
                      [key]: e.target.value,
                    }))
                  }
                />
              </div>
            ))}

            <div className="form-group">
              <label>Suitability</label>
              <textarea
                rows={4}
                value={candidateForm.suitability}
                onChange={(e) =>
                  setCandidateForm((f) => ({
                    ...f,
                    suitability: e.target.value,
                  }))
                }
              />
            </div>

            <div className="form-group">
              <label>CV (PDF / DOC)</label>
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={(e) => setCvFile(e.target.files[0])}
              />
            </div>

            <div className="modal-actions">
              <button
                onClick={handleSubmitCandidate}
                disabled={isSubmitting || uploadingCV}
              >
                {uploadingCV
                  ? "Uploading CV..."
                  : isSubmitting
                  ? "Submitting..."
                  : "Submit"}
              </button>

              <button onClick={() => setShowSubmit(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <Icons />
    </div>
  );
}
