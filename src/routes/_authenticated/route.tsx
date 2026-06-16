import { createFileRoute, redirect } from '@tanstack/react-router'
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout'
import { getCookie } from '@/lib/cookies'
import { getSubdomainInfo } from '@/lib/subdomain'

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: () => {
    const token = getCookie('accessToken')

    if (!token) {
      throw redirect({
        to: '/login',
      })
    }

    // Dashboard routes only exist on tenant subdomains.
    // If user is on the main domain, redirect to login.
    const { isCompanyPortal } = getSubdomainInfo()
    if (!isCompanyPortal) {
      throw redirect({
        to: '/login',
      })
    }
  },

  component: AuthenticatedLayout,
})
