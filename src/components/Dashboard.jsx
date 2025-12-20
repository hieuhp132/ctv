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

/* ================== HELPERS ================== */
const asArray = (v) => (Array.isArray(v) ? v : []);
const getJobId = (job) => job?._id || job?.id;

/* ================== COMPONENT ================== */
export default function Dashboard() {
  const { user } = useAuth();
  const recruiterId = user?.id || user?.email;

  /* ---------- JOB STATES ---------- */
  const [jobs, setJobs] = useState([]);
  const [savedJobIds, setSavedJobIds] = useState(new Set());
  const [loading, setLoading] = useState(true);

  /* ---------- FILTER & PAGINATION ---------- */
  const [searchText, setSearchText] = useState("");
  const [filterLocation, setFilterLocation] = useState("");
  const [filterCompany, setFilterCompany] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 9;

  /* ---------- SUBMIT MODAL ---------- */
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

  /* ================== LOAD DATA ================== */
  useEffect(() => {
    if (!user) return;

    (async () => {
      setLoading(true);
      try {
        const jobsRes = await fetchAllJobs();
        const jobsArray = asArray(jobsRes?.jobs).map((j) => ({
          ...j,
          _id: getJobId(j),
        }));

        let savedIds = new Set();
        if (user?.email || user?.id) {
          const savedRes = await fetchSavedJobsL(user.email);
          asArray(savedRes?.jobs).forEach((j) => {
            const id = j.jobId || j._id;
            if (id) savedIds.add(id);
          });
        }

        setSavedJobIds(savedIds);

        setJobs(
          jobsArray.map((j) => ({
            ...j,
            isSaved: savedIds.has(j._id),
          }))
        );
      } catch (err) {
        console.error("Load jobs failed", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  /* ================== FILTER ================== */
  const CATEGORY_KEYWORDS = {
    Developer: ["dev", "developer", "engineer", "react", "node"],
    Data: ["data", "ml", "machine learning"],
    Designer: ["design", "ux", "ui"],
    Sales: ["sales", "business"],
    Marketing: ["marketing", "seo"],
    Manager: ["manager", "lead"],
  };

  const activeJobs = useMemo(() => {
    const today = new Date();
    return jobs.filter(
      (j) => j.status === "Active" && (!j.deadline || new Date(j.deadline) >= today)
    );
  }, [jobs]);

  const filteredJobs = useMemo(() => {
    const text = searchText.toLowerCase();
    return activeJobs.filter((job) => {
      const blob = `${job.title} ${job.company} ${job.location}`.toLowerCase();
      if (text && !blob.includes(text)) return false;
      if (filterLocation && job.location !== filterLocation) return false;
      if (filterCompany && job.company !== filterCompany) return false;

      if (filterCategory) {
        const title = job.title?.toLowerCase() || "";
        return CATEGORY_KEYWORDS[filterCategory]?.some((kw) =>
          title.includes(kw)
        );
      }
      return true;
    });
  }, [activeJobs, searchText, filterLocation, filterCompany, filterCategory]);

  const totalPages = Math.max(1, Math.ceil(filteredJobs.length / pageSize));
  const displayedJobs = filteredJobs.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  /* ================== SAVE / UNSAVE ================== */
  const handleSaveUnsaveJob = async (job) => {
    if (!recruiterId) return;
    try {
      const newSet = new Set(savedJobIds);

      if (job.isSaved) {
        await unsaveJobL(job._id, recruiterId);
        newSet.delete(job._id);
      } else {
        await saveJobL(job._id, recruiterId);
        newSet.add(job._id);
      }

      setSavedJobIds(newSet);
      setJobs((prev) =>
        prev.map((j) =>
          j._id === job._id ? { ...j, isSaved: !job.isSaved } : j
        )
      );
    } catch {
      alert("Save job failed");
    }
  };

  /* ================== SUBMIT CANDIDATE ================== */
  const uploadCV = async () => {
    setUploadingCV(true);
    try {
      const res = await uploadFile(cvFile);
      return res?.publicUrl;
    } finally {
      setUploadingCV(false);
    }
  };

  const handleSubmitCandidate = async () => {
    if (!cvFile) return alert("Please upload CV");
    try {
      setIsSubmitting(true);
      const cvUrl = await uploadCV();
      if (!cvUrl) return alert("Upload failed");

      await createSubmissionL({
        jobId: selectedJob._id,
        recruiterId,
        ...candidateForm,
        cvUrl,
      });

      alert("Candidate submitted");

      setCandidateForm({
        candidateName: "",
        candidateEmail: "",
        candidatePhone: "",
        linkedin: "",
        portfolio: "",
        suitability: "",
      });
      setCvFile(null);
      setShowSubmit(false);
    } catch {
      alert("Submit failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ================== RENDER ================== */
  return (
    <div className="dashboard-container">
      <h2>Active Jobs</h2>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="job-list">
          {displayedJobs.map((job) => (
            <div
              key={job._id}
              className="job-card"
              onClick={() => window.open(`/job/${job._id}`, "_blank")}
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
              {job.deadline && <div>⏰ Deadline: {new Date(job.deadline).toLocaleDateString()}</div>}
              {job.category && <div>🏷 Category: {job.category}</div>}

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

      {/* SUBMIT MODAL */}
      {showSubmit && selectedJob && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Submit Candidate – {selectedJob.title}</h3>

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
                    setCandidateForm((f) => ({ ...f, [key]: e.target.value }))
                  }
                />
              </div>
            ))}

            <div className="form-group">
              <label>Suitability</label>
              <textarea
                value={candidateForm.suitability}
                onChange={(e) =>
                  setCandidateForm((f) => ({ ...f, suitability: e.target.value }))
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
                {uploadingCV ? "Uploading..." : "Submit"}
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
