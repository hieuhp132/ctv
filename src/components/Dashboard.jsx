import React, { useState, useEffect, useMemo } from "react";
import "./Dashboard.css";
import {
  fetchAllJobs,
  fetchSavedJobsL,
  saveJobL,
  unsaveJobL,
  createSubmissionL,
  uploadFile,
} from "../api";
import { useAuth } from "../context/AuthContext";
import Icons from "./Icons";
import Select from "react-select";

export default function Dashboard() {
  const { user } = useAuth();
  const recruiterId = user?.id || user?.email;

  const [jobs, setJobs] = useState([]);
  const [savedJobIds, setSavedJobIds] = useState(new Set());
  const [loading, setLoading] = useState(true);

    const [searchText, setSearchText] = useState("");
    const [filterLocation, setFilterLocation] = useState("");
    const [filterCompany, setFilterCompany] = useState("");
    const [filterCategory, setFilterCategory] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 9;

  const [showSubmit, setShowSubmit] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingCV, setUploadingCV] = useState(false);
  const [cvFile, setCvFile] = useState(null);

  const [candidateForm, setCandidateForm] = useState({
    candidateName: "",
    candidateEmail: "",
    candidatePhone: "",
    linkedin: "",
    portfolio: "",
    suitability: "",
  });

  const asArray = (v) => (Array.isArray(v) ? v : []);
  const getJobId = (job) => job?._id || job?.id;

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      try {
        const jobsRes = await fetchAllJobs();
        const jobsArray = asArray(jobsRes?.jobs).map((j) => ({ ...j, _id: getJobId(j) }));

        let savedIds = new Set();
        if (user?.email || user?.id) {
          const savedRes = await fetchSavedJobsL(user.email);
          asArray(savedRes?.jobs).forEach((j) => {
            const id = j.jobId || j._id;
            if (id) savedIds.add(id);
          });
        }

        setSavedJobIds(savedIds);
        setJobs(jobsArray.map((j) => ({ ...j, isSaved: savedIds.has(j._id) })));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  const CATEGORY_KEYWORDS = {
    Developer: ["dev", "developer", "engineer", "react", "node"],
    Data: ["data", "ml", "machine learning"],
    Designer: ["design", "ux", "ui"],
    Sales: ["sales", "business"],
    Marketing: ["marketing", "seo"],
    Manager: ["manager", "lead"],
  };

  const activeJobs = useMemo(() => {
    const today = new Date();
    return jobs.filter(
      (j) => j.status === "Active" && (!j.deadline || new Date(j.deadline) >= today)
    );
  }, [jobs]);






  const handleSaveUnsaveJob = async (job) => {
    if (!recruiterId) return;
    try {
      const newSet = new Set(savedJobIds);
      if (job.isSaved) {
        await unsaveJobL(job._id, recruiterId);
        newSet.delete(job._id);
      } else {
        await saveJobL(job._id, recruiterId);
        newSet.add(job._id);
      }
      setSavedJobIds(newSet);
      setJobs((prev) =>
        prev.map((j) => (j._id === job._id ? { ...j, isSaved: !job.isSaved } : j))
      );
    } catch {
      alert("Save job failed");
    }
  };

  const uploadCV = async () => {
    setUploadingCV(true);
    try {
      const res = await uploadFile(cvFile);
      return res?.publicUrl;
    } finally {
      setUploadingCV(false);
    }
  };

  const handleSubmitCandidate = async () => {
    if (!cvFile) return alert("Please upload CV");
    try {
      setIsSubmitting(true);
      const cvUrl = await uploadCV();
      if (!cvUrl) return alert("Upload failed");
      await createSubmissionL({ jobId: selectedJob._id, recruiterId, ...candidateForm, cvUrl });
      alert("Candidate submitted");
      setCandidateForm({ candidateName: "", candidateEmail: "", candidatePhone: "", linkedin: "", portfolio: "", suitability: "" });
      setCvFile(null);
      setShowSubmit(false);
    } catch {
      alert("Submit failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectStyles = {
    control: (base) => ({
      ...base,
      minHeight: 40,
      borderRadius: 8,
      fontSize: 14,
    }),
    valueContainer: (base) => ({
      ...base,
      padding: "2px 10px",
    }),
    option: (base, state) => ({
      ...base,
      padding: "10px 12px",   // 👈 chiều cao option
      fontSize: 14,
      backgroundColor: state.isFocused ? "#f3f4f6" : "#fff",
      color: "#111",
      whiteSpace: "normal",   // 👈 text dài tự xuống dòng
      cursor: "pointer",
    }),
    menu: (base) => ({
      ...base,
      zIndex: 9999,
    }),
  };
  const categoriesAvailable = React.useMemo(() => {
    const cats = new Set();
    jobs.forEach((job) => {
      const title = (job.title || "").toLowerCase();
      Object.keys(CATEGORY_KEYWORDS).forEach((cat) => {
        const kws = CATEGORY_KEYWORDS[cat] || [];
        if (kws.some((kw) => title.includes(kw))) cats.add(cat);
      });
    });
    if (cats.size === 0) cats.add("Developer");
    return Array.from(cats);
  }, [jobs]);
  const uniqueLocations = React.useMemo(() => {
    const m = new Map();
    jobs.forEach((j) => {
      const raw = j.location;
      const k = String(raw || "").trim().replace(/\s+/g, " ").toLowerCase();
      if (!k) return;
      if (!m.has(k)) m.set(k, raw);
    });
    return Array.from(m.values());
  }, [jobs]);
  const uniqueCompanies = React.useMemo(() => {
    const m = new Map();
    jobs.forEach((j) => {
      const raw = j.company;
      const k = String(raw || "").trim().replace(/\s+/g, " ").toLowerCase();
      if (!k) return;
      if (!m.has(k)) m.set(k, raw);
    });
    return Array.from(m.values());
  }, [jobs]);
    const filteredJobs = React.useMemo(() => {
      const text = searchText.toLowerCase().trim();
      return jobs.filter((job) => {
        const searchableText = [
          job.title || "",
          job.company || "",
          job.location || "",
          Array.isArray(job.keywords) ? job.keywords.join(" ") : job.keywords || "",
          (job.description || "").replace(/<[^>]*>/g, " "),
          (job.requirements || "").replace(/<[^>]*>/g, " "),
        ]
          .join(" ")
          .toLowerCase();
        const matchSearch = text === "" || searchableText.includes(text);
        const matchLocation = filterLocation === "" || job.location === filterLocation;
        const matchCompany = filterCompany === "" || job.company === filterCompany;
        let matchCategory = true;
        if (filterCategory) {
          const title = (job.title || "").toLowerCase();
          const keywords = CATEGORY_KEYWORDS[filterCategory] || [];
          matchCategory = keywords.some((kw) => title.includes(kw));
        }
        return matchSearch && matchLocation && matchCompany && matchCategory;
      });
    }, [jobs, searchText, filterLocation, filterCompany, filterCategory]);
  
      const locationOptions = React.useMemo(
        () => uniqueLocations.map(loc => ({ value: loc, label: loc })),
        [uniqueLocations]
      );
  
      const companyOptions = React.useMemo(
        () => uniqueCompanies.map(c => ({ value: c, label: c })),
        [uniqueCompanies]
      );
  
      const categoryOptions = React.useMemo(
        () => categoriesAvailable.map(cat => ({ value: cat, label: cat })),
        [categoriesAvailable]
      );

  
  const totalPages = Math.max(1, Math.ceil(filteredJobs.length / pageSize));
  const displayedJobs = filteredJobs.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="dashboard-container">
      <h2>Active Jobs</h2>

   
        <div className="filter-bar">
          <input
            type="text"
            placeholder="Search jobs, companies, skills..."
            className="filter-input"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />

          {/* LOCATION */}
          <div style={{ minWidth: 200, flex: 1 }}>
            <Select
              placeholder="All Locations"
              options={locationOptions}
              isClearable
              styles={selectStyles}
              value={
                filterLocation
                  ? { value: filterLocation, label: filterLocation }
                  : null
              }
              onChange={(opt) => setFilterLocation(opt?.value || "")}
            />
          </div>

          {/* COMPANY */}
          <div style={{ minWidth: 200, flex: 1 }}>
            <Select
              placeholder="All Companies"
              options={companyOptions}
              isClearable
              styles={selectStyles}
              value={
                filterCompany
                  ? { value: filterCompany, label: filterCompany }
                  : null
              }
              onChange={(opt) => setFilterCompany(opt?.value || "")}
            />
          </div>

          {/* CATEGORY */}
          <div style={{ minWidth: 180 }}>
            <Select
              placeholder="All Categories"
              options={categoryOptions}
              isClearable
              styles={selectStyles}
              value={
                filterCategory
                  ? { value: filterCategory, label: filterCategory }
                  : null
              }
              onChange={(opt) => setFilterCategory(opt?.value || "")}
            />
          </div>
        </div>


      {loading ? <p>Loading...</p> : (
        <div className="job-list">
          {displayedJobs.map((job) => (
            <div key={job._id} className="job-card" onClick={() => window.open(`/job/${job._id}`, "_blank")}>
              <div className="job-card-header">
                <div>
                  <h3>{job.title}</h3>
                  <p>{job.company}</p>
                </div>
                <button className={`save-btn ${job.isSaved ? "saved" : ""}`} onClick={(e) => { e.stopPropagation(); handleSaveUnsaveJob(job); }}>
                  {job.isSaved ? "★" : "☆"}
                </button>
              </div>

              <div>📍 {job.location}</div>
              <div>💲 {job.salary || "N/A"}</div>
              {job.deadline && <div>⏰ Deadline: {new Date(job.deadline).toLocaleDateString()}</div>}
              {job.category && <div>🏷 Category: {job.category}</div>}

              <div style={{ fontSize: "12px", color: "#666", marginBottom: 6 }}>
                <span>Vacancies: {job.vacancies || 0}</span>
                <span style={{ marginLeft: 8 }}>Applicants: {job.applicants || 0}</span>
              </div>

              <span style={{ marginLeft: 8, fontWeight: "bold", color: "green" }}>
                Status: {job.status || "Active"}
              </span>

              <div className="reward-line">
                <span className="reward-badge">USD {job.rewardCandidateUSD} / Headhunter</span>
                <span className="reward-badge secondary">+USD {job.rewardInterviewUSD} / Interview</span>
                <span className="job-bonus">+USD {job.bonus}</span>
              </div>

              <button className="submit-btn" onClick={(e) => { e.stopPropagation(); setSelectedJob(job); setShowSubmit(true); }}>
                Submit Candidate
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          {Array.from({ length: totalPages }).map((_, i) => (
            <button key={i} onClick={() => setPage(i + 1)} className={i + 1 === page ? "active" : ""}>{i + 1}</button>
          ))}
        </div>
      )}

      {/* Submit Modal */}
      {showSubmit && selectedJob && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Submit Candidate – {selectedJob.title}</h3>
            {["candidateName","candidateEmail","candidatePhone","linkedin","portfolio"].map((key) => (
              <div key={key} className="form-group">
                <label>{key.replace(/([A-Z])/g, " $1").replace(/^./, str => str.toUpperCase())}</label>
                <input value={candidateForm[key]} onChange={(e) => setCandidateForm(f => ({ ...f, [key]: e.target.value }))}/>
              </div>
            ))}
            <div className="form-group">
              <label>Suitability</label>
              <textarea value={candidateForm.suitability} onChange={(e) => setCandidateForm(f => ({ ...f, suitability: e.target.value }))}/>
            </div>
            <div className="form-group">
              <label>CV (PDF/DOC)</label>
              <input type="file" accept=".pdf,.doc,.docx" onChange={(e) => setCvFile(e.target.files[0])}/>
            </div>
            <div className="modal-actions">
              <button onClick={handleSubmitCandidate} disabled={isSubmitting || uploadingCV}>
                {uploadingCV ? "Uploading..." : "Submit"}
              </button>
              <button onClick={() => setShowSubmit(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <Icons/>
    </div>
  );
}
