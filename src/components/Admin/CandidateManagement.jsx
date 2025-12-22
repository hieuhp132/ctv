import React, { useEffect, useMemo, useState } from "react";
import "./CandidateManagement.css";
import {
  updateReferralFieldsById,
  listReferrals,
  removeReferralFieldsById,
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
    const av = a[key];
    const bv = b[key];
    if (av == null) return 1;
    if (bv == null) return -1;
    if (!isNaN(av) && !isNaN(bv)) return direction === "asc" ? av - bv : bv - av;
    return direction === "asc"
      ? String(av).localeCompare(String(bv))
      : String(bv).localeCompare(String(av));
  });
};

const paginate = (data, page) => data.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

/* ================= DEBOUNCE HOOK ================= */
function useDebounce(value, delay = 200) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debounced;
}

/* ================= FILTER UI COMPONENT ================= */
const FilterUI = React.memo(({ filters, onChange, sortConfig, setSortConfig }) => {
  const handleChange = (key, value) => onChange(key, value);

  return (
    <div className="filter-container">
      <input
        placeholder="Candidate"
        value={filters.candidateName}
        onChange={(e) => handleChange("candidateName", e.target.value)}
      />
      <input
        placeholder="Job"
        value={filters.job}
        onChange={(e) => handleChange("job", e.target.value)}
      />
      <input
        placeholder="CTV"
        value={filters.recruiter}
        onChange={(e) => handleChange("recruiter", e.target.value)}
      />
      <input
        placeholder="Email"
        value={filters.candidateEmail}
        onChange={(e) => handleChange("candidateEmail", e.target.value)}
      />
      <select
        value={filters.status}
        onChange={(e) => handleChange("status", e.target.value)}
      >
        <option value="">All Status</option>
        {STATUS_OPTIONS.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
    </div>
  );
});

/* ================= MAIN COMPONENT ================= */
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

  // trạng thái tạm thời cho status mỗi referral
  const [localStatuses, setLocalStatuses] = useState({});

  /* ================= LOAD DATA ================= */
  useEffect(() => {
    if (!adminId) return;
    listReferrals({ id: adminId, email, isAdmin: true, limit: 1000 }).then((res) => {
      setRows(res || []);
      // khởi tạo localStatuses
      const statusMap = {};
      (res || []).forEach((r) => {
        statusMap[r._id] = r.status;
      });
      setLocalStatuses(statusMap);
    });
  }, [adminId, email]);

  /* ================= RESET PAGE ON FILTER ================= */
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
  const filtered = useMemo(() => {
    return rows.filter((r) =>
      Object.entries(debouncedFilters).every(([key, value]) => {
        if (!value) return true;
        return String(r[key] || "").toLowerCase().includes(String(value).toLowerCase());
      })
    );
  }, [rows, debouncedFilters]);

  const sorted = useMemo(() => sortData(filtered, sortConfig), [filtered, sortConfig]);

  const activeRows = sorted.filter((r) => r.status !== "rejected");
  const rejectedRows = sorted.filter((r) => r.status === "rejected");

  const activePaged = paginate(activeRows, activePage);
  const rejectedPaged = paginate(rejectedRows, rejectedPage);

  /* ================= SORT HANDLER ================= */
  const toggleSort = (key) => {
    setSortConfig((p) => {
      if (p.key !== key) return { key, direction: "asc" };
      if (p.direction === "asc") return { key, direction: "desc" };
      return { key: "", direction: "" };
    });
  };
  const sortIcon = (key) =>
    sortConfig.key !== key ? "⇅" : sortConfig.direction === "asc" ? "↑" : "↓";

  /* ================= STATUS HANDLERS ================= */
  const handleStatusChange = (id, value) => {
    setLocalStatuses((p) => ({ ...p, [id]: value }));
  };

  const handleUpdate = async (id) => {
    const newStatus = localStatuses[id];
    if(!window.confirm("Update candidate status?")) return;
    await updateReferralFieldsById(id, { status: newStatus });
    setRows((p) => p.map((r) => (r._id === id ? { ...r, status: newStatus } : r)));
  };

  const handleRemove = async (id) => {
    if (!window.confirm("Remove candidate?")) return;
    await removeReferralFieldsById(id);
    setRows((p) => p.filter((r) => r._id !== id));
  };

  /* ================= TABLE RENDER ================= */
  const renderTable = (title, data, isActive, page, setPage, total) => (
    <section className="table-section">
      <h3>{title}</h3>
      <div className="table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th onClick={() => toggleSort("candidateName")}>Name {sortIcon("candidateName")}</th>
              <th onClick={() => toggleSort("job")}>Job {sortIcon("job")}</th>
              <th onClick={() => toggleSort("recruiter")}>CTV {sortIcon("recruiter")}</th>
              <th>Email</th>
              <th>Phone</th>
              <th>CV</th>
              <th>LinkedIn</th> 
              <th>Portfolio</th>
              <th onClick={() => toggleSort("status")}>Status {sortIcon("status")}</th>
              <th>Bonus</th>
              {isActive && <th>Actions</th>}
              <th onClick={() => toggleSort("time")}>Time {sortIcon("time")}</th>
            </tr>
          </thead>
          <tbody>
            {data.map((r) => (
              <tr key={r._id}>
                <td>{r.candidateName}</td>
                <td>{r.job}</td>
                <td>{r.recruiter}</td>
                <td>{r.candidateEmail}</td>
                <td>{r.candidatePhone}</td>
                <td>
                  {isActive ? (
                    <select
                      value={localStatuses[r._id] || r.status}
                      onChange={(e) => handleStatusChange(r._id, e.target.value)}
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

                <td>{r.bonus || 0}</td>
                {isActive && <td>                  
                    
                      <div className="buttons">
                        <button onClick={() => handleUpdate(r._id)}>Update</button>
                        <button onClick={() => handleRemove(r._id)}>Remove</button>
                      </div>
                                      
                </td>}
                <td>
                  {new Date(r.updatedAt).toLocaleString()}
                </td>
              </tr>
            ))}
            {!data.length && (
              <tr>
                <td colSpan="7">No data</td>
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
        <button disabled={page >= Math.ceil(total / PAGE_SIZE)} onClick={() => setPage(page + 1)}>
          Next
        </button>
      </div>
    </section>
  );

  /* ================= RENDER ================= */
  return (
    <div className="candidate-page">
      <div className="page-header">
        <h2>Candidate Management</h2>
      </div>

      <FilterUI
        filters={filters}
        onChange={(key, value) => setFilters((p) => ({ ...p, [key]: value }))}
        sortConfig={sortConfig}
        setSortConfig={setSortConfig}
      />

      {renderTable("Active Candidates", activePaged, true, activePage, setActivePage, activeRows.length)}
      {renderTable("Rejected Candidates", rejectedPaged, false, rejectedPage, setRejectedPage, rejectedRows.length)}
    </div>
  );
}
