import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";

import { AuthProvider, useAuth } from "./context/AuthContext";
import { ROLE_ROUTES } from "./routes/roleRoutes";

import Layout from "./components/Layout";
// import Home from "./pages/home/Home";
import Pending from "./pages/pending/Pending";
import Login from "./pages/login/Login";
import SignUp from "./pages/signup/SignUp";
// ADMIN
import AdJobsList from "./pages/admin/jobs/All";
import AdJobDetail from "./pages/admin/jobs/Detail";
import AdSavedJobs from "./pages/admin/jobs/Saved";
import AdProfile from "./pages/admin/profile/Profile";
import AdMyBrand from "./pages/admin/mybrand/MyBrand";
import AdCandidates from "./pages/admin/candidates_tracker/Candidates";
import AdStatistics from "./pages/admin/statistics/Statistics";
import AdUsersManagement from "./pages/admin/users/UsersManagement";
import AdNotification from "./pages/admin/notifications/Notification";

// RECRUITER
import RecrProfile from "./pages/recruiter/profile/Profile";
import RecrJobsList from "./pages/recruiter/jobs/All";
import RecrJobDetail from "./pages/recruiter/jobs/Detail";
import RecrSavedJobs from "./pages/recruiter/jobs/Saved";
import RecrCandidates from "./pages/recruiter/candidates_tracker/Candidates";
import RecrNotification from "./pages/recruiter/notifications/Notification";
import Update from "./pages/update/Update";
import TermsPage from "./pages/terms/Terms";

function PrivateRoute({ roles }) {
  const { user, authReady } = useAuth();

  if (!authReady) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.status !== "Active") return <Navigate to="/pending" replace />;
  if (roles && !roles.includes(user.role))
    return <Navigate to="/" replace />;

  return <Outlet />;
}

function RedirectToHome() {
  window.location.href = "/index.html";
  return null;
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

function AppRoutes() {
  const { authReady } = useAuth();
  if (!authReady) return null;

  return (
    <Routes>
      <Route element={<Layout />}>
        {/* PUBLIC */}
        <Route path="/" element={
          // <Home />
          <RedirectToHome />
        } />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/pending" element={<Pending />} />
        <Route path="/update" element={<Update />} />
        <Route path="/terms" element={<TermsPage />} />

        {/* ADMIN */}
        <Route element={<PrivateRoute roles={["admin"]} />}>
          <Route path={ROLE_ROUTES.admin.profile} element={<AdProfile />} />
          <Route path={ROLE_ROUTES.admin.jobs} element={<AdJobsList />} />
          <Route path={ROLE_ROUTES.admin.jobDetail} element={<AdJobDetail />} />
          <Route path={ROLE_ROUTES.admin.savedJobs} element={<AdSavedJobs />} />
          <Route path={ROLE_ROUTES.admin.myBrand} element={<AdMyBrand />} />
          <Route path={ROLE_ROUTES.admin.statistics} element={<AdStatistics />} />
          <Route path={ROLE_ROUTES.admin.candidates} element={<AdCandidates />} />
          <Route path={ROLE_ROUTES.admin.users} element={<AdUsersManagement />} />
          <Route path={ROLE_ROUTES.admin.notification} element={<AdNotification />} />
        </Route>

        {/* RECRUITER */}
        <Route element={<PrivateRoute roles={["recruiter"]} />}>
          <Route
            path={ROLE_ROUTES.recruiter.profile}
            element={<RecrProfile />}
          />
          <Route
            path={ROLE_ROUTES.recruiter.jobs}
            element={<RecrJobsList />}
          />
          <Route
            path={ROLE_ROUTES.recruiter.jobDetail}
            element={<RecrJobDetail />}
          />
          <Route
            path={ROLE_ROUTES.recruiter.savedJobs}
            element={<RecrSavedJobs />}
          />
          <Route
            path={ROLE_ROUTES.recruiter.candidates}
            element={<RecrCandidates />}
          />
          <Route path={ROLE_ROUTES.recruiter.notification} element={<RecrNotification />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
