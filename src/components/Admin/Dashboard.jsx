// src/components/AdminDashboard.js
import React, { useEffect, useState } from "react";
import "./Dashboard.css";
import "../Dashboard.css";
import {
  fetchAllJobs,
  getBalances,

  deleteJobL,
  fetchSavedJobsL,
 
  unsaveJobL,
  saveJobL,
  updateJobL,
  createJobL,
} from "../../api";
import { useAuth } from "../../context/AuthContext";
import { NavLink, useNavigate } from "react-router-dom";
import Select from "react-select";

// ReactQuill
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";

// Centralized Quill configuration and init helper
import {  QUILL_MODULES, QUILL_FORMATS } from "./quillConfig";

// initialize quill once (idempotent)
// initQuill();

// IMPORTANT: import Quill directly and register our size format once.
// We use the style-based size attributor (reliable across environments),
// then convert its inline style output to the data-size markup when saving.
import Quill from "quill";

/* ===========================
   Quill Inline Size Registration
   =========================== */

/**
 * We register a style-based size attributor so Quill shows exact labels
 * like "12px", "14px", "1rem", etc. This makes the toolbar dropdown show
 * the exact values we want and applying sizes works across browsers.
 *
 * On submit we'll normalize saved HTML from `style="font-size:18px"` to
 * `<span class="ql-size" data-size="18px">` so your backend can see
 * the `data-size` pattern you requested.
 */
const QUILL_SIZE_WHITELIST = [
  "12px",
  "14px",
  "16px",
  "18px",
  "20px",
  "24px",
  "28px",
  "32px",

];

// Register sizes only once
try {
  const Size = Quill.import("attributors/style/size");
  Size.whitelist = QUILL_SIZE_WHITELIST;
  Quill.register(Size, true);
} catch (err) {
  // If registration fails, log — but don't break the whole component.
  // ReactQuill will fall back to defaults but we attempt safe behavior.
  // (In normal setups this will succeed.)
  // eslint-disable-next-line no-console
  console.warn("Quill size registration failed:", err);
}

// Register a Parchment attribute so Quill's 'list' format reads/writes the
// `data-list` attribute on list items. This allows the editor to natively
// understand markup like `<li data-list="bullet">` and treat it as the
// `list: 'bullet'` format instead of falling back to default behavior.
try {
  const Parchment = Quill.import('parchment');
  if (Parchment && Parchment.Attributor && Parchment.Scope) {
    const DataListAttr = new Parchment.Attributor.Attribute('list', 'data-list', {
      scope: Parchment.Scope.BLOCK,
    });
    Quill.register(DataListAttr, true);
  }
} catch (err) {
  // Non-fatal — if Parchment isn't available or registration fails we'll
  // continue to use the sanitize/convert fallback functions added earlier.
  // eslint-disable-next-line no-console
  console.warn('Failed to register data-list attributor:', err);
}

/* ===========================
   Quill Modules & Formats
   =========================== */


/* ===========================
   Component
   =========================== */
export default function AdminDashboard() {
  const [jobs, setJobs] = useState([]);
  const [savedJobs, setSavedJobs] = useState([]);
  const [optimisticallySaved, setOptimisticallySaved] = useState(new Set());
  const { user } = useAuth();
  const adminId = user?.id || user?.email;
  const [savedJobIds, setSavedJobIds] = useState(new Set());
  const navigate = useNavigate();
  const [balances, setBalancesState] = useState({
    adminCredit: 0,
    ctvBonusById: {},
  });
  const [activePage, setActivePage] = useState(1);
  const [inactivePage, setInactivePage] = useState(1);
  const jobsPerPage = 9;
  const [searchText, setSearchText] = useState("");
  const [filterLocation, setFilterLocation] = useState("");
  const [filterCompany, setFilterCompany] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
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

  const [showJobModal, setShowJobModal] = useState(false);
  const [editingJob, setEditingJob] = useState(null);

  // Register Quill sizes on mount as a safety (if Quill was not ready earlier)
  // useEffect(() => {
  //   try {
  //     const Size = Quill.import("attributors/style/size");
  //     if (Size && (!Size.whitelist || Size.whitelist.length === 0)) {
  //       Size.whitelist = QUILL_SIZE_WHITELIST;
  //       Quill.register(Size, true);
  //     }
  //   } catch (err) {
  //     // ignore
  //   }
  // }, []);

  const [jobForm, setJobForm] = useState({
    title: "",
    company: "",
    location: "",
    bonus: "",
    rewardCandidateUSD: 500,
    rewardInterviewUSD: 2,
    vacancies: 1,
    applicants: 0,
    deadline: "",
    status: "Active",
    description: "",
    keywords: "",
    requirements: "",
    benefits: "",
    other: "",
  });

  const openAddJob = () => {
    setEditingJob(null);
    setJobForm({
      title: "",
      company: "",
      location: "",
      salary: "",
      bonus: "",
      rewardCandidateUSD: 500,
      rewardInterviewUSD: 2,
      vacancies: 1,
      applicants: 0,
      deadline: "",
      status: "Active",
      description: "",
      requirements: "",
      benefits: "",
      other: "",
      keywords: "",
    });
    setShowJobModal(true);
  };

  const openEditJob = (job) => {
    console.log("Editing job:", job);
    setEditingJob(job);
    setJobForm({
      title: job.title || "",
      company: job.company || "",
      location: job.location || "",
      salary: job.salary || "",
      bonus: job.bonus || "",
      rewardCandidateUSD: job.rewardCandidateUSD,
      rewardInterviewUSD: job.rewardInterviewUSD,
      vacancies: job.vacancies,
      applicants: job.applicants,
      deadline: job.deadline || "",
      status: job.status || "Active",
      // If backend stores data-size markup or legacy <ol> with data-list="bullet",
      // convert list markup to <ul> and convert data-size into inline style so
      // the Quill editor (which uses style-based size attributor) displays sizes
      // correctly and shows bullets rather than numeric markers.
      description: convertDataSizeToStyle(normalizeQuillSavedHtml(job.jobsdetail.description || "")),
      requirements: convertDataSizeToStyle(normalizeQuillSavedHtml(job.jobsdetail.requirements || "")),
      benefits: convertDataSizeToStyle(normalizeQuillSavedHtml(job.jobsdetail.benefits || "")),
      other: convertDataSizeToStyle(normalizeQuillSavedHtml(job.jobsdetail.other || "")),
      keywords: Array.isArray(job.keywords) ? job.keywords.join(", ") : "",
    });
    setShowJobModal(true);
  };

  const closeJobModal = () => setShowJobModal(false);

  const onChangeJobField = (e) => {
    const { name, value } = e.target;
    setJobForm((prev) => ({
      ...prev,
      [name]:
        name.includes("reward") || name === "vacancies" || name === "applicants"
          ? Number(value)
          : value,
    }));
  };

  // Normalize Quill-saved HTML so bullet lists are stored as <ul> when editor used bullets.
  function normalizeQuillSavedHtml(html) {
    if (!html || typeof html !== "string") return html;
    if (html.indexOf('data-list="bullet"') !== -1 || html.indexOf("data-list='bullet'") !== -1) {
      return html.replace(/<ol(.*?)>/gi, "<ul$1>").replace(/<\/ol>/gi, "</ul>");
    }
    return html;
  }

  // Convert inline style font-size (e.g. <span style="font-size:18px">) into
  // <span class="ql-size" data-size="18px"> so your backend sees data-size markup.
  // This preserves the text and other attributes.
  function convertStyleSizeToDataSize(html) {
    if (!html || typeof html !== "string") return html;

    // Replace style="font-size: 18px;" or style="font-size:18px" etc.
    // Keeps other style rules intact (we only extract font-size and remove it from style).
    return html.replace(/<span\b([^>]*)style\s*=\s*"(.*?)"([^>]*)>/gi, (match, preAttrs1, styleContent, postAttrs1) => {
      // find font-size in styleContent
      const fontSizeMatch = styleContent.match(/font-size\s*:\s*([^;]+)\s*;?/i);
      if (!fontSizeMatch) {
        // no font-size -> return original span
        return match;
      }
      const fontSizeValue = fontSizeMatch[1].trim();

      // remove font-size declaration from styleContent
      const newStyle = styleContent.replace(/font-size\s*:\s*([^;]+)\s*;?/i, "").trim();

      // Build new attributes: keep existing attributes but remove the original style attr and add remaining style if any.
      // We need to reconstruct attributes carefully.
      // Merge preAttrs1 and postAttrs1 and drop style attr...
      const otherAttrs = (preAttrs1 + " " + postAttrs1).trim();

      // Build remaining style attribute if any
      const styleAttr = newStyle ? ` style="${newStyle}"` : "";

      // Add class "ql-size" and data-size attribute
      // Keep otherAttrs as-is (they may already include class or other attributes).
      // If otherAttrs already contains class attribute, we append ql-size to it; otherwise, add class="ql-size".
      let attrs = otherAttrs;

      // normalize spacing
      attrs = attrs.replace(/\s+/g, " ").trim();

      // Check for existing class=""
      const classMatch = attrs.match(/class\s*=\s*"(.*?)"/i);
      if (classMatch) {
        // append ql-size to existing classes
        const classes = classMatch[1] ? classMatch[1].trim() : "";
        const newClasses = (classes + " ql-size").trim();
        attrs = attrs.replace(/class\s*=\s*"(.*?)"/i, `class="${newClasses}"`);
      } else {
        // add class attribute
        attrs = (attrs ? attrs + ' ' : '') + `class="ql-size"`;
      }

      // Remove any stray style attr from attrs (we already handled it)
      attrs = attrs.replace(/\s*style\s*=\s*"(.*?)"/i, "").trim();

      // Reconstruct the span tag
      return `<span ${attrs}${styleAttr} data-size="${fontSizeValue}">`;
    });
  }

  // Convert stored data-size markup back into inline style font-size so Quill's
  // style-based size attributor (registered above) recognizes and displays it
  // when loading content into the editor for editing.
  function convertDataSizeToStyle(html) {
    if (!html || typeof html !== "string") return html;

    return html.replace(/<span\b([^>]*)\sdata-size\s*=\s*"([^"]+)"([^>]*)>/gi, (match, preAttrs, sizeValue, postAttrs) => {
      // Combine attributes while removing data-size
      let attrs = (preAttrs + ' ' + postAttrs).trim();

      // Extract existing style if any
      const styleMatch = attrs.match(/style\s*=\s*"([^"]*)"/i);
      let existingStyle = styleMatch ? styleMatch[1].trim() : "";

      // Remove any existing style attr from attrs (we'll re-add it)
      attrs = attrs.replace(/style\s*=\s*"([^"]*)"/i, "").trim();

      // Build new style string: preserve other style declarations and append font-size
      const fontSizeDecl = `font-size: ${sizeValue};`;
      const newStyle = (existingStyle ? existingStyle + ' ' + fontSizeDecl : fontSizeDecl).trim();

      // Ensure class contains ql-size for consistency (optional)
      const classMatch = attrs.match(/class\s*=\s*"([^"]*)"/i);
      if (classMatch) {
        const classes = classMatch[1].split(/\s+/).filter(Boolean);
        if (!classes.includes('ql-size')) {
          const newClasses = (classes.concat(['ql-size'])).join(' ');
          attrs = attrs.replace(/class\s*=\s*"([^"]*)"/i, `class="${newClasses}"`);
        }
      } else {
        attrs = (attrs ? attrs + ' ' : '') + `class="ql-size"`;
      }

      // Reconstruct span tag with inline style and without data-size attr
      return `<span ${attrs} style="${newStyle}">`;
    });
  }

  // Ensure lists are safe for Quill editor: convert any <ol> to <ul>
  // and remove data-list attributes from <li> so Quill renders bullets
  // based on the parent tag instead of any stray attributes.
  function sanitizeListsForEditor(html) {
    if (!html || typeof html !== "string") return html;

    // Convert <ol ...> to <ul ...>
    let out = html.replace(/<ol(.*?)>/gi, "<ul$1>").replace(/<\/ol>/gi, "</ul>");

    // Remove data-list attributes from li (e.g. data-list="bullet")
    out = out.replace(/<li\b([^>]*)\sdata-list\s*=\s*"[^"]*"([^>]*)>/gi, "<li$1$2>");
    out = out.replace(/<li\b([^>]*)\sdata-list\s*=\s*'[^']*'([^>]*)>/gi, "<li$1$2>");

    return out;
  }

  const submitJobForm = async (e) => {
    e.preventDefault();

    const formattedJobForm = {
      ...jobForm,
      salary: jobForm.salary?.trim() || "N/A",
      keywords:
        typeof jobForm.keywords === "string"
          ? jobForm.keywords
              .split(",")
              .map((k) => k.trim())
              .filter(Boolean)
          : [],
    };

    formattedJobForm.description = normalizeQuillSavedHtml(formattedJobForm.description);
    formattedJobForm.requirements = normalizeQuillSavedHtml(formattedJobForm.requirements);
    formattedJobForm.benefits = normalizeQuillSavedHtml(formattedJobForm.benefits);
    formattedJobForm.other = normalizeQuillSavedHtml(formattedJobForm.other);

    // Convert style-based font-size into data-size markup for storage consistency
    formattedJobForm.description = convertStyleSizeToDataSize(formattedJobForm.description);
    formattedJobForm.requirements = convertStyleSizeToDataSize(formattedJobForm.requirements);
    formattedJobForm.benefits = convertStyleSizeToDataSize(formattedJobForm.benefits);
    formattedJobForm.other = convertStyleSizeToDataSize(formattedJobForm.other);

    try {
      if (editingJob) {
        await updateJobL({ ...editingJob, ...formattedJobForm });
      } else {
        await createJobL(formattedJobForm);
      }

      closeJobModal();
      await refresh();
    } catch (err) {
      console.error("Failed to save job:", err);
      alert("Failed to save job. Check console for details.");
    }
  };

  const refresh = async () => {
    try {
      const [js, bal] = await Promise.all([
        fetchAllJobs(),
        getBalances(),
      ]);
      console.log("REFRESHED JOBS RAW:", js.jobs);
      const sortedJobs = [...(js.jobs || [])].sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );
      console.log("REFRESHED JOBS:", sortedJobs);
      setJobs(sortedJobs);
      setBalancesState(bal);

      if (user?.id || user?.email) {
        setSavedJobs(
          (js.jobs || []).filter(
            (j) => Array.isArray(j.savedBy) && j.savedBy.includes(user.id || user.email)
          )
        );
      }
    } catch (err) {
      console.error("Failed to refresh data:", err);
    }
  };
  const asArray = (v) => (Array.isArray(v) ? v : []);

  useEffect(() => {
    const loadJobs = async () => {
      try {
        const jobsData = await fetchAllJobs();
        
        const sortedJobs = [...(jobsData.jobs || [])].sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );
        console.log("Loaded jobs:", sortedJobs);        
        setJobs(sortedJobs);

        let savedIds = new Set();
        if (user?.email || user?.id) {
          const savedRes = await fetchSavedJobsL(user.email);
          asArray(savedRes?.jobs).forEach((j) => {
            const id = j.jobId || j._id;
            if (id) savedIds.add(id);
          });
        }

        setSavedJobIds(savedIds);
        setJobs(sortedJobs.map((j) => ({ ...j, isSaved: savedIds.has(j._id) })));
      } catch (error) {
        console.error("Error loading jobs:", error);
      }
    };

    loadJobs();
  }, [user]);

  const removeJob = async (job) => {
    if (!window.confirm(`Delete job ${job.title}?`)) return;
    try {
      await deleteJobL(job._id);
      await refresh();
    } catch (err) {
      console.error("Failed to delete job:", err);
      alert("Failed to delete job");
    }
  };




  // -----------------------------------------
  // ACTIVE / INACTIVE jobs separation
  // -----------------------------------------
  const today = new Date();
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
  
    const activeJobs = filteredJobs.filter((job) => {
    const deadlineDate = job.deadline ? new Date(job.deadline) : null;
    const isPastDeadline = deadlineDate && today > deadlineDate;
    return job.status === "Active" && !isPastDeadline;
  });

  const inactiveJobs = filteredJobs.filter((job) => {
    const deadlineDate = job.deadline ? new Date(job.deadline) : null;
    const isPastDeadline = deadlineDate && today > deadlineDate;
    return job.status !== "Active" || isPastDeadline;
  });

  const totalActivePages = Math.ceil(activeJobs.length / jobsPerPage) || 1;
  const totalInactivePages = Math.ceil(inactiveJobs.length / jobsPerPage) || 1;
  const activeStart = (activePage - 1) * jobsPerPage;
  const inactiveStart = (inactivePage - 1) * jobsPerPage;
  const displayedActiveJobs = activeJobs.slice(activeStart, activeStart + jobsPerPage);
  const displayedInactiveJobs = inactiveJobs.slice(inactiveStart, inactiveStart + jobsPerPage);


    const handleSaveUnsaveJob = async (job) => {
      if (!adminId) return;
      try {
        const newSet = new Set(savedJobIds);
        if (job.isSaved) {
          await unsaveJobL(job._id, adminId);
          newSet.delete(job._id);
        } else {
          await saveJobL(job._id, adminId);
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

  // -----------------------------------------
  // Render helpers
  // -----------------------------------------
  const renderJobCard = (job, isInactive) => {
    return (
      <div
        key={job.id}
        className="job-card"
        style={{
          position: "relative",
          cursor: isInactive ? "not-allowed" : "pointer",
          filter: isInactive ? "" : "none",
          pointerEvents: "auto",
        }}
        onClick={() => {
          navigate(`/job/${job._id}`);
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div className="job-title" style={{ fontWeight: 600, fontSize: "1.1em" }}>
            {job.title}
          </div>

          {/* SAVE BUTTON */}
          <button className={`save-btn ${job.isSaved ? "saved" : ""}`} onClick={(e) => { e.stopPropagation(); handleSaveUnsaveJob(job); }}>
            {job.isSaved ? "★" : "☆"}
          </button>
        </div>

        {/* INFO */}
        <div style={{ fontSize: "13px", color: "#555", marginBottom: 6 }}>
          <strong>Company:</strong> {job.company}
        </div>

        <div style={{ fontSize: "13px", color: "#555", marginBottom: 6 }}>
          <strong>Location:</strong> {job.location}
        </div>

        <div className="job-meta">
          <div>
            <strong>Salary:</strong> {job.salary || "N/A"}
          </div>


          {job.deadline && <span className="job-deadline">Deadline: {job.deadline}</span>}

          <span style={{ marginLeft: 8, fontWeight: "bold", color: isInactive ? "red" : "green" }}>
            Status: {isInactive ? "Inactive" : "Active"}
          </span>
        </div>

        <div style={{ fontSize: "12px", color: "#666", marginBottom: 6 }}>
          <span>Vacancies: {job.vacancies}</span>
          <span style={{ marginLeft: 8 }}>Applicants: {job.applicants}</span>
        </div>

        <div className="reward-line">
          <span className="reward-badge">USD {job.rewardCandidateUSD} / Headhunter</span>
          <span className="reward-badge secondary">+USD {job.rewardInterviewUSD} / Interview</span>
          <span className="job-bonus">+USD {job.bonus}</span>
        </div>

        {/* ACTION BUTTONS */}
        <div className="job-actions">
          <button
            onClick={(e) => {
              e.stopPropagation();
              openEditJob(job);
            }}
            disabled={isInactive}
            style={{
              opacity: isInactive ? 0.5 : 1,
            }}
          >
            Edit
          </button>

          <button
            className="danger"
            onClick={(e) => {
              e.stopPropagation();
              removeJob(job);
            }}
          >
            Delete
          </button>

          <button
            style={{
              marginLeft: 8,
              background: job.status === "Active" ? "#ffc107" : "#28a745",
              color: "#fff",
              border: "none",
              borderRadius: 4,
              padding: "4px 10px",
              cursor: "pointer",
            }}
            onClick={async (e) => {
              e.stopPropagation();
              try {
                await updateJobL({ ...job, status: job.status === "Active" ? "Inactive" : "Active" });
                await refresh();
              } catch (err) {
                console.error("Failed to update status:", err);
                alert("Failed to update job status");
              }
            }}
          >
            {job.status === "Active" ? "Pause" : "Resume"}
          </button>
        </div>
      </div>
    );
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


  return (
    <div className="admin-dashboard">

      {/* TABS */}
      <div className="tasks" style={{ display: "flex", gap: 20 }}>
        <NavLink to="/admin-dashboard" className={({ isActive }) => (isActive ? "nav-tab active-tab" : "nav-tab")}>
          Beta
        </NavLink>
        <NavLink to="/user-management" className={({ isActive }) => (isActive ? "nav-tab active-tab" : "nav-tab")}>
          Users List
        </NavLink>
      </div>

      {/* ACTIVE JOB LIST */}
      <div style={{ marginTop: 24 }}>

        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <h3 style={{ color: "green" }}>ACTIVE JOBS ({activeJobs.length})</h3>
          <div>
            <button onClick={openAddJob}>+ Add Job</button>
          </div>
        </div>

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


        <div className="jobs-grid">{displayedActiveJobs.map((job) => renderJobCard(job, false))}</div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
          <div style={{ fontSize: 12, color: "#666" }}>
            Showing {activeJobs.length === 0 ? 0 : activeStart + 1}-{Math.min(activeStart + jobsPerPage, activeJobs.length)} of {activeJobs.length}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => setActivePage((p) => Math.max(1, p - 1))} disabled={activePage <= 1}>
              Prev
            </button>
            <span>
              Page {activePage} / {totalActivePages}
            </span>
            <button onClick={() => setActivePage((p) => Math.min(totalActivePages, p + 1))} disabled={activePage >= totalActivePages}>
              Next
            </button>
          </div>
        </div>
      </div>

      {/* INACTIVE JOB LIST */}
      <div style={{ marginTop: 40 }}>
        <h3 style={{ color: "red" }}>INACTIVE / EXPIRED JOBS ({inactiveJobs.length})</h3>
        <div className="jobs-grid">{displayedInactiveJobs.map((job) => renderJobCard(job, true))}</div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
          <div style={{ fontSize: 12, color: "#666" }}>
            Showing {inactiveJobs.length === 0 ? 0 : inactiveStart + 1}-{Math.min(inactiveStart + jobsPerPage, inactiveJobs.length)} of {inactiveJobs.length}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => setInactivePage((p) => Math.max(1, p - 1))} disabled={inactivePage <= 1}>
              Prev
            </button>
            <span>
              Page {inactivePage} / {totalInactivePages}
            </span>
            <button onClick={() => setInactivePage((p) => Math.min(totalInactivePages, p + 1))} disabled={inactivePage >= totalInactivePages}>
              Next
            </button>
          </div>
        </div>
      </div>

      {/* MODAL */}
      {showJobModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 12,
              padding: 16,
              width: 600,
              maxWidth: "90%",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
          >
            <h3>{editingJob ? "Edit job" : "Add job"}</h3>

            <form onSubmit={submitJobForm} className="candidate-form">
              <div style={{ display: "grid", gap: 8 }}>
                <input name="title" placeholder="Title" value={jobForm.title || ""} onChange={onChangeJobField} required />

                <input name="company" placeholder="Company" value={jobForm.company || ""} onChange={onChangeJobField} required />

                <input name="location" placeholder="Location" value={jobForm.location || ""} onChange={onChangeJobField} required />

                <input name="keywords" placeholder="e.g. JavaScript, React, Remote" value={jobForm.keywords || ""} onChange={onChangeJobField} />

                <input
                  name="salary"
                  placeholder="Salary (e.g.: 1000 USD)"
                  value={jobForm.salary || ""}
                  onChange={(e) =>
                    setJobForm((p) => ({
                      ...p,
                      salary: e.target.value.trim(),
                    }))
                  }
                  required
                />

                <input name="bonus" placeholder="Bonus" value={jobForm.bonus || ""} onChange={onChangeJobField} />

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <input name="rewardCandidateUSD" type="number" placeholder="Reward/Headhunter" value={jobForm.rewardCandidateUSD || ""} onChange={onChangeJobField} />

                  <input name="rewardInterviewUSD" type="number" placeholder="Reward/Interview" value={jobForm.rewardInterviewUSD || ""} onChange={onChangeJobField} />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <input name="vacancies" type="number" placeholder="Vacancies" value={jobForm.vacancies || ""} onChange={onChangeJobField} />

                  <input name="applicants" type="number" placeholder="Applicants" value={jobForm.applicants || ""} onChange={onChangeJobField} />
                </div>

                <input name="deadline" placeholder="Deadline (YYYY-MM-DD)" value={jobForm.deadline || ""} onChange={onChangeJobField} />

                {/* ReactQuill fields */}
                <div style={{ marginTop: 12, padding: 12, background: "#f8f9fa", borderRadius: 8 }}>
                  <h4>Job Details</h4>

                  <label>Description</label>
                  <ReactQuill
                    modules={QUILL_MODULES}
                    formats={QUILL_FORMATS}
                    value={jobForm.description || ""}
                    onChange={(v) => setJobForm((p) => ({ ...p, description: v }))}
                    style={{ marginBottom: 20 }}
                  />

                  <label>Requirements</label>
                  <ReactQuill
                    modules={QUILL_MODULES}
                    formats={QUILL_FORMATS}
                    value={jobForm.requirements || ""}
                    onChange={(v) => setJobForm((p) => ({ ...p, requirements: v }))}
                    style={{ marginBottom: 20 }}
                  />

                  <label>Benefits</label>
                  <ReactQuill
                    modules={QUILL_MODULES}
                    formats={QUILL_FORMATS}
                    value={jobForm.benefits || ""}
                    onChange={(v) => setJobForm((p) => ({ ...p, benefits: v }))}
                    style={{ marginBottom: 20 }}
                  />

                  <label>Other</label>
                  <ReactQuill
                    modules={QUILL_MODULES}
                    formats={QUILL_FORMATS}
                    value={jobForm.other || ""}
                    onChange={(v) => setJobForm((p) => ({ ...p, other: v }))}
                    style={{ marginBottom: 20 }}
                  />
                </div>
              </div>

              {/* BUTTONS */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 12 }}>
                <button type="button" onClick={closeJobModal}>
                  Cancel
                </button>

                <button
                  type="submit"
                  style={{
                    background: "linear-gradient(135deg,#FFA500,#FF5E62)",
                    color: "#fff",
                    borderRadius: 6,
                    padding: "6px 12px",
                    border: "none",
                  }}
                >
                  {editingJob ? "Save" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
