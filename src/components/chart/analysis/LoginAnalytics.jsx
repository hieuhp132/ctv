import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';
import './LoginAnalytics.css';
import { API_BASE } from '../../../services/api';

const COLORS = [
  '#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6',
  '#1abc9c', '#e67e22', '#34495e', '#c0392b', '#16a085',
  '#d35400', '#8e44ad', '#27ae60', '#2980b9', '#16a085',
  '#c0392b', '#d35400', '#e74c3c', '#3498db', '#2ecc71',
  '#f39c12', '#9b59b6', '#1abc9c', '#e67e22'
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
      <div className="analytics-container">
        <div className="loader">Loading analytics data...</div>
      </div>
    );
  }

  return (
    <div className="analytics-container">
      <h1>📊 System Login Analytics</h1>
      {error && <div className="error-message">{error}</div>}

      {/* Tabs */}
      <div className="tabs">
        {['summary', 'users', 'dates', 'peak'].map(tab => (
          <button
            key={tab}
            className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'summary' && 'Overview'}
            {tab === 'users' && 'Users'}
            {tab === 'dates' && 'By Date'}
            {tab === 'peak' && 'Peak Hours'}
          </button>
        ))}
      </div>

      <div className="tab-content">

        {/* SUMMARY */}
        {activeTab === 'summary' && (
          <div className="section">
            <h2>📊 System Overview</h2>

            <div className="stats-grid">
              <Stat label="🔴 Peak Hour" value={peakAnalytics.peakHour} sub={`${peakAnalytics.max} logins`} />
              <Stat label="🟡 Avg / Hour" value={peakAnalytics.average} sub="Across all hours" />
              <Stat label="🟢 Lowest Hour" value={peakAnalytics.lowestHour} sub={`${peakAnalytics.min} logins`} />
              <Stat label="📊 Total Logins" value={peakAnalytics.total} sub="24-hour total" />
            </div>

            {peakTimes.length > 0 ? (
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={peakTimes}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="count" stroke="#3498db" fill="#3498db" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <Empty message="📭 No login data available yet" />
            )}
          </div>
        )}

        {/* USERS */}
        {activeTab === 'users' && (
          <div className="section">
            <h2>👥 User Login Statistics</h2>
            {userStats.length ? (
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={userStats.slice(0, 10)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="email" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3498db" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Empty message="📭 No user data available yet" />
            )}
          </div>
        )}

        {/* DATES */}
        {activeTab === 'dates' && (
          <div className="section">
            <h2>📅 Daily Login Statistics</h2>
            {dateStatsArray.length ? (
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={dateStatsArray.slice(0, 30)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line dataKey="totalLogins" stroke="#27ae60" />
                  <Line dataKey="uniqueUserCount" stroke="#e74c3c" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <Empty message="📭 No daily data available yet" />
            )}
          </div>
        )}

        {/* PEAK */}
        {activeTab === 'peak' && (
          <div className="section">
            <h2>🔥 Peak Login Hours</h2>
            {peakTimes.length ? (
              <>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={peakTimes}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#e74c3c" />
                  </BarChart>
                </ResponsiveContainer>

                <ResponsiveContainer width="100%" height={400}>
                  <PieChart>
                    <Pie data={peakTimes} dataKey="count" outerRadius={120} label>
                      {peakTimes.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>

                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Rank</th>
                      <th>Hour</th>
                      <th>Count</th>
                      <th>%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedTopPeakTimes.map((t, i) => (
                      <tr key={i}>
                        <td>#{i + 1}</td>
                        <td>{t.hour}</td>
                        <td>{t.count}</td>
                        <td>
                          {peakAnalytics.total
                            ? ((t.count / peakAnalytics.total) * 100).toFixed(1)
                            : '0.0'}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            ) : (
              <Empty message="📭 No peak time data available yet" />
            )}
          </div>
        )}
      </div>

      <div className="refresh-button">
        <button onClick={fetchAllData} className="btn-refresh">🔄 Refresh Data</button>
      </div>
    </div>
  );
};

/* ---------------- SMALL COMPONENTS ---------------- */

const Stat = ({ label, value, sub }) => (
  <div className="stat-detail-box">
    <div className="stat-detail-label">{label}</div>
    <div className="stat-detail-value">{value}</div>
    <div className="stat-detail-sub">{sub}</div>
  </div>
);

const Empty = ({ message }) => (
  <div className="empty-state-box">
    <p>{message}</p>
  </div>
);

export default LoginAnalytics;
