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


  
  const sectionStyle = `
    font-family: Arial;
    font-size: 14px;
    line-height: 1.5;
    color:#000;
    margin:0;
  `;
  const titleStyle = `
    font-size:18px;
    font-weight:bold;
    margin:4px 0 2px 0;
    padding-bottom:3px;
    border-bottom:1px solid #333;
    display:block;
    width:100%;
  `;
  const blockStyle = `
    margin:2px 0 4px 0;
  `;

  const renderSectionToCanvas = async (html) => {
    const container = document.createElement("div");
  
    container.style.position = "fixed";
    container.style.left = "-9999px";
    container.style.width = "794px";
    container.style.padding = "40px";
    container.style.background = "#fff";
    container.style.fontFamily = "Arial";
    container.style.lineHeight = "1.6";
    container.innerHTML = html;
  
    document.body.appendChild(container);
  
    await new Promise(r => setTimeout(r, 300));
  
    const canvas = await html2canvas(container, {
      scale: 2,
      backgroundColor: "#fff",
      useCORS: true
    });
  
    document.body.removeChild(container);
  
    return canvas;
  };

  
  const buildSections = () => {
    if (!job) return [];
  
    return [
      `
      <div style="${sectionStyle}">
      <h1 style="font-size:26px;margin-bottom:6px;border-bottom:3px solid #3498db;padding-bottom:6px">
      ${job.title}
      </h1>
      
      <div style="${blockStyle}">
      <b>Salary:</b> ${job.salary || "Negotiable"} |
      <b>Location:</b> ${job.location || "Remote"} |
      <b>Reward:</b> ${job.rewardCandidateUSD ?? 0} USD
      </div>
      
      <div style="${blockStyle}">
      ${(keywords || []).map(k =>
      `<span style="background:#3498db;color:#fff;padding:3px 8px;margin-right:4px;border-radius:10px;font-size:11px">${k}</span>`
      ).join("")}
      </div>
      </div>
      `,
      
      job.jobsdetail?.description
      ? `
      <div style="${sectionStyle}">
      <div style="${titleStyle}">Description</div>
      <div>${cleanJobHtml(job.jobsdetail.description)}</div>
      </div>
      `
      : "",
      
      job.jobsdetail?.requirement
      ? `
      <div style="${sectionStyle}">
      <div style="${titleStyle}">Requirements</div>
      <div>${cleanJobHtml(job.jobsdetail.requirement)}</div>
      </div>
      `
      : "",
      
      job.jobsdetail?.benefits
      ? `
      <div style="${sectionStyle}">
      <div style="${titleStyle}">Benefits</div>
      <div>${cleanJobHtml(job.jobsdetail.benefits)}</div>
      </div>
      `
      : "",
      
      // job.jobsdetail?.other
      // ? `
      // <div style="${sectionStyle}">
      // <div style="${titleStyle}">Other Information</div>
      // <div>${cleanJobHtml(job.jobsdetail.other)}</div>
      // </div>
      // `
      // : ""
      
      ];
  };
  const handleCreatePDF = async () => {
    if (!job) return;
  
    try {
      setCreatingPDF(true);
  
      const pdf = new jsPDF("p", "mm", "a4");
  
      const pageWidth = 210;
      const pageHeight = 297;
  
      const sections = buildSections();
  
      let currentY = 10;

      for (const section of sections) {
      
        if (!section) continue;
      
        const canvas = await renderSectionToCanvas(section);
      
        const imgData = canvas.toDataURL("image/jpeg", 1);
      
        const imgWidth = pageWidth - 20;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
        if (currentY + imgHeight > pageHeight - 10) {
          pdf.addPage();
          currentY = 10;
        }
      
        pdf.addImage(imgData, "JPEG", 10, currentY, imgWidth, imgHeight);
      
        currentY += imgHeight + 2; // giảm khoảng cách từ 10 -> 4
      }
  
      const blob = pdf.output("blob");
  
      const fileName = `${job.title.replace(/\s+/g, "_")}_${Date.now()}.pdf`;
  
      const file = new File([blob], fileName, { type: "application/pdf" });
  
      const res = await uploadFile(file);
  
      if (res?.publicUrl) {
        setPdfUrl(res.publicUrl);
        setPdfFileName(fileName);
        alert("PDF created successfully");
      }
  
    } catch (err) {
      console.error(err);
      alert("PDF creation failed");
    } finally {
      setCreatingPDF(false);
    }
  };

  const handleDeletePDF = async () => {
    if (!pdfUrl) return alert("No PDF file to delete");
    if (!window.confirm("Are you sure you want to delete this PDF?")) return;
    
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
        {keywords.length > 0 && (
          <div className="job-tags">
            {keywords.map((k) => <span key={k}>{k}</span>)}
          </div>
        )}
      </header>

      <div className="job-layout">
        {/* Main Content */}
        <main className="job-main-content">
          <div className="job-info-grid">
            <div className="info-box">
              <strong>Salary</strong>
              <span>{job.salary || "Negotiable"}</span>
            </div>
            <div className="info-box">
              <strong>Location</strong>
              <span>{job.location || "Remote"}</span>
            </div>
            <div className="info-box">
              <strong>Reward</strong>
              <span>{job.rewardCandidateUSD ?? 0} USD</span>
            </div>
          </div>

          <section className="job-section">
            <h1>Description</h1>
            <div className="job-html-content" dangerouslySetInnerHTML={{ __html: cleanJobHtml(job.jobsdetail.description)|| "No description provided" }} />
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
                  <input required value={candidateForm.candidateName} onChange={(e) => setCandidateForm({...candidateForm, candidateName: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input type="email" required value={candidateForm.candidateEmail} onChange={(e) => setCandidateForm({...candidateForm, candidateEmail: e.target.value})} />
                </div>
              </div>
              
              <div className="form-group">
                <label>Phone Number</label>
                <input required value={candidateForm.candidatePhone} onChange={(e) => setCandidateForm({...candidateForm, candidatePhone: e.target.value})} />
              </div>

              <div className="form-group">
                <label>LinkedIn Profile</label>
                <input value={candidateForm.linkedin} onChange={(e) => setCandidateForm({...candidateForm, linkedin: e.target.value})} />
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
