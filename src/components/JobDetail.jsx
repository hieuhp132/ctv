// src/components/JobDetail.js
import React, { useEffect, useMemo, useState } from "react";
import {
  getJobById,
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
  const [groupedOffers, setGroupedOffers] = useState({});
  const [jdPublicUrl, setJdPublicUrl] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [file, setFile] = useState(null);

  useEffect(() => {
    async function fetchJob() {
      const jobData = await getJobById(id);
      // Developer log: print raw HTML fields from Quill so we can inspect stored tags
      try {
        console.groupCollapsed && console.groupCollapsed("[JobDetail] raw job HTML (remove this log in prod)");
        console.log("job.id:", jobData?.id);
        console.log("job.description:", jobData?.description);
        console.log("job.requirements:", jobData?.requirements);
        console.log("job.benefits:", jobData?.benefits);
        console.log("job.other:", jobData?.other);
        console.groupEnd && console.groupEnd();
      } catch (err) {
        console.warn("JobDetail: failed to log job HTML", err);
      }

      setJob(jobData);
    }
    fetchJob();
  }, [id]);

  useEffect(() => {
    if (!job) {
      setJdPublicUrl(null);
      return;
    }

    async function fetchAndMatchedFileByJdLink() {
      try {
        const files = await getListFiles();
        if (!files || files.length === 0) {
          setJdPublicUrl(null);
          return;
        }

        const matched = files.find((file) => {
          const a = decodeURIComponent(file.publicUrl.split("/").pop());
          const b = decodeURIComponent(job.jdLink?.split("/").pop() || "");
          return a === b;
        });

        if (matched) {
          setJdPublicUrl(matched.publicUrl);
          setFile(matched.name);
        } else {
          setJdPublicUrl(null);
          setFile(null);
        }
      } catch (err) {
        console.error("Error fetching files:", err);
        setJdPublicUrl(null);
      }
    }

    fetchAndMatchedFileByJdLink();
  }, [job?.jdLink]);

  const handleFileUploadSuccess = (fileData) => {
    setUploadedFile(fileData.publicUrl);
    setJdPublicUrl(fileData.publicUrl);

    updateJobJD(id, { jdLink: fileData.publicUrl }).then((updatedJob) => {
      setJob(updatedJob);
    });
  };

  useEffect(() => {
    if (!isAdmin) return;

    Promise.all([listSubmissions(), listArchivedSubmissions()]).then(
      ([subs, arch]) => {
        const all = [...subs, ...arch].filter(
          (s) => String(s.jobId) === String(id)
        );
        const grouped = all.reduce((acc, s) => {
          const key = s.ctv || "CTV";
          if (!acc[key]) acc[key] = [];
          acc[key].push(s);
          return acc;
        }, {});
        setGroupedOffers(grouped);
      }
    );
  }, [id, isAdmin]);

  if (!job) return <p>Loading...</p>;

  const submit = async (e) => {
    e.preventDefault();
    const form = e.target;
    const name = form[0].value;
    const email = form[1].value;
    const phone = form[2].value;
    const cvFile = form[3].files?.[0] || null;
    const linkedin = form[4].value;
    const portfolio = form[5].value;
    const suitability = form[6].value;

    await createSubmission({
      candidateName: name,
      jobId: id,
      jobTitle: job.title,
      ctvId,
      email,
      phone,
      linkedin,
      portfolio,
      suitability,
      cvFile,
      bonus: job.bonus,
    });

    alert("Profile submitted successfully!");
    setOpen(false);
    form.reset();
  };

  const section = (title, contentHtml) => (
    <div style={{ marginBottom: 24 }}>
      <div style={{ fontWeight: 600, marginBottom: 8 }}>{title}</div>
      <div
        className="job-html-content"
        style={{ lineHeight: 1.6, color: "#222" }}
        dangerouslySetInnerHTML={{ __html: contentHtml }}
      />
    </div>
  );
  

  const isMobile = window.innerWidth <= 768;

  const mobileStyles = {
    container: { padding: 16, fontSize: 14 },
    title: { fontSize: 20, fontWeight: 700, marginBottom: 8 },
    detailsGrid: { display: "grid", gridTemplateColumns: "1fr", gap: 12 },
  };

  const styles = isMobile ? mobileStyles : {};

  return (
    <div style={styles.container || { padding: 16 }}>
      <div
        style={styles.title || { fontSize: 26, fontWeight: 700, marginBottom: 8 }}
      >
        {job.title}
      </div>

      {job.keywords && Array.isArray(job.keywords) && job.keywords.length > 0 && (
        <div
          style={{
            display: "flex",
            gap: 16,
            alignItems: "center",
            marginBottom: 16,
            flexWrap: "wrap",
          }}
        >
          {job.keywords.map((keyword, index) => (
            <span
              key={index}
              style={{
                background: "#eef2ff",
                color: "#3730a3",
                padding: "3px 10px",
                borderRadius: 999,
                fontSize: 12,
                marginBottom: 4,
              }}
            >
              {keyword}
            </span>
          ))}
        </div>
      )}

      <div
        style={
          styles.detailsGrid || {
            display: "grid",
            gridTemplateColumns: "1fr 320px",
            gap: 24,
          }
        }
      >
        {/* LEFT SIDE */}
        <div>
          {/* Detail blocks */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 12,
              marginBottom: 18,
            }}
          >
            <div style={infoBox}>
              <div style={infoLabel}>Salary</div>
              <div style={infoValue}>{job.salary ?? "N/A"}</div>
            </div>
            <div style={infoBox}>
              <div style={infoLabel}>Location</div>
              <div style={infoValue}>{job.location || "-"}</div>
            </div>
            <div style={infoBox}>
              <div style={infoLabel}>Reward</div>
              <div style={infoValue}>
                Candidate: {job.rewardCandidateUSD || 0} USD
              </div>
            </div>
          </div>

          {/* Description */}
          {section("Job Overview And Responsibility", job.description || "")}

          {/* Requirements */}
          {section("Required Skills and Experience", job.requirements || "")}

          {/* Benefits */}
          {section(
            "Why Candidate should apply this position",
            job.benefits || ""
          )}

          {/* Others */}
          {section("Other", job.other || "No any specific notice")}
        </div>

        {/* RIGHT SIDE */}
        <aside style={{ alignSelf: "start" }}>
          {isCTV && (
            <>
              <div style={actionBox}>
                <div style={{ fontWeight: 700, marginBottom: 10 }}>Actions</div>
                <button
                  onClick={() => setOpen(true)}
                  style={{ width: "100%", marginBottom: 8 }}
                >
                  Submit candidate
                </button>
              </div>

              <div style={actionBox}>
                <FilesView publicUrl={jdPublicUrl} name={file} />
              </div>
            </>
          )}

          {isAdmin && (
            <div style={adminBox}>
              <h3 style={{ marginBottom: 12 }}>Admin: Manage JD File</h3>

              <FilesView publicUrl={jdPublicUrl} name={file} />
              <div
                style={{
                  borderRadius: 5,
                  border: "2px solid black",
                  height: 2,
                  marginBottom: 10,
                  marginTop: 5,
                }}
              ></div>

              <FileUploader onUploadSuccess={handleFileUploadSuccess} />
            </div>
          )}
        </aside>
      </div>

      {/* Modal submit candidate */}
      {open && (
        <div style={modalOverlay} onClick={() => setOpen(false)}>
          <form
            onSubmit={submit}
            onClick={(e) => e.stopPropagation()}
            style={modalForm}
          >
            <h3>Submit Candidate</h3>
            <input type="text" placeholder="Candidate Name" required />
            <input type="email" placeholder="Candidate Email" required />
            <input type="tel" placeholder="Candidate Phone" required />
            <input type="file" accept=".pdf,.doc,.docx" required />
            <input type="url" placeholder="LinkedIn URL" />
            <input type="url" placeholder="Portfolio URL" />
            <textarea
              placeholder="Why is candidate suitable?"
              rows={3}
              required
            />

            <button type="submit">Submit</button>
            <button type="button" onClick={() => setOpen(false)}>
              Cancel
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

/* --- Styles --- */
const infoBox = {
  background: "#fafafa",
  border: "1px solid #eee",
  borderRadius: 8,
  padding: 12,
};

const infoLabel = { fontSize: 12, color: "#666" };
const infoValue = { fontWeight: 600 };

const actionBox = {
  border: "1px solid #eee",
  borderRadius: 10,
  padding: 14,
  background: "#fff",
  marginBottom: 16,
};

const adminBox = {
  border: "2px solid #ddd",
  borderRadius: "12px",
  padding: "20px",
  background: "#f7f7f7",
  boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
  marginTop: 24,
};

const modalOverlay = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100vw",
  height: "100vh",
  backgroundColor: "rgba(0,0,0,0.5)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 999,
};

const modalForm = {
  background: "#fff",
  borderRadius: 12,
  padding: 24,
  width: "90vw",
  maxWidth: 400,
  boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
  display: "flex",
  flexDirection: "column",
  gap: 12,
};
