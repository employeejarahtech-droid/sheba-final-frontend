import { createFileRoute, redirect } from '@tanstack/react-router'
import { Login } from '@/features/auth/sign-in/login'
import { getCookie } from '@/lib/cookies'

export const Route = createFileRoute('/(auth)/login')({
  beforeLoad: () => {
    const token = getCookie('accessToken')
    if (token) {
      throw redirect({ to: '/dashboard' })
    }
  },
  component: Login,
})
