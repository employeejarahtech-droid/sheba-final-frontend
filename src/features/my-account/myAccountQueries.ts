import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getProfile, updateProfile, changePassword } from './myAccountService'
import { useAuthStore } from '@/stores/auth-store'

export function useGetProfileQuery() {
  return useQuery({
    queryKey: ['my-account-profile'],
    queryFn: getProfile,
  })
}

export function useUpdateProfileMutation() {
  const qc = useQueryClient()
  const setUser = useAuthStore((s) => s.setAuth)
  const user = useAuthStore((s) => s.user)
  const token = useAuthStore((s) => s.accessToken)

  return useMutation({
    mutationFn: (formData: FormData) => updateProfile(formData),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['my-account-profile'] })
      qc.invalidateQueries({ queryKey: ['user-profile'] })
      if (data.name && user) {
        setUser({ ...user, name: data.name, email: data.email }, token)
      }
    },
  })
}

export function useChangePasswordMutation() {
  return useMutation({
    mutationFn: ({ currentPassword, newPassword }: { currentPassword: string; newPassword: string }) =>
      changePassword(currentPassword, newPassword),
  })
}
