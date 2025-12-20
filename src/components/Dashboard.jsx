import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";
import {
  fetchAllJobs,
  fetchSavedJobsL,
  saveJobL,
  unsaveJobL,
  createSubmissionL,
} from "../api";
import { useAuth } from "../context/AuthContext";
import Icons from "./Icons";

/* ================== HELPERS ================== */
const asArray = (v) => (Array.isArray(v) ? v : []);
const getJobId = (job) => job?._id || job?.id;

/* ================== COMPONENT ================== */
export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const recruiterId = useMemo(
    () => user?.id || user?.email,
    [user]
  );

  const [jobs, setJobs] = useState([]);
  const [savedJobIds, setSavedJobIds] = useState(new Set());
  const [loading, setLoading] = useState(true);

  /* ===== SUBMIT STATE ===== */
  const [selectedJob, setSelectedJob] = useState(null);
  const [showSubmit, setShowSubmit] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [candidateForm, setCandidateForm] = useState({
    candidateName: "",
    candidateEmail: "",
    candidatePhone: "",
    cvUrl: "",
    linkedin: "",
    portfolio: "",
    suitability: "", // ✅ THÊM
  });

  /* ================== LOAD JOBS ================== */
  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      setLoading(true);
      try {
        const jobsRes = await fetchAllJobs();
        const jobsArray = asArray(jobsRes?.jobs).map((j) => ({
          ...j,
          _id: getJobId(j),
        }));

        let saved = new Set();
        if (recruiterId) {
          const savedRes = await fetchSavedJobsL(recruiterId);
          asArray(savedRes?.jobs).forEach((j) => {
            const id = j.jobId || j._id;
            if (id) saved.add(id);
          });
        }

        setSavedJobIds(saved);

        setJobs(
          jobsArray.map((j) => ({
            ...j,
            isSaved: saved.has(j._id),
          }))
        );
      } catch (err) {
        console.error("Load jobs failed", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user, recruiterId]);

  /* ================== SAVE / UNSAVE ================== */
  const handleSaveUnsaveJob = async (job) => {
    if (!recruiterId || !job?._id) return;

    const next = new Set(savedJobIds);

    try {
      if (job.isSaved) {
        await unsaveJobL(job._id, recruiterId);
        next.delete(job._id);
      } else {
        await saveJobL(job._id, recruiterId);
        next.add(job._id);
      }

      setSavedJobIds(next);
      setJobs((prev) =>
        prev.map((j) =>
          j._id === job._id ? { ...j, isSaved: !job.isSaved } : j
        )
      );
    } catch {
      alert("Save job failed");
    }
  };

  /* ================== SUBMIT HANDLER ================== */
  const handleSubmitCandidate = async () => {
    if (!selectedJob || !recruiterId) return;

    if (!candidateForm.candidateName || !candidateForm.candidateEmail) {
      alert("Candidate name & email are required");
      return;
    }

    try {
      setIsSubmitting(true);

      await createSubmissionL({
        job: selectedJob._id,
        recruiterId,
        ...candidateForm, // includes suitability
      });

      alert("Candidate submitted successfully");

      setShowSubmit(false);
      setSelectedJob(null);
      setCandidateForm({
        candidateName: "",
        candidateEmail: "",
        candidatePhone: "",
        cvUrl: "",
        linkedin: "",
        portfolio: "",
        suitability: "",
      });
    } catch (err) {
      console.error(err);
      alert("Submit failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ================== RENDER ================== */
  return (
    <div className="dashboard-container">
      <div className="dashboard-grid">
        <h2>Active Jobs</h2>

        {loading ? (
          <p>Loading jobs...</p>
        ) : (
          <div className="job-list">
            {jobs.map((job) => (
              <div
                key={job._id}
                className="job-card"
                onClick={() =>
                  window.open(`/job/${job._id}`, "_blank")
                }
              >
                <div className="job-card-header">
                  <div>
                    <h3>{job.title}</h3>
                    <p>{job.company}</p>
                  </div>

                  <button
                    className={`save-btn ${job.isSaved ? "saved" : ""}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSaveUnsaveJob(job);
                    }}
                  >
                    {job.isSaved ? "★" : "☆"}
                  </button>
                </div>

                <div>📍 {job.location}</div>
                <div>💲 {job.salary || "N/A"}</div>

                <button
                  className="submit-btn"
                  onClick={(e) => {
                    e.stopPropagation();
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
      </div>

      {/* ===== SUBMIT MODAL ===== */}
      {showSubmit && selectedJob && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Submit Candidate</h3>
            <p>
              <b>Job:</b> {selectedJob.title}
            </p>

            <input
              placeholder="Candidate Name"
              value={candidateForm.candidateName}
              onChange={(e) =>
                setCandidateForm((f) => ({
                  ...f,
                  candidateName: e.target.value,
                }))
              }
            />

            <input
              placeholder="Candidate Email"
              value={candidateForm.candidateEmail}
              onChange={(e) =>
                setCandidateForm((f) => ({
                  ...f,
                  candidateEmail: e.target.value,
                }))
              }
            />

            <input
              placeholder="Candidate Phone"
              value={candidateForm.candidatePhone}
              onChange={(e) =>
                setCandidateForm((f) => ({
                  ...f,
                  candidatePhone: e.target.value,
                }))
              }
            />

            <input
              placeholder="CV URL"
              value={candidateForm.cvUrl}
              onChange={(e) =>
                setCandidateForm((f) => ({
                  ...f,
                  cvUrl: e.target.value,
                }))
              }
            />

            <input
              placeholder="LinkedIn"
              value={candidateForm.linkedin}
              onChange={(e) =>
                setCandidateForm((f) => ({
                  ...f,
                  linkedin: e.target.value,
                }))
              }
            />

            <input
              placeholder="Portfolio"
              value={candidateForm.portfolio}
              onChange={(e) =>
                setCandidateForm((f) => ({
                  ...f,
                  portfolio: e.target.value,
                }))
              }
            />

            {/* ✅ SUITABILITY */}
            <textarea
              placeholder="Suitability / Why this candidate fits the job"
              value={candidateForm.suitability}
              onChange={(e) =>
                setCandidateForm((f) => ({
                  ...f,
                  suitability: e.target.value,
                }))
              }
              rows={4}
            />

            <div className="modal-actions">
              <button
                onClick={handleSubmitCandidate}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Submitting..." : "Submit"}
              </button>
              <button onClick={() => setShowSubmit(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <Icons />
    </div>
  );
}
