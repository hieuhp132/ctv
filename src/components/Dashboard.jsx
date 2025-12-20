import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";
import {
  fetchAllJobs,
  fetchSavedJobsL,
  saveJobL,
  unsaveJobL,
  createSubmissionL,
} from "../api";
import { useAuth } from "../context/AuthContext";
import Icons from "./Icons";
import Select from "react-select";

const asArray = (v) => (Array.isArray(v) ? v : []);

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const ctvId = useMemo(() => user?.email || user?.id || "CTV", [user]);

  const [jobs, setJobs] = useState([]);
  const [savedJobs, setSavedJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [page, setPage] = useState(1);
  const pageSize = 9;

  const [searchText, setSearchText] = useState("");
  const [filterLocation, setFilterLocation] = useState("");
  const [filterCompany, setFilterCompany] = useState("");
  const [filterCategory, setFilterCategory] = useState("");

  const CATEGORY_KEYWORDS = {
    Developer: ["dev", "developer", "engineer", "software", "frontend", "backend", "fullstack", "react", "node", "vue", "angular", "solidity", "smart contract"],
    Data: ["data", "machine learning", "ml", "data scientist", "data engineer"],
    Designer: ["design", "designer", "ux", "ui", "product designer"],
    Sales: ["sales", "account executive", "business development", "bd"],
    Marketing: ["marketing", "growth", "seo", "content"],
    Manager: ["manager", "lead", "head of", "director"],
    Finance: ["finance", "account", "accountant", "financial"],
    HR: ["hr", "recruiter", "people", "talent"],
  };

  // -------------------- Load jobs + saved jobs --------------------
  const loadData = async () => {
    setLoading(true);

    let jobsResponse = [];
    let savedResponse = { items: [] };

    // Load saved jobs from localStorage first
    const localSaved = JSON.parse(localStorage.getItem("savedJobs") || "[]");
    const savedJobIdsLocal = new Set(localSaved.map((j) => j.id));

    try {
      jobsResponse = await fetchAllJobs();
      console.log("jobsResponse", jobsResponse);
    } catch (err) {
      console.error("Failed to fetch jobs", err);
    }

    if (user?.id || user?.email) {
      try {
        savedResponse = await fetchSavedJobsL(user.id || user.email);
        console.log("savedResponse", savedResponse);
      } catch (err) {
        console.error("Failed to fetch saved jobs", err);
      }
    }

    // Normalize arrays
    const jobsArray = asArray(jobsResponse?.jobs);
    const savedItems = asArray(savedResponse?.items);

    // Format saved jobs from backend
    const backendSavedJobs = savedItems.map((item) => ({
      id: item.jobId || item.id || item._id || item.jobLink,
      title: item.title || "",
      company: item.company || "",
      location: item.location || "",
      salary: item.salary,
      deadline: item.deadline,
      bonus: item.bonus,
    }));

    // Merge localStorage saved jobs with backend saved jobs
    const savedJobIds = new Set([
      ...backendSavedJobs.map((j) => j.id),
      ...savedJobIdsLocal,
    ]);

    // Add isSaved flag
    const jobsWithSavedFlag = jobsArray.map((job) => ({
      ...job,
      id: job.id || job._id,
      isSaved: savedJobIds.has(job.id || job._id),
    }));

    setJobs(jobsWithSavedFlag);
    setSavedJobs(backendSavedJobs);
    localStorage.setItem("savedJobs", JSON.stringify(backendSavedJobs));
    setLoading(false);
  };

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  // -------------------- Active + filtered jobs --------------------
  const activeJobs = useMemo(() => {
    const today = new Date();
    return jobs.filter(
      (job) => job.status === "Active" && (!job.deadline || new Date(job.deadline) >= today)
    );
  }, [jobs]);

  const filteredJobs = useMemo(() => {
    const text = searchText.toLowerCase().trim();
    return activeJobs.filter((job) => {
      const searchable = [
        job.title || "",
        job.company || "",
        job.location || "",
        Array.isArray(job.keywords) ? job.keywords.join(" ") : job.keywords || "",
        (job.description || "").replace(/<[^>]*>/g, " "),
        (job.requirements || "").replace(/<[^>]*>/g, " "),
      ].join(" ").toLowerCase();

      const matchSearch = text === "" || searchable.includes(text);
      const matchLocation = filterLocation === "" || job.location === filterLocation;
      const matchCompany = filterCompany === "" || job.company === filterCompany;

      let matchCategory = true;
      if (filterCategory) {
        const title = (job.title || "").toLowerCase();
        matchCategory = (CATEGORY_KEYWORDS[filterCategory] || []).some((kw) => title.includes(kw));
      }

      return matchSearch && matchLocation && matchCompany && matchCategory;
    });
  }, [activeJobs, searchText, filterLocation, filterCompany, filterCategory]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(filteredJobs.length / pageSize)),
    [filteredJobs.length]
  );
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [totalPages]);

  const displayedJobs = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredJobs.slice(start, start + pageSize);
  }, [filteredJobs, page]);

  // -------------------- Save / Unsave --------------------
  const handleSaveUnsaveJob = async (job) => {
    try {
      const userId = user?.id || user?.email;
      if (!userId) return;

      let newSaved = [];

      if (job.isSaved) {
        const response = await unsaveJobL(job.id, userId);
        if (response?.success) {
          newSaved = savedJobs.filter((j) => j.id !== job.id);
        } else return;
      } else {
        const response = await saveJobL(job.id, userId);
        if (response?.success) {
          newSaved = [...savedJobs, job];
        } else return;
      }

      setSavedJobs(newSaved);
      localStorage.setItem("savedJobs", JSON.stringify(newSaved));
      setJobs((prev) =>
        prev.map((j) =>
          j.id === job.id ? { ...j, isSaved: !job.isSaved } : j
        )
      );
    } catch (err) {
      alert("Failed to save/unsave job");
    }
  };

  // -------------------- Categories / Locations / Companies --------------------
  const categoriesAvailable = useMemo(() => {
    const cats = new Set();
    jobs.forEach((job) => {
      const title = (job.title || "").toLowerCase();
      Object.keys(CATEGORY_KEYWORDS).forEach((cat) => {
        if ((CATEGORY_KEYWORDS[cat] || []).some((kw) => title.includes(kw))) cats.add(cat);
      });
    });
    if (cats.size === 0) cats.add("Developer");
    return Array.from(cats);
  }, [jobs]);

  const uniqueLocations = useMemo(() => {
    const m = new Map();
    jobs.forEach((j) => {
      const k = String(j.location || "").trim().toLowerCase();
      if (k && !m.has(k)) m.set(k, j.location);
    });
    return Array.from(m.values());
  }, [jobs]);

  const uniqueCompanies = useMemo(() => {
    const m = new Map();
    jobs.forEach((j) => {
      const k = String(j.company || "").trim().toLowerCase();
      if (k && !m.has(k)) m.set(k, j.company);
    });
    return Array.from(m.values());
  }, [jobs]);

  const locationOptions = useMemo(
    () => uniqueLocations.map((l) => ({ value: l, label: l })),
    [uniqueLocations]
  );
  const companyOptions = useMemo(
    () => uniqueCompanies.map((c) => ({ value: c, label: c })),
    [uniqueCompanies]
  );

  const selectStyles = {
    control: (base) => ({ ...base, minHeight: 40, fontSize: 14, borderRadius: 8 }),
    valueContainer: (base) => ({ ...base, padding: "2px 10px" }),
    option: (base, state) => ({
      ...base,
      padding: "10px 12px",
      fontSize: 14,
      backgroundColor: state.isFocused ? "#f3f4f6" : "#fff",
      color: "#111",
      cursor: "pointer",
      whiteSpace: "normal",
    }),
    menu: (base) => ({ ...base, zIndex: 9999 }),
  };

  // -------------------- Modal --------------------
  const closeModal = () => setSelectedJob(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedJob) return;
    setIsSubmitting(true);

    try {
      const form = e.target;
      await createSubmissionL({
        candidateName: form[0].value,
        jobId: selectedJob.id,
        jobTitle: selectedJob.title,
        ctvId,
        email: form[1].value,
        phone: form[2].value,
        cvFile: form[3].files?.[0] || null,
        linkedin: form[4].value,
        portfolio: form[5].value,
        suitability: form[6].value,
        bonus: selectedJob.bonus,
      });
      alert("Profile submitted successfully!");
      form.reset();
      closeModal();
    } catch (err) {
      alert("Failed to submit profile");
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // -------------------- Render --------------------
  return (
    <div className="dashboard-container">
      <div className="dashboard-grid">
        <h2>Active Jobs</h2>

        <div className="filter-bar">
          <input
            type="text"
            placeholder="Search jobs, companies, skills..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="filter-input"
          />
          <button className="find-jobs-btn" type="button">
            Search
          </button>
        </div>

        <div className="filter-bar" style={{ marginTop: 8 }}>
          <div style={{ flex: 1 }}>
            <Select
              options={locationOptions}
              placeholder="All locations"
              isClearable
              styles={selectStyles}
              value={filterLocation ? { value: filterLocation, label: filterLocation } : null}
              onChange={(opt) => setFilterLocation(opt?.value || "")}
            />
          </div>
          <div style={{ flex: 1 }}>
            <Select
              options={companyOptions}
              placeholder="All companies"
              isClearable
              styles={selectStyles}
              value={filterCompany ? { value: filterCompany, label: filterCompany } : null}
              onChange={(opt) => setFilterCompany(opt?.value || "")}
            />
          </div>
        </div>

        <div className="category-chips">
          {categoriesAvailable.map((cat) => (
            <button
              key={cat}
              className={`chip ${filterCategory === cat ? "active" : ""}`}
              onClick={() => setFilterCategory((c) => (c === cat ? "" : cat))}
              type="button"
            >
              {cat}
            </button>
          ))}
        </div>

        {loading ? (
          <p>Loading jobs...</p>
        ) : (
          <div className="job-list">
            {displayedJobs.map((job) => (
              <div
                key={job.id}
                className="job-card"
                onClick={() => window.open(`${window.location.origin}/job/${job._id}`, "_blank")}
                style={{ cursor: "pointer" }}
              >
                <div className="job-card-header">
                  <div className="job-title-company">
                    <h3>{job.title}</h3>
                    <p>{job.company}</p>
                  </div>
                  <button
                    className={`save-btn ${job.isSaved ? "saved" : ""}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSaveUnsaveJob(job);
                    }}
                  >
                    {job.isSaved ? "★" : "☆"}
                  </button>
                </div>
                <div className="job-location">📍 {job.location}</div>
                <div className="job-salary">💲 Salary: {job.salary || "N/A"}</div>
                {job.deadline && <div className="job-deadline">Deadline: {job.deadline}</div>}
                <div className="job-extra-info">
                  <div className="extra">Vacancies: {job.vacancies} | Applicants: {job.applicants}</div>
                  <div className="extra">💰 {job.rewardInterviewUSD} / Interview | 💰 {job.rewardCandidateUSD} / Headhunter</div>
                  <div className="job-bonus">💰 {job.bonus}</div>
                  <div className="info-item online-days">Online {job.onlineDaysAgo} days ago</div>
                </div>
                <hr className="job-divider" />
                <button
                  className="submit-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedJob(job);
                  }}
                >
                  Submit Candidate
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="pagination">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>
            Prev
          </button>
          <span>Page {page} / {totalPages}</span>
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>
            Next
          </button>
        </div>
      </div>

      <Icons />

      {selectedJob && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Submit candidate for {selectedJob.title}</h3>
            <form onSubmit={handleSubmit} className="candidate-form">
              <input type="text" placeholder="Candidate name" required />
              <input type="email" placeholder="Email" required />
              <input type="tel" placeholder="Phone number" required />
              <input type="file" name="cv" accept=".pdf" required />
              <input type="url" placeholder="LinkedIn profile" />
              <input type="url" placeholder="Portfolio/Website link" />
              <textarea placeholder="Why is the candidate suitable?" rows="3" />
              <div className="modal-actions">
                <button type="button" onClick={closeModal} className="cancel">Cancel</button>
                <button type="submit" className="submit" disabled={isSubmitting}>{isSubmitting ? "Submitting..." : "Submit Profile"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
