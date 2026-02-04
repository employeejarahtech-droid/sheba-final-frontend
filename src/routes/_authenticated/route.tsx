import { createFileRoute, redirect } from '@tanstack/react-router'
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout'
import { getCookie } from '@/lib/cookies'

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: () => {
    const token = getCookie('accessToken')

    if (!token) {
      throw redirect({
        to: '/login',
      })
    }
  },

  component: AuthenticatedLayout,
})
