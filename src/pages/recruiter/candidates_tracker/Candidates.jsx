import React, { useMemo, useState, useEffect } from "react";
import {
  listReferrals,
  getJobByIdL,
} from "../../../services/api";
import { useAuth } from "../../../context/AuthContext";
import "./Candidates.css";
import Icons from "../../../components/Icons.jsx";

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
const paginate = (data, page) =>
  data.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

/* ================= TABLE ================= */
function CandidateTable({ title, rows, jobMap }) {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    status: "",
    candidate: "",
    job: "",
    email: "",
  });

  useEffect(() => {
    setPage(1);
  }, [filters]);

  const filtered = useMemo(() => {
    return rows.filter((c) => {
      const matchStatus =
        !filters.status || c.status === filters.status;

      const matchCandidate = (c.candidateName || "")
        .toLowerCase()
        .includes(filters.candidate.toLowerCase());

      const matchJob = (jobMap[c.job]?.title || "")
        .toLowerCase()
        .includes(filters.job.toLowerCase());

      const matchEmail = (c.candidateEmail || "")
        .toLowerCase()
        .includes(filters.email.toLowerCase());

      return matchStatus && matchCandidate && matchJob && matchEmail;
    });
  }, [rows, filters, jobMap]);

  const paged = paginate(filtered, page);

  return (
    <section className="table-section">
      <h3>{title}</h3>

      {/* FILTER */}
      <div className="filter-container">
        <input
          placeholder="Candidate"
          value={filters.candidate}
          onChange={(e) =>
            setFilters((f) => ({ ...f, candidate: e.target.value }))
          }
        />
        <input
          placeholder="Job"
          value={filters.job}
          onChange={(e) =>
            setFilters((f) => ({ ...f, job: e.target.value }))
          }
        />
        <input
          placeholder="Email"
          value={filters.email}
          onChange={(e) =>
            setFilters((f) => ({ ...f, email: e.target.value }))
          }
        />

        <select
          value={filters.status}
          onChange={(e) =>
            setFilters((f) => ({ ...f, status: e.target.value }))
          }
        >
          <option value="">All Status</option>
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

      {/* TABLE */}
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
            {paged.map((c) => (
              <tr key={c._id}>
                <td>{c.candidateName}</td>
                <td>{jobMap[c.job]?.title || "-"}</td>
                <td>{jobMap[c.job]?.salary || "-"}</td>
                <td>
                  {c.status
                    ?.split("_")
                    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                    .join(" ")}
                </td>
                <td>{c.bonus ?? "-"}</td>
                <td>{c.candidateEmail || "-"}</td>
                <td>{c.candidatePhone || "-"}</td>

                <td>
                  {c.cvUrl ? (
                    <a href={c.cvUrl} target="_blank" rel="noreferrer">
                      Link
                    </a>
                  ) : (
                    "-"
                  )}
                </td>

                <td>
                  {c.linkedin ? (
                    <a href={c.linkedin} target="_blank" rel="noreferrer">
                      Link
                    </a>
                  ) : (
                    "-"
                  )}
                </td>

                <td>
                  {c.portfolio ? (
                    <a href={c.portfolio} target="_blank" rel="noreferrer">
                      Link
                    </a>
                  ) : (
                    "-"
                  )}
                </td>

                <td>
                  {c.createdAt
                    ? new Date(c.createdAt).toLocaleString()
                    : "-"}
                </td>
              </tr>
            ))}

            {!paged.length && (
              <tr>
                <td colSpan="11">No data</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* PAGINATION */}
      <div className="pagination">
        <button disabled={page === 1} onClick={() => setPage(page - 1)}>
          Prev
        </button>
        <span>
          Page {page} / {Math.ceil(filtered.length / PAGE_SIZE) || 1}
        </span>
        <button
          disabled={page >= Math.ceil(filtered.length / PAGE_SIZE)}
          onClick={() => setPage(page + 1)}
        >
          Next
        </button>
      </div>
    </section>
  );
}

/* ================= MAIN ================= */
export default function MyCandidates() {
  const { user } = useAuth();
  const userId = user?._id || user?.id;
  const userEmail = user?.email;

  const [candidates, setCandidates] = useState([]);
  const [archived, setArchived] = useState([]);
  const [balance, setBalance] = useState(0);
  const [jobMap, setJobMap] = useState({});

  /* ===== LOAD REFERRALS ===== */
  useEffect(() => {
    if (!userId && !userEmail) return;

    Promise.all([
      listReferrals({
        id: userId,
        email: userEmail,
        isAdmin: false,
      }),
      listReferrals({
        id: userId,
        email: userEmail,
        isAdmin: false,
        status: "rejected",
      }),
    ]).then(([active, rejected]) => {
      setCandidates(active || []);
      setArchived(rejected || []);
    });

 
  }, [userId, userEmail]);

  /* ===== LOAD JOB INFO ===== */
  useEffect(() => {
    const all = [...candidates, ...archived];
    const jobIds = [...new Set(all.map((c) => c.job).filter(Boolean))];

    if (!jobIds.length) return;

    Promise.all(
      jobIds.map(async (id) => {
        if (jobMap[id]) return [id, jobMap[id]];
        const res = await getJobByIdL(id);
        return [
          id,
          {
            title: res?.job?.title || "-",
            salary: res?.job?.salary || "-",
          },
        ];
      })
    ).then((entries) => {
      setJobMap((p) => ({ ...p, ...Object.fromEntries(entries) }));
    });
  }, [candidates, archived]); // intentionally skip jobMap

  return (
    <div className="dashboard-container candidate-page">
      <header className="page-header">
        <h2>My Candidates</h2>
        <div className="credit-info">
          Your Balance: <span>${balance}</span>
        </div>
      </header>

      <CandidateTable
        title="Active Candidates"
        rows={candidates.filter((c) => c.status !== "rejected")}
        jobMap={jobMap}
      />

      <CandidateTable
        title="Rejected Candidates"
        rows={archived}
        jobMap={jobMap}
      />

      <Icons />
    </div>
  );
}
