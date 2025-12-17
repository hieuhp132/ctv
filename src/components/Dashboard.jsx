import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";
import {
  fetchJobs,
  createSubmission,
  fetchSavedJobs,
  saveJob,
  unsaveJob,
} from "../api";
import { useAuth } from "../context/AuthContext";
import Icons from "./Icons";
import Select from "react-select";

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const ctvId = useMemo(() => (user?.email || user?.id || "CTV"), [user]);

  const [jobs, setJobs] = useState([]);
  const [savedJobs, setSavedJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [page, setPage] = useState(1);
  const pageSize = 9;

  const [searchText, setSearchText] = useState("");
  const [filterLocation, setFilterLocation] = useState("");
  const [filterCompany, setFilterCompany] = useState("");
  const [filterCategory, setFilterCategory] = useState("");

  // Map categories to keywords that may appear in job titles (lowercased)
  const CATEGORY_KEYWORDS = {
    Developer: [
      "dev",
      "developer",
      "engineer",
      "software",
      "frontend",
      "backend",
      "fullstack",
      "react",
      "node",
      "vue",
      "angular",
      "solidity",
      "smart contract",
    ],
    Data: ["data", "machine learning", "ml", "data scientist", "data engineer"],
    Designer: ["design", "designer", "ux", "ui", "product designer"],
    Sales: ["sales", "account executive", "business development", "bd"],
    Marketing: ["marketing", "growth", "seo", "content"],
    Manager: ["manager", "lead", "head of", "director"],
    Finance: ["finance", "account", "accountant", "financial"],
    HR: ["hr", "recruiter", "people", "talent"],
  };

  const activeJobs = useMemo(() => {
    const today = new Date();
    return jobs.filter((job) => {
      const deadlineDate = job.deadline ? new Date(job.deadline) : null;
      const isPastDeadline = deadlineDate && today > deadlineDate;
      return job.status === "Active" && !isPastDeadline;
    });
  }, [jobs]);

  const totalPages = useMemo(() => {
    const count = activeJobs.length;
    return count === 0 ? 1 : Math.ceil(count / pageSize);
  }, [activeJobs.length]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [totalPages]);

  const loadSavedJobs = async () => {
    try {
      const userId = user?.id || user?.email;
      if (!userId) return [];
      const response = await fetchSavedJobs(userId);
      if (response?.items && Array.isArray(response.items)) {
        const backendSavedJobs = response.items.map((item) => ({
          id: item.jobId || item.id || item._id || item.jobLink || "undefined-id",
          title: item.title,
          company: item.company,
          location: item.location,
          salary: item.salary,
          deadline: item.deadline,
          bonus: item.bonus,
        }));
        setSavedJobs(backendSavedJobs);
        localStorage.setItem("savedJobs", JSON.stringify(backendSavedJobs));
        return backendSavedJobs;
      }
      return [];
    } catch (error) {
      return [];
    }
  };

  const loadJobs = async () => {
    try {
      const jobsData = await fetchJobs();
      const today = new Date();
      const activeOnly = jobsData.filter((job) => {
        const deadlineDate = job.deadline ? new Date(job.deadline) : null;
        const isPastDeadline = deadlineDate && today > deadlineDate;
        return job.status === "Active" && !isPastDeadline;
      });
      // console.log("Fetched jobs:", activeOnly);
      setJobs(activeOnly);
    } catch (error) {}
  };

  const updateJobListWithSavedStatus = (savedJobsList) => {
    setJobs((prevJobs) => {
      const savedJobsIds = savedJobsList.map((job) => job.id);
      return prevJobs.map((job) => ({
        ...job,
        isSaved: savedJobsIds.includes(job.id),
      }));
    });
  };

  useEffect(() => {
    loadSavedJobs().then((savedJobsList) => {
      loadJobs().then(() => {
        updateJobListWithSavedStatus(savedJobsList);
      });
    });
  }, [user]);

  const closeModal = () => setSelectedJob(null);

  const handleSubmit = async (e) => {
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
      jobId: selectedJob.id,
      jobTitle: selectedJob.title,
      ctvId,
      email,
      phone,
      linkedin,
      portfolio,
      suitability,
      cvFile,
      bonus: selectedJob.bonus,
    });

    alert("Profile submitted successfully!");
    form.reset();
    closeModal();
  };

  const handleSaveUnsaveJob = async (job, isSaved) => {
    try {
      const userId = user?.id || user?.email;
      if (!userId) return;

      if (isSaved) {
        const response = await unsaveJob(job.id, userId);
        if (response?.success) {
          setSavedJobs((prev) => prev.filter((savedJob) => savedJob.id !== job.id));
        }
      } else {
        const response = await saveJob(job.id, userId);
        if (response?.success) {
          setSavedJobs((prev) =>
            prev.some((savedJob) => savedJob.id === job.id) ? prev : [...prev, job]
          );
        }
      }
    } catch (err) {
      alert("Failed to save/unsave job");
    }
  };

  const filteredJobs = useMemo(() => {
    const text = searchText.toLowerCase().trim();
    return activeJobs.filter((job) => {
      // Search across multiple fields: title, company, location, keywords, and content snippets
      const searchableText = [
        job.title || "",
        job.company || "",
        job.location || "",
        Array.isArray(job.keywords) ? job.keywords.join(" ") : job.keywords || "",
        // Extract text from HTML descriptions (strip tags for search)
        (job.description || "").replace(/<[^>]*>/g, " "),
        (job.requirements || "").replace(/<[^>]*>/g, " "),
      ]
        .join(" ")
        .toLowerCase();

      const matchSearch = text === "" || searchableText.includes(text);

      const matchLocation = filterLocation === "" || job.location === filterLocation;
      const matchCompany = filterCompany === "" || job.company === filterCompany;

      // Category filter: if set, job title must match any keyword for that category
      let matchCategory = true;
      if (filterCategory) {
        const title = (job.title || "").toLowerCase();
        const keywords = CATEGORY_KEYWORDS[filterCategory] || [];
        matchCategory = keywords.some((kw) => title.includes(kw));
      }

      return matchSearch && matchLocation && matchCompany && matchCategory;
    });
  }, [activeJobs, searchText, filterLocation, filterCompany, filterCategory]);

  const startIndex = (page - 1) * pageSize;
  const displayedJobs = filteredJobs.slice(startIndex, startIndex + pageSize);

  // Categories available based on job titles
  const categoriesAvailable = useMemo(() => {
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

  const uniqueLocations = useMemo(() => {
    const m = new Map();
    jobs.forEach((j) => {
      const raw = j.location;
      const k = String(raw || "").trim().replace(/\s+/g, " ").toLowerCase();
      if (!k) return;
      if (!m.has(k)) m.set(k, raw);
    });
    return Array.from(m.values());
  }, [jobs]);

  const uniqueCompanies = useMemo(() => {
    const m = new Map();
    jobs.forEach((j) => {
      const raw = j.company;
      const k = String(raw || "").trim().replace(/\s+/g, " ").toLowerCase();
      if (!k) return;
      if (!m.has(k)) m.set(k, raw);
    });
    return Array.from(m.values());
  }, [jobs]);

  const locationOptions = useMemo(
    () => uniqueLocations.map(loc => ({ value: loc, label: loc })),
    [uniqueLocations]
  );

  const companyOptions = useMemo(
    () => uniqueCompanies.map(comp => ({ value: comp, label: comp })),
    [uniqueCompanies]
  );

  const selectStyles = {
    control: (base) => ({
      ...base,
      minHeight: 40,
      fontSize: 14,
      borderRadius: 8,
    }),
    valueContainer: (base) => ({
      ...base,
      padding: "2px 10px",
    }),
    option: (base, state) => ({
      ...base,
      padding: "10px 12px",        // 👈 chiều cao option
      fontSize: 14,
      backgroundColor: state.isFocused ? "#f3f4f6" : "#fff",
      color: "#111",
      cursor: "pointer",
      whiteSpace: "normal",        // 👈 text dài tự xuống dòng
    }),
    menu: (base) => ({
      ...base,
      zIndex: 9999,
    }),
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-grid">
        <h2>Active Jobs</h2>

        {/* Search */}
        <div className="filter-bar">
          <input
            type="text"
            placeholder="Search jobs, companies, skills..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="filter-input"
          />
          <button className="find-jobs-btn" type="button">Search</button>
        </div>

        {/* Filters */}
        <div className="filter-bar" style={{ marginTop: 8 }}>
            <div style={{ flex: 1 }}>
          <Select
            options={locationOptions}
            placeholder="All locations"
            isClearable
            styles={selectStyles}
            value={
              filterLocation
                ? { value: filterLocation, label: filterLocation }
                : null
            }
            onChange={(option) => setFilterLocation(option?.value || "")}
          /></div>

           <div style={{ flex: 1 }}>
          <Select
            options={companyOptions}
            placeholder="All companies"
            isClearable
            styles={selectStyles}
            value={
              filterCompany
                ? { value: filterCompany, label: filterCompany }
                : null
            }
            onChange={(option) => setFilterCompany(option?.value || "")}
          />  </div>

        </div>

        {/* Category Chips - derived from job titles */}
        <div className="category-chips">
          {categoriesAvailable.map((cat) => {
            const active = filterCategory === cat;
            return (
              <button
                key={cat}
                className={`chip ${active ? "active" : ""}`}
                onClick={() => setFilterCategory((c) => (c === cat ? "" : cat))}
                type="button"
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Job List */}
        <div className="job-list">
          {displayedJobs.map((job) => {
            const isSaved = savedJobs.some((savedJob) => savedJob.id === job.id);
            const companyInitial = job.company ? job.company[0].toUpperCase() : "?";

            return (
              <div
                key={job.id}
                className="job-card"
                onClick={() => window.open(`${window.location.origin}/job/${job.id}`, "_blank")}
                style={{ cursor: "pointer" }}
              >
                <div className="job-card-header">
                  {/* <div className="company-logo">{companyInitial}</div> */}
                  <div className="job-title-company">
                    <h3>{job.title}</h3>
                    <p>{job.company}</p>
                  </div>

                  <button
                    className={`save-btn ${isSaved ? "saved" : ""}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSaveUnsaveJob(job, isSaved);
                    }}
                  >
                    {isSaved ? "★" : "☆"}
                  </button>
                </div>

                {/* 🔥 FIX TRIỆT ĐỂ 3 THẺ P → DIV */}
                <div className="job-location">📍 {job.location}</div>
                <div className="job-salary">💲 Salary: {job.salary || "N/A"}</div>
                {job.deadline && (
                  <div className="job-deadline">Deadline: {job.deadline}</div>
                )}

                {/* Extra info */}
                <div className="job-extra-info">
                  <div className="extra">
                    <div className="">
                      Vacancies: {job.vacancies}
                    </div>


                    <div className="">
                      Applicants: {job.applicants}
                    </div>
                  </div>


                  <div className="extra">
                    <div className="info-item applicants">
                    💰 {job.rewardInterviewUSD} / Interview
                    </div>

                    <div className="info-item bonus">
                    💰 {job.rewardCandidateUSD} / Headhunter
                    </div>  
                  </div>
                  
                  <div className="job-bonus">
                   💰 {job.bonus}
                  </div>

                  <div className="info-item online-days">
                      Online {job.onlineDaysAgo} days ago
                  </div>
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
            );
          })}
        </div>

        {/* Pagination */}
        <div className="pagination">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>
            Prev
          </button>

          <span>
            Page {page} / {totalPages}
          </span>

          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
          >
            Next
          </button>
        </div>
      </div>

      <Icons />

      {/* Modal */}
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
                <button type="button" onClick={closeModal} className="cancel">
                  Cancel
                </button>
                <button type="submit" className="submit">
                  Submit Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
