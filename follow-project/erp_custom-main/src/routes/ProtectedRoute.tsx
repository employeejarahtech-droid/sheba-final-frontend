import { useAppSelector } from "@/store/store";
import { Navigate, Outlet } from "react-router";

export default function ProtectedRoute() {
  const user = useAppSelector((state) => state.auth.user);
  const token = useAppSelector((state) => state.auth.token);

  if (!user || !token) return <Navigate to="/login" replace />;

  if (!user.role && !user.role_id) {
    return <Navigate to="/unauthorized" replace />;
  }


  return <Outlet />;
}
