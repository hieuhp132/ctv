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

/* ===== ADD CHART ===== */
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

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

const STATUS_COLORS = {
  submitted: "#4f46e5",
  under_review: "#0ea5e9",
  interviewing: "#6366f1",
  offer: "#16a34a",
  hired: "#22c55e",
  onboard: "#84cc16",
  rejected: "#ef4444",
};

const PAGE_SIZE = 10;

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

/* ===== ADD CHART COMPONENT ===== */
const StatusPieChart = ({ title, data }) => (
  <div style={{ width: "100%", height: 280 }}>
    <h3 style={{ textAlign: "center", marginBottom: 8 }}>{title}</h3>
    <ResponsiveContainer>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          outerRadius={90}
          label={({ name, value }) => `${name}: ${value}%`}
        >
          {data.map((d) => (
            <Cell key={d.name} fill={STATUS_COLORS[d.name]} />
          ))}
        </Pie>
        <Tooltip formatter={(v) => `${v}%`} />
      </PieChart>
    </ResponsiveContainer>
  </div>
);

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

  /* ================= SORT ================= */
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

  /* ===== ADD CHART DATA ===== */
  const allStatusChartData = useMemo(() => {
    const total = rows.length || 1;
    const c = rows.reduce((a, r) => {
      a[r.status] = (a[r.status] || 0) + 1;
      return a;
    }, {});
    return STATUS_OPTIONS.map((s) => ({
      name: s,
      value: Math.round(((c[s] || 0) / total) * 100),
    })).filter((d) => d.value > 0);
  }, [rows]);

  const focusStatusChartData = useMemo(() => {
    const total = rows.length || 1;
    const focus = ["submitted", "offer"];
    const c = rows.reduce((a, r) => {
      if (focus.includes(r.status))
        a[r.status] = (a[r.status] || 0) + 1;
      return a;
    }, {});
    return focus.map((s) => ({
      name: s,
      value: Math.round(((c[s] || 0) / total) * 100),
    }));
  }, [rows]);

  /* ================= RENDER ================= */
  return (
    <div className="candidate-page">
      <h2>Candidate Management</h2>

      {/* ===== ADD CHART UI ===== */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 24,
          marginBottom: 24,
        }}
      >
        <StatusPieChart
          title="All Candidate Status (%)"
          data={allStatusChartData}
        />
        <StatusPieChart
          title="Focus: Submitted vs Offer (%)"
          data={focusStatusChartData}
        />
      </div>

      <div className="head">
        <FilterUI
          filters={filters}
          onChange={(k, v) => setFilters((p) => ({ ...p, [k]: v }))}
        />

        <button
          onClick={handleExportExcel}
          style={{
            padding: "6px 12px",
            fontWeight: 600,
            cursor: "pointer",
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
