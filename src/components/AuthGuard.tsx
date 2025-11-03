import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { auth } from "../firebase";
import LoadingSpinner from "./ui/LoadingSpinner";

type AuthGuardProps = {
  children: ReactNode;
};

export default function AuthGuard({ children }: AuthGuardProps) {
  const { user, loading } = useAuth();

  // Allow routing immediately after login by checking auth.currentUser
  if (loading && !auth.currentUser) {
    return <LoadingSpinner fullScreen message="Checking authentication..." />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
