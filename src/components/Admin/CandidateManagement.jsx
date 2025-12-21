// CandidateManagement.js – RAW backend data + filter + sort
import React, { useEffect, useState } from "react";
import "./CandidateManagement.css";
import {
  updateSubmissionStatus,
  getBalances,
  finalizeSubmission,
  removeCandidateById,
  listReferrals,
} from "../../api";
import { useAuth } from "../../context/AuthContext";

/* ================= CONSTANTS ================= */

const STATUS_OPTIONS = [
  { value: "submitted", label: "Submitted" },
  { value: "under_review", label: "Under Review" },
  { value: "interviewing", label: "Interviewing" },
  { value: "offer", label: "Offer" },
  { value: "hired", label: "Hired" },
  { value: "onboard", label: "Onboard" },
  { value: "rejected", label: "Rejected" },
];

const getRefId = (sub) => sub?._id;

/* ================= COMPONENT ================= */

export default function CandidateManagement() {
  const { user } = useAuth();
  const adminId = user?._id;
  const email = user?.email || "";

  const [submissions, setSubmissions] = useState([]);
  const [archived, setArchived] = useState([]);
  const [balances, setBalances] = useState({ adminCredit: 0 });

  const [editedRows, setEditedRows] = useState({});
  const [loadingRow, setLoadingRow] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [archivedPage, setArchivedPage] = useState(1);
  const rowsPerPage = 15;

  /* ===== FILTER + SORT ===== */
  const [filters, setFilters] = useState({
    status: "all",
    candidate: "",
    email: "",
  });

  const [sortConfig, setSortConfig] = useState({
    key: "",
    direction: "asc",
  });

  /* ================= DATA LOAD ================= */

  const refresh = async () => {
    if (!adminId) return;

    const [activeRes, archivedRes, bal] = await Promise.all([
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
      getBalances(),
    ]);

    setSubmissions(activeRes?.items || []);
    setArchived(archivedRes?.items || []);
    setBalances(bal || { adminCredit: 0 });
  };

  useEffect(() => {
    refresh();
  }, [adminId, email]);

  /* ================= ACTIONS ================= */

  const handleSave = async (sub) => {
    const rid = getRefId(sub);
    if (!rid) return;

    setLoadingRow(rid);

    try {
      const pending = editedRows[rid] || {};
      const nextStatus = pending.status ?? sub.status;
      const nextBonus = pending.bonus ?? sub.bonus;

      await updateSubmissionStatus({
        id: rid,
        status: nextStatus,
        bonus: nextBonus,
      });

      if (nextStatus === "onboard" || nextStatus === "rejected") {
        await finalizeSubmission({ referralId: rid });
      }

      setSuccessMessage("Successfully updated!");
      setTimeout(() => setSuccessMessage(""), 3000);

      await refresh();
      setEditedRows((p) => {
        const n = { ...p };
        delete n[rid];
        return n;
      });
    } catch (e) {
      alert("Update failed");
    } finally {
      setLoadingRow(null);
    }
  };

  /* ================= HELPERS ================= */

  const applyFilters = (data) =>
    data.filter((s) => {
      if (filters.status !== "all" && s.status !== filters.status) return false;
      if (
        filters.candidate &&
        !s.candidateName
          ?.toLowerCase()
          .includes(filters.candidate.toLowerCase())
      )
        return false;
      if (
        filters.email &&
        !s.candidateEmail
          ?.toLowerCase()
          .includes(filters.email.toLowerCase())
      )
        return false;
      return true;
    });

  const applySort = (data) => {
    if (!sortConfig.key) return data;
    return [...data].sort((a, b) => {
      const av = (a[sortConfig.key] || "").toString().toLowerCase();
      const bv = (b[sortConfig.key] || "").toString().toLowerCase();
      return sortConfig.direction === "asc"
        ? av.localeCompare(bv)
        : bv.localeCompare(av);
    });
  };

  const paginate = (data, page) =>
    data.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  const processedSubs = applySort(applyFilters(submissions));
  const processedArchived = applySort(applyFilters(archived));

  const currentSubs = paginate(processedSubs, currentPage);
  const currentArchived = paginate(processedArchived, archivedPage);

  /* ================= RENDER ================= */

  const renderTable = (title, data) => (
    <section className="table-section">
      <div className="table-header">
        <h3>{title}</h3>

        <div className="filter-row">
          <div className="filter-wrapper">
            <label>Status</label>
            <select
              className="status-filter"
              value={filters.status}
              onChange={(e) =>
                setFilters((p) => ({ ...p, status: e.target.value }))
              }
            >
              <option value="all">All</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-wrapper">
            <label>Candidate</label>
            <input
              type="text"
              value={filters.candidate}
              onChange={(e) =>
                setFilters((p) => ({ ...p, candidate: e.target.value }))
              }
            />
          </div>

          <div className="filter-wrapper">
            <label>Email</label>
            <input
              type="text"
              value={filters.email}
              onChange={(e) =>
                setFilters((p) => ({ ...p, email: e.target.value }))
              }
            />
          </div>
        </div>
      </div>

      <div className="table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th
                onClick={() =>
                  setSortConfig({
                    key: "candidateName",
                    direction:
                      sortConfig.direction === "asc" ? "desc" : "asc",
                  })
                }
              >
                CANDIDATE
              </th>
              <th>JOB</th>
              <th>CTV</th>
              <th>EMAIL</th>
              <th>PHONE</th>
              <th>CV</th>
              <th>LINKEDIN</th>
              <th
                onClick={() =>
                  setSortConfig({
                    key: "status",
                    direction:
                      sortConfig.direction === "asc" ? "desc" : "asc",
                  })
                }
              >
                STATUS
              </th>
              <th className="short">BONUS</th>
              <th className="short">ACTION</th>
            </tr>
          </thead>

          <tbody>
            {data.map((sub) => {
              const rid = getRefId(sub);
              return (
                <tr key={rid}>
                  <td data-label="Candidate">{sub.candidateName}</td>
                  <td data-label="Job" className="wrap">{sub.job}</td>
                  <td data-label="CTV" className="wrap">{sub.recruiter}</td>
                  <td data-label="Email">{sub.candidateEmail}</td>
                  <td data-label="Phone">{sub.candidatePhone}</td>
                  <td data-label="CV">
                    {sub.cvUrl ? (
                      <a href={sub.cvUrl} target="_blank" rel="noreferrer">
                        Link
                      </a>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td data-label="LinkedIn">
                    {sub.linkedin ? (
                      <a href={sub.linkedin} target="_blank" rel="noreferrer">
                        Link
                      </a>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td data-label="Status">
                    <select
                      value={sub.status}
                      onChange={(e) =>
                        setEditedRows((p) => ({
                          ...p,
                          [rid]: { ...p[rid], status: e.target.value },
                        }))
                      }
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td data-label="Bonus">
                    <input
                      type="number"
                      value={sub.bonus || 0}
                      onChange={(e) =>
                        setEditedRows((p) => ({
                          ...p,
                          [rid]: { ...p[rid], bonus: e.target.value },
                        }))
                      }
                    />
                  </td>
                  <td data-label="Action">
                    <div className="action-buttons">
                      <button onClick={() => handleSave(sub)}>Update</button>
                      <button
                        className="remove-btn"
                        onClick={async () => {
                          if (!window.confirm("Remove candidate?")) return;
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
    </section>
  );

  return (
    <div className="candidate-page">
      {successMessage && <div className="success-banner">{successMessage}</div>}

      <div className="page-header">
        <h2>Candidate Management</h2>
        <div className="credit-info">
          Admin Credit: <span>${balances.adminCredit}</span>
        </div>
      </div>

      {renderTable("Active Candidates", currentSubs)}
      {renderTable("Archived Candidates", currentArchived)}
    </div>
  );
}
