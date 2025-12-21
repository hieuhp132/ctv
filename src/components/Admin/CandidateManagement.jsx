import React, { useEffect, useMemo, useState } from "react";
import "./CandidateManagement.css";
import {
  updateSubmissionStatus,
  finalizeSubmission,
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

const SORT_FIELDS = [
  { key: "candidateName", label: "Name" },
  { key: "job", label: "Job" },
  { key: "recruiter", label: "CTV" },
  { key: "candidateEmail", label: "Email" },
  { key: "status", label: "Status" },
  { key: "bonus", label: "Bonus" },
];

/* ================= HELPERS ================= */

const getRefId = (r) => r?._id;

const uniqueValues = (data, key) =>
  [...new Set(data.map((i) => i[key]).filter(Boolean))];

const sortData = (data, { key, direction }) => {
  if (!key || !direction) return data;

  return [...data].sort((a, b) => {
    let av = a[key];
    let bv = b[key];

    if (av == null) return 1;
    if (bv == null) return -1;

    if (!isNaN(av) && !isNaN(bv)) {
      return direction === "asc" ? av - bv : bv - av;
    }

    if (!isNaN(Date.parse(av)) && !isNaN(Date.parse(bv))) {
      return direction === "asc"
        ? new Date(av) - new Date(bv)
        : new Date(bv) - new Date(av);
    }

    return direction === "asc"
      ? String(av).localeCompare(String(bv))
      : String(bv).localeCompare(String(av));
  });
};

const SortIcon = ({ active, direction }) => {
  if (!active) return <span className="sort-icon">↕</span>;
  return (
    <span className="sort-icon">
      {direction === "asc" ? "↑" : "↓"}
    </span>
  );
};

/* ================= COMPONENT ================= */

export default function CandidateManagement() {
  const { user } = useAuth();
  const adminId = user?._id;
  const email = user?.email || "";

  const [activeRows, setActiveRows] = useState([]);
  const [archivedRows, setArchivedRows] = useState([]);

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

  /* ================= LOAD DATA ================= */

  const loadData = async () => {
    if (!adminId) return;

    const [active, archived] = await Promise.all([
      listReferrals({
        id: adminId,
        email,
        isAdmin: true,
        finalized: false,
        limit: 1000,
      }),
      listReferrals({
        id: adminId,
        email,
        isAdmin: true,
        finalized: true,
        limit: 1000,
      }),
    ]);

    setActiveRows(active?.items || active || []);
    setArchivedRows(archived?.items || archived || []);
  };

  useEffect(() => {
    loadData();
  }, [adminId, email]);

  /* ================= FILTER + SORT ================= */

  const applyFilters = (rows) =>
    rows.filter((r) =>
      Object.entries(filters).every(([key, val]) => {
        if (!val) return true;
        return String(r[key] || "")
          .toLowerCase()
          .includes(val.toLowerCase());
      })
    );

  const processedActive = useMemo(
    () => sortData(applyFilters(activeRows), sortConfig),
    [activeRows, filters, sortConfig]
  );

  const processedArchived = useMemo(
    () => sortData(applyFilters(archivedRows), sortConfig),
    [archivedRows, filters, sortConfig]
  );

  /* ================= SORT HANDLER ================= */

  const toggleSort = (key) => {
    setSortConfig((prev) => {
      if (prev.key !== key) return { key, direction: "asc" };
      if (prev.direction === "asc") return { key, direction: "desc" };
      return { key: "", direction: "" };
    });
  };

  /* ================= OPTIONS ================= */

  const jobOptions = uniqueValues([...activeRows, ...archivedRows], "job");
  const recruiterOptions = uniqueValues(
    [...activeRows, ...archivedRows],
    "recruiter"
  );

  /* ================= TABLE RENDER ================= */

  const renderTable = (title, rows, editableStatus) => (
    <section className="table-section">
      <h3>{title}</h3>

      {/* ===== MOBILE SORT ===== */}
      <div className="mobile-sort">
        <select
          value={sortConfig.key}
          onChange={(e) =>
            setSortConfig((p) => ({ ...p, key: e.target.value }))
          }
        >
          <option value="">Sort by</option>
          {SORT_FIELDS.map((f) => (
            <option key={f.key} value={f.key}>
              {f.label}
            </option>
          ))}
        </select>

        <select
          value={sortConfig.direction}
          onChange={(e) =>
            setSortConfig((p) => ({ ...p, direction: e.target.value }))
          }
        >
          <option value="">Direction</option>
          <option value="asc">Ascending ↑</option>
          <option value="desc">Descending ↓</option>
        </select>
      </div>

      <div className="table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th onClick={() => toggleSort("candidateName")}>
                Name
                <SortIcon
                  active={sortConfig.key === "candidateName"}
                  direction={sortConfig.direction}
                />
              </th>
              <th onClick={() => toggleSort("job")}>
                Job
                <SortIcon
                  active={sortConfig.key === "job"}
                  direction={sortConfig.direction}
                />
              </th>
              <th onClick={() => toggleSort("recruiter")}>
                CTV
                <SortIcon
                  active={sortConfig.key === "recruiter"}
                  direction={sortConfig.direction}
                />
              </th>
              <th onClick={() => toggleSort("candidateEmail")}>
                Email
                <SortIcon
                  active={sortConfig.key === "candidateEmail"}
                  direction={sortConfig.direction}
                />
              </th>
              <th onClick={() => toggleSort("status")}>
                Status
                <SortIcon
                  active={sortConfig.key === "status"}
                  direction={sortConfig.direction}
                />
              </th>
              <th onClick={() => toggleSort("bonus")}>
                Bonus
                <SortIcon
                  active={sortConfig.key === "bonus"}
                  direction={sortConfig.direction}
                />
              </th>
              <th>CV</th>
              <th>LinkedIn</th>
              <th>Action</th>
            </tr>

            {/* ===== FILTER ROW ===== */}
            <tr className="filter-row">
              <th>
                <input
                  placeholder="Search"
                  value={filters.candidateName}
                  onChange={(e) =>
                    setFilters({ ...filters, candidateName: e.target.value })
                  }
                />
              </th>

              <th>
                <select
                  value={filters.job}
                  onChange={(e) =>
                    setFilters({ ...filters, job: e.target.value })
                  }
                >
                  <option value="">All</option>
                  {jobOptions.map((j) => (
                    <option key={j}>{j}</option>
                  ))}
                </select>
              </th>

              <th>
                <select
                  value={filters.recruiter}
                  onChange={(e) =>
                    setFilters({ ...filters, recruiter: e.target.value })
                  }
                >
                  <option value="">All</option>
                  {recruiterOptions.map((r) => (
                    <option key={r}>{r}</option>
                  ))}
                </select>
              </th>

              <th>
                <input
                  placeholder="Email"
                  value={filters.candidateEmail}
                  onChange={(e) =>
                    setFilters({
                      ...filters,
                      candidateEmail: e.target.value,
                    })
                  }
                />
              </th>

              <th>
                <select
                  value={filters.status}
                  onChange={(e) =>
                    setFilters({ ...filters, status: e.target.value })
                  }
                >
                  <option value="">All</option>
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </th>

              <th />
              <th />
              <th />
              <th />
            </tr>
          </thead>

          <tbody>
            {rows.map((r) => (
              <tr key={getRefId(r)}>
                <td data-label="Name">{r.candidateName}</td>
                <td data-label="Job">{r.job}</td>
                <td data-label="CTV">{r.recruiter}</td>
                <td data-label="Email">{r.candidateEmail}</td>

                <td data-label="Status">
                  {editableStatus ? (
                    <select
                      value={r.status}
                      onChange={(e) =>
                        updateSubmissionStatus({
                          id: getRefId(r),
                          status: e.target.value,
                        }).then(() => loadData())
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

                <td data-label="CV">
                  {r.cvUrl && (
                    <a href={r.cvUrl} target="_blank" rel="noreferrer">
                      Link
                    </a>
                  )}
                </td>

                <td data-label="LinkedIn">
                  {r.linkedin && (
                    <a href={r.linkedin} target="_blank" rel="noreferrer">
                      Link
                    </a>
                  )}
                </td>

                <td data-label="Action">
                  <button
                    className="remove-btn"
                    onClick={async () => {
                      if (!window.confirm("Remove candidate?")) return;
                      await removeCandidateById(getRefId(r));
                      loadData();
                    }}
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}

            {!rows.length && (
              <tr>
                <td colSpan="9" style={{ textAlign: "center" }}>
                  No data
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );

  /* ================= RENDER ================= */

  return (
    <div className="candidate-page">
      <div className="page-header">
        <h2>Candidate Management</h2>
      </div>

      {renderTable("Active Candidates", processedActive, true)}
      {renderTable("Archived Candidates", processedArchived, false)}
    </div>
  );
}
