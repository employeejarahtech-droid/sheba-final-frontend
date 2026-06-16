/**
 * Platform Public Service — Unauthenticated API calls
 *
 * Landing page data, pricing plans, subdomain check, registration, contact.
 */

import type {
  PlatformSubscriptionPlan,
  PlatformLandingData,
  ApiResponse,
} from '@/types/platform.types'

const BASE_URL = import.meta.env.VITE_API_URL || ''

async function publicFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })

  const data = await res.json()

  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Request failed')
  }

  return data
}

// ── Landing Page Data ───────────────────────────────────────────────────
export async function fetchLandingData(): Promise<ApiResponse<PlatformLandingData>> {
  return publicFetch('/api/public/landing')
}

// ── Active Subscription Plans ───────────────────────────────────────────
export async function fetchPublicPlans(): Promise<ApiResponse<PlatformSubscriptionPlan[]>> {
  return publicFetch('/api/public/plans')
}

// ── Check Subdomain Availability ────────────────────────────────────────
export async function checkSubdomain(
  slug: string
): Promise<{ available: boolean; message: string }> {
  const res = await fetch(`${BASE_URL}/api/public/check-subdomain/${encodeURIComponent(slug)}`)
  return res.json()
}

// ── Submit Registration ─────────────────────────────────────────────────
export async function submitRegistration(data: {
  email: string
  name: string
  company_name: string
  subdomain: string
  admin_password: string
  phone?: string
  plan_id?: number | null
  cycle?: string
}): Promise<ApiResponse<{ id: number; email: string; subdomain: string }>> {
  return publicFetch('/api/public/register', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

// ── Submit Contact Form ─────────────────────────────────────────────────
export async function submitContactForm(data: {
  first_name: string
  last_name?: string
  email: string
  phone?: string
  company?: string
  subject?: string
  message: string
}): Promise<ApiResponse<{ id: number }>> {
  return publicFetch('/api/public/contact', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}
