import CandidateManagement from "./components/Admin/CandidateManagement";
import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Login from "./components/login/Login";
import Dashboard from "./components/Dashboard";
import AdminDashboard from "./components/Admin/Dashboard";
import AdminDashboardBeta from "./components/Admin/AdminDashboard";
import SignUp from "./components/signup/SignUp";
import Navbar from "./components/Navbar";
import ViewProfile from "./components/Profile/ViewProfile";
import MyBrand from "./components/Profile/MyBrand";
import MyCandidates from "./components/Profile/MyCandidates";
import SavedJobs from "./components/Profile/SavedJobs";
import JobDetail from "./components/JobDetail";
import HomePage from "./components/HomePage";
import TermsPage from "./components/TermsPage";
import AdminSavedJobs from "./components/Admin/SavedJobs";
import UsersManagement from "./components/Admin/UsersManagement";
import AuthCallback from "./components/auth/AuthPage";
import Updated from "./components/Updated";

/* ================= PRIVATE ROUTE ================= */
function PrivateRoute({ children, roles }) {
  const { user, authReady } = useAuth();

  if (!authReady) return null;
  if (!user) return <Navigate to="/login" replace />;

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

/* ================= ROOT HANDLER ================= */
function RootPage() {
  const { user, authReady } = useAuth();

  if (!authReady) return null;

  // Đã login → redirect dashboard tương ứng
  if (user) {
    return <Navigate to={user.role === "admin" ? "/admin" : "/dashboard"} replace />;
  }

  // Chưa login → HomePage (SEO)
  // return <HomePage />;
  return <Updated />;
}

/* ================= MAIN APP ================= */
export default function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>

          {/* ✅ ROOT = HOME PAGE */}
          <Route path="/" element={<RootPage />} />

          <Route path="/login" element={<><Navbar /><Login /></>} />
          <Route path="/signup" element={<><Navbar /><SignUp /></>} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/auth/callback" element={<AuthCallback />} />

          {/* ---------------- PRIVATE ROUTES ---------------- */}
          <Route
            path="/dashboard"
            element={
              <PrivateRoute roles={["recruiter", "authenticated"]}>
                <Navbar />
                <Dashboard />
              </PrivateRoute>
            }
          />

          <Route
            path="/admin"
            element={
              <PrivateRoute roles={["admin"]}>
                <Navbar />
                <AdminDashboard />
              </PrivateRoute>
            }
          />

          <Route
            path="/admin-dashboard"
            element={
              <PrivateRoute roles={["admin"]}>
                <Navbar />
                <AdminDashboardBeta />
              </PrivateRoute>
            }
          />

          <Route
            path="/user-management"
            element={
              <PrivateRoute roles={["admin"]}>
                <Navbar />
                <UsersManagement />
              </PrivateRoute>
            }
          />

          <Route
            path="/candidate-management"
            element={
              <PrivateRoute roles={["admin"]}>
                <Navbar />
                <CandidateManagement />
              </PrivateRoute>
            }
          />

          <Route
            path="/job/:id"
            element={
              <PrivateRoute>
                <Navbar />
                <JobDetail />
              </PrivateRoute>
            }
          />

          <Route
            path="/profile"
            element={
              <PrivateRoute>
                <Navbar />
                <ViewProfile />
              </PrivateRoute>
            }
          />

          <Route
            path="/my-brand"
            element={
              <PrivateRoute>
                <Navbar />
                <MyBrand />
              </PrivateRoute>
            }
          />

          <Route
            path="/my-candidates"
            element={
              <PrivateRoute>
                <Navbar />
                <MyCandidates />
              </PrivateRoute>
            }
          />

          <Route
            path="/saved-jobs"
            element={
              <PrivateRoute roles={["recruiter"]}>
                <Navbar />
                <SavedJobs />
              </PrivateRoute>
            }
          />

          <Route
            path="/admin/saved-jobs"
            element={
              <PrivateRoute roles={["admin"]}>
                <Navbar />
                <AdminSavedJobs />
              </PrivateRoute>
            }
          />

          {/* 404 */}
          <Route path="*" element={<Navigate to="/" replace />} />

        </Routes>
      </AuthProvider>
    </Router>
  );
}
