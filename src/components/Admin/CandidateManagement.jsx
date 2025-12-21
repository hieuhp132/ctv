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

  const [rows, setRows] = useState([]);

  /* ===== FILTER ===== */
  const [filters, setFilters] = useState({
    candidateName: "",
    job: "",
    recruiter: "",
    candidateEmail: "",
    status: "",
  });

  /* ===== SORT ===== */
  const [sortConfig, setSortConfig] = useState({
    key: "",
    direction: "",
  });

  /* ================= LOAD DATA ================= */

  const loadData = async () => {
    if (!adminId) return;

    const res = await listReferrals({
      id: adminId,
      email,
      isAdmin: true,
      limit: 1000,
    });

    setRows(res || []);
  };

  useEffect(() => {
    loadData();
  }, [adminId, email]);

  /* ================= FILTER + SORT ================= */

  const filteredRows = useMemo(() => {
    return rows.filter((r) =>
      Object.entries(filters).every(([key, val]) => {
        if (!val) return true;
        return String(r[key] || "")
          .toLowerCase()
          .includes(val.toLowerCase());
      })
    );
  }, [rows, filters]);

  const sortedRows = useMemo(
    () => sortData(filteredRows, sortConfig),
    [filteredRows, sortConfig]
  );

  /* ================= SPLIT BY STATUS ================= */

  const activeRows = sortedRows.filter((r) => r.status !== "rejected");
  const rejectedRows = sortedRows.filter((r) => r.status === "rejected");

  /* ================= OPTIONS ================= */

  const jobOptions = uniqueValues(rows, "job");
  const recruiterOptions = uniqueValues(rows, "recruiter");

  /* ================= SORT HANDLER ================= */

  const toggleSort = (key) => {
    setSortConfig((prev) => {
      if (prev.key !== key) return { key, direction: "asc" };
      if (prev.direction === "asc") return { key, direction: "desc" };
      return { key: "", direction: "" };
    });
  };

  /* ================= MOBILE FILTER (CSS CONTROLLED) ================= */

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

  const renderTable = (title, data, editableStatus) => (
    <section className="table-section">
      <h3>{title}</h3>

      {/* MOBILE FILTER (ONLY MOBILE) */}
      <MobileFilter />

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

            {/* DESKTOP FILTER */}
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
            {data.map((r) => (
              <tr key={getRefId(r)}>
                <td>{r.candidateName}</td>
                <td>{r.job}</td>
                <td>{r.recruiter}</td>
                <td>{r.candidateEmail}</td>
                <td>
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
                <td>{r.bonus || 0}</td>
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

            {!data.length && (
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

      {renderTable("Active Candidates", activeRows, true)}
      {renderTable("Rejected Candidates", rejectedRows, false)}
    </div>
  );
}
