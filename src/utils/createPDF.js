import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { cleanJobHtml } from "./cleanJobHtml.js";
import { uploadFile } from "../services/api.js";


export async function createPDF({ job, keywords = [] }) {
  if (!job) throw new Error("Job data not available");

  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-9999px';
  container.style.top = '-9999px';
  container.style.width = '800px';
  container.style.background = 'white';

  const jobDescription = cleanJobHtml(job.jobsdetail?.description || job.description || "");
  const jobRequirement = cleanJobHtml(job.jobsdetail?.requirement || job.requirements || "");
  const jobBenefits = cleanJobHtml(job.jobsdetail?.benefits || job.benefits || "");
  const jobOther = cleanJobHtml(job.jobsdetail?.other || job.other || "");
  
  const safeName = (job.title || "job")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")     // bỏ dấu
    .replace(/đ/g, "d").replace(/Đ/g, "D")
    .replace(/[^a-zA-Z0-9]/g, "_")       // CHẶN HẾT ký tự lạ
    .replace(/_+/g, "_")                 // gộp _
    .replace(/^_|_$/g, "")               // trim _
    .toLowerCase();


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
        border-bottom: 2px solid #f3f4f6;
      }
      .section-content {
        font-size: 15px;
        line-height: 1.7;
        color: #374151;
        white-space: pre-wrap;
        word-break: break-word;
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
  await new Promise(r => setTimeout(r, 1000));

  const canvas = await html2canvas(container, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#ffffff'
  });

  document.body.removeChild(container);

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true
  });

  const pdfWidth = 210;
  const pdfHeight = 297;
  const margin = 10;
  const contentWidth = pdfWidth - 2 * margin;
  const contentHeight = pdfHeight - 2 * margin;

  const imgWidthMM = contentWidth;
  const imgHeightMM = (canvas.height * imgWidthMM) / canvas.width;

  if (imgHeightMM <= contentHeight) {
    pdf.addImage(canvas.toDataURL('image/jpeg', 0.95), 'JPEG', margin, margin, imgWidthMM, imgHeightMM);
  } else {
    let sourceY = 0;
    let pageNumber = 0;

    const ctxFull = canvas.getContext('2d', { willReadFrequently: true });
    const width = canvas.width;

    const rowWhiteness = (y) => {
      const data = ctxFull.getImageData(0, y, width, 1).data;
      let white = 0;
      for (let i = 0; i < data.length; i += 4) {
        if (data[i] > 245 && data[i+1] > 245 && data[i+2] > 245) white++;
      }
      return white / (data.length / 4);
    };

    while (sourceY < canvas.height) {
      if (pageNumber > 0) pdf.addPage();

      const canvasHeightPerPage = (contentHeight * canvas.width) / imgWidthMM;
      let targetEnd = Math.min(sourceY + canvasHeightPerPage, canvas.height);

      if (targetEnd < canvas.height) {
        for (let y = targetEnd; y > sourceY; y--) {
          if (rowWhiteness(y) > 0.98) {
            targetEnd = y;
            break;
          }
        }
      }

      const sliceHeight = targetEnd - sourceY;

      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = canvas.width;
      tempCanvas.height = sliceHeight;
      tempCanvas.getContext('2d').drawImage(canvas, 0, sourceY, canvas.width, sliceHeight, 0, 0, canvas.width, sliceHeight);

      const displayHeightMM = (sliceHeight * imgWidthMM) / canvas.width;

      pdf.addImage(tempCanvas.toDataURL('image/jpeg', 0.95), 'JPEG', margin, margin, imgWidthMM, displayHeightMM);

      sourceY = targetEnd;
      pageNumber++;
    }
  }

  const blob = pdf.output('blob');
  const fileName = `jd_${Date.now()}_${safeName}.pdf`;
  const file = new File([blob], fileName, { type: 'application/pdf' });

  const res = await uploadFile(file);

  return {
    url: res?.publicUrl,
    name: fileName
  };
}