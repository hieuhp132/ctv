// src/components/AdminDashboard.js
import React, { useEffect, useMemo, useState } from "react";
import "./Dashboard.css";
import "../Dashboard.css";
import {
  fetchAllJobs,
  listSubmissions,
  listArchivedSubmissions,
  getBalances,
  createJob,
  updateJob,
  deleteJob,
  saveJob,
  unsaveJob,
  fetchSavedJobs,
} from "../../api";
import { useAuth } from "../../context/AuthContext";
import { NavLink, useNavigate } from "react-router-dom";
import Select from "react-select";

import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import { QUILL_MODULES, QUILL_FORMATS } from "./quillConfig";
import Quill from "quill";

/* ===========================
   SAFE HELPERS
   =========================== */
const safeArray = (v) => (Array.isArray(v) ? v : []);

/* ===========================
   COMPONENT
   =========================== */
export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [jobs, setJobs] = useState([]);
  const [savedJobs, setSavedJobs] = useState([]);
  const [optimisticallySaved, setOptimisticallySaved] = useState(new Set());
  const [balances, setBalancesState] = useState({ adminCredit: 0, ctvBonusById: {} });

  const [activePage, setActivePage] = useState(1);
  const [inactivePage, setInactivePage] = useState(1);
  const jobsPerPage = 9;

  const [searchText, setSearchText] = useState("");
  const [filterLocation, setFilterLocation] = useState("");
  const [filterCompany, setFilterCompany] = useState("");
  const [filterCategory, setFilterCategory] = useState("");

  const CATEGORY_KEYWORDS = {
    Developer: ["dev", "developer", "engineer", "frontend", "backend", "react", "node"],
    Data: ["data", "ml", "machine learning"],
    Designer: ["design", "ux", "ui"],
    Sales: ["sales", "account"],
    Marketing: ["marketing", "seo"],
    Manager: ["manager", "lead"],
  };

  /* ===========================
     LOAD DATA (SAFE)
     =========================== */
  useEffect(() => {
    const load = async () => {
      try {
        const jobsData = await fetchAllJobs();
        console.log("Fetched jobs data:", jobsData);
        setJobs(safeArray(jobsData));

        if (user?.id || user?.email) {
          const res = await fetchSavedJobs(user.id || user.email);
          setSavedJobs(safeArray(res?.items));
        }
      } catch (err) {
        console.error("Error loading jobs:", err);
        setJobs([]); // 🔥 never crash UI
      }
    };
    load();
  }, [user]);

  const refresh = async () => {
    try {
      const [, , js, bal] = await Promise.all([
        listSubmissions(),
        listArchivedSubmissions(),
        fetchAllJobs(),
        getBalances(),
      ]);

      setJobs(safeArray(js));
      setBalancesState(bal || {});
    } catch (e) {
      console.error("refresh failed:", e);
      setJobs([]);
    }
  };

  /* ===========================
     SAFE MEMO DATA
     =========================== */
  const safeJobs = useMemo(() => safeArray(jobs), [jobs]);

  const categoriesAvailable = useMemo(() => {
    const cats = new Set();
    safeJobs.forEach((job) => {
      const title = (job.title || "").toLowerCase();
      Object.entries(CATEGORY_KEYWORDS).forEach(([cat, kws]) => {
        if (kws.some((kw) => title.includes(kw))) cats.add(cat);
      });
    });
    return cats.size ? [...cats] : ["Developer"];
  }, [safeJobs]);

  const uniqueLocations = useMemo(() => {
    const s = new Set();
    safeJobs.forEach((j) => j.location && s.add(j.location));
    return [...s];
  }, [safeJobs]);

  const uniqueCompanies = useMemo(() => {
    const s = new Set();
    safeJobs.forEach((j) => j.company && s.add(j.company));
    return [...s];
  }, [safeJobs]);

  const filteredJobs = useMemo(() => {
    const text = searchText.toLowerCase();
    return safeJobs.filter((job) => {
      const blob = `${job.title} ${job.company} ${job.location}`.toLowerCase();
      return (
        (!text || blob.includes(text)) &&
        (!filterLocation || job.location === filterLocation) &&
        (!filterCompany || job.company === filterCompany)
      );
    });
  }, [safeJobs, searchText, filterLocation, filterCompany]);

  /* ===========================
     ACTIVE / INACTIVE
     =========================== */
  const today = new Date();

  const activeJobs = filteredJobs.filter((j) => {
    const d = j.deadline ? new Date(j.deadline) : null;
    return j.status === "Active" && (!d || today <= d);
  });

  const inactiveJobs = filteredJobs.filter((j) => !activeJobs.includes(j));

  /* ===========================
     OPTIONS
     =========================== */
  const locationOptions = uniqueLocations.map((v) => ({ value: v, label: v }));
  const companyOptions = uniqueCompanies.map((v) => ({ value: v, label: v }));
  const categoryOptions = categoriesAvailable.map((v) => ({ value: v, label: v }));

  /* ===========================
     RENDER
     =========================== */
  return (
    <div className="admin-dashboard">
      <h3>ACTIVE JOBS ({activeJobs.length})</h3>

      <div className="filter-bar">
        <input
          placeholder="Search..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />

        <Select
          placeholder="Location"
          isClearable
          options={locationOptions}
          onChange={(v) => setFilterLocation(v?.value || "")}
        />

        <Select
          placeholder="Company"
          isClearable
          options={companyOptions}
          onChange={(v) => setFilterCompany(v?.value || "")}
        />
      </div>

      <div className="jobs-grid">
        {activeJobs.map((job) => (
          <div key={job.id} className="job-card" onClick={() => navigate(`/job/${job.id}`)}>
            <strong>{job.title}</strong>
            <div>{job.company}</div>
            <div>{job.location}</div>
          </div>
        ))}
      </div>

      <h3 style={{ marginTop: 40 }}>INACTIVE JOBS ({inactiveJobs.length})</h3>

      <div className="jobs-grid">
        {inactiveJobs.map((job) => (
          <div key={job.id} className="job-card inactive">
            <strong>{job.title}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}
