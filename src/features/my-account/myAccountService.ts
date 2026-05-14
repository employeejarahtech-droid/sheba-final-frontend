import api from '@/lib/axios'

export interface UserProfile {
  id: number
  name: string
  email: string
  role_id: number
  companyName: string | null
  avatar: string | null
  bio: string | null
  currency: string | null
  address1: string | null
  address2: string | null
}

export async function getProfile(): Promise<UserProfile> {
  const res = await api.get('/users/profile')
  return res.data.data
}

export async function updateProfile(data: FormData): Promise<UserProfile> {
  const res = await api.put('/users/profile', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return res.data.data
}

export async function changePassword(currentPassword: string, newPassword: string) {
  const res = await api.put('/users/change-password', { currentPassword, newPassword })
  return res.data
}
