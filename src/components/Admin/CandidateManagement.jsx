import React, { useEffect, useMemo, useState } from "react";
import "./CandidateManagement.css";
import {
  updateReferralFieldsById,
  listReferrals,
  removeReferralFieldsById,
  getJobByIdL,
  fetchProfileFromServerL,
} from "../../api";
import { useAuth } from "../../context/AuthContext";

/* ================= CONSTANTS ================= */
const STATUS_OPTIONS = [
  "submitted",
  "under_review",
  "interviewing",
  "offer",
  "hired",
  "onboard",
  "rejected",
];
const PAGE_SIZE = 10;

/* ================= HELPERS ================= */
const sortData = (data, { key, direction }) => {
  if (!key || !direction) return data;
  return [...data].sort((a, b) => {
    let av = a[key];
    let bv = b[key];

    if (
      key.toLowerCase().includes("time") ||
      key.toLowerCase().includes("date") ||
      key === "updatedAt"
    ) {
      av = av ? new Date(av).getTime() : 0;
      bv = bv ? new Date(bv).getTime() : 0;
    }

    if (av == null) return 1;
    if (bv == null) return -1;

    if (!isNaN(av) && !isNaN(bv))
      return direction === "asc" ? av - bv : bv - av;

    return direction === "asc"
      ? String(av).localeCompare(String(bv))
      : String(bv).localeCompare(String(av));
  });
};

const paginate = (data, page) =>
  data.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

/* ================= DEBOUNCE ================= */
function useDebounce(value, delay = 200) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

/* ================= FILTER UI ================= */
const FilterUI = React.memo(({ filters, onChange }) => (
  <div className="filter-container">
    <input
      placeholder="Candidate"
      value={filters.candidateName}
      onChange={(e) => onChange("candidateName", e.target.value)}
    />
    <input
      placeholder="Job"
      value={filters.job}
      onChange={(e) => onChange("job", e.target.value)}
    />
    <input
      placeholder="CTV"
      value={filters.recruiter}
      onChange={(e) => onChange("recruiter", e.target.value)}
    />
    <input
      placeholder="Email"
      value={filters.candidateEmail}
      onChange={(e) => onChange("candidateEmail", e.target.value)}
    />
    <select
      value={filters.status}
      onChange={(e) => onChange("status", e.target.value)}
    >
      <option value="">All Status</option>
      {STATUS_OPTIONS.map((s) => (
        <option key={s} value={s}>
          {s}
        </option>
      ))}
    </select>
  </div>
));

/* ================= MAIN ================= */
export default function CandidateManagement() {
  const { user } = useAuth();
  const adminId = user?._id;
  const email = user?.email || "";

  const [rows, setRows] = useState([]);
  const [filters, setFilters] = useState({
    candidateName: "",
    job: "",
    recruiter: "",
    candidateEmail: "",
    status: "",
  });
  const [sortConfig, setSortConfig] = useState({ key: "", direction: "" });
  const [activePage, setActivePage] = useState(1);
  const [rejectedPage, setRejectedPage] = useState(1);

  const [jobMap, setJobMap] = useState({});
  const [recruiterMap, setRecruiterMap] = useState({});
  const [localStatuses, setLocalStatuses] = useState({});

  /* ================= LOAD DATA ================= */
  useEffect(() => {
    if (!adminId) return;

    listReferrals({ id: adminId, email, isAdmin: true, limit: 1000 }).then(
      async (res = []) => {
        setRows(res);

        const statusMap = {};
        const jobIds = new Set();
        const recruiterIds = new Set();

        res.forEach((r) => {
          statusMap[r._id] = r.status;
          if (r.job) jobIds.add(r.job);
          if (r.recruiter) recruiterIds.add(r.recruiter);
        });

        setLocalStatuses(statusMap);

        /* ===== LOAD JOBS (FIX UNWRAP) ===== */
        jobIds.forEach(async (jobId) => {
          if (jobMap[jobId]) return;
          try {
            const res = await getJobByIdL(jobId);
            setJobMap((prev) => ({
              ...prev,
              [jobId]: res?.job || null, // ✅ FIX
            }));
          } catch {
            setJobMap((prev) => ({
              ...prev,
              [jobId]: null,
            }));
          }
        });

        /* ===== LOAD RECRUITERS (FIX UNWRAP) ===== */
       // Load Recruiter names an toàn 
       recruiterIds.forEach(async (uid) => { 
       if (!recruiterMap[uid]) { 
        try { 
          const user = await fetchProfileFromServerL(uid);
          // console.log("Loaded recruiter:", user); 
          setRecruiterMap((prev) => ({ ...prev, [uid]: user })); 
        } catch (err) { 
          console.warn("Recruiter not found:", uid); 
          setRecruiterMap((prev) => ({ ...prev, [uid]: { name: "Unknown User" } })); 
        } 
      } 
    }); });
  }, [adminId, email]); // ❗ không phụ thuộc jobMap/recruiterMap

  /* ================= RESET PAGE ================= */
  useEffect(() => {
    setActivePage(1);
    setRejectedPage(1);
  }, [filters]);

  /* ================= DEBOUNCE FILTERS ================= */
  const debouncedFilters = {
    candidateName: useDebounce(filters.candidateName),
    job: useDebounce(filters.job),
    recruiter: useDebounce(filters.recruiter),
    candidateEmail: useDebounce(filters.candidateEmail),
    status: filters.status,
  };

  /* ================= FILTER & SORT ================= */
  const filtered = useMemo(
    () =>
      rows.filter((r) =>
        Object.entries(debouncedFilters).every(([k, v]) =>
          v
            ? String(r[k] || "")
                .toLowerCase()
                .includes(String(v).toLowerCase())
            : true
        )
      ),
    [rows, debouncedFilters]
  );

  const sorted = useMemo(
    () => sortData(filtered, sortConfig),
    [filtered, sortConfig]
  );

  const activeRows = sorted.filter((r) => r.status !== "rejected");
  const rejectedRows = sorted.filter((r) => r.status === "rejected");

  const activePaged = paginate(activeRows, activePage);
  const rejectedPaged = paginate(rejectedRows, rejectedPage);

  /* ================= SORT ================= */
  const toggleSort = (key) => {
    setSortConfig((p) => {
      if (p.key !== key) return { key, direction: "asc" };
      if (p.direction === "asc") return { key, direction: "desc" };
      return { key: "", direction: "" };
    });
  };
  const sortIcon = (key) =>
    sortConfig.key !== key
      ? "⇅"
      : sortConfig.direction === "asc"
      ? "↑"
      : "↓";

  /* ================= STATUS ================= */
  const handleStatusChange = (id, value) =>
    setLocalStatuses((p) => ({ ...p, [id]: value }));

  const handleUpdate = async (id) => {
    if (!window.confirm("Update candidate status?")) return;
    const newStatus = localStatuses[id];
    await updateReferralFieldsById(id, { status: newStatus });
    setRows((p) =>
      p.map((r) => (r._id === id ? { ...r, status: newStatus } : r))
    );
  };

  const handleRemove = async (id) => {
    if (!window.confirm("Remove candidate?")) return;
    await removeReferralFieldsById(id);
    setRows((p) => p.filter((r) => r._id !== id));
  };

  /* ================= TABLE ================= */
  const renderTable = (title, data, isActive, page, setPage, total) => (
    <section className="table-section">
      <h3>{title}</h3>
      <div className="table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th onClick={() => toggleSort("candidateName")}>
                Name {sortIcon("candidateName")}
              </th>
              <th onClick={() => toggleSort("job")}>
                Job {sortIcon("job")}
              </th>
              <th onClick={() => toggleSort("recruiter")}>
                CTV {sortIcon("recruiter")}
              </th>
              <th>Email</th>
              <th>Phone</th>
              <th>CV</th>
              <th>LinkedIn</th>
              <th>Portfolio</th>
              <th onClick={() => toggleSort("status")}>
                Status {sortIcon("status")}
              </th>
              <th>Bonus</th>
              {isActive && <th>Actions</th>}
              <th onClick={() => toggleSort("updatedAt")}>
                Time {sortIcon("updatedAt")}
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((r) => (
              <tr key={r._id}>
                <td>{r.candidateName}</td>
                <td>{jobMap[r.job]?.title ?? "Unknown Job"}</td>
                <td>{recruiterMap[r.recruiter]?.email || r.recruiter || "Unknown User"}</td>
                <td>{r?.candidateEmail || "-"}</td>
                <td>{r.candidatePhone}</td>
                <td>
                  {r.cvUrl ? (
                    <a href={r.cvUrl} target="_blank" rel="noreferrer">
                      Link
                    </a>
                  ) : (
                    "-"
                  )}
                </td>
                <td>
                  {r.linkedin ? (
                    <a href={r.linkedin} target="_blank" rel="noreferrer">
                      Link
                    </a>
                  ) : (
                    "-"
                  )}
                </td>
                <td>
                  {r.portfolio ? (
                    <a href={r.portfolio} target="_blank" rel="noreferrer">
                      Link
                    </a>
                  ) : (
                    "-"
                  )}
                </td>
                <td>
                  {isActive ? (
                    <select
                      value={localStatuses[r._id] || r.status}
                      onChange={(e) =>
                        handleStatusChange(r._id, e.target.value)
                      }
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  ) : (
                    r.status
                  )}
                </td>
                <td>{r.bonus || 0}</td>
                  <td>
                    <button onClick={() => handleUpdate(r._id)}>Update</button>
                    <button onClick={() => handleRemove(r._id)}>Remove</button>
                  </td>
                <td>{new Date(r.updatedAt || r.createdAt).toLocaleString("vi-VN")}</td>
              </tr>
            ))}
            {!data.length && (
              <tr>
                <td colSpan="12">No data</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="pagination">
        <button disabled={page === 1} onClick={() => setPage(page - 1)}>
          Prev
        </button>
        <span>
          Page {page} / {Math.ceil(total / PAGE_SIZE) || 1}
        </span>
        <button
          disabled={page >= Math.ceil(total / PAGE_SIZE)}
          onClick={() => setPage(page + 1)}
        >
          Next
        </button>
      </div>
    </section>
  );

  /* ================= RENDER ================= */
  return (
    <div className="candidate-page">
      <h2>Candidate Management</h2>

      <FilterUI
        filters={filters}
        onChange={(k, v) => setFilters((p) => ({ ...p, [k]: v }))}
      />

      {renderTable(
        "Active Candidates",
        activePaged,
        true,
        activePage,
        setActivePage,
        activeRows.length
      )}
      {renderTable(
        "Rejected Candidates",
        rejectedPaged,
        false,
        rejectedPage,
        setRejectedPage,
        rejectedRows.length
      )}
    </div>
  );
}
