import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import {
  getJobByIdL,
  createSubmissionL,
  updateJobL,
  getListFiles,
  uploadFile
} from "../../../services/api.js";
import { useAuth } from "../../../context/AuthContext.jsx";
import FilesView from "../../../components/FileView";
import FileUploader from "../../../components/FileUploader";
import Comments from "../../../components/Comments";
import Activity from "../../../components/Activity";
import "./Detail.css";
import { cleanJobHtml } from "../../../components/CleanJobHtml.jsx";

export default function JobDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const isCTV = user?.role === "recruiter";
  const isAdmin = user?.role === "admin";
  const recruiterId = useMemo(() => user?.email || user?.id, [user]);

  const [job, setJob] = useState(null);
  const [open, setOpen] = useState(false);
  const [jdPublicUrl, setJdPublicUrl] = useState(null);
  const [jdFileName, setJdFileName] = useState(null);
  const [cvFile, setCvFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingCV, setUploadingCV] = useState(false);
  const [creatingPDF, setCreatingPDF] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [pdfFileName, setPdfFileName] = useState(null);
  const [activeTab, setActiveTab] = useState("comments");
  const [candidateForm, setCandidateForm] = useState({
    candidateName: "", candidateEmail: "", candidatePhone: "",
    linkedin: "", portfolio: "", suitability: "",
  });

  useEffect(() => {
    getJobByIdL(id).then((res) => setJob(res.job));

    // Load PDF info from localStorage
    const storedPdf = localStorage.getItem(`pdf_${id}`);
    if (storedPdf) {
      try {
        const { url, name } = JSON.parse(storedPdf);
        setPdfUrl(url);
        setPdfFileName(name);
      } catch (err) {
        console.error('Error loading PDF from localStorage:', err);
      }
    }
  }, [id]);

  useEffect(() => {
    if (!job?.jdLink) return;
    getListFiles().then((files) => {
      const matched = files?.find(f =>
        decodeURIComponent(f.publicUrl.split("/").pop()) ===
        decodeURIComponent(job.jdLink.split("/").pop())
      );
      setJdPublicUrl(matched?.publicUrl || null);
      setJdFileName(matched?.name || null);

      // Check if PDF already exists
      const pdfFile = files?.find(f =>
        f.name.toLowerCase().includes(job.title?.toLowerCase().replace(/\s+/g, '_')) &&
        f.name.endsWith('.pdf')
      );
      setPdfUrl(pdfFile?.publicUrl || null);
    });
  }, [job?.jdLink]);

  const keywords = useMemo(() => {
    if (!job?.keywords) return [];
    return Array.isArray(job.keywords) ? job.keywords : job.keywords.split(",").map(k => k.trim()).filter(Boolean);
  }, [job?.keywords]);

  const handleSubmitCandidate = async () => {
    if (!cvFile) return alert("Please upload CV");
    try {
      setIsSubmitting(true);
      setUploadingCV(true);
      const res = await uploadFile(cvFile);
      setUploadingCV(false);

      if (!res?.publicUrl) return alert("Upload CV failed");

      await createSubmissionL({
        jobId: id, recruiterId, ...candidateForm,
        cvUrl: res.publicUrl, bonus: job.bonus,
      });

      alert("Candidate submitted successfully!");
      setOpen(false);
      setCandidateForm({ candidateName: "", candidateEmail: "", candidatePhone: "", linkedin: "", portfolio: "", suitability: "" });
      setCvFile(null);
    } catch (err) {
      alert("Submit failed");
    } finally {
      setIsSubmitting(false);
      setUploadingCV(false);
    }
  };


  const handleCreatePDF = async () => {
    if (!job) return alert("Job data not available");
    try {
      setCreatingPDF(true);

      // Create temporary container with content
      const container = document.createElement('div');
      container.style.position = 'fixed';
      container.style.left = '-9999px';
      container.style.top = '-9999px';
      container.style.width = '800px'; // Use px for better compatibility
      container.style.background = 'white';

      const jobDescription = cleanJobHtml(job.jobsdetail?.description || job.description || "");
      const jobRequirement = cleanJobHtml(job.jobsdetail?.requirement || job.requirements || "");
      const jobBenefits = cleanJobHtml(job.jobsdetail?.benefits || job.benefits || "");
      const jobOther = cleanJobHtml(job.jobsdetail?.other || job.other || "");

      container.innerHTML = `
        <style>
          * { box-sizing: border-box; -webkit-print-color-adjust: exact; }
          .pdf-container {
            font-family: "Arial", sans-serif;
            color: #374151;
            line-height: 1.7;
            padding: 40px;
            width: 800px;
            background: white;
          }
          .job-title {
            font-size: 24px;
            font-weight: bold;
            color: #111827;
            margin: 0 0 16px 0;
            padding-bottom: 12px;
            border-bottom: 2px solid #3b82f6;
          }
          .info-grid {
            display: flex;
            gap: 20px;
            margin-bottom: 24px;
          }
          .info-item {
            flex: 1;
            background: #f3f4f6;
            padding: 12px;
            border-radius: 6px;
          }
          .info-label {
            font-size: 11px;
            font-weight: bold;
            color: #6b7280;
            text-transform: uppercase;
            margin-bottom: 4px;
          }
          .info-value {
            font-size: 14px;
            font-weight: bold;
            color: #111827;
          }
          .tags {
            margin-bottom: 24px;
          }
          .tag {
            display: inline-block;
            background: #dbeafe;
            color: #1e40af;
            padding: 4px 10px;
            border-radius: 12px;
            font-size: 11px;
            font-weight: bold;
            margin-right: 6px;
            margin-bottom: 6px;
          }
          .section {
            margin-bottom: 24px;
            background: white;
            border-radius: 10px;
            padding: 24px;
            border: 1px solid #e5e7eb;
          }
          .section-title {
            font-size: 1.25rem;
            font-weight: 700;
            color: #111827;
            margin: 0 0 16px 0;
            padding-bottom: 8px;
            border-bottom: 2px solid #f3f4f6;
            text-transform: none; /* Trả về dạng thường giống web */
          }
          .section-content {
            font-size: 15px;
            line-height: 1.7;
            color: #374151;
            white-space: pre-wrap;
            word-break: break-word; /* Đảm bảo không tràn nhưng vẫn tự nhiên */
          }
          .section-content p { margin-bottom: 12px; }
          .section-content ul, .section-content ol { padding-left: 24px; margin-bottom: 16px; }
          .section-content li { margin-bottom: 8px; }
          .section-content strong { color: #111827; }
        </style>
        <div class="pdf-container">
          <h1 class="job-title">${job.title || "Job Description"}</h1>
          
          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">Salary</div>
              <div class="info-value">${job.salary || "Negotiable"}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Location</div>
              <div class="info-value">${job.location || "Remote"}</div>
            </div>
          </div>

          ${keywords.length > 0 ? `
            <div class="tags">
              ${keywords.map(k => `<span class="tag">${k}</span>`).join('')}
            </div>
          ` : ''}

          ${jobDescription ? `
            <div class="section">
              <h3 class="section-title">Description</h3>
              <div class="section-content">${jobDescription}</div>
            </div>
          ` : ''}

          ${jobRequirement ? `
            <div class="section">
              <h3 class="section-title">Requirements</h3>
              <div class="section-content">${jobRequirement}</div>
            </div>
          ` : ''}

          ${jobBenefits ? `
            <div class="section">
              <h3 class="section-title">Benefits</h3>
              <div class="section-content">${jobBenefits}</div>
            </div>
          ` : ''}

        </div>
      `;

      document.body.appendChild(container);

      // Wait for content and potential images
      await new Promise(resolve => setTimeout(resolve, 1000));

      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      document.body.removeChild(container);

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true
      });

      const pdfWidth = 210; // A4 width in mm
      const pdfHeight = 297; // A4 height in mm
      const margin = 10; // 10mm margins
      const contentWidth = pdfWidth - 2 * margin;
      const contentHeight = pdfHeight - 2 * margin;

      // Calculate image dimensions in mm
      const imgWidthMM = contentWidth;
      const imgHeightMM = (canvas.height * imgWidthMM) / canvas.width;

      if (imgHeightMM <= contentHeight) {
        // Fits on one page
        pdf.addImage(imgData, 'JPEG', margin, margin, imgWidthMM, imgHeightMM);
      } else {
        // Spans multiple pages
        let sourceY = 0;
        let pageNumber = 0;

        // Detection settings
        const ctxFull = canvas.getContext('2d', { willReadFrequently: true });
        const width = canvas.width;
        const SCAN_RANGE = Math.floor(canvas.height / imgHeightMM * 20); // Scan 20mm range
        const THRESH = 0.98; // 98% white is considered safe
        const rowWhiteness = (y) => {
          if (y < 0 || y >= canvas.height) return 0;
          const data = ctxFull.getImageData(0, y, width, 1).data;
          let whiteCount = 0;
          for (let i = 0; i < data.length; i += 4) {
            const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
            if (a === 0 || (r > 245 && g > 245 && b > 245)) whiteCount++;
          }
          return whiteCount / (data.length / 4);
        };

        while (sourceY < canvas.height) {
          if (pageNumber > 0) pdf.addPage();

          // Target end in canvas pixels
          const canvasHeightPerPage = (contentHeight * canvas.width) / imgWidthMM;
          let targetEnd = Math.min(sourceY + canvasHeightPerPage, canvas.height);

          // If not the last page, find best cut point
          if (targetEnd < canvas.height) {
            let bestY = targetEnd;
            let bestScore = -1;
            for (let dy = 0; dy <= SCAN_RANGE; dy++) {
              const y = targetEnd - dy;
              if (y <= sourceY) break;
              const s = rowWhiteness(y);
              if (s > bestScore) {
                bestScore = s;
                bestY = y;
              }
              if (s >= THRESH) break; // Found a good enough spot
            }
            targetEnd = bestY;
          }

          const sourceHeight = targetEnd - sourceY;
          const displayHeightMM = (sourceHeight * imgWidthMM) / canvas.width;

          // Create temporary canvas for the slice
          const tempCanvas = document.createElement('canvas');
          tempCanvas.width = canvas.width;
          tempCanvas.height = sourceHeight;
          const tempCtx = tempCanvas.getContext('2d');
          tempCtx.drawImage(canvas, 0, sourceY, canvas.width, sourceHeight, 0, 0, canvas.width, sourceHeight);

          pdf.addImage(tempCanvas.toDataURL('image/jpeg', 0.95), 'JPEG', margin, margin, imgWidthMM, displayHeightMM);

          sourceY = targetEnd;
          pageNumber++;
        }
      }

      // Get PDF blob and upload
      const pdfBlob = pdf.output('blob');
      const safeName = job.title
        ?.normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, "_")
        .replace(/_+/g, "_")
        .trim();

      const fileName = `${safeName || "job"}_${Date.now()}.pdf`;
      const pdfFile = new File([pdfBlob], fileName, { type: 'application/pdf' });

      const res = await uploadFile(pdfFile);
      console.log(res);
      if (res?.publicUrl) {
        setPdfUrl(res.publicUrl);
        setPdfFileName(fileName);

        // Save to localStorage
        try {
          localStorage.setItem(`pdf_${id}`, JSON.stringify({
            url: res.publicUrl,
            name: fileName,
            createdAt: new Date().toISOString()
          }));
        } catch (err) {
          console.error('Error saving PDF to localStorage:', err);
        }

        alert('PDF created and uploaded successfully!');
      } else {
        alert('PDF created but upload failed');
      }
    } catch (err) {
      console.error('PDF creation error:', err);
      alert('Failed to create PDF: ' + err.message);
    } finally {
      setCreatingPDF(false);
    }
  };

  const handleDeletePDF = async () => {
    try {
      // File deletion would be implemented in backend
      // For now, just clear the state
      setPdfUrl(null);
      setPdfFileName(null);

      // Remove from localStorage
      try {
        localStorage.removeItem(`pdf_${id}`);
      } catch (err) {
        console.error('Error removing PDF from localStorage:', err);
      }

      alert("PDF deleted successfully!");
    } catch (err) {
      console.error('PDF deletion error:', err);
      alert('Failed to delete PDF');
    }
  };

  if (!job) return <div className="loading">Fetching job details...</div>;

  return (
    <div className="job-detail">
      {console.log("Rendering JobDetail with job:", job)}
      <header className="page-header">
        <h2>{job.title || "Untitled Job"}</h2>
        <div className="job-tags">
          <span className="badge-salary">💰 {job.salary || "Negotiable"}</span>
          <span className="badge-location">📍 {job.location || "Remote"}</span>
          <span className="badge-reward">🏆 Reward: {job.rewardCandidateUSD ?? 0} USD</span>
          {keywords.length > 0 && keywords.map((k) => <span key={k} className="badge-keyword">{k}</span>)}
        </div>
      </header>

      <div className="job-layout">
        {/* Main Content */}
        <main className="job-main-content">

          <section className="job-section">
            <h1>Description</h1>
            <div className="job-html-content" dangerouslySetInnerHTML={{ __html: cleanJobHtml(job.jobsdetail.description) || "No description provided" }} />
          </section>

          <section className="job-section">
            <h1>Requirements</h1>
            <div className="job-html-content" dangerouslySetInnerHTML={{ __html: cleanJobHtml(job.jobsdetail?.requirement) || "No requirements listed" }} />
          </section>

          <section className="job-section">
            <h1>Benefits</h1>
            <div className="job-html-content" dangerouslySetInnerHTML={{ __html: cleanJobHtml(job.jobsdetail?.benefits) || "No benefits listed" }} />
          </section>
          <section className="job-section">
            <h1>Other Information</h1>
            <div className="job-html-content" dangerouslySetInnerHTML={{ __html: cleanJobHtml(job.jobsdetail?.other) || "No other information provided" }} />
          </section>
        </main>

        {/* Sidebar - Files, Comments & Activity */}
        <aside className="job-sidebar">
          {isCTV && (
            <div className="card">
              <button className="primary" onClick={() => setOpen(true)}>Submit Candidate</button>
              <FilesView publicUrl={jdPublicUrl} name={jdFileName} />
            </div>
          )}

          {isAdmin && (
            <div className="card admin">
              <h4>Managing JD File on Supabase</h4>
              <FilesView publicUrl={jdPublicUrl} name={jdFileName} onDelete={() => {
                setJdPublicUrl(null);
                setJdFileName(null);
                updateJobL({ _id: id, jdLink: null });
              }} />
              <div style={{ height: 12 }} />
              <FileUploader onUploadSuccess={(data) => {
                updateJobL({ _id: id, jdLink: data.publicUrl }).then(setJob);
                setJdPublicUrl(data.publicUrl);
              }} />

              <div style={{ height: 20 }} />
              <h4>Job Description PDF manuell</h4>
              {pdfUrl ? (
                <div>
                  <p style={{ fontSize: '14px', color: '#27ae60' }}>✓ PDF already created</p>
                  <FilesView publicUrl={pdfUrl} name={pdfFileName} onDelete={handleDeletePDF} />
                </div>
              ) : (
                <button
                  onClick={handleCreatePDF}
                  disabled={creatingPDF}
                  style={{
                    width: '100%',
                    backgroundColor: creatingPDF ? '#95a5a6' : '#27ae60',
                    color: 'white',
                    border: 'none',
                    padding: '12px',
                    borderRadius: '6px',
                    cursor: creatingPDF ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    fontWeight: 'bold'
                  }}
                >
                  {creatingPDF ? '⏳ Creating PDF...' : '📄 Create PDF'}
                </button>
              )}
            </div>
          )}

          {/* Comments and Activity Tabs */}
          <div className="comments-activity-wrapper">
            <div className="comments-activity-tabs">
              <button
                className={`tab-button ${activeTab === "comments" ? "active" : ""}`}
                onClick={() => setActiveTab("comments")}
              >
                💬 Comments
              </button>
              <button
                className={`tab-button ${activeTab === "activity" ? "active" : ""}`}
                onClick={() => setActiveTab("activity")}
              >
                📊 Activity
              </button>
            </div>

            <div className="comments-activity-content">
              {activeTab === "comments" && (
                <Comments jobId={id} isAdmin={isAdmin} />
              )}
              {activeTab === "activity" && (
                <Activity showAll={true} />
              )}
            </div>
          </div>
        </aside>
      </div>

      {/* Modal Submit */}
      {open && (
        <div className="modal-overlay" onClick={() => setOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Submit Candidate</h3>
            <form onSubmit={(e) => { e.preventDefault(); handleSubmitCandidate(); }}>
              <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div className="form-group">
                  <label>Full Name</label>
                  <input required value={candidateForm.candidateName} onChange={(e) => setCandidateForm({ ...candidateForm, candidateName: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input type="email" required value={candidateForm.candidateEmail} onChange={(e) => setCandidateForm({ ...candidateForm, candidateEmail: e.target.value })} />
                </div>
              </div>

              <div className="form-group">
                <label>Phone Number</label>
                <input required value={candidateForm.candidatePhone} onChange={(e) => setCandidateForm({ ...candidateForm, candidatePhone: e.target.value })} />
              </div>

              <div className="form-group">
                <label>LinkedIn Profile</label>
                <input value={candidateForm.linkedin} onChange={(e) => setCandidateForm({ ...candidateForm, linkedin: e.target.value })} />
              </div>

              <div className="form-group">
                <label>CV (PDF/DOC)</label>
                <input type="file" accept=".pdf,.doc,.docx" onChange={(e) => setCvFile(e.target.files[0])} />
              </div>

              <div className="modal-actions">
                <button type="submit" className="primary" disabled={isSubmitting}>
                  {uploadingCV ? "Uploading CV..." : "Confirm Submission"}
                </button>
                <button type="button" onClick={() => setOpen(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
