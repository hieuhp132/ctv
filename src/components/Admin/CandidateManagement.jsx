import React, { useEffect, useMemo, useState } from "react";
import "./CandidateManagement.css";
import {
  updateSubmissionStatus,
  removeCandidateById,
  listReferrals,
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

    if (!isNaN(av) && !isNaN(bv)) {
      return direction === "asc" ? av - bv : bv - av;
    }

    return direction === "asc"
      ? String(av).localeCompare(String(bv))
      : String(bv).localeCompare(String(av));
  });
};

const paginate = (data, page) =>
  data.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

/* ================= COMPONENT ================= */

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

  const [sortConfig, setSortConfig] = useState({
    key: "",
    direction: "",
  });

  const [activePage, setActivePage] = useState(1);
  const [rejectedPage, setRejectedPage] = useState(1);

  /* ================= LOAD ================= */

  useEffect(() => {
    if (!adminId) return;

    listReferrals({
      id: adminId,
      email,
      isAdmin: true,
      limit: 1000,
    }).then((res) => setRows(res || []));
  }, [adminId, email]);

  /* ================= FILTER + SORT ================= */

  const filtered = useMemo(() => {
    return rows.filter((r) =>
      Object.entries(filters).every(([k, v]) => {
        if (!v) return true;
        return String(r[k] || "").toLowerCase().includes(v.toLowerCase());
      })
    );
  }, [rows, filters]);

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

  /* ================= FILTER UI ================= */

  const FilterUI = () => (
    <>
      {/* ===== DESKTOP FILTER ===== */}
      <div className="desktop-filter">
        <input
          placeholder="Candidate"
          value={filters.candidateName}
          onChange={(e) =>
            setFilters({ ...filters, candidateName: e.target.value })
          }
        />

        <input
          placeholder="Job"
          value={filters.job}
          onChange={(e) =>
            setFilters({ ...filters, job: e.target.value })
          }
        />

        <input
          placeholder="CTV"
          value={filters.recruiter}
          onChange={(e) =>
            setFilters({ ...filters, recruiter: e.target.value })
          }
        />

        <select
          value={filters.status}
          onChange={(e) =>
            setFilters({ ...filters, status: e.target.value })
          }
        >
          <option value="">All Status</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </div>

      {/* ===== MOBILE FILTER ===== */}
      <div className="mobile-sort">
        <input
          placeholder="Candidate"
          value={filters.candidateName}
          onChange={(e) =>
            setFilters({ ...filters, candidateName: e.target.value })
          }
        />

        <select
          value={filters.status}
          onChange={(e) =>
            setFilters({ ...filters, status: e.target.value })
          }
        >
          <option value="">All Status</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </div>
    </>
  );

  /* ================= TABLE ================= */

  const renderTable = (title, data, isActive, page, setPage, total) => (
    <section className="table-section">
      <h3>{title}</h3>

      <FilterUI />

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
              <th onClick={() => toggleSort("status")}>
                Status {sortIcon("status")}
              </th>
              <th onClick={() => toggleSort("bonus")}>
                Bonus {sortIcon("bonus")}
              </th>
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
                        updateSubmissionStatus({
                          id: r._id,
                          status: e.target.value,
                        })
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
                  <button
                    className="remove-btn"
                    onClick={async () => {
                      if (!window.confirm("Remove candidate?")) return;
                      await removeCandidateById(r._id);
                      setRows((p) => p.filter((x) => x._id !== r._id));
                    }}
                  >
                    Remove
                  </button>
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
        <button
          disabled={page >= Math.ceil(total / PAGE_SIZE)}
          onClick={() => setPage(page + 1)}
        >
          Next
        </button>
      </div>
    </section>
  );

  return (
    <div className="candidate-page">
      <div className="page-header">
        <h2>Candidate Management</h2>
      </div>

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
