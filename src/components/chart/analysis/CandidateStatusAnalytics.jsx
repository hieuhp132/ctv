import React, { useEffect, useMemo, useState } from "react";
import { listReferrals } from "../../../services/api.js";
import { useAuth } from "../../../context/AuthContext";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { Info, Users, CheckCircle2, RefreshCw } from "lucide-react";

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

/* ================= MAIN COMPONENT ================= */
export default function CandidateStatusCharts() {
  const { user } = useAuth();
  const adminId = user?._id;
  const email = user?.email || "";

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = () => {
    if (!adminId) return;
    setLoading(true);
    listReferrals({ id: adminId, email, isAdmin: true, limit: 1000 })
      .then((res = []) => setRows(Array.isArray(res) ? res : []))
      .catch((err) => console.error("Failed to list referrals", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
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
    Object.keys(statusCounts)
      .map((k) => ({
        name: k.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        value: statusCounts[k],
        color: STATUS_COLORS[k] || STATUS_COLORS.other,
      }))
      .filter((item) => item.value > 0), 
    [statusCounts]
  );

  const focusChartData = useMemo(() => {
    const submitted = statusCounts.submitted || 0;
    const hired = (statusCounts.hired || 0) + (statusCounts.onboard || 0);
    const total = Object.values(statusCounts).reduce((s, v) => s + v, 0);

    return [
      { name: "New Leads (Submitted)", value: submitted, color: STATUS_COLORS.submitted },
      { name: "Success (Hired/Onboard)", value: hired, color: STATUS_COLORS.hired },
      { name: "In Progress", value: total - submitted - hired, color: STATUS_COLORS.under_review },
    ].filter(item => item.value > 0);
  }, [statusCounts]);

  const totalCandidates = rows.length;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-16 bg-white/50 backdrop-blur-md rounded-3xl shadow-sm border border-gray-100 min-h-[400px]">
        <div className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mb-4"></div>
        <span className="text-gray-500 font-medium tracking-wide">Synthesizing Pipeline Data...</span>
      </div>
    );
  }

  if (!rows.length) {
    return (
      <div className="flex flex-col items-center justify-center p-16 bg-white rounded-3xl shadow-sm border border-gray-100 min-h-[400px] text-center">
        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6 text-gray-300">
          <Users className="w-10 h-10" />
        </div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">Awaiting Candidates</h3>
        <p className="text-gray-500 max-w-sm">Your pipeline is currently empty. Candidate data will automatically populate here once referrals start coming in.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 mb-8">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex items-center gap-4 transition-transform hover:-translate-y-1 duration-300">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Users className="w-7 h-7" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Total Candidates</p>
            <h4 className="text-3xl font-extrabold text-gray-900">{totalCandidates}</h4>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex items-center gap-4 transition-transform hover:-translate-y-1 duration-300">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Total Hires</p>
            <h4 className="text-3xl font-extrabold text-gray-900">
              {(statusCounts.hired || 0) + (statusCounts.onboard || 0)}
            </h4>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex items-center gap-4 transition-transform hover:-translate-y-1 duration-300">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <RefreshCw className="w-7 h-7" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">In Progress</p>
            <h4 className="text-3xl font-extrabold text-gray-900">
               {totalCandidates - (statusCounts.hired || 0) - (statusCounts.onboard || 0) - (statusCounts.rejected || 0)}
            </h4>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Overall Distribution */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 flex flex-col items-center relative overflow-hidden group">
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-indigo-500 to-violet-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          
          <div className="w-full flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-gray-800">Pipeline Distribution</h3>
            <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:text-indigo-600 cursor-help transition-colors">
              <Info className="w-4 h-4" />
            </div>
          </div>

          <div className="w-full h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={overallChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                  stroke="none"
                >
                  {overallChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value, name) => [value, name]}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                  itemStyle={{ fontWeight: 600 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="w-full mt-4 grid grid-cols-2 gap-3">
            {Object.keys(statusCounts).map((key) => {
              if (statusCounts[key] === 0) return null;
              return (
                <div key={key} className="flex items-center justify-between p-2.5 rounded-xl hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: STATUS_COLORS[key] || STATUS_COLORS.other }} />
                    <span className="text-xs font-semibold text-gray-600 capitalize">{key.replace(/_/g, ' ')}</span>
                  </div>
                  <span className="text-sm font-bold text-gray-900">{statusCounts[key]}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Conversion Focus Chart */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 flex flex-col items-center relative overflow-hidden group">
           <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-400 to-teal-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          
           <div className="w-full flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-gray-800">Conversion Focus</h3>
            <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:text-emerald-600 cursor-help transition-colors">
              <Info className="w-4 h-4" />
            </div>
          </div>

          <div className="w-full h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={focusChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={100}
                  paddingAngle={4}
                  dataKey="value"
                  stroke="none"
                >
                  {focusChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value) => [`${value} Candidates`, '']}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                  itemStyle={{ fontWeight: 600 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="w-full mt-4 flex justify-around">
            {focusChartData.map((item, idx) => (
              <div key={idx} className="flex flex-col items-center text-center px-2">
                <span className="w-3 h-3 rounded-full mb-2" style={{ backgroundColor: item.color }} />
                <span className="text-2xl font-black text-gray-900 leading-none mb-1">{item.value}</span>
                <span className="text-xs font-semibold text-gray-500">{item.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}