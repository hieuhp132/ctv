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

    // number
    if (!isNaN(av) && !isNaN(bv)) {
      return direction === "asc" ? av - bv : bv - av;
    }

    // date
    if (!isNaN(Date.parse(av)) && !isNaN(Date.parse(bv))) {
      return direction === "asc"
        ? new Date(av) - new Date(bv)
        : new Date(bv) - new Date(av);
    }

    // string
    return direction === "asc"
      ? String(av).localeCompare(String(bv))
      : String(bv).localeCompare(String(av));
  });
};

/* ================= COMPONENT ================= */

export default function CandidateManagement() {
  const { user } = useAuth();
  const adminId = user?._id;
  const email = user?.email || "";

  const [rows, setRows] = useState([]);

  /* ===== FILTER STATE (PER COLUMN) ===== */
  const [filters, setFilters] = useState({
    candidateName: "",
    job: "",
    recruiter: "",
    candidateEmail: "",
    status: "",
  });

  /* ===== SORT STATE ===== */
  const [sortConfig, setSortConfig] = useState({
    key: "",
    direction: "",
  });

  /* ================= LOAD DATA ================= */

  useEffect(() => {
    if (!adminId) return;

    listReferrals({
      id: adminId,
      email,
      isAdmin: true,
      limit: 1000,
    }).then((res) => setRows(res || []));
  }, [adminId, email]);

  /* ================= FILTERED + SORTED ================= */

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

  /* ================= SORT HANDLER ================= */

  const toggleSort = (key) => {
    setSortConfig((prev) => {
      if (prev.key !== key) return { key, direction: "asc" };
      if (prev.direction === "asc") return { key, direction: "desc" };
      return { key: "", direction: "" };
    });
  };

  /* ================= OPTIONS FROM BACKEND ================= */

  const jobOptions = uniqueValues(rows, "job");
  const recruiterOptions = uniqueValues(rows, "recruiter");

  /* ================= RENDER ================= */

  return (
    <div className="candidate-page">
      <div className="page-header">
        <h2>My Candidates</h2>
      </div>

      <div className="table-section">
        <div className="table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th onClick={() => toggleSort("candidateName")}>Name</th>
                <th onClick={() => toggleSort("job")}>Job</th>
                <th onClick={() => toggleSort("recruiter")}>CTV</th>
                <th onClick={() => toggleSort("candidateEmail")}>Email</th>
                <th onClick={() => toggleSort("status")}>Status</th>
                <th onClick={() => toggleSort("bonus")}>Bonus</th>
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
              {sortedRows.map((r) => (
                <tr key={getRefId(r)}>
                  <td>{r.candidateName}</td>
                  <td>{r.job}</td>
                  <td>{r.recruiter}</td>
                  <td>{r.candidateEmail}</td>
                  <td>{r.status}</td>
                  <td>{r.bonus || 0}</td>
                  <td>
                    {r.cvUrl && (
                      <a href={r.cvUrl} target="_blank" rel="noreferrer">
                        Link
                      </a>
                    )}
                  </td>
                  <td>
                    {r.linkedin && (
                      <a href={r.linkedin} target="_blank" rel="noreferrer">
                        Link
                      </a>
                    )}
                  </td>
                  <td>
                    <button
                      className="remove-btn"
                      onClick={async () => {
                        if (!window.confirm("Remove candidate?")) return;
                        await removeCandidateById(getRefId(r));
                        setRows((p) =>
                          p.filter((x) => getRefId(x) !== getRefId(r))
                        );
                      }}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}

              {!sortedRows.length && (
                <tr>
                  <td colSpan="9" style={{ textAlign: "center" }}>
                    No data
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
