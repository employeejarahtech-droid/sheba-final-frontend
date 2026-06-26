import { createFileRoute, redirect } from '@tanstack/react-router'
import { Login } from '@/features/auth/sign-in/login'
import { PlatformLogin } from '@/features/auth/sign-in/platform-login'
import { getCookie } from '@/lib/cookies'
import { getSubdomainInfo } from '@/lib/subdomain'

export const Route = createFileRoute('/(auth)/login')({
  beforeLoad: () => {
    const token = getCookie('accessToken')
    if (token) {
      throw redirect({ to: '/dashboard' })
    }
  },
  component: LoginWrapper,
})

function LoginWrapper() {
  const { isCompanyPortal, isPlatform } = getSubdomainInfo()

  // Platform domain: show platform login
  if (isPlatform) {
    return <PlatformLogin />
  }

  // Tenant subdomain: show tenant-specific login
  if (isCompanyPortal) {
    return <Login />
  }

  // Default to platform login
  return <PlatformLogin />
}
