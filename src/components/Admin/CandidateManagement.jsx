// CandidateManagement.js – RAW backend data (no normalize)
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
    console.log("Active referrals response:", activeRes);
    console.log("Archived referrals response:", archivedRes);
    setSubmissions(Array.isArray(activeRes?.items) ? activeRes.items : []);
    setArchived(Array.isArray(archivedRes?.items) ? archivedRes.items : []);
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

  const paginate = (data, page) =>
    data.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  const currentSubs = paginate(submissions, currentPage);
  const currentArchived = paginate(archived, archivedPage);

  /* ================= RENDER ================= */

  const renderTable = (title, data) => (
    <section className="table-section">
      <h3>{title}</h3>

      <table className="admin-table">
        <thead>
          <tr>
            <th>CANDIDATE</th>
            <th>JOB</th>
            <th>CTV</th>
            <th>EMAIL</th>
            <th>PHONE</th>
            <th>CV</th>
            <th>LINKEDIN</th>
            <th>STATUS</th>
            <th>BONUS</th>
            <th>ACTION</th>
          </tr>
        </thead>

        <tbody>
          {data.map((sub) => {
            const rid = getRefId(sub);
            return (
              <tr key={rid}>
                <td>{sub.candidateName}</td>
                <td>{sub.job}</td>
                <td>{sub.recruiter}</td>
                <td>{sub.candidateEmail}</td>
                <td>{sub.candidatePhone}</td>

                <td>
                  {sub.cvUrl ? (
                    <a href={sub.cvUrl} target="_blank" rel="noreferrer">
                      Link
                    </a>
                  ) : (
                    "-"
                  )}
                </td>

                <td>
                  {sub.linkedin ? (
                    <a href={sub.linkedin} target="_blank" rel="noreferrer">
                      Link
                    </a>
                  ) : (
                    "-"
                  )}
                </td>

                <td>
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

                <td>
                  <input
                    value={sub.bonus || 0}
                    onChange={(e) =>
                      setEditedRows((p) => ({
                        ...p,
                        [rid]: { ...p[rid], bonus: e.target.value },
                      }))
                    }
                  />
                </td>

                <td>
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
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );

  return (
    <div className="candidate-page">
      {successMessage && <div className="success-banner">{successMessage}</div>}

      <h2>Candidate Management</h2>
      <div>Admin Credit: ${balances.adminCredit}</div>

      {renderTable("Active Candidates", currentSubs)}
      {renderTable("Archived Candidates", currentArchived)}
    </div>
  );
}
