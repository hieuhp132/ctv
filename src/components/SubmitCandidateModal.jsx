import { useEffect, useId, useState } from "react";
import { FileText, FileUp, Link2, LoaderCircle, UserRound, X } from "lucide-react";
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

const isResumeFile = (file) => /\.(pdf|doc|docx)$/i.test(file?.name || "");

export default function SubmitCandidateModal({
  open,
  onClose,
  job,
  recruiterId,
  onSuccess,
}) {
  const formId = useId();
  const [form, setForm] = useState(EMPTY_FORM);
  const [cvFile, setCvFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return undefined;

    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !submitting) onClose();
    };

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose, submitting]);

  if (!open || !job) return null;

  const closeModal = () => {
    if (submitting) return;
    setForm(EMPTY_FORM);
    setCvFile(null);
    setError("");
    onClose();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!cvFile) {
      setError("Attach the candidate’s CV before submitting.");
      return;
    }

    try {
      setError("");
      setSubmitting(true);
      setUploading(true);
      const upload = await uploadFile(cvFile);
      setUploading(false);
      if (!upload?.publicUrl) throw new Error("The CV upload did not return a file URL. Please try again.");

      await createSubmissionL({
        jobId: job._id,
        recruiterId,
        ...form,
        cvUrl: upload.publicUrl,
      });

      setForm(EMPTY_FORM);
      setCvFile(null);
      onSuccess?.();
      onClose();
    } catch (submitError) {
      console.error("Candidate submission failed:", submitError);
      setError(submitError.message || "We couldn’t submit this candidate. Please try again.");
    } finally {
      setUploading(false);
      setSubmitting(false);
    }
  };

  const updateField = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  return (
    <div
      className="submit-candidate-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) closeModal();
      }}
    >
      <section
        className="submit-candidate-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${formId}-title`}
        aria-describedby={`${formId}-description`}
      >
        <header className="submit-candidate-modal__header">
          <div className="submit-candidate-modal__title-icon" aria-hidden="true">
            <UserRound size={21} />
          </div>
          <div className="submit-candidate-modal__heading">
            <span className="submit-candidate-modal__eyebrow">CANDIDATE REFERRAL</span>
            <h2 id={`${formId}-title`}>Submit a candidate</h2>
            <p id={`${formId}-description`}>Add candidate details for this opportunity.</p>
          </div>
          <button
            className="submit-candidate-modal__close"
            type="button"
            onClick={closeModal}
            disabled={submitting}
            aria-label="Close form"
          >
            <X size={19} />
          </button>
        </header>

        <div className="submit-candidate-job">
          <span className="submit-candidate-job__icon"><Link2 size={16} /></span>
          <span>
            <small>SUBMITTING FOR</small>
            <strong>{job.title || "Open position"}</strong>
            <em>{job.company || "Company not specified"}</em>
          </span>
        </div>

        <form className="submit-candidate-form" onSubmit={handleSubmit}>
          <div className="submit-candidate-form__section">
            <div className="submit-candidate-form__section-heading">
              <span className="submit-candidate-form__section-icon"><UserRound size={16} /></span>
              <div>
                <h3>Candidate details</h3>
                <p>Contact information to follow up on the referral.</p>
              </div>
            </div>

            <div className="submit-candidate-form__grid">
              <div className="submit-candidate-field">
                <label htmlFor={`${formId}-name`}>Full name <span>*</span></label>
                <input
                  id={`${formId}-name`}
                  name="candidateName"
                  value={form.candidateName}
                  onChange={updateField}
                  placeholder="e.g. Alex Morgan"
                  autoComplete="name"
                  required
                />
              </div>
              <div className="submit-candidate-field">
                <label htmlFor={`${formId}-email`}>Email address <span>*</span></label>
                <input
                  id={`${formId}-email`}
                  type="email"
                  name="candidateEmail"
                  value={form.candidateEmail}
                  onChange={updateField}
                  placeholder="alex@example.com"
                  autoComplete="email"
                  required
                />
              </div>
              <div className="submit-candidate-field">
                <label htmlFor={`${formId}-phone`}>Phone number <small>OPTIONAL</small></label>
                <input
                  id={`${formId}-phone`}
                  type="tel"
                  name="candidatePhone"
                  value={form.candidatePhone}
                  onChange={updateField}
                  placeholder="+1 (555) 000-0000"
                  autoComplete="tel"
                />
              </div>
              <div className="submit-candidate-field">
                <label htmlFor={`${formId}-linkedin`}>LinkedIn profile <small>OPTIONAL</small></label>
                <input
                  id={`${formId}-linkedin`}
                  type="url"
                  name="linkedin"
                  value={form.linkedin}
                  onChange={updateField}
                  placeholder="https://linkedin.com/in/..."
                />
              </div>
              <div className="submit-candidate-field submit-candidate-field--full">
                <label htmlFor={`${formId}-portfolio`}>Portfolio or personal website <small>OPTIONAL</small></label>
                <input
                  id={`${formId}-portfolio`}
                  type="url"
                  name="portfolio"
                  value={form.portfolio}
                  onChange={updateField}
                  placeholder="https://"
                />
              </div>
              <div className="submit-candidate-field submit-candidate-field--full">
                <label htmlFor={`${formId}-suitability`}>Why are they a good fit? <small>OPTIONAL</small></label>
                <textarea
                  id={`${formId}-suitability`}
                  name="suitability"
                  value={form.suitability}
                  onChange={updateField}
                  placeholder="Share a short note about their relevant experience and strengths..."
                  rows={3}
                />
              </div>
            </div>
          </div>

          <div className="submit-candidate-form__section submit-candidate-form__section--cv">
            <div className="submit-candidate-form__section-heading">
              <span className="submit-candidate-form__section-icon"><FileText size={16} /></span>
              <div>
                <h3>Resume / CV <span>*</span></h3>
                <p>PDF or Word document.</p>
              </div>
            </div>
            <label
              className={`submit-candidate-upload${cvFile ? " has-file" : ""}`}
              htmlFor={`${formId}-cv`}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                const droppedFile = event.dataTransfer.files?.[0];
                if (!droppedFile) return;
                if (!isResumeFile(droppedFile)) {
                  setCvFile(null);
                  setError("Please choose a PDF, DOC, or DOCX file.");
                  return;
                }
                setCvFile(droppedFile);
                setError("");
              }}
            >
              <input
                id={`${formId}-cv`}
                type="file"
                accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={(event) => {
                  const selectedFile = event.target.files?.[0] || null;
                  if (selectedFile && !isResumeFile(selectedFile)) {
                    setCvFile(null);
                    setError("Please choose a PDF, DOC, or DOCX file.");
                    return;
                  }
                  setCvFile(selectedFile);
                  setError("");
                }}
                disabled={submitting}
              />
              <span className="submit-candidate-upload__icon"><FileUp size={20} /></span>
              <span className="submit-candidate-upload__text">
                <strong>{cvFile ? cvFile.name : "Choose a file or drag it here"}</strong>
                <small>{cvFile ? `${(cvFile.size / (1024 * 1024)).toFixed(2)} MB · Ready to upload` : "PDF, DOC or DOCX"}</small>
              </span>
              <span className="submit-candidate-upload__button">Browse files</span>
            </label>
          </div>

          {error && <p className="submit-candidate-error" role="alert">{error}</p>}

          <footer className="submit-candidate-modal__footer">
            <p>Candidate details are only shared with the hiring team.</p>
            <div className="submit-candidate-modal__actions">
              <button className="submit-candidate-button submit-candidate-button--secondary" type="button" onClick={closeModal} disabled={submitting}>
                Cancel
              </button>
              <button className="submit-candidate-button submit-candidate-button--primary" type="submit" disabled={submitting}>
                {submitting ? <><LoaderCircle className="submit-candidate-spinner" size={17} />{uploading ? "Uploading CV…" : "Submitting…"}</> : "Submit candidate"}
              </button>
            </div>
          </footer>
        </form>
      </section>
    </div>
  );
}
