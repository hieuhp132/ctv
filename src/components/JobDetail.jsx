import React, { useEffect, useMemo, useState } from "react";
import {
  getJobByIdL,
  createSubmissionL,
  listSubmissions,
  listArchivedSubmissions,
  updateJobL,
  getListFiles,
  uploadFile,
} from "../api";
import { useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import FilesView from "./FilesView";
import FileUploader from "./FileUploader";
import "./JobDetail.css";

export default function JobDetail() {
  const { id } = useParams();
  const { user } = useAuth();

  const isCTV = user?.role === "recruiter";
  const isAdmin = user?.role === "admin";
  const ctvId = useMemo(() => user?.email || user?.id || "CTV", [user]);

  const [job, setJob] = useState(null);
  const [open, setOpen] = useState(false);
  const [groupedOffers, setGroupedOffers] = useState([]);
  const [jdPublicUrl, setJdPublicUrl] = useState(null);
  const [file, setFile] = useState(null);

  // ===== Submit candidate states (GIỐNG DASHBOARD) =====
  const [cvFile, setCvFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingCV, setUploadingCV] = useState(false);

  const [candidateForm, setCandidateForm] = useState({
    candidateName: "",
    candidateEmail: "",
    candidatePhone: "",
    linkedin: "",
    portfolio: "",
    suitability: "",
  });

  // ===== Fetch job =====
  useEffect(() => {
    getJobByIdL(id).then((data) => {
      setJob(data.job);
    });
  }, [id]);

  // ===== Fetch JD file =====
  useEffect(() => {
    if (!job) return;

    getListFiles().then((files) => {
      const matched = files?.find(
        (f) =>
          decodeURIComponent(f.publicUrl.split("/").pop()) ===
          decodeURIComponent(job.jdLink?.split("/").pop() || "")
      );
      setJdPublicUrl(matched?.publicUrl || null);
      setFile(matched?.name || null);
    });
  }, [job?.jdLink]);

  // ===== Admin upload JD =====
  const handleFileUploadSuccess = async (fileData) => {
    const updatedJob = await updateJobL({
      _id: id,
      jdLink: fileData.publicUrl,
    });
    setJob(updatedJob);
    setJdPublicUrl(fileData.publicUrl);
  };

  // ===== Admin fetch submissions =====
  useEffect(() => {
    if (!isAdmin) return;
    Promise.all([listSubmissions(), listArchivedSubmissions()]).then(
      ([subs, arch]) => {
        const all = [...subs, ...arch].filter(
          (s) => String(s.jobId) === String(id)
        );
        setGroupedOffers(all);
      }
    );
  }, [id, isAdmin]);

  // ===== Upload CV (GIỐNG DASHBOARD) =====
  const uploadCV = async () => {
    setUploadingCV(true);
    try {
      const res = await uploadFile(cvFile);
      return res?.publicUrl;
    } finally {
      setUploadingCV(false);
    }
  };

  // ===== Submit Candidate (GIỐNG DASHBOARD) =====
  const handleSubmitCandidate = async () => {
    if (!cvFile) {
      alert("Please upload CV");
      return;
    }

    try {
      setIsSubmitting(true);

      const cvUrl = await uploadCV();
      if (!cvUrl) {
        alert("Upload CV failed");
        return;
      }

      await createSubmissionL({
        jobId: id,
        recruiterId: ctvId,
        ...candidateForm,
        cvUrl,
        bonus: job.bonus,
      });

      alert("Candidate submitted successfully!");

      setCandidateForm({
        candidateName: "",
        candidateEmail: "",
        candidatePhone: "",
        linkedin: "",
        portfolio: "",
        suitability: "",
      });
      setCvFile(null);
      setOpen(false);
    } catch (err) {
      console.error(err);
      alert("Submit failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!job) return <p className="loading">Loading...</p>;

  const section = (title, html) => (
    <section className="job-section">
      <h4>{title}</h4>
      <div
        className="job-html-content"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </section>
  );

  return (
    <div className="dashboard-container job-detail">
      <header className="page-header">
        <h2>{job.title || "Untitled Job"}</h2>
      </header>

      {job.keywords?.length > 0 && (
        <div className="job-tags">
          {job.keywords.map((k) => (
            <span key={k}>{k}</span>
          ))}
        </div>
      )}

      <div className="job-layout">
        {/* LEFT */}
        <div>
          <div className="job-info-grid">
            <div className="info-box">
              <strong>Salary</strong>
              <span>{job.salary || "N/A"}</span>
            </div>
            <div className="info-box">
              <strong>Location</strong>
              <span>{job.location || "N/A"}</span>
            </div>
            <div className="info-box">
              <strong>Reward</strong>
              <span>{job.rewardCandidateUSD ?? 0} USD</span>
            </div>
          </div>

          {section(
            "Job Overview And Responsibility",
            job.jobsdetail?.description || "<p>No description provided</p>"
          )}
          {section(
            "Required Skills and Experience",
            job.jobsdetail?.requirements ||
              job.jobsdetail?.requirement ||
              job.requirement ||
              "<p>No requirements listed</p>"
          )}
          {section(
            "Why Candidate should apply this position",
            job.jobsdetail?.benefits || "<p>No benefits listed</p>"
          )}
          {section(
            "Other",
            job.jobsdetail?.other || job.other || "<p>No specific notice</p>"
          )}
        </div>

        {/* RIGHT */}
        <aside className="job-sidebar">
          {isCTV && (
            <div className="card">
              <button className="primary" onClick={() => setOpen(true)}>
                Submit candidate
              </button>
              <FilesView publicUrl={jdPublicUrl} name={file} />
            </div>
          )}

          {isAdmin && (
            <div className="card admin">
              <h4>Admin: Manage JD File</h4>
              <FilesView publicUrl={jdPublicUrl} name={file} />
              <div style={{ height: 12 }} />
              <FileUploader onUploadSuccess={handleFileUploadSuccess} />
            </div>
          )}
        </aside>
      </div>

      {/* ===== Submit Candidate Modal (GIỐNG DASHBOARD) ===== */}
      {open && (
        <div className="modal-overlay" onClick={() => setOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Submit Candidate – {job.title}</h3>

            {[
              "candidateName",
              "candidateEmail",
              "candidatePhone",
              "linkedin",
              "portfolio",
            ].map((key) => (
              <div key={key} className="form-group">
                <label>
                  {key
                    .replace(/([A-Z])/g, " $1")
                    .replace(/^./, (s) => s.toUpperCase())}
                </label>
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
                rows={3}
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
              <label>CV (PDF/DOC)</label>
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
              <button onClick={() => setOpen(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
