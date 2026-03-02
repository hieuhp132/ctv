
import LoginAnalytics from "../../../components/chart/analysis/LoginAnalytics.jsx";
import CandidateStatusCharts from "../../../components/chart/analysis/CandidateStatusAnalytics.jsx";
import "./Statistics.css"; // Đảm bảo import file CSS bên dưới



export default function Statistics() {
  return (
    <div className="admin-page">
      <header className="stats-header">
        <h2>Candidate Submittions Overviews</h2>
        <p>Real-time overview of your referral pipeline performance.</p>
      </header>
      <CandidateStatusCharts />
      <LoginAnalytics />
    </div>
  );
}