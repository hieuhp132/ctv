import React, { useEffect, useMemo, useState } from "react";
import "./CandidateManagement.css";
import {
  updateSubmissionStatus,
  removeCandidateById,
  listReferrals,
  updateReferralFields,
  removeReferralFields,
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
    <>
      <div className="desktop-filter">
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
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      <div className="mobile-sort">
        <input
          placeholder="Candidate"
          value={filters.candidateName}
          onChange={(e) => handleChange("candidateName", e.target.value)}
        />
        <select
          value={filters.status}
          onChange={(e) => handleChange("status", e.target.value)}
        >
          <option value="">All Status</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        <select
          value={sortConfig.key}
          onChange={(e) => setSortConfig((p) => ({ ...p, key: e.target.value }))}
        >
          <option value="">Sort by</option>
          <option value="candidateName">Name</option>
          <option value="job">Job</option>
          <option value="recruiter">CTV</option>
          <option value="status">Status</option>
          <option value="bonus">Bonus</option>
        </select>

        <select
          value={sortConfig.direction}
          onChange={(e) => setSortConfig((p) => ({ ...p, direction: e.target.value }))}
        >
          <option value="asc">Ascending</option>
          <option value="desc">Descending</option>
        </select>
      </div>
    </>
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

  /* ================= LOAD DATA ================= */
  useEffect(() => {
    if (!adminId) return;
    listReferrals({ id: adminId, email, isAdmin: true, limit: 1000 }).then((res) =>
      setRows(res || [])
    );
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
    status: filters.status, // select filter không debounce
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
              <th onClick={() => toggleSort("status")}>Status {sortIcon("status")}</th>
              <th onClick={() => toggleSort("bonus")}>Bonus {sortIcon("bonus")}</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {data.map((r) => (
              <tr key={r._id}>
                <td data-label="Name">{r.candidateName}</td>
                <td data-label="Job">{r.job}</td>
                <td data-label="CTV">{r.recruiter}</td>
                <td data-label="Email">{r.candidateEmail}</td>
                <td data-label="Status">
                  {isActive ? (
                    <select
                      value={r.status}
                      onChange={(e) =>
                        updateSubmissionStatus({ id: r._id, status: e.target.value })
                      }
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                  ) : (
                    r.status
                  )}
                </td>
                <td data-label="Bonus">{r.bonus || 0}</td>
                <td data-label="Action">
                  
                  <div className="buttons">

                    <button
                      className="remove-btn"
                      onClick={async () => {
                        if (!window.confirm("Remove candidate?")) return;
                        await removeReferralFields(r._id);
                        setRows((p) => p.filter((x) => x._id !== r._id));
                      }}
                    >
                      Remove
                    </button>

                    <button
                      className="remove-btn"
                      onClick={async () => {
                        if (!window.confirm("Update candidate?")) return;
                        await updateReferralFields(r._id, { status: "interviewing" }); // ví dụ cập nhật
                        setRows((p) =>
                          p.map((x) => (x._id === r._id ? { ...x, status: "interviewing" } : x))
                        );
                      }}
                    >
                      Update
                    </button>

                  </div>
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
        <button disabled={page === 1} onClick={() => setPage(page - 1)}>Prev</button>
        <span>Page {page} / {Math.ceil(total / PAGE_SIZE) || 1}</span>
        <button disabled={page >= Math.ceil(total / PAGE_SIZE)} onClick={() => setPage(page + 1)}>Next</button>
      </div>
    </section>
  );

  /* ================= RENDER ================= */
  return (
    <div className="candidate-page">
      <div className="page-header"><h2>Candidate Management</h2></div>

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
