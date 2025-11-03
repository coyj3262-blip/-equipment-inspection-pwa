import type { ReactNode } from "react";
import { useUserRole } from "../hooks/useUserRole";
import { Navigate } from "react-router-dom";
import LoadingSpinner from "./ui/LoadingSpinner";

type RequireEmployeeProps = {
  children: ReactNode;
};

export default function RequireEmployee({ children }: RequireEmployeeProps) {
  const { isSupervisor, loading } = useUserRole();

  if (loading) {
    return <LoadingSpinner fullScreen message="Loading..." />;
  }

  if (isSupervisor) {
    return <Navigate to="/supervisor-hub" replace />;
  }

  return <>{children}</>;
}
