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
  return <span className="sort-icon">{direction === "asc" ? "↑" : "↓"}</span>;
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

  /* ================= OPTIONS ================= */

  const jobOptions = uniqueValues([...activeRows, ...archivedRows], "job");
  const recruiterOptions = uniqueValues(
    [...activeRows, ...archivedRows],
    "recruiter"
  );

  /* ================= SORT HANDLER ================= */

  const toggleSort = (key) => {
    setSortConfig((prev) => {
      if (prev.key !== key) return { key, direction: "asc" };
      if (prev.direction === "asc") return { key, direction: "desc" };
      return { key: "", direction: "" };
    });
  };

  /* ================= MOBILE FILTER ================= */

  const MobileFilter = () => (
    <div className="mobile-filter">
      <input
        placeholder="Candidate name"
        value={filters.candidateName}
        onChange={(e) =>
          setFilters({ ...filters, candidateName: e.target.value })
        }
      />

      <input
        placeholder="Email"
        value={filters.candidateEmail}
        onChange={(e) =>
          setFilters({ ...filters, candidateEmail: e.target.value })
        }
      />

      <select
        value={filters.job}
        onChange={(e) => setFilters({ ...filters, job: e.target.value })}
      >
        <option value="">All jobs</option>
        {jobOptions.map((j) => (
          <option key={j}>{j}</option>
        ))}
      </select>

      <select
        value={filters.recruiter}
        onChange={(e) =>
          setFilters({ ...filters, recruiter: e.target.value })
        }
      >
        <option value="">All CTV</option>
        {recruiterOptions.map((r) => (
          <option key={r}>{r}</option>
        ))}
      </select>

      <select
        value={filters.status}
        onChange={(e) =>
          setFilters({ ...filters, status: e.target.value })
        }
      >
        <option value="">All status</option>
        {STATUS_OPTIONS.map((s) => (
          <option key={s}>{s}</option>
        ))}
      </select>
    </div>
  );

  /* ================= TABLE ================= */

  const renderTable = (title, rows, editableStatus) => (
    <section className="table-section">
      <h3>{title}</h3>

      {/* MOBILE FILTER */}
      <MobileFilter />

      {/* MOBILE SORT */}
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
              {[
                ["candidateName", "Name"],
                ["job", "Job"],
                ["recruiter", "CTV"],
                ["candidateEmail", "Email"],
                ["status", "Status"],
                ["bonus", "Bonus"],
              ].map(([key, label]) => (
                <th key={key} onClick={() => toggleSort(key)}>
                  {label}
                  <SortIcon
                    active={sortConfig.key === key}
                    direction={sortConfig.direction}
                  />
                </th>
              ))}
              <th>CV</th>
              <th>LinkedIn</th>
              <th>Action</th>
            </tr>

            {/* DESKTOP FILTER ROW */}
            <tr className="filter-row">
              <th>
                <input
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
                        }).then(loadData)
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
                <td>{r.cvUrl && <a href={r.cvUrl}>Link</a>}</td>
                <td>{r.linkedin && <a href={r.linkedin}>Link</a>}</td>
                <td>
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

  return (
    <div className="candidate-page">
      <h2>Candidate Management</h2>
      {renderTable("Active Candidates", processedActive, true)}
      {renderTable("Archived Candidates", processedArchived, false)}
    </div>
  );
}
