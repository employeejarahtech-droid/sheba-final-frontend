import { createFileRoute } from '@tanstack/react-router'
import { Login } from '@/features/auth/sign-in/login'

export const Route = createFileRoute('/(auth)/login')({
  component: Login,
})
