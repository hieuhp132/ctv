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

/* ===== CHART ===== */
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
    <input placeholder="Candidate" value={filters.candidateName}
      onChange={(e) => onChange("candidateName", e.target.value)} />
    <input placeholder="Job" value={filters.job}
      onChange={(e) => onChange("job", e.target.value)} />
    <input placeholder="CTV" value={filters.recruiter}
      onChange={(e) => onChange("recruiter", e.target.value)} />
    <input placeholder="Email" value={filters.candidateEmail}
      onChange={(e) => onChange("candidateEmail", e.target.value)} />
    <select value={filters.status}
      onChange={(e) => onChange("status", e.target.value)}>
      <option value="">All Status</option>
      {STATUS_OPTIONS.map((s) => (
        <option key={s} value={s}>{s}</option>
      ))}
    </select>
  </div>
));

/* ================= PIE ================= */
const StatusPieChart = ({ title, data }) => (
  <div style={{ width: "100%", height: 300 }}>
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

    listReferrals({ id: adminId, email, isAdmin: true, limit: 1000 })
      .then(async (res = []) => {
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

        jobIds.forEach(async (id) => {
          if (!jobMap[id]) {
            const j = await getJobByIdL(id);
            setJobMap((p) => ({ ...p, [id]: j?.job }));
          }
        });

        recruiterIds.forEach(async (id) => {
          if (!recruiterMap[id]) {
            const u = await fetchProfileFromServerL(id);
            setRecruiterMap((p) => ({ ...p, [id]: u }));
          }
        });
      });
  }, [adminId, email]);

  /* ================= EXPORT (FIXED POSITION) ================= */
  const handleExportExcel = () => {
    if (!rows.length) return alert("No data to export");

    const exportData = rows.map((r) => ({
      "Candidate Name": r.candidateName || "",
      "Candidate Email": r.candidateEmail || "",
      "Candidate Phone": r.candidatePhone || "",
      "Job Title": jobMap[r.job]?.title || "",
      "Job Salary": jobMap[r.job]?.salary || "",
      "CTV Email": recruiterMap[r.recruiter]?.email || "",
      Status: r.status,
      Bonus: r.bonus ?? "",
      "CV Link": r.cvUrl || "",
      LinkedIn: r.linkedin || "",
      Portfolio: r.portfolio || "",
      "Created At": r.createdAt
        ? new Date(r.createdAt).toLocaleString("vi-VN")
        : "",
      "Updated At": r.updatedAt
        ? new Date(r.updatedAt).toLocaleString("vi-VN")
        : "",
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Candidates");

    const buffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(
      new Blob([buffer]),
      `candidate-management-${new Date().toISOString().slice(0, 10)}.xlsx`
    );
  };

  /* ================= CHART DATA ================= */
  const allStatusChartData = useMemo(() => {
    const total = rows.length || 1;
    const count = {};
    rows.forEach((r) => (count[r.status] = (count[r.status] || 0) + 1));
    return STATUS_OPTIONS.map((s) => ({
      name: s,
      value: Math.round(((count[s] || 0) / total) * 100),
    })).filter((d) => d.value > 0);
  }, [rows]);

  const focusStatusChartData = useMemo(() => {
    const total = rows.length || 1;
    const focus = ["submitted", "offer"];
    const count = {};
    rows.forEach((r) => {
      if (focus.includes(r.status))
        count[r.status] = (count[r.status] || 0) + 1;
    });
    return focus.map((s) => ({
      name: s,
      value: Math.round(((count[s] || 0) / total) * 100),
    }));
  }, [rows]);

  /* ================= RENDER ================= */
  return (
    <div className="candidate-page">
      <h2>Candidate Management</h2>

      {/* ===== CHART ===== */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        <StatusPieChart title="All Status (%)" data={allStatusChartData} />
        <StatusPieChart title="Submitted vs Offer (%)" data={focusStatusChartData} />
      </div>

      <div className="head">
        <FilterUI
          filters={filters}
          onChange={(k, v) => setFilters((p) => ({ ...p, [k]: v }))}
        />
        <button onClick={handleExportExcel}>Export Excel</button>
      </div>

      {/* ===== TABLES GIỮ NGUYÊN ===== */}
      {/* Active + Rejected tables của bạn giữ nguyên */}
    </div>
  );
}
