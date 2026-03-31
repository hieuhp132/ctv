import { createPDF} from '../utils/createPDF.js';
import { updateJobL } from '../services/api.js';

const URL = "http://localhost:3000/local"

console.log("Migrate to Supabase");

import puppeteer from "puppeteer";
import { cleanJobHtml } from "./cleanJobHtml.js";
import { uploadFile } from "../services/api.js";

export async function createPDF({ job, keywords = [] }) {
  if (!job) throw new Error("Job data not available");

  const jobDescription = cleanJobHtml(job.jobsdetail?.description || job.description || "");
  const jobRequirement = cleanJobHtml(job.jobsdetail?.requirement || job.requirements || "");
  const jobBenefits = cleanJobHtml(job.jobsdetail?.benefits || job.benefits || "");

  const safeName = (job.title || "job")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d").replace(/Đ/g, "D")
    .replace(/[^a-zA-Z0-9]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "")
    .toLowerCase();

  const html = `
  <html>
    <head>
      <style>
        body {
          font-family: Arial;
          padding: 40px;
          color: #374151;
        }
        h1 { font-size: 24px; }
        .section { margin-top: 20px; }
      </style>
    </head>
    <body>
      <h1>${job.title || "Job Description"}</h1>

      <p><b>Salary:</b> ${job.salary || "Negotiable"}</p>
      <p><b>Location:</b> ${job.location || "Remote"}</p>

      ${jobDescription ? `<div class="section"><h3>Description</h3>${jobDescription}</div>` : ""}
      ${jobRequirement ? `<div class="section"><h3>Requirements</h3>${jobRequirement}</div>` : ""}
      ${jobBenefits ? `<div class="section"><h3>Benefits</h3>${jobBenefits}</div>` : ""}
    </body>
  </html>
  `;

  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  await page.setContent(html, { waitUntil: "networkidle0" });

  const pdfBuffer = await page.pdf({
    format: "A4",
    printBackground: true,
  });

  await browser.close();

  const fileName = `jd_${Date.now()}_${safeName}.pdf`;

  // ⚠️ uploadFile phải support buffer
  const res = await uploadFile({
    buffer: pdfBuffer,
    fileName,
    contentType: "application/pdf",
  });

  return {
    publicUrl: res?.publicUrl,
    name: fileName,
  };
}


async function migrateToSupaBase() {
    const res = await fetch(`${URL}/jobs`);
    const data = await res.json();
    const jobs = data.jobs;



    const toMigrate = jobs.filter(job => job.jdLink === '')
    for (const job of toMigrate) {
        console.log(job);
        const res = await createPDF({ job });
        if (!res?.publicUrl) {
            console.log("Failed to create PDF for job:", job);
            continue;
        }
        job.jdLink = res.publicUrl;
        await updateJobL(job);
        console.log("Migrated job:", job);
    }
    console.log(toMigrate);
}

migrateToSupaBase();    