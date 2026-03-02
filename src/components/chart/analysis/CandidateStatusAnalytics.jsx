
import React, { useEffect, useMemo, useState } from "react";
import { listReferrals } from "../../../services/api.js";
import { useAuth } from "../../../context/AuthContext";
/* ================= CONSTANTS ================= */
export const STATUS_COLORS = {
  submitted: "#6366f1",    // Indigo
  under_review: "#8b5cf6", // Violet
  interviewing: "#ec4899", // Pink
  offer: "#10b981",        // Emerald
  hired: "#059669",        // Green
  onboard: "#3b82f6",      // Blue
  rejected: "#f43f5e",     // Rose
  other: "#94a3b8",        // Slate
};

const STATUS_OPTIONS = [
  "submitted",
  "under_review",
  "interviewing",
  "offer",
  "hired",
  "onboard",
  "rejected",
];

/* ================= SVG HELPERS ================= */
function polarToCartesian(cx, cy, r, angleDeg) {
  const angleRad = ((angleDeg - 90) * Math.PI) / 180;
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

  return [
    `M ${startOuter.x} ${startOuter.y}`,
    `A ${rOuter} ${rOuter} 0 ${largeArcFlag} 0 ${endOuter.x} ${endOuter.y}`,
    `L ${endInner.x} ${endInner.y}`,
    `A ${rInner} ${rInner} 0 ${largeArcFlag} 1 ${startInner.x} ${startInner.y}`,
    "Z",
  ].join(" ");
}

/* ================= PIE CHART COMPONENT ================= */
function PieChart({ title, data, size = 200, thickness = 45 }) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  let angle = 0;

  const cx = size / 2;
  const cy = size / 2;
  const rOuter = size / 2 - 10;
  const rInner = rOuter - thickness;

  return (
    <div className="chart-card">
      <h3 className="chart-title">{title}</h3>
      <div className="chart-container">
        <svg width={size} height={size} className="pie-svg">
          {data.map((d, i) => {
            if (d.value === 0) return null;
            const start = angle;
            const sweep = (d.value / total) * 360;
            const end = start + sweep;
            angle = end;

            return (
              <path
                key={i}
                d={describeArcSector(cx, cy, rOuter, rInner, start, end)}
                fill={d.color}
                className="chart-path"
              />
            );
          })}
          <circle cx={cx} cy={cy} r={rInner - 4} fill="#fff" />
          <text x={cx} y={cy} className="chart-center-text">
            <tspan x={cx} dy="-0.2em" className="total-num">{total}</tspan>
            <tspan x={cx} dy="1.4em" className="total-label">CANDIDATES</tspan>
          </text>
        </svg>
      </div>

      <div className="legend">
        {data.map((d, i) => (
          <div key={i} className="legend-item" style={{ opacity: d.value === 0 ? 0.5 : 1 }}>
            <span className="legend-color" style={{ background: d.color }} />
            <span className="legend-label">{d.label.replace('_', ' ')}</span>
            <span className="legend-value">
              {d.value} <small>({Math.round((d.value / total) * 100)}%)</small>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ================= MAIN COMPONENT ================= */
export default function CandidateStatusCharts() {
  const { user } = useAuth();
  const adminId = user?._id;
  const email = user?.email || "";

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!adminId) return;
    setLoading(true);
    listReferrals({ id: adminId, email, isAdmin: true, limit: 1000 })
      .then((res = []) => setRows(Array.isArray(res) ? res : []))
      .finally(() => setLoading(false));
  }, [adminId, email]);

  const statusCounts = useMemo(() => {
    const map = {};
    rows.forEach((r) => {
      const s = r?.status || "other";
      map[s] = (map[s] || 0) + 1;
    });
    STATUS_OPTIONS.forEach((s) => { map[s] = map[s] || 0; });
    return map;
  }, [rows]);

  const overallChartData = useMemo(() => 
    Object.keys(statusCounts).map((k) => ({
      label: k,
      value: statusCounts[k],
      color: STATUS_COLORS[k] || STATUS_COLORS.other,
    })), [statusCounts]
  );

  const focusChartData = useMemo(() => {
    const submitted = statusCounts.submitted || 0;
    const hired = (statusCounts.hired || 0) + (statusCounts.onboard || 0);
    const total = Object.values(statusCounts).reduce((s, v) => s + v, 0);

    return [
      { label: "New Leads (Submitted)", value: submitted, color: STATUS_COLORS.submitted },
      { label: "Success (Hired)", value: hired, color: STATUS_COLORS.hired },
      { label: "In Progress(Totals)", value: total - submitted - hired, color: STATUS_COLORS.other },
    ];
  }, [statusCounts]);

  if (loading) return <div className="loading-state">Generating Insights...</div>;
  if (!rows.length) return <div className="empty-state">No candidate data found.</div>;

  return (
    <div className="charts-grid">
      <PieChart title="Overall Status Distribution" data={overallChartData} />
      <PieChart title="Conversion Pipeline" data={focusChartData} thickness={50} />
    </div>
  );
}