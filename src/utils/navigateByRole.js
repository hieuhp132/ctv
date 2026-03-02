import { ROLE_ROUTES } from "../routes/roleRoutes";

export const navigateByRole = (navigate, user, key, options = {}) => {
  if (!user?.role) return;

  const roleRoutes = ROLE_ROUTES[user.role];
  if (!roleRoutes) return;

  const path = roleRoutes[key];
  if (!path) return;

  navigate(path, options);
};
