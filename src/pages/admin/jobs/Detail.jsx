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
      container.style.width = '210mm';
      container.style.padding = '15mm';
      container.style.background = 'white';
      container.style.fontSize = '95px';
      container.style.lineHeight = '1.7';
      container.style.color = '#000';
      container.style.fontFamily = 'Arial, sans-serif';
      container.style.wordWrap = 'break-word';
      container.style.overflowWrap = 'break-word';
      container.style.whiteSpace = 'normal';
      
      container.innerHTML = `
        <div style="text-align: left;">
          <h1 style="color: #000; border-bottom: 3px solid #3498db; padding-bottom: 12px; font-size: 28px; font-weight: 800; margin: 0 0 15px 0; word-wrap: break-word; overflow-wrap: break-word;">${job.title || "Job Description"}</h1>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px;">
            <div style="background: #ecf0f1; padding: 10px; border-radius: 6px; word-wrap: break-word; overflow-wrap: break-word;">
              <div style="font-weight: 800; color: #000; font-size: 13px;">Salary</div>
              <div style="color: #000; margin-top: 6px; font-size: 14px; font-weight: 600; word-wrap: break-word; overflow-wrap: break-word;">${job.salary || "Negotiable"}</div>
            </div>
            <div style="background: #ecf0f1; padding: 10px; border-radius: 6px; word-wrap: break-word; overflow-wrap: break-word;">
              <div style="font-weight: 800; color: #000; font-size: 13px;">Location</div>
              <div style="color: #000; margin-top: 6px; font-size: 14px; font-weight: 600; word-wrap: break-word; overflow-wrap: break-word;">${job.location || "Remote"}</div>
            </div>
          </div>

          ${keywords.length > 0 ? `
            <div style="margin-bottom: 12px;">
              ${keywords.map(k => `<span style="display: inline-block; background: #3498db; color: white; padding: 6px 12px; margin-right: 6px; margin-bottom: 4px; border-radius: 15px; font-size: 12px; word-wrap: break-word;">${k}</span>`).join('')}
            </div>
          ` : ''}

          ${job.jobsdetail.description ? `
            <div style="margin-bottom: 15px; word-wrap: break-word; overflow-wrap: break-word;">
              <h2 style="color: #000; margin: 0 0 10px 0; font-size: 18px; font-weight: 800; border-bottom: 2px solid #bdc3c7; padding-bottom: 6px;">Description</h2>
              <div style="color: #000; font-size: 15px; line-height: 1.7; font-weight: 600; word-wrap: break-word; overflow-wrap: break-word; white-space: pre-wrap;">${job.jobsdetail.description}</div>
            </div>
          ` : ''}

          ${job.jobsdetail?.requirement ? `
            <div style="margin-bottom: 15px; word-wrap: break-word; overflow-wrap: break-word;">
              <h2 style="color: #000; margin: 0 0 10px 0; font-size: 18px; font-weight: 800; border-bottom: 2px solid #bdc3c7; padding-bottom: 6px;">Requirements</h2>
              <div style="color: #000; font-size: 15px; line-height: 1.7; font-weight: 600; word-wrap: break-word; overflow-wrap: break-word; white-space: pre-wrap;">${job.jobsdetail.requirement}</div>
            </div>
          ` : ''}

          ${job.jobsdetail.benefits ? `
            <div style="margin-bottom: 15px; word-wrap: break-word; overflow-wrap: break-word;">
              <h2 style="color: #000; margin: 0 0 10px 0; font-size: 18px; font-weight: 800; border-bottom: 2px solid #bdc3c7; padding-bottom: 6px;">Benefits</h2>
              <div style="color: #000; font-size: 15px; line-height: 1.7; font-weight: 600; word-wrap: break-word; overflow-wrap: break-word; white-space: pre-wrap;">${job.jobsdetail.benefits}</div>
            </div>
          ` : ''}

          <div style="margin-top: 20px; border-top: 1px solid #ddd; padding-top: 10px; font-size: 10px; color: #7f8c8d;">
            <p style="margin: 0;">Generated on ${new Date().toLocaleString()}</p>
          </div>
        </div>
      `;
      
      document.body.appendChild(container);

      // Wait for content to render
      await new Promise(resolve => setTimeout(resolve, 800));

      // Convert to canvas
      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        windowWidth: 794,
        windowHeight: 1123,
        imageTimeout: 0,
        removeContainer: false
      });

      // Remove container
      document.body.removeChild(container);

      // Get PDF dimensions
      const pdfWidth = 210; // A4 width in mm
      const pdfHeight = 297; // A4 height in mm
      const margin = 15; // 15mm margins (same as padding)
      const contentWidth = pdfWidth - 2 * margin; // 180mm

      // Calculate image dimensions
      const imgWidth = contentWidth;
      const imgHeight = (canvas.height * imgWidth * 25.4) / (canvas.width * 25.4);

      // Create PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true
      });

      // Calculate position
      let yPosition = margin;
      const pageHeight = pdfHeight - 2 * margin;

      // Convert canvas to image
      const imgData = canvas.toDataURL('image/jpeg', 0.95);

      // Add pages with proper pagination
      if (imgHeight <= pageHeight) {
        // Content fits in one page
        pdf.addImage(imgData, 'JPEG', margin, yPosition, imgWidth, imgHeight);
      } else {
        // Content spans multiple pages
        let sourceY = 0;
        let pageNumber = 0;

        while (sourceY < canvas.height) {
          if (pageNumber > 0) {
            pdf.addPage();
            yPosition = margin;
          }

          // Calculate how much of the canvas fits on this page
          const canvasHeightPerPage = (pageHeight * canvas.width * 25.4) / (imgWidth * 25.4);
          let targetEnd = Math.min(sourceY + canvasHeightPerPage, canvas.height);

          const ctxFull = canvas.getContext('2d');
          const width = canvas.width;
          const sampleStepX = Math.max(1, Math.floor(width / 80));
          const range = 40;
          const threshold = 0.97;
          const isRowWhite = (y) => {
            const data = ctxFull.getImageData(0, y, width, 1).data;
            let whiteCount = 0;
            let samples = 0;
            for (let x = 0; x < width; x += sampleStepX) {
              const idx = x * 4;
              const r = data[idx];
              const g = data[idx + 1];
              const b = data[idx + 2];
              const a = data[idx + 3];
              if (a === 0 || (r > 245 && g > 245 && b > 245)) whiteCount++;
              samples++;
            }
            return whiteCount / samples >= threshold;
          };
          let sourceYEnd = targetEnd;
          for (let dy = 0; dy <= range; dy++) {
            const down = targetEnd + dy;
            const up = targetEnd - dy;
            if (down < canvas.height && isRowWhite(down)) { sourceYEnd = down; break; }
            if (up > sourceY && isRowWhite(up)) { sourceYEnd = up; break; }
          }
          const heightOnPage = (sourceYEnd - sourceY) / canvas.height * imgHeight;

          // Create temporary canvas for this page's content
          const pageCanvas = document.createElement('canvas');
          pageCanvas.width = canvas.width;
          pageCanvas.height = sourceYEnd - sourceY;

          const ctx = pageCanvas.getContext('2d');
          ctx.drawImage(
            canvas,
            0,
            sourceY,
            canvas.width,
            sourceYEnd - sourceY,
            0,
            0,
            canvas.width,
            sourceYEnd - sourceY
          );

          const pageImgData = pageCanvas.toDataURL('image/jpeg', 0.95);
          pdf.addImage(pageImgData, 'JPEG', margin, yPosition, imgWidth, heightOnPage);

          sourceY = sourceYEnd;
          pageNumber++;
        }
      }

      // Get PDF blob and upload
      const pdfBlob = pdf.output('blob');
      const fileName = `${job.title?.replace(/\s+/g, '_') || 'job'}_${Date.now()}.pdf`;
      const pdfFile = new File([pdfBlob], fileName, { type: 'application/pdf' });

      const res = await uploadFile(pdfFile);
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
            <div className="job-html-content" dangerouslySetInnerHTML={{ __html: job.jobsdetail?.description || "No description provided" }} />
          </section>

          <section className="job-section">
            <h1>Requirements</h1>
            <div className="job-html-content" dangerouslySetInnerHTML={{ __html: job.jobsdetail?.requirement || "No requirements listed" }} />
          </section>

          <section className="job-section">
            <h1>Benefits</h1>
            <div className="job-html-content" dangerouslySetInnerHTML={{ __html: job.jobsdetail?.benefits || "No benefits listed" }} />
          </section>
          <section className="job-section">
            <h1>Other Information</h1>
            <div className="job-html-content" dangerouslySetInnerHTML={{ __html: job.jobsdetail?.other || "No other information provided" }} />
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
