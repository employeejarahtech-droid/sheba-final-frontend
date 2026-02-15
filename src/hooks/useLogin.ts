import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { loginApi } from "@/services/auth";
import { useAuthStore } from "@/stores/auth-store";

export function useLogin() {
  const setAuth = useAuthStore((s) => s.setAuth);

  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      loginApi(email, password),

    onMutate: () => {
      toast.loading("Signing in...", { id: "login-toast" });
    },

    onSuccess: (res) => {
      // Handle nested data structure: { status, message, data: { user, accessToken } }
      const data = res.data || res;
      const token = data.accessToken || data.token;
      const user = data.user;

      if (!token || !user) {
        toast.error("Invalid response from server", { id: "login-toast" });
        throw new Error("Invalid response from server");
      }

      // Save token & user
      setAuth(user, token);
      toast.success("Login successful!", { id: "login-toast" });
    },

    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Login failed. Please try again.";

      toast.error(message, { id: "login-toast" });
    },
  });
}
