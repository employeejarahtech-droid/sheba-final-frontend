import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getCookie } from '@/lib/cookies'
import { useAppDispatch } from '@/store/store'
import { setCurrency } from '@/store/currencySlice'

type CompanySettings = {
  currency?: string | null
}

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const token = getCookie('accessToken')
  const dispatch = useAppDispatch()

  // Currency is the authoritative field on company settings (edited on the
  // settings page). The users/profile endpoint does not expose currency, so we
  // read it from company settings instead. Sharing the ['company-settings']
  // query key dedupes the request with the settings page and keeps the store in
  // sync automatically when currency is updated there.
  const { data: settingsData } = useQuery<CompanySettings>({
    queryKey: ['company-settings'],
    queryFn: async (): Promise<CompanySettings> => {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/company-settings`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!res.ok) {
        // Silently fail if settings fetch fails
        return {} as CompanySettings
      }

      const response = await res.json()
      return response.data
    },
    enabled: !!token,
    retry: false,
    refetchOnWindowFocus: false,
  })

  // Hydrate the Redux store once the company currency is known
  useEffect(() => {
    if (settingsData?.currency) {
      dispatch(setCurrency(settingsData.currency))
    }
  }, [settingsData, dispatch])

  return <>{children}</>
}
