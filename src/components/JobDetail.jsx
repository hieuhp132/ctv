// src/components/JobDetail.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  getJobByIdL,
  createSubmission,
  listSubmissions,
  listArchivedSubmissions,
  updateJobJD,
  getListFiles,
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

  // Fetch job by ID
  useEffect(() => {
    getJobByIdL(id).then((data) => {
      setJob(data);
      console.log("Fetched Job Detail:", data);
    });
  }, [id]);

  // Fetch job JD file
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

  // Handle JD file upload (Admin)
  const handleFileUploadSuccess = (fileData) => {
    updateJobJD(id, { jdLink: fileData.publicUrl }).then(setJob);
    setJdPublicUrl(fileData.publicUrl);
  };

  // Fetch submissions (Admin)
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

  if (!job) return <p className="loading">Loading...</p>;

  // Candidate submission form
  const submit = async (e) => {
    e.preventDefault();
    const f = e.target;

    await createSubmission({
      candidateName: f[0].value,
      email: f[1].value,
      phone: f[2].value,
      cvFile: f[3].files[0],
      linkedin: f[4].value,
      portfolio: f[5].value,
      suitability: f[6].value,
      jobId: id,
      jobTitle: job.title,
      ctvId,
      bonus: job.bonus,
    });

    alert("Profile submitted successfully!");
    setOpen(false);
    f.reset();
  };

  // Section helper
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

      {/* Keywords / Tags */}
      {job.keywords?.length > 0 && (
        <div className="job-tags">
          {job.keywords.map((k) => (
            <span key={k}>{k}</span>
          ))}
        </div>
      )}

      <div className="job-layout">
        {/* LEFT COLUMN */}
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

          {/* Job Sections */}
          {section(
            "Job Overview And Responsibility",
            job.jobsdetail?.description || "<p>No description provided</p>"
          )}
          {section(
            "Required Skills and Experience",
            job.jobsdetail?.requirement || "<p>No requirements listed</p>"
          )}
          {section(
            "Why Candidate should apply this position",
            job.jobsdetail?.benefits || "<p>No benefits listed</p>"
          )}
          {section("Other", job.other || "<p>No specific notice</p>")}
        </div>

        {/* RIGHT SIDEBAR */}
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

      {/* Modal for candidate submission */}
      {open && (
        <div className="modal-overlay" onClick={() => setOpen(false)}>
          <form
            className="modal-form"
            onSubmit={submit}
            onClick={(e) => e.stopPropagation()}
          >
            <h3>Submit Candidate</h3>
            <input required placeholder="Candidate Name" />
            <input required type="email" placeholder="Email" />
            <input required placeholder="Phone" />
            <input required type="file" />
            <input placeholder="LinkedIn URL" />
            <input placeholder="Portfolio URL" />
            <textarea rows={3} placeholder="Why suitable?" required />
            <div className="modal-actions">
              <button type="submit">Submit</button>
              <button type="button" onClick={() => setOpen(false)}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
