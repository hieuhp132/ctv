// Updated CandidateManagement.js with success banner and full integration
import React, { useEffect, useState } from "react";
import "./CandidateManagement.css";
import {
  listSubmissions,
  listArchivedSubmissions,
  updateSubmissionStatus,
  getBalances,
  finalizeSubmission,
  removeCandidateById,
} from "../../api";

const STATUS_OPTIONS = [
  { value: "submitted", label: "Submitted" },
  { value: "under_review", label: "Under Review" },
  { value: "interviewing", label: "Interviewing" },
  { value: "offer", label: "Offer" },
  { value: "hired", label: "Hired" },
  { value: "onboard", label: "Onboard" },
  { value: "rejected", label: "Rejected" },
];

function getRefId(sub) {
  return sub?._id ?? sub?.id ?? sub?.referralId ?? sub?.uuid ?? undefined;
}

export default function CandidateManagement() {
  const [submissions, setSubmissions] = useState([]);
  const [archived, setArchived] = useState([]);
  const [balances, setBalances] = useState({ adminCredit: 0, ctvBonusById: {} });
  const [editedRows, setEditedRows] = useState({});
  const [loadingRow, setLoadingRow] = useState(null);

  const [successMessage, setSuccessMessage] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [archivedPage, setArchivedPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(15);

  const [sortConfig, setSortConfig] = useState({ key: "", direction: "" });
  const [archivedSortConfig, setArchivedSortConfig] = useState({
    key: "",
    direction: "",
  });

  const [filters, setFilters] = useState({
    status: "all",
    candidate: "all",
    job: "all",
    ctv: "all",
    email: "all",
  });

  const [archivedFilters, setArchivedFilters] = useState({
    status: "all",
    candidate: "all",
    job: "all",
    ctv: "all",
    email: "all",
  });

  const refresh = async () => {
    const [subs, arch, bal] = await Promise.all([
      listSubmissions(),
      listArchivedSubmissions(),
      getBalances(),
    ]);

    const filteredSubs = Array.isArray(subs)
      ? subs.filter((sub) => !sub.finalized)
      : [];

    setSubmissions(filteredSubs);
    setArchived(arch || []);
    setBalances(bal || { adminCredit: 0, ctvBonusById: {} });
  };

  useEffect(() => {
    refresh();
  }, []);

  const handleStatusChange = (rid, newStatus) => {
    setEditedRows((prev) => ({
      ...prev,
      [rid]: { ...prev[rid], status: newStatus },
    }));
  };

  const handleBonusChange = (rid, newBonus) => {
    setEditedRows((prev) => ({
      ...prev,
      [rid]: { ...prev[rid], bonus: newBonus },
    }));
  };

  const handleSave = async (sub) => {
    const rid = getRefId(sub);
    if (!rid) return alert("Missing referral ID");

    setLoadingRow(rid);
    try {
      const pending = editedRows[rid] || {};
      const nextStatus = (pending.status ?? sub.status)?.toLowerCase();
      const nextBonus = pending.bonus ?? sub.bonus;

      if (nextStatus === "onboard" || nextStatus === "rejected") {
        const confirmMsg = `${
          nextStatus === "onboard" ? "Onboard" : "Reject"
        } ${sub.candidate}?`;
        if (!window.confirm(confirmMsg)) return;

        await updateSubmissionStatus({ id: rid, status: nextStatus, bonus: nextBonus });

        setSuccessMessage("Successfully updated!");
        setTimeout(() => setSuccessMessage(""), 3000);

        await finalizeSubmission({ referralId: rid });
        await refresh();
      } else {
        await updateSubmissionStatus({ id: rid, status: nextStatus, bonus: nextBonus });

        setSuccessMessage("Successfully updated!");
        setTimeout(() => setSuccessMessage(""), 3000);

        await refresh();
      }

      setEditedRows((prev) => {
        const n = { ...prev };
        delete n[rid];
        return n;
      });
    } catch (err) {
      alert("Failed to update: " + (err?.message || err));
    } finally {
      setLoadingRow(null);
    }
  };

  const sortData = (data, config) => {
    if (!config.key) return data;
    return [...data].sort((a, b) => {
      const aVal = (a[config.key] || "").toString().toLowerCase();
      const bVal = (b[config.key] || "").toString().toLowerCase();
      return config.direction === "asc"
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal);
    });
  };

  const paginate = (data, page) => {
    const start = (page - 1) * rowsPerPage;
    return data.slice(start, start + rowsPerPage);
  };

  const filteredSubs = submissions.filter((s) => {
    return (
      (filters.status === "all" ||
        (s.status || "").toLowerCase() === filters.status.toLowerCase()) &&
      (filters.candidate === "all" || (s.candidate || "") === filters.candidate) &&
      (filters.job === "all" || (s.job || "") === filters.job) &&
      (filters.ctv === "all" || (s.ctv || "") === filters.ctv) &&
      (filters.email === "all" || (s.email || "") === filters.email)
    );
  });

  const filteredArchived = archived.filter((s) => {
    return (
      (archivedFilters.status === "all" ||
        (s.status || "").toLowerCase() === archivedFilters.status.toLowerCase()) &&
      (archivedFilters.candidate === "all" || (s.candidate || "") === archivedFilters.candidate) &&
      (archivedFilters.job === "all" || (s.job || "") === archivedFilters.job) &&
      (archivedFilters.ctv === "all" || (s.ctv || "") === archivedFilters.ctv) &&
      (archivedFilters.email === "all" || (s.email || "") === archivedFilters.email)
    );
  });

  const sortedSubs = sortData(filteredSubs, sortConfig);
  const currentSubs = paginate(sortedSubs, currentPage);
  const totalSubPages = Math.ceil(sortedSubs.length / rowsPerPage) || 1;

  const sortedArchived = sortData(filteredArchived, archivedSortConfig);
  const currentArchived = paginate(sortedArchived, archivedPage);
  const totalArchPages = Math.ceil(sortedArchived.length / rowsPerPage) || 1;

  const showingRange = (page, total) => {
    const start = (page - 1) * rowsPerPage + 1;
    const end = Math.min(page * rowsPerPage, total);
    return `${start}-${end} of ${total}`;
  };

  const handleSort = (key, direction, archived = false) => {
    if (archived) setArchivedSortConfig({ key, direction });
    else setSortConfig({ key, direction });
  };

  const uniqueValues = (key, fromArchived = false) => {
    const source = fromArchived ? archived : submissions;
    const vals = Array.from(new Set(source.map((s) => s[key]).filter(Boolean)));
    return vals.sort();
  };

  const renderFilterSelect = (label, key, isArchived = false) => {
    const currentFilters = isArchived ? archivedFilters : filters;
    const setCurrentFilters = isArchived ? setArchivedFilters : setFilters;

    return (
      <div className="filter-wrapper">
        <label>{label}:</label>
        <select
          value={currentFilters[key]}
          onChange={(e) => setCurrentFilters({ ...currentFilters, [key]: e.target.value })}
          className="status-filter"
        >
          <option value="all">All</option>
          {key === "status"
            ? STATUS_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))
            : uniqueValues(key, isArchived).map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
        </select>
      </div>
    );
  };

  const renderTable = (title, data, page, setPage, totalPages, sortCfg, archived = false) => (
    <section className="table-section">
      <div className="table-header">
        <h3>{title}</h3>

        <div className="filter-row" style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {renderFilterSelect("Status", "status", archived)}
          {renderFilterSelect("Candidate", "candidate", archived)}
          {renderFilterSelect("Job", "job", archived)}
          {renderFilterSelect("CTV", "ctv", archived)}
          {renderFilterSelect("Email", "email", archived)}
        </div>

        <div className="row-count">Showing {showingRange(page, data.length)}</div>
      </div>

      <div className="table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              {["candidate","job","ctv","email","phone","curriculum vitae","linkedin","status","bonus","action",].map((col) => (
                <th key={col} className={["curriculum vitae", "linkedin", "bonus", "action"].includes(col) ? "short" : ""}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    {col.toUpperCase()}
                    {["candidate", "job", "ctv", "email", "status"].includes(col) && (
                      <select
                        className="sort-select"
                        value={sortCfg.key === col ? sortCfg.direction : ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          handleSort(val ? col : "", val, archived);
                        }}
                      >
                        <option value="">Sort</option>
                        <option value="asc">A → Z</option>
                        <option value="desc">Z → A</option>
                      </select>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {data.map((sub, i) => {
              const rid = getRefId(sub);
              const currentStatus = editedRows[rid]?.status ?? sub.status;
              const currentBonus = editedRows[rid]?.bonus ?? sub.bonus;
              const isLoading = loadingRow === rid;

              return (
                <tr key={rid ?? i}>
                  <td className="wrap">{sub.candidate}</td>
                  <td className="wrap">{sub.job}</td>
                  <td className="wrap">{sub.ctv}</td>
                  <td className="wrap">{sub.email}</td>
                  <td>{sub.phone}</td>
                  <td className="short">
                    {sub.cv ? <a href={sub.cvUrl} target="_blank" rel="noreferrer">Link</a> : "-"}
                  </td>
                  <td className="short">
                    {sub.linkedin ? <a href={sub.linkedin} target="_blank" rel="noreferrer">Link</a> : "-"}
                  </td>
                  <td className="short">
                    <select
                      value={currentStatus?.toLowerCase()}
                      onChange={(e) => handleStatusChange(rid, e.target.value)}
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="short">
                    <input
                      type="text"
                      value={currentBonus || ""}
                      onChange={(e) => handleBonusChange(rid, e.target.value)}
                      className="bonus-input"
                    />
                  </td>
                  <td className="short">
                    <div className="action-buttons">
                      <button onClick={() => handleSave(sub)} disabled={isLoading}>
                        {isLoading ? "..." : "Update"}
                      </button>
                      <button
                        className="remove-btn"
                        onClick={async () => {
                          if (!window.confirm(`Remove ${sub.candidate}?`)) return;
                          await removeCandidateById(rid);
                          await refresh();
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="pagination">
        <button onClick={() => setPage((p) => Math.max(1, p - 1))}>Prev</button>
        <span>Page {page} / {totalPages}</span>
        <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Next</button>
      </div>
    </section>
  );

  return (
    <div className="candidate-page">

      {successMessage && (
        <div className="success-banner">{successMessage}</div>
      )}

      <header className="page-header">
        <h2>Candidate Management</h2>
        <div className="credit-info">
          Admin Credit: <span>${balances.adminCredit}</span>
        </div>
      </header>

      {renderTable(
        "Active Candidates",
        currentSubs,
        currentPage,
        setCurrentPage,
        totalSubPages,
        sortConfig,
        false
      )}

      {renderTable(
        "Archived Candidates",
        currentArchived,
        archivedPage,
        setArchivedPage,
        totalArchPages,
        archivedSortConfig,
        true
      )}
    </div>
  );
}
