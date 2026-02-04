import { useAppSelector } from "@/store/store";
import { Navigate } from "react-router";



export const PermissionsGurd = ({ children, allowedPermissions }: { children: React.ReactNode, allowedPermissions?: string[] }) => {
  const userPermissions = useAppSelector((state) => state.auth.user?.role.permissions || []);

  if (allowedPermissions && !allowedPermissions.some(p => userPermissions.includes(p))) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};
