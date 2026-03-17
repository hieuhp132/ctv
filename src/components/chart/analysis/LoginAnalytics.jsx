import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';
import { API_BASE } from '../../../services/api';
import { Clock, Users, Calendar, Activity, RefreshCw } from "lucide-react";

const COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b',
  '#3b82f6', '#14b8a6', '#f43f5e', '#84cc16', '#06b6d4'
];

const LoginAnalytics = () => {
  const [summary, setSummary] = useState(null);
  const [userStats, setUserStats] = useState([]);
  const [dateStats, setDateStats] = useState({});
  const [peakTimes, setPeakTimes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('summary');
  const [error, setError] = useState(null);

  /* ---------------- FETCH ---------------- */

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [summaryRes, usersRes, dateRes, peakRes] = await Promise.all([
        fetch(`${API_BASE}/analytics/login/summary`),
        fetch(`${API_BASE}/analytics/login/users`),
        fetch(`${API_BASE}/analytics/login/by-date`),
        fetch(`${API_BASE}/analytics/login/peak-times`)
      ]);

      if (!summaryRes.ok) throw new Error('Failed to fetch summary');

      const summaryData = await summaryRes.json();
      setSummary(summaryData.data || null);

      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUserStats(usersData?.data?.users || []);
      }

      if (dateRes.ok) {
        const dateData = await dateRes.json();
        setDateStats(dateData?.data || {});
      }

      if (peakRes.ok) {
        const peakData = await peakRes.json();
        setPeakTimes(peakData?.data?.peakLoginTimes || []);
      }
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  /* ---------------- MEMOIZED ANALYTICS ---------------- */

  const peakAnalytics = useMemo(() => {
    if (!peakTimes.length) {
      return {
        total: 0,
        average: '0.0',
        peakHour: 'N/A',
        lowestHour: 'N/A',
        max: 0,
        min: 0
      };
    }

    const total = peakTimes.reduce((sum, t) => sum + t.count, 0);

    const peak = peakTimes.reduce((a, b) => (b.count > a.count ? b : a));
    const lowest = peakTimes.reduce((a, b) => (b.count < a.count ? b : a));

    return {
      total,
      average: (total / peakTimes.length).toFixed(1),
      peakHour: peak.hour,
      lowestHour: lowest.hour,
      max: peak.count,
      min: lowest.count
    };
  }, [peakTimes]);

  const sortedTopPeakTimes = useMemo(() => {
    return [...peakTimes].sort((a, b) => b.count - a.count).slice(0, 10);
  }, [peakTimes]);

  const dateStatsArray = useMemo(() => {
    return Object.values(dateStats).reverse();
  }, [dateStats]);

  /* ---------------- RENDER ---------------- */

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-16 bg-white/50 backdrop-blur-md rounded-3xl shadow-sm border border-gray-100 min-h-[400px]">
        <div className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mb-4"></div>
        <span className="text-gray-500 font-medium tracking-wide">Loading System Analytics...</span>
      </div>
    );
  }

  const TABS = [
    { id: 'summary', icon: <Activity className="w-4 h-4" />, label: 'Overview' },
    { id: 'users', icon: <Users className="w-4 h-4" />, label: 'Users' },
    { id: 'dates', icon: <Calendar className="w-4 h-4" />, label: 'By Date' },
    { id: 'peak', icon: <Clock className="w-4 h-4" />, label: 'Peak Hours' },
  ];

  return (
    <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 relative">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">System Login Analytics</h2>
          <p className="text-gray-500 text-sm mt-1">Detailed breakdown of platform access patterns.</p>
        </div>
        <button 
          onClick={fetchAllData} 
          className="flex items-center gap-2 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl font-medium transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-600 border border-red-100 rounded-2xl flex items-center">
           <span className="font-semibold">{error}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex space-x-2 mb-8 p-1 bg-gray-50/80 rounded-2xl overflow-x-auto">
        {TABS.map(tab => (
          <button
            key={tab.id}
            className={`flex items-center gap-2 flex-1 md:flex-none justify-center px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${
              activeTab === tab.id 
                ? 'bg-white text-indigo-600 shadow-sm border border-gray-100' 
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100/50'
            }`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      <div className="min-h-[400px]">

        {/* SUMMARY */}
        {activeTab === 'summary' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <StatCard label="Peak Hour" value={peakAnalytics.peakHour} sub={`${peakAnalytics.max} logins`} icon={<Activity />} color="text-rose-500" bg="bg-rose-50" />
              <StatCard label="Avg / Hour" value={peakAnalytics.average} sub="Across all hours" icon={<Clock />} color="text-amber-500" bg="bg-amber-50" />
              <StatCard label="Lowest Hour" value={peakAnalytics.lowestHour} sub={`${peakAnalytics.min} logins`} icon={<Activity />} color="text-teal-500" bg="bg-teal-50" />
              <StatCard label="Total Logins" value={peakAnalytics.total} sub="24-hour total" icon={<Users />} color="text-indigo-500" bg="bg-indigo-50" />
            </div>

            <div className="bg-gray-50/50 rounded-3xl p-6 border border-gray-100">
              <h3 className="text-lg font-bold text-gray-800 mb-6">Login Volume (24h)</h3>
              {peakTimes.length > 0 ? (
                <div className="h-[320px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={peakTimes}>
                      <defs>
                        <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{fill: '#64748b'}} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b'}} dx={-10} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                        itemStyle={{ fontWeight: 600, color: '#6366f1' }}
                      />
                      <Area type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <EmptyState message="No login data available yet" />
              )}
            </div>
          </div>
        )}

        {/* USERS */}
        {activeTab === 'users' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-gray-50/50 rounded-3xl p-6 border border-gray-100">
              <h3 className="text-lg font-bold text-gray-800 mb-6">Top Users Activity</h3>
              {userStats.length ? (
                <div className="h-[400px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={userStats.slice(0, 10)} maxBarSize={40}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="email" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b'}} dx={-10} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                        cursor={{fill: '#f1f5f9'}}
                      />
                      <Bar dataKey="count" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <EmptyState message="No user data available yet" />
              )}
            </div>
          </div>
        )}

        {/* DATES */}
        {activeTab === 'dates' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-gray-50/50 rounded-3xl p-6 border border-gray-100">
               <h3 className="text-lg font-bold text-gray-800 mb-6">Historical Login Trends</h3>
              {dateStatsArray.length ? (
                <div className="h-[400px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={dateStatsArray.slice(0, 30)}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#64748b'}} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b'}} dx={-10} />
                      <Tooltip 
                         contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                      />
                      <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                      <Line type="monotone" name="Total Logins" dataKey="totalLogins" stroke="#10b981" strokeWidth={3} dot={{r:4, strokeWidth:2}} activeDot={{r: 6}} />
                      <Line type="monotone" name="Unique Users" dataKey="uniqueUserCount" stroke="#ec4899" strokeWidth={3} dot={{r:4, strokeWidth:2}} activeDot={{r: 6}} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <EmptyState message="No daily data available yet" />
              )}
            </div>
          </div>
        )}

        {/* PEAK */}
        {activeTab === 'peak' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <div className="bg-gray-50/50 rounded-3xl p-6 border border-gray-100 overflow-hidden relative">
                 <h3 className="text-lg font-bold text-gray-800 mb-6">Peak Analytics</h3>
                  {peakTimes.length ? (
                    <div className="h-[300px] w-full">
                       <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={peakTimes} dataKey="count" nameKey="hour" innerRadius={70} outerRadius={110} paddingAngle={2} stroke="none">
                            {peakTimes.map((_, i) => (
                              <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip 
                            formatter={(value, name) => [`${value} logins`, `Hour ${name}`]}
                            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  ) : <EmptyState message="No pie data" />}
              </div>

              <div className="bg-gray-50/50 rounded-3xl p-6 border border-gray-100">
                 <h3 className="text-lg font-bold text-gray-800 mb-4">Top Hours Ranking</h3>
                 {peakTimes.length ? (
                    <div className="overflow-x-auto custom-scrollbar max-h-[300px] rounded-xl border border-gray-100 bg-white">
                      <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-500 uppercase bg-gray-50 sticky top-0 z-10">
                          <tr>
                            <th className="px-6 py-4 font-bold border-b border-gray-100">Rank</th>
                            <th className="px-6 py-4 font-bold border-b border-gray-100">Hour</th>
                            <th className="px-6 py-4 font-bold border-b border-gray-100 text-right">Logins</th>
                            <th className="px-6 py-4 font-bold border-b border-gray-100 text-right">%</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sortedTopPeakTimes.map((t, i) => (
                            <tr key={i} className="hover:bg-gray-50/50 border-b border-gray-50 last:border-0 transition-colors">
                              <td className="px-6 py-4 font-semibold text-gray-500">#{i + 1}</td>
                              <td className="px-6 py-4 font-bold text-gray-900">{t.hour}</td>
                              <td className="px-6 py-4 font-bold text-indigo-600 text-right">{t.count}</td>
                              <td className="px-6 py-4 font-semibold text-gray-500 text-right">
                                {peakAnalytics.total
                                  ? ((t.count / peakAnalytics.total) * 100).toFixed(1)
                                  : '0.0'}%
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                 ) : <EmptyState message="No table data" />}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/* ---------------- SMALL COMPONENTS ---------------- */

const StatCard = ({ label, value, sub, icon, color, bg }) => (
  <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
    <div className="flex justify-between items-start mb-4">
      <div className={`w-10 h-10 rounded-xl ${bg} ${color} flex items-center justify-center`}>
        {icon}
      </div>
    </div>
    <div>
      <h4 className="text-2xl font-black text-gray-900 mb-1">{value}</h4>
      <p className="text-sm font-bold text-gray-700">{label}</p>
      <p className="text-xs font-semibold text-gray-400 mt-1">{sub}</p>
    </div>
  </div>
);

const EmptyState = ({ message }) => (
  <div className="flex flex-col items-center justify-center h-full p-12 text-center">
    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-gray-400">
      <Activity className="w-8 h-8 opacity-50" />
    </div>
    <p className="text-gray-500 font-medium">{message}</p>
  </div>
);

export default LoginAnalytics;

