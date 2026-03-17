
import LoginAnalytics from "../../../components/chart/analysis/LoginAnalytics.jsx";
import CandidateStatusCharts from "../../../components/chart/analysis/CandidateStatusAnalytics.jsx";
import "./Statistics.css"; // Đảm bảo import file CSS bên dưới



export default function Statistics() {
  return (
    <div className="min-h-screen bg-gray-50/50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="mb-10 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-50 to-violet-50 blur-3xl -z-10 rounded-full opacity-60"></div>
          <h2 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-3">Insights Dashboard</h2>
          <p className="text-gray-500 text-lg max-w-2xl">Real-time performance metrics and deep analytics for your recruitment and platform activity pipeline.</p>
        </header>

        <div className="space-y-12">
          <CandidateStatusCharts />
          <LoginAnalytics />
        </div>
      </div>
    </div>
  );
}