/**
 * Admin Login Hook — TanStack Query mutation
 *
 * Mirrors src/hooks/useLogin.ts pattern.
 */

import { useMutation } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import { adminLoginApi } from '@/services/platform-auth'
import { usePlatformAuthStore } from '@/stores/platform-auth-store'

export function useAdminLogin() {
  const setAuth = usePlatformAuthStore((s) => s.setAuth)
  const navigate = useNavigate()

  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      adminLoginApi(email, password),

    onMutate: () => {
      toast.loading('Signing in...', { id: 'admin-login-toast' })
    },

    onSuccess: (res) => {
      const { token, user } = res.data
      setAuth(user, token, true)
      toast.success('Welcome, Admin!', { id: 'admin-login-toast' })
      navigate({ to: '/admin', replace: true })
    },

    onError: (error: Error) => {
      toast.error(error.message || 'Login failed', { id: 'admin-login-toast' })
    },
  })
}
