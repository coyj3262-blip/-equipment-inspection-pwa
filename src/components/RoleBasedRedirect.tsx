import { Navigate } from "react-router-dom";
import { useUserRole } from "../hooks/useUserRole";
import LoadingSpinner from "./ui/LoadingSpinner";

/**
 * Redirects users to their role-appropriate home page:
 * - Supervisors → /supervisor-hub
 * - Employees → /dashboard
 */
export default function RoleBasedRedirect() {
  const { isSupervisor, loading } = useUserRole();

  if (loading) {
    return <LoadingSpinner fullScreen message="Loading..." />;
  }

  if (isSupervisor) {
    return <Navigate to="/supervisor-hub" replace />;
  }

  return <Navigate to="/dashboard" replace />;
}
