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

      const matchJob = (jobMap?.[c.job]?.title || "")
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
        .map((c) => jobMap?.[c.job]?.title)
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
          {name !== "Completed" && (
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
          )}

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
                <td data-label="Name">{c.candidateName}</td>
                <td data-label="Job">{jobMap?.[c.job]?.title || "-"}</td>
                <td data-label="Salary">{jobMap?.[c.job]?.salary || "-"}</td>
                <td data-label="Status">
                  {c.status
                    ? c.status
                        .split("_")
                        .map(
                          (w) => w.charAt(0).toUpperCase() + w.slice(1)
                        )
                        .join(" ")
                    : "-"}
                </td>
                <td data-label="Bonus">{c.bonus ?? "-"}</td>
                <td data-label="Email">{c.candidateEmail || "-"}</td>
                <td data-label="Phone">{c.candidatePhone || "-"}</td>

                <td data-label="CV">
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
  const userId = user?._id || user?.id;
  const userEmail = user?.email;

  const [candidates, setCandidates] = useState([]);
  const [archived, setArchived] = useState([]);
  const [balance, setBalance] = useState(0);
  const [jobMap, setJobMap] = useState({});

  /* ===== LOAD REFERRALS ===== */
  useEffect(() => {
    if (!userId && !userEmail) return;
    console.log("Loading referrals for user:", userId);
    console.log("or email:", userEmail);
    Promise.all([
      listReferrals({
        id: userId,
        email: userEmail,
        isAdmin: false,
        finalized: false,
      }),
      listReferrals({
        id: userId,
        email: userEmail,
        isAdmin: false,
        finalized: true,
      }),
    ]).then(([active, done]) => {
      setCandidates(active || []);
      setArchived(done || []);
    });

    getBalances().then((b) => {
      const key = userId || userEmail;
      setBalance(b?.ctvBonusById?.[key] || 0);
    });
  }, [userId, userEmail]);


  /* ===== LOAD JOB TITLE + SALARY ===== */
  useEffect(() => {
    const loadJobs = async () => {
      const all = [...candidates, ...archived];
      const jobIds = [...new Set(all.map(c => c.job).filter(Boolean))];

      if (jobIds.length === 0) return;

      const entries = await Promise.all(
        jobIds.map(async (id) => {
          if (jobMap[id]) return [id, jobMap[id]];

          const job = await getJobByIdL(id);
          return [
            id,
            {
              title: job?.job.title || "-",
              salary: job?.job.salary || "-"
            }
          ];
        })
      );

      setJobMap(prev => ({
        ...prev,
        ...Object.fromEntries(entries)
      }));
    };

    loadJobs();
  }, [candidates, archived]); // intentionally not adding jobMap

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
