import React, { useState, useEffect } from "react";
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

const asArray = (v) => (Array.isArray(v) ? v : []);
const getJobId = (job) => job?._id || job?.id;

export default function Dashboard() {
  const { user } = useAuth();
  const recruiterId = user?._id || user?.id || user?.email;

  const [jobs, setJobs] = useState([]);
  const [savedJobIds, setSavedJobIds] = useState(new Set());
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const jobsRes = await fetchAllJobs();
      const jobsArr = asArray(jobsRes?.jobs).map(j => ({
        ...j,
        _id: getJobId(j),
      }));
      setJobs(jobsArr);
      setLoading(false);
    })();
  }, [user]);

  const uploadCV = async () => {
    setUploadingCV(true);
    try {
      const res = await uploadFile(cvFile);
      return res?.publicUrl || null;
    } finally {
      setUploadingCV(false);
    }
  };

  const handleSubmitCandidate = async () => {
    if (!cvFile) return alert("Please upload CV");
    try {
      setIsSubmitting(true);
      const cvUrl = await uploadCV();
      if (!cvUrl) return alert("CV upload failed");

      await createSubmissionL({
        jobId: selectedJob._id,
        recruiterId,
        ...candidateForm,
        cvUrl,
      });

      alert("Candidate submitted successfully");
      setShowSubmit(false);
      setCvFile(null);
    } catch {
      alert("Submit failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="dashboard-container">
      <h2>Active Jobs</h2>

      {loading ? <p>Loading...</p> : (
        <div className="job-list">
          {jobs.map(job => (
            <div key={job._id} className="job-card">
              <div className="job-card-header">
                <div>
                  <h3>{job.title}</h3>
                  <p>{job.company}</p>
                </div>
                <button
                  className={`save-btn ${job.isSaved ? "saved" : ""}`}
                >★</button>
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

      {showSubmit && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Submit Candidate</h3>

            <div className="form-grid">
              {[
                ["Candidate Name","candidateName"],
                ["Email","candidateEmail"],
                ["Phone","candidatePhone"],
                ["LinkedIn","linkedin"],
                ["Portfolio","portfolio"],
              ].map(([label,key]) => (
                <div className="form-group" key={key}>
                  <label>{label}</label>
                  <input
                    value={candidateForm[key]}
                    onChange={e =>
                      setCandidateForm(f => ({ ...f, [key]: e.target.value }))
                    }
                  />
                </div>
              ))}

              <div className="form-group full">
                <label>Suitability</label>
                <textarea
                  value={candidateForm.suitability}
                  onChange={e =>
                    setCandidateForm(f => ({ ...f, suitability: e.target.value }))
                  }
                />
              </div>

              <div className="form-group full">
                <label>CV (PDF / DOC)</label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={e => setCvFile(e.target.files[0])}
                />
              </div>
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
