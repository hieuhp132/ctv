const adminRoutes = {
  profile: "/admin/profile",
  jobs: "/admin/jobs",
  jobDetail: "/admin/job/:id",
  statistics: "/admin/statistics",
  candidates: "/admin/candidates",
  savedJobs: "/admin/saved-jobs",
  myBrand: "/admin/my-brand",
  users: "/admin/users",
  notification: "/admin/notifications",
};

export const ROLE_ROUTES = {
  admin: adminRoutes,
  lower_admin: adminRoutes,

  recruiter_freelancer: {
    dashboard: "/recruiter/dashboard",
    profile: "/recruiter/profile",
    jobs: "/recruiter/jobs",
    jobDetail: "/recruiter/job/:id",
    savedJobs: "/recruiter/saved-jobs",
    candidates: "/recruiter/candidates",
    notification: "/recruiter/notifications",
  },
  recruiter_fulltime: {
    dashboard: "/employee",
    jobs: "/employee",
    candidates: "/employee",
  },
};

export function getRoleLabel(role) {
  const labels = {
    admin: "Admin",
    lower_admin: "Lower admin",
    candidate: "Candidate",
    recruiter: "Freelance Recruiter",
    recruiter_freelancer: "Freelance Recruiter",
    recruiter_fulltime: "Employee",
  };
  return labels[role] || role || "";
}

// Keep active sessions and links created before the role rename working.
ROLE_ROUTES.recruiter = ROLE_ROUTES.recruiter_freelancer;

export const ROLE_NAV_ITEMS = {
  admin: [
    { label: "Dashboard", path: ROLE_ROUTES.admin.jobs },
    { label: "Statistics", path: ROLE_ROUTES.admin.statistics },
    { label: "Candidate Management", path: ROLE_ROUTES.admin.candidates },
    { label: "Saved Jobs", path: ROLE_ROUTES.admin.savedJobs },
    { label: "User Management", path: ROLE_ROUTES.admin.users },
  ],
  lower_admin: [
    { label: "Dashboard", path: adminRoutes.jobs },
    { label: "Statistics", path: adminRoutes.statistics },
    { label: "Candidate Management", path: adminRoutes.candidates },
    { label: "Saved Jobs", path: adminRoutes.savedJobs },
    { label: "User Management", path: adminRoutes.users },
  ],
  recruiter_freelancer: [
    { label: "Dashboard", path: ROLE_ROUTES.recruiter_freelancer.dashboard },
    { label: "Jobs", path: ROLE_ROUTES.recruiter_freelancer.jobs },
    { label: "My Candidates", path: ROLE_ROUTES.recruiter_freelancer.candidates },
    { label: "Saved Jobs", path: ROLE_ROUTES.recruiter_freelancer.savedJobs },
  ],
  recruiter_fulltime: [
    { label: "Employee workspace", path: ROLE_ROUTES.recruiter_fulltime.dashboard },
  ],
};

ROLE_NAV_ITEMS.recruiter = ROLE_NAV_ITEMS.recruiter_freelancer;
