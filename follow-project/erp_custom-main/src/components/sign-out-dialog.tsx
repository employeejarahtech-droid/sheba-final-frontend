"use client";

// import { useAuthStore } from "@/stores/auth-store";
import { useLocation, useNavigate,  } from "react-router";
import { ConfirmDialog } from "./confirm-dialog";
import { useAppDispatch } from "@/store/store";
import { logout } from "@/store/features/auth/authSlice";

interface SignOutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SignOutDialog({ open, onOpenChange }: SignOutDialogProps) {
  const navigate = useNavigate();
  const location = useLocation();
  // const { auth } = useAuthStore();
  const dispatch = useAppDispatch();

  const handleSignOut = () => {
    // auth.reset();

    dispatch(logout());
    // Preserve current path for redirect after sign-in
    const currentPath = location.pathname + location.search;

    // navigate({ to: string }) is not standard; use `navigate(path, options)` in React Router v6
    navigate(`/login?redirect=${encodeURIComponent(currentPath)}`, { replace: true });
  };

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Sign out"
      desc="Are you sure you want to sign out? You will need to sign in again to access your account."
      confirmText="Sign out"
      destructive
      handleConfirm={handleSignOut}
      className="sm:max-w-sm"
    />
  );
}
