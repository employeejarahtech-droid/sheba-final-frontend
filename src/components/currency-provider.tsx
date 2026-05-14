import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getCookie } from '@/lib/cookies'
import { useAppDispatch } from '@/store/store'
import { setCurrency } from '@/store/currencySlice'

type ProfileResponse = {
  id: number
  companyName: string
  email: string
  avatar: string | null
  bio?: string | null
  currency?: string | null
  address1?: string | null
  address2?: string | null
}

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const token = getCookie('accessToken')
  const dispatch = useAppDispatch()

  // Fetch profile to get currency setting
  const { data: profileData } = useQuery<ProfileResponse>({
    queryKey: ['user-currency'],
    queryFn: async (): Promise<ProfileResponse> => {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/users/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!res.ok) {
        // Silently fail if profile fetch fails
        return {} as ProfileResponse
      }

      const response = await res.json()
      return response.data
    },
    enabled: !!token,
    retry: false,
    refetchOnWindowFocus: false,
  })

  // Update Redux store when profile data loads
  useEffect(() => {
    if (profileData?.currency) {
      dispatch(setCurrency(profileData.currency))
    }
  }, [profileData, dispatch])

  return <>{children}</>
}
