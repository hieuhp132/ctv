import React, { useMemo, useState, useEffect } from "react";
import { listSubmissions, listArchivedSubmissions, getBalances } from "../../api";
import { useAuth } from "../../context/AuthContext";
import "../Admin/CandidateManagement.css";
import Icons from "../Icons";

const STATUS_OPTIONS = [
  "submitted",
  "under_review",
  "interviewing",
  "offer",
  "hired",
  "onboard",
  "rejected",
];

function CandidateTracker({ candidates, name }) {
  const [filters, setFilters] = useState({
    candidate: "",
    job: "",
    email: "",
    status: "all",
  });

  // ✅ Áp dụng lọc
  const filteredCandidates = useMemo(() => {
    return candidates.filter((c) => {
      const matchStatus =
        filters.status === "all" ||
        (c.status || "").toLowerCase() === filters.status.toLowerCase();

      const matchCandidate = (c.candidate || "")
        .toLowerCase()
        .includes(filters.candidate.toLowerCase());
      const matchJob = (c.job || "")
        .toLowerCase()
        .includes(filters.job.toLowerCase());
      const matchEmail = (c.email || "")
        .toLowerCase()
        .includes(filters.email.toLowerCase());

      return matchStatus && matchCandidate && matchJob && matchEmail;
    });
  }, [candidates, filters]);

  // ✅ Tạo danh sách job/status có sẵn để người dùng chọn
  const uniqueJobs = [...new Set(candidates.map((c) => c.job).filter(Boolean))];
  const uniqueCandidates = [
    ...new Set(candidates.map((c) => c.candidate).filter(Boolean)),
  ];
  const uniqueEmails = [
    ...new Set(candidates.map((c) => c.email).filter(Boolean)),
  ];

  return (
    <div className="candidate-tracker">
      <h2>{name}</h2>

      {/* 🧭 Bộ lọc */}
      <div className="filter-bar">
        <div className="filter-item">
          <label>Status:</label>
          <select
            value={filters.status}
            onChange={(e) =>
              setFilters((f) => ({ ...f, status: e.target.value }))
            }
          >
            <option value="all">All</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s
                  .split("_")
                  .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                  .join(" ")}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-item">
          <label>Candidate:</label>
          <select
            value={filters.candidate}
            onChange={(e) =>
              setFilters((f) => ({ ...f, candidate: e.target.value }))
            }
          >
            <option value="">All</option>
            {uniqueCandidates.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-item">
          <label>Job:</label>
          <select
            value={filters.job}
            onChange={(e) =>
              setFilters((f) => ({ ...f, job: e.target.value }))
            }
          >
            <option value="">All</option>
            {uniqueJobs.map((j) => (
              <option key={j} value={j}>
                {j}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-item">
          <label>Email:</label>
          <select
            value={filters.email}
            onChange={(e) =>
              setFilters((f) => ({ ...f, email: e.target.value }))
            }
          >
            <option value="">All</option>
            {uniqueEmails.map((em) => (
              <option key={em} value={em}>
                {em}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 🧾 Table */}
      <div className="table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Job</th>
              <th>Salary</th>
              <th>Status</th>
              <th>Bonus</th>
              <th>Email</th>
              <th>Phone</th>
              <th>CV</th>
              <th>LinkedIn</th>
              <th>Portfolio</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            {filteredCandidates.map((c) => (
              <tr key={c.id}>
                <td data-label="Name">{c.candidate}</td>
                <td data-label="Job">{c.job}</td>
                <td data-label="Salary">{c.salary || "-"}</td>
                <td data-label="Status">
                  {c.status
                    ? c.status
                        .split("_")
                        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                        .join(" ")
                    : "-"}
                </td>
                <td data-label="Bonus">{c.bonus || "-"}</td>
                <td data-label="Email">{c.email || "-"}</td>
                <td data-label="Phone">{c.phone || "-"}</td>
                <td data-label="CV">
                  {c.cv ? (
                    <a
                      href={c.cvUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {/* {c.cv} */}
                      Link
                    </a>
                  ) : (
                    "-"
                  )}
                </td>
                <td data-label="LinkedIn">
                  {c.linkedin ? (
                    <a href={c.linkedin} target="_blank" rel="noreferrer">
                      Link
                    </a>
                  ) : (
                    "-"
                  )}
                </td>
                <td data-label="Portfolio">
                  {c.portfolio ? (
                    <a href={c.portfolio} target="_blank" rel="noreferrer">
                      Link
                    </a>
                  ) : (
                    "-"
                  )}
                </td>
                <td data-label="Time">
                  {c.createdAt
                    ? new Date(c.createdAt).toLocaleString()
                    : "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredCandidates.length === 0 && (
          <p style={{ padding: 12, color: "gray" }}>No candidates found.</p>
        )}
      </div>
    </div>
  );
}

export default function MyCandidates() {
  const { user } = useAuth();
  const ctvId = useMemo(() => user?._id, [user]);
  const [candidates, setCandidates] = useState([]);
  const [archived, setArchived] = useState([]);
  const [balance, setBalance] = useState(0);

  useEffect(() => {
    Promise.all([listSubmissions(), listArchivedSubmissions()]).then(
      ([subs, arch]) => {
        setCandidates(subs.filter((s) => String(s.ctv) === String(ctvId)));
        setArchived(arch.filter((a) => String(a.ctv) === String(ctvId)));
      }
    );
    getBalances().then((b) => {
      const id = user?._id || user?.id || user?.email;
      setBalance(b.ctvBonusById?.[id] || 0);
    });
  }, [ctvId, user]);

  return (
    <div style={{ padding: 16 }}>
      <h2>My Candidates</h2>
      <div
        style={{ marginBottom: 12, fontWeight: 500, color: "#0d6efd" }}
      >
        Your Balance: {balance} USD
      </div>

      <div style={{ marginBottom: 32 }}>
        <CandidateTracker candidates={candidates} name="Candidate Tracking" />
      </div>

      <div>
        <CandidateTracker candidates={archived} name="Completed" />
      </div>

      <Icons />
    </div>
  );
}
