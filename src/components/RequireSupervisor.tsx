import type { ReactNode } from "react";
import { useUserRole } from "../hooks/useUserRole";
import { Navigate } from "react-router-dom";
import LoadingSpinner from "./ui/LoadingSpinner";

type RequireSupervisorProps = {
  feature?: string;
  children: ReactNode;
};

export default function RequireSupervisor({ feature, children }: RequireSupervisorProps) {
  const { isSupervisor, loading } = useUserRole();

  if (loading) {
    return <LoadingSpinner fullScreen message={`Checking ${feature || 'supervisor'} access...`} />;
  }

  if (!isSupervisor) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

