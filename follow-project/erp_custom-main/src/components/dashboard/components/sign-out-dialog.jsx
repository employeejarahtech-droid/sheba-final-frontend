"use client";
import { ConfirmDialog } from "./ConfirmDialog";
import { useRouter } from "next/navigation";

export function SignOutDialog({ open, onOpenChange }) {
  const router = useRouter();

  const handleSignOut = () => {
    router.push("/sign-in");
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
