import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuthStore } from "@/stores/auth-store";
import { toast } from "sonner";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const navigate = useNavigate();
  const { accessToken } = useAuthStore();

  useEffect(() => {
    if (!accessToken) {
      toast.error("Session expired. Please login again.");
      navigate({ to: "/login" });
    }
  }, [accessToken, navigate]);

  if (!accessToken) {
    return null;
  }

  return <>{children}</>;
}
