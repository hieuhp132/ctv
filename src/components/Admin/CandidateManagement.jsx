import React, { useEffect, useMemo, useState } from "react";
import "./CandidateManagement.css";
import {
  updateReferralFieldsById,
  listReferrals,
  removeReferralFieldsById,
  getJobByIdL,
  fetchProfileFromServerL,
} from "../../api";
import { useAuth } from "../../context/AuthContext";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

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

/* ================= CHART HELPERS & COMPONENTS ================= */
const STATUS_COLORS = {
  submitted: "#2563eb",
  under_review: "#fb923c",
  interviewing: "#f97316",
  offer: "#10b981",
  hired: "#059669",
  onboard: "#059669",
  rejected: "#ef4444",
  other: "#6b7280",
};

function polarToCartesian(cx, cy, r, angleDeg) {
  const angleRad = ((angleDeg - 90) * Math.PI) / 180.0;
  return {
    x: cx + r * Math.cos(angleRad),
    y: cy + r * Math.sin(angleRad),
  };
}

function describeArcSector(cx, cy, rOuter, rInner, startAngle, endAngle) {
  const startOuter = polarToCartesian(cx, cy, rOuter, endAngle);
  const endOuter = polarToCartesian(cx, cy, rOuter, startAngle);
  const startInner = polarToCartesian(cx, cy, rInner, endAngle);
  const endInner = polarToCartesian(cx, cy, rInner, startAngle);

  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

  const d = [
    `M ${startOuter.x} ${startOuter.y}`,
    `A ${rOuter} ${rOuter} 0 ${largeArcFlag} 0 ${endOuter.x} ${endOuter.y}`,
    `L ${endInner.x} ${endInner.y}`,
    `A ${rInner} ${rInner} 0 ${largeArcFlag} 1 ${startInner.x} ${startInner.y}`,
    "Z",
  ].join(" ");

  return d;
}

function PieChart({ data, size = 160, thickness = 36, showLegend = true }) {
  const total = data.reduce((s, d) => s + Math.max(0, d.value), 0) || 1;
  let angle = 0;
  const cx = size / 2;
  const cy = size / 2;
  const rOuter = size / 2 - 6;
  const rInner = Math.max(6, rOuter - thickness);

  return (
    <div className="chart-card">
      <svg width={size} height={size} className="pie-svg" role="img" aria-label="Status chart">
        {data.map((d, i) => {
          const value = Math.max(0, d.value);
          const start = angle;
          const sweep = (value / total) * 360;
          const end = start + sweep;
          const path = describeArcSector(cx, cy, rOuter, rInner, start, end);
          angle = end;
          return <path key={i} d={path} fill={d.color || STATUS_COLORS[d.label] || STATUS_COLORS.other} />;
        })}
        <circle cx={cx} cy={cy} r={rInner - 6} fill="#fff" />
        <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central" style={{fontSize:12,fill:'#374151'}}>Total {data.reduce((s,d)=>s+d.value,0)}</text>
      </svg>

      {showLegend && (
        <div className="legend">
          {data.map((d, i) => (
            <div key={i} className="legend-item">
              <span className="legend-color" style={{ background: d.color || STATUS_COLORS[d.label] || STATUS_COLORS.other }} />
              <span className="legend-label">{d.label} — {d.value} ({Math.round((d.value / total) * 100)}%)</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


/* ================= HELPERS ================= */
const paginate = (data, page) =>
  data.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

/* ================= DEBOUNCE ================= */
function useDebounce(value, delay = 200) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

/* ================= FILTER UI ================= */
const FilterUI = React.memo(({ filters, onChange }) => (
  <div className="filter-container">
    <input
      placeholder="Candidate"
      value={filters.candidateName}
      onChange={(e) => onChange("candidateName", e.target.value)}
    />
    <input
      placeholder="Job"
      value={filters.job}
      onChange={(e) => onChange("job", e.target.value)}
    />
    <input
      placeholder="CTV"
      value={filters.recruiter}
      onChange={(e) => onChange("recruiter", e.target.value)}
    />
    <input
      placeholder="Email"
      value={filters.candidateEmail}
      onChange={(e) => onChange("candidateEmail", e.target.value)}
    />
    <select
      value={filters.status}
      onChange={(e) => onChange("status", e.target.value)}
    >
      <option value="">All Status</option>
      {STATUS_OPTIONS.map((s) => (
        <option key={s} value={s}>
          {s}
        </option>
      ))}
    </select>
  </div>
));

/* ================= MAIN ================= */
export default function CandidateManagement() {
  const { user } = useAuth();
  const adminId = user?._id;
  const email = user?.email || "";

  const [rows, setRows] = useState([]);
  const [filters, setFilters] = useState({
    candidateName: "",
    job: "",
    recruiter: "",
    candidateEmail: "",
    status: "",
  });
  const [sortConfig, setSortConfig] = useState({
    key: "updatedAt",
    direction: "desc",
  });
  const [activePage, setActivePage] = useState(1);
  const [rejectedPage, setRejectedPage] = useState(1);

  const [jobMap, setJobMap] = useState({});
  const [recruiterMap, setRecruiterMap] = useState({});
  const [localStatuses, setLocalStatuses] = useState({});

  /* ================= LOAD DATA ================= */
  useEffect(() => {
    if (!adminId) return;

    listReferrals({ id: adminId, email, isAdmin: true, limit: 1000 }).then(
      async (res = []) => {
        
        console.log(res);
        setRows(res);

        const statusMap = {};
        const jobIds = new Set();
        const recruiterIds = new Set();

        res.forEach((r) => {
          statusMap[r._id] = r.status;
          if (r.job) jobIds.add(r.job);
          if (r.recruiter) recruiterIds.add(r.recruiter);
        });

        setLocalStatuses(statusMap);

        jobIds.forEach(async (jobId) => {
          if (jobMap[jobId]) return;
          try {
            const res = await getJobByIdL(jobId);
            setJobMap((p) => ({ ...p, [jobId]: res?.job || null }));
          } catch {
            setJobMap((p) => ({ ...p, [jobId]: null }));
          }
        });

        recruiterIds.forEach(async (uid) => {
          if (recruiterMap[uid]) return;
          try {
            const user = await fetchProfileFromServerL(uid);
            setRecruiterMap((p) => ({ ...p, [uid]: user }));
          } catch {
            setRecruiterMap((p) => ({
              ...p,
              [uid]: { email: "Unknown User" },
            }));
          }
        });
      }
    );
  }, [adminId, email]);

  /* ================= RESET PAGE ================= */
  useEffect(() => {
    setActivePage(1);
    setRejectedPage(1);
  }, [filters]);

  /* ================= DEBOUNCE FILTERS ================= */
  const debouncedFilters = {
    candidateName: useDebounce(filters.candidateName),
    job: useDebounce(filters.job),
    recruiter: useDebounce(filters.recruiter),
    candidateEmail: useDebounce(filters.candidateEmail),
    status: filters.status,
  };

  /* ================= FILTER ================= */
  const filtered = useMemo(
    () =>
      rows.filter((r) =>
        Object.entries(debouncedFilters).every(([k, v]) =>
          v
            ? String(r[k] || "")
                .toLowerCase()
                .includes(String(v).toLowerCase())
            : true
        )
      ),
    [rows, debouncedFilters]
  );

  /* ================= SORT (FIXED) ================= */
  const sorted = useMemo(() => {
    const { key, direction } = sortConfig;
    if (!key) return filtered;

    return [...filtered].sort((a, b) => {
      let av = "";
      let bv = "";

      if (key === "updatedAt") {
        av = new Date(a.updatedAt || a.createdAt).getTime();
        bv = new Date(b.updatedAt || b.createdAt).getTime();
      } else if (key === "recruiter") {
        av = recruiterMap[a.recruiter]?.email || "";
        bv = recruiterMap[b.recruiter]?.email || "";
      } else if (key === "job") {
        av = jobMap[a.job]?.title || "";
        bv = jobMap[b.job]?.title || "";
      } else {
        av = a[key] ?? "";
        bv = b[key] ?? "";
      }

      if (!isNaN(av) && !isNaN(bv)) {
        return direction === "asc" ? av - bv : bv - av;
      }

      return direction === "asc"
        ? String(av).localeCompare(String(bv))
        : String(bv).localeCompare(String(av));
    });
  }, [filtered, sortConfig, recruiterMap, jobMap]);

  const activeRows = sorted.filter((r) => r.status !== "rejected");
  const rejectedRows = sorted.filter((r) => r.status === "rejected");

  const activePaged = paginate(activeRows, activePage);
  const rejectedPaged = paginate(rejectedRows, rejectedPage);

  /* ================= SORT UI ================= */
  const toggleSort = (key) => {
    setSortConfig((p) => {
      if (p.key !== key) return { key, direction: "asc" };
      if (p.direction === "asc") return { key, direction: "desc" };
      return { key: "updatedAt", direction: "desc" };
    });
  };

  const sortIcon = (key) =>
    sortConfig.key !== key ? "⇅" : sortConfig.direction === "asc" ? "↑" : "↓";

  /* ================= STATUS ================= */
  const handleStatusChange = (id, value) =>
    setLocalStatuses((p) => ({ ...p, [id]: value }));

  const handleUpdate = async (id) => {
    if (!window.confirm("Update candidate status?")) return;

    const newStatus = localStatuses[id];
    const now = new Date().toISOString();

    await updateReferralFieldsById(id, { status: newStatus });

    setRows((p) =>
      p.map((r) =>
        r._id === id
          ? { ...r, status: newStatus, updatedAt: now }
          : r
      )
    );
  };

  const handleRemove = async (id) => {
    if (!window.confirm("Remove candidate?")) return;
    await removeReferralFieldsById(id);
    setRows((p) => p.filter((r) => r._id !== id));
  };

  /* ================= TABLE ================= */
  const renderTable = (title, data, page, setPage, total) => (
    <section className="table-section">
      <h3>{title}</h3>
      <div className="table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th onClick={() => toggleSort("candidateName")}>
                Name {sortIcon("candidateName")}
              </th>
              <th onClick={() => toggleSort("job")}>
                Job {sortIcon("job")}
              </th>
              <th onClick={() => toggleSort("recruiter")}>
                CTV {sortIcon("recruiter")}
              </th>
              <th>Email</th>
              <th>CV</th>
              <th>Linkedln</th>
              <th>Portfolio</th>
              <th>Status</th>
              <th onClick={() => toggleSort("updatedAt")}>
                Time {sortIcon("updatedAt")}
              </th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.map((r) => (
              <tr key={r._id}>
                <td>{r.candidateName}</td>
                <td>{jobMap[r.job]?.title || "Unknown Job"}</td>
                <td>{recruiterMap[r.recruiter]?.email || r.recruiter || "Unknown User"}</td>
                <td>{r.candidateEmail || "-"}</td>
                <td>
                  <a href={r.cvUrl}>Link</a>
                </td>
                <td>
                  <a href={r.linkedin}>Link</a>
                </td>
                <td>
                  <a href={r.portfolio}>Link</a>
                </td>
                <td>
                  <select
                    value={localStatuses[r._id] || r.status}
                    onChange={(e) =>
                      handleStatusChange(r._id, e.target.value)
                    }
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  {new Date(
                    r.updatedAt || r.createdAt
                  ).toLocaleString("vi-VN")}
                </td>
                <td>
                  <button onClick={() => handleUpdate(r._id)}>Update</button>
                  <button onClick={() => handleRemove(r._id)}>Remove</button>
                </td>
              </tr>
            ))}
            {!data.length && (
              <tr>
                <td colSpan="7">No data</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="pagination">
        <button disabled={page === 1} onClick={() => setPage(page - 1)}>
          Prev
        </button>
        <span>
          Page {page} / {Math.ceil(total / PAGE_SIZE) || 1}
        </span>
        <button
          disabled={page >= Math.ceil(total / PAGE_SIZE)}
          onClick={() => setPage(page + 1)}
        >
          Next
        </button>
      </div>
    </section>
  );

  const handleExportExcel = () => {
  if (!rows.length) {
    alert("No data to export");
    return;
  }

  const exportData = rows.map((r) => ({
    "Candidate Name": r.candidateName || "",
    "Candidate Email": r.candidateEmail || "",
    "Candidate Phone": r.candidatePhone || "",
    "Job Title": jobMap[r.job]?.title || "",
    "Job Salary": jobMap[r.job]?.salary || "",
    "CTV Email":
      recruiterMap[r.recruiter]?.email || r.recruiter || "",
    Status: r.status,
    Bonus: r.bonus ?? "",
    "CV Link": r.cvUrl || "",
    "LinkedIn": r.linkedin || "",
    "Portfolio": r.portfolio || "",
    "Created At": r.createdAt
      ? new Date(r.createdAt).toLocaleString("vi-VN")
      : "",
    "Updated At": r.updatedAt
      ? new Date(r.updatedAt).toLocaleString("vi-VN")
      : "",
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      "Candidates"
    );

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    const blob = new Blob([excelBuffer], {
      type:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    saveAs(
      blob,
      `candidate-management-${new Date()
        .toISOString()
        .slice(0, 10)}.xlsx`
    );
  };

  /* ================= CHART DATA PREP ================= */
  // const statusCounts = useMemo(() => {
  //   const map = {};
  //   rows.forEach((r) => {
  //     const s = r.status || "other";
  //     map[s] = (map[s] || 0) + 1;
  //   });
  //   // ensure all known statuses present
  //   STATUS_OPTIONS.forEach((s) => {
  //     map[s] = map[s] || 0;
  //   });
  //   return map;
  // }, [rows]);

  // const overallChartData = useMemo(() => {
  //   return Object.keys(statusCounts).map((k) => ({ label: k, value: statusCounts[k] || 0, color: STATUS_COLORS[k] }));
  // }, [statusCounts]);

  // const focusChartData = useMemo(() => {
  //   const sub = statusCounts.submitted || 0;
  //   const off = statusCounts.offer || 0;
  //   const rest = Object.keys(statusCounts).reduce((s, k) => {
  //     if (k === "submitted" || k === "offer") return s;
  //     return s + (statusCounts[k] || 0);
  //   }, 0);
  //   return [
  //     { label: "submitted", value: sub, color: STATUS_COLORS.submitted },
  //     { label: "offer", value: off, color: STATUS_COLORS.offer },
  //     { label: "others", value: rest, color: STATUS_COLORS.other },
  //   ];
  // }, [statusCounts]);


  /* ================= RENDER ================= */
  return (
    <div className="candidate-page">
      <h2>Candidate Management</h2>
      

        <FilterUI
          filters={filters}
          onChange={(k, v) => setFilters((p) => ({ ...p, [k]: v }))}
        />
      <div style={{display:'flex',flexDirection:'column',gap:12,alignItems:'flex-end'}}>
          {/* <div className="charts-row">
            <PieChart data={overallChartData} size={180} thickness={40} />
            <PieChart data={focusChartData} size={180} thickness={44} />
          </div> */}

          <button
            onClick={handleExportExcel}
            style={{
              padding: "6px 12px",
              fontWeight: 600,
              cursor: "pointer",
              marginBottom: "1rem"
            }}
          >
            Export Excel
          </button>
        </div>

      {renderTable(
        "Active Candidates",
        activePaged,
        activePage,
        setActivePage,
        activeRows.length
      )}

      {renderTable(
        "Rejected Candidates",
        rejectedPaged,
        rejectedPage,
        setRejectedPage,
        rejectedRows.length
      )}
    </div>
  );
}
