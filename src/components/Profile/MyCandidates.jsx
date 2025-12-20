import React, { useMemo, useState, useEffect } from "react";
import {
  listReferrals,
  getBalances,
  getJobByIdL,
} from "../../api";
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

/* ================= TRACKER ================= */
function CandidateTracker({ candidates, name, jobMap }) {
  const [filters, setFilters] = useState({
    candidate: "",
    job: "",
    email: "",
    status: "all",
  });

  const filteredCandidates = useMemo(() => {
    return candidates.filter((c) => {
      const matchStatus =
        filters.status === "all" ||
        String(c.status).toLowerCase() === filters.status.toLowerCase();

      const matchCandidate = (c.candidateName || "")
        .toLowerCase()
        .includes(filters.candidate.toLowerCase());

      const matchJob = (jobMap?.[c.job] || "")
        .toLowerCase()
        .includes(filters.job.toLowerCase());

      const matchEmail = (c.candidateEmail || "")
        .toLowerCase()
        .includes(filters.email.toLowerCase());

      return matchStatus && matchCandidate && matchJob && matchEmail;
    });
  }, [candidates, filters, jobMap]);

  const uniqueJobs = [
    ...new Set(
      candidates
        .map((c) => jobMap?.[c.job])
        .filter(Boolean)
    ),
  ];

  const uniqueCandidates = [
    ...new Set(candidates.map((c) => c.candidateName).filter(Boolean)),
  ];

  const uniqueEmails = [
    ...new Set(candidates.map((c) => c.candidateEmail).filter(Boolean)),
  ];

  return (
    <section className="table-section">
      <div className="table-header">
        <h3>{name}</h3>

        <div className="filter-row">
          <div className="filter-wrapper">
            <label>Status</label>
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

          <div className="filter-wrapper">
            <label>Candidate</label>
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

          <div className="filter-wrapper">
            <label>Job</label>
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

          <div className="filter-wrapper">
            <label>Email</label>
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
      </div>

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
              <tr key={c._id}>
                <td>{c.candidateName}</td>
                <td>{jobMap?.[c.job] || "-"}</td>
                <td>-</td>
                <td>
                  {c.status
                    ? c.status
                        .split("_")
                        .map(
                          (w) => w.charAt(0).toUpperCase() + w.slice(1)
                        )
                        .join(" ")
                    : "-"}
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
          </tbody>
        </table>

        {filteredCandidates.length === 0 && (
          <p style={{ padding: 12, color: "#6b7280" }}>
            No candidates found.
          </p>
        )}
      </div>
    </section>
  );
}

/* ================= MAIN PAGE ================= */
export default function MyCandidates() {
  const { user } = useAuth();
  const ctvId = useMemo(() => user?._id, [user]);

  const [candidates, setCandidates] = useState([]);
  const [archived, setArchived] = useState([]);
  const [balance, setBalance] = useState(0);
  const [jobMap, setJobMap] = useState({});

  /* ===== LOAD REFERRALS ===== */
  useEffect(() => {
    if (!ctvId) return;

    Promise.all([
      listReferrals({ id: ctvId, isAdmin: false, finalized: false }),
      listReferrals({ id: ctvId, isAdmin: false, finalized: true }),
    ]).then(([active, done]) => {
      setCandidates(active || []);
      setArchived(done || []);
    });

    getBalances().then((b) => {
      const id = user?._id || user?.id || user?.email;
      setBalance(b?.ctvBonusById?.[id] || 0);
    });
  }, [ctvId, user]);

  /* ===== LOAD JOB TITLES ===== */
useEffect(() => {
  const loadJobs = async () => {
    const all = [...candidates, ...archived];
    const jobIds = [...new Set(all.map(c => c.job).filter(Boolean))];

    console.log("JOB IDS:", jobIds);

    const entries = await Promise.all(
      jobIds.map(async (id) => {
        console.log("Fetching job:", id);
        const job = await getJobByIdL(id);
        console.log("Job result:", job);
        return [id, job?.title || "-"];
      })
    );

    console.log("JOB MAP ENTRIES:", entries);

    setJobMap(prev => ({ ...prev, ...Object.fromEntries(entries) }));
  };

  loadJobs();
}, [candidates, archived]);


  return (
    <div className="dashboard-container candidate-page">
      <header className="page-header">
        <h2>My Candidates</h2>
        <div className="credit-info">
          Your Balance: <span>${balance}</span>
        </div>
      </header>

      <CandidateTracker
        candidates={candidates}
        jobMap={jobMap}
        name="Candidate Tracking"
      />

      <CandidateTracker
        candidates={archived}
        jobMap={jobMap}
        name="Completed"
      />

      <Icons />
    </div>
  );
}
