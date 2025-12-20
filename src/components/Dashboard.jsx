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

/* ================== HELPERS ================== */
const asArray = (v) => (Array.isArray(v) ? v : []);
const getJobId = (job) => job?._id || job?.id;

/* ================== COMPONENT ================== */
export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const ctvId = useMemo(() => user?.email || user?.id || "CTV", [user]);

  const [jobs, setJobs] = useState([]);
  const [savedJobIds, setSavedJobIds] = useState(new Set());
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
    Developer: ["dev", "developer", "engineer", "software", "frontend", "backend", "react", "node"],
    Data: ["data", "ml", "machine learning", "data engineer"],
    Designer: ["design", "designer", "ux", "ui"],
    Sales: ["sales", "business development"],
    Marketing: ["marketing", "seo", "content"],
    Manager: ["manager", "lead", "director"],
  };

  /* ================== LOAD DATA ================== */
  const loadData = async () => {
    setLoading(true);

    try {
      const jobsRes = await fetchAllJobs();
      const jobsArray = asArray(jobsRes?.jobs).map((job) => ({
        ...job,
        _id: getJobId(job),
      }));

      let savedIds = new Set();

      // Load from backend (SOURCE OF TRUTH)
      if (user?.id || user?.email) {
        const savedRes = await fetchSavedJobsL(user.id || user.email);
        const savedItems = asArray(savedRes?.items);

        savedItems.forEach((item) => {
          const id = item.jobId || item._id;
          if (id) savedIds.add(id);
        });

        // Persist clean data to localStorage
        localStorage.setItem(
          "savedJobs",
          JSON.stringify([...savedIds].map((_id) => ({ _id })))
        );
      } else {
        // Fallback localStorage
        const localSaved = JSON.parse(localStorage.getItem("savedJobs") || "[]");
        localSaved.forEach((j) => j?._id && savedIds.add(j._id));
      }

      setSavedJobIds(savedIds);

      // Attach isSaved flag
      const jobsWithFlags = jobsArray.map((job) => ({
        ...job,
        isSaved: savedIds.has(job._id),
      }));

      setJobs(jobsWithFlags);
    } catch (err) {
      console.error("Load jobs failed", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  /* ================== FILTER ================== */
  const activeJobs = useMemo(() => {
    const today = new Date();
    return jobs.filter(
      (j) => j.status === "Active" && (!j.deadline || new Date(j.deadline) >= today)
    );
  }, [jobs]);

  const filteredJobs = useMemo(() => {
    const text = searchText.toLowerCase();
    return activeJobs.filter((job) => {
      const blob = `${job.title} ${job.company} ${job.location}`.toLowerCase();
      if (text && !blob.includes(text)) return false;
      if (filterLocation && job.location !== filterLocation) return false;
      if (filterCompany && job.company !== filterCompany) return false;

      if (filterCategory) {
        const title = job.title?.toLowerCase() || "";
        return CATEGORY_KEYWORDS[filterCategory]?.some((kw) =>
          title.includes(kw)
        );
      }
      return true;
    });
  }, [activeJobs, searchText, filterLocation, filterCompany, filterCategory]);

  const totalPages = Math.max(1, Math.ceil(filteredJobs.length / pageSize));
  const displayedJobs = filteredJobs.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  /* ================== SAVE / UNSAVE ================== */
  const handleSaveUnsaveJob = async (job) => {
    const jobId = job._id;
    const userId = user?.id || user?.email;
    if (!jobId || !userId) return;

    try {
      let newSet = new Set(savedJobIds);

      if (job.isSaved) {
        await unsaveJobL(jobId, userId);
        newSet.delete(jobId);
      } else {
        await saveJobL(jobId, userId);
        newSet.add(jobId);
      }

      setSavedJobIds(newSet);

      // Persist
      localStorage.setItem(
        "savedJobs",
        JSON.stringify([...newSet].map((_id) => ({ _id })))
      );

      setJobs((prev) =>
        prev.map((j) =>
          j._id === jobId ? { ...j, isSaved: !job.isSaved } : j
        )
      );
    } catch (err) {
      alert("Save job failed");
    }
  };

  /* ================== RENDER ================== */
  return (
    <div className="dashboard-container">
      <div className="dashboard-grid">
        <h2>Active Jobs</h2>

        {loading ? (
          <p>Loading jobs...</p>
        ) : (
          <div className="job-list">
            {displayedJobs.map((job) => (
              <div
                key={job._id}
                className="job-card"
                onClick={() =>
                  window.open(`/job/${job._id}`, "_blank")
                }
              >
                <div className="job-card-header">
                  <div>
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

                <div>📍 {job.location}</div>
                <div>💲 {job.salary || "N/A"}</div>

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
      </div>

      <Icons />
    </div>
  );
}
