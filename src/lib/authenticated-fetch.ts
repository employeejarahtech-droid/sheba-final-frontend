import { useAuthStore } from "@/stores/auth-store";
import { toast } from "sonner";

interface AuthenticatedFetchOptions extends RequestInit {
  token?: string;
}

interface ApiError {
  message?: string;
}

export async function authenticatedFetch(
  url: string,
  options: AuthenticatedFetchOptions = {}
): Promise<Response> {
  const { accessToken: token } = useAuthStore.getState();

  console.log("🔐 Auth State Before Request:", {
    url,
    hasToken: !!token,
    tokenLength: token?.length,
    method: options.method,
  });

  if (!token) {
    console.error("❌ No token in store! Current store state:", useAuthStore.getState());
    toast.error("Please login to continue.");
    window.location.href = "/login";
    throw new Error("No token available");
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
    },
  });

  console.log("📡 Response:", {
    url,
    status: response.status,
    ok: response.ok,
  });

  // Handle 401 Unauthorized - token expired or invalid
  if (response.status === 401) {
    console.error("❌ 401 Unauthorized - Server rejected the token");
    console.error("Token used (first 50 chars):", token.substring(0, 50) + "...");
    const { logout } = useAuthStore.getState();
    logout();
    toast.error("Session expired. Please login again.");

    // Delay redirect so you can see the logs
    setTimeout(() => {
      window.location.href = "/login";
    }, 3000);

    throw new Error("Unauthorized");
  }

  return response;
}

export async function handleFetchError(response: Response): Promise<void> {
  if (!response.ok) {
    const error: ApiError = await response.json();

    // Don't throw for 401 - it's already handled in authenticatedFetch
    if (response.status === 401) {
      throw new Error("Unauthorized");
    }

    throw new Error(error?.message || `Request failed with status ${response.status}`);
  }
}
