import React, { useState } from "react";
import { uploadFile, createSubmissionL } from "../services/api.js";
import "./SubmitCandidateModal.css";

const EMPTY_FORM = {
  candidateName: "",
  candidateEmail: "",
  candidatePhone: "",
  linkedin: "",
  portfolio: "",
  suitability: "",
};

export default function SubmitCandidateModal({
  open,
  onClose,
  job,
  recruiterId,
  onSuccess,
}) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [cvFile, setCvFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!open || !job) return null;

  const uploadCV = async () => {
    setUploading(true);
    try {
      const res = await uploadFile(cvFile);
      return res?.publicUrl;
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!cvFile) return alert("Please upload CV");

    try {
      setSubmitting(true);
      const cvUrl = await uploadCV();
      if (!cvUrl) throw new Error("Upload failed");

      await createSubmissionL({
        jobId: job._id,
        recruiterId,
        ...form,
        cvUrl,
      });

      alert("Candidate submitted successfully");
      setForm(EMPTY_FORM);
      setCvFile(null);
      onSuccess?.();
      onClose();
    } catch (e) {
      alert("Submit failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h3>Submit Candidate – {job.title}</h3>

        {Object.keys(EMPTY_FORM).map((key) =>
          key === "suitability" ? (
            <div className="form-group" key={key}>
              <label>Suitability</label>
              <textarea
                value={form[key]}
                onChange={(e) =>
                  setForm((f) => ({ ...f, [key]: e.target.value }))
                }
              />
            </div>
          ) : (
            <div className="form-group" key={key}>
              <label>
                {key
                  .replace(/([A-Z])/g, " $1")
                  .replace(/^./, (c) => c.toUpperCase())}
              </label>
              <input
                value={form[key]}
                onChange={(e) =>
                  setForm((f) => ({ ...f, [key]: e.target.value }))
                }
              />
            </div>
          ),
        )}

        {/* ✅ CUSTOM FILE UPLOAD (FIX LANGUAGE ISSUE) */}
        <div className="form-group">
          <label>CV (PDF / DOC)</label>

          <div className="custom-file-upload">
            <input
              type="file"
              id="cv-upload"
              accept=".pdf,.doc,.docx"
              hidden
              onChange={(e) => setCvFile(e.target.files[0])}
            />

            <label htmlFor="cv-upload" className="upload-btn">
              Upload CV
            </label>

            <span className="file-name">
              {cvFile ? cvFile.name : "No file selected"}
            </span>
          </div>
        </div>

        <div className="modal-actions">
          <button onClick={handleSubmit} disabled={uploading || submitting}>
            {uploading ? "Uploading..." : "Submit"}
          </button>
          <button onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
