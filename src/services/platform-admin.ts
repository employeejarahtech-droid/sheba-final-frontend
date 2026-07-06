/**
 * Platform Admin Service — Authenticated admin CRUD API calls
 *
 * All calls go through platformAuthenticatedFetch which adds the Bearer token
 * and handles 401 redirects to /admin/login.
 */

import { platformFetchJson } from '@/lib/platform-authenticated-fetch'
import type {
  PlatformDashboardStats,
  PlatformCompany,
  PlatformCompanyDomain,
  PlatformSubscriptionPlan,
  PlatformRegistration,
  PlatformAdminUser,
  PlatformSetting,
  PlatformModule,
  PlatformBillingOverview,
  PlatformTransaction,
  PlatformRevenueStat,
  PlatformContact,
  PlatformSubscription,
  PlatformInvoice,
  PlatformStripeOverview,
  PlatformStripeCustomer,
  PaginatedResponse,
  ApiResponse,
} from '@/types/platform.types'

// ═══════════════════════════════════════════════════════════════════════
//  DASHBOARD
// ═══════════════════════════════════════════════════════════════════════

export async function fetchDashboardStats(): Promise<ApiResponse<PlatformDashboardStats>> {
  return platformFetchJson('/api/admin/dashboard')
}

// ═══════════════════════════════════════════════════════════════════════
//  COMPANIES
// ═══════════════════════════════════════════════════════════════════════

export async function fetchCompanies(params?: {
  page?: number
  limit?: number
  search?: string
  status?: string
  dbType?: string
}): Promise<PaginatedResponse<PlatformCompany>> {
  const query = new URLSearchParams()
  if (params?.page) query.set('page', String(params.page))
  if (params?.limit) query.set('limit', String(params.limit))
  if (params?.search) query.set('search', params.search)
  if (params?.status) query.set('status', params.status)
  if (params?.dbType) query.set('dbType', params.dbType)
  const qs = query.toString()
  return platformFetchJson(`/api/admin/companies${qs ? `?${qs}` : ''}`)
}

export async function fetchCompany(id: number): Promise<ApiResponse<PlatformCompany>> {
  return platformFetchJson(`/api/admin/companies/${id}`)
}

export async function createCompany(data: Partial<PlatformCompany>): Promise<ApiResponse<PlatformCompany>> {
  return platformFetchJson('/api/admin/companies', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateCompany(id: number, data: Partial<PlatformCompany>): Promise<ApiResponse<PlatformCompany>> {
  return platformFetchJson(`/api/admin/companies/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function toggleCompanyActive(id: number): Promise<ApiResponse<PlatformCompany>> {
  return platformFetchJson(`/api/admin/companies/${id}/toggle-active`, { method: 'PATCH' })
}

export async function deleteCompany(id: number): Promise<ApiResponse<void>> {
  return platformFetchJson(`/api/admin/companies/${id}`, { method: 'DELETE' })
}

export interface LoginAsResult {
  token: string
  subdomain: string
  user: { id: number; name: string; email: string; userType: string; companyId: number }
}

export async function loginAsCompany(id: number): Promise<ApiResponse<LoginAsResult>> {
  return platformFetchJson(`/api/admin/companies/${id}/login-as`, { method: 'POST' })
}

// ── Company Custom Domain (superadmin review workflow) ─────────────────

export async function fetchCompanyDomains(companyId: number): Promise<ApiResponse<PlatformCompanyDomain[]>> {
  return platformFetchJson(`/api/admin/companies/${companyId}/domains`)
}

export async function recheckDomainSSL(
  companyId: number,
  domainId: number
): Promise<ApiResponse<{ valid: boolean; message: string }>> {
  return platformFetchJson(`/api/admin/companies/${companyId}/domains/${domainId}/recheck-ssl`, { method: 'POST' })
}

export async function verifyDomainDNS(companyId: number, domainId: number): Promise<ApiResponse<{ domain: string }>> {
  return platformFetchJson(`/api/admin/companies/${companyId}/domains/${domainId}/verify-dns`, { method: 'POST' })
}

export async function installDomainSSL(companyId: number, domainId: number): Promise<ApiResponse<{ domain: string }>> {
  return platformFetchJson(`/api/admin/companies/${companyId}/domains/${domainId}/install-ssl`, { method: 'POST' })
}

export async function goLiveDomain(companyId: number, domainId: number): Promise<ApiResponse<{ domain: string }>> {
  return platformFetchJson(`/api/admin/companies/${companyId}/domains/${domainId}/go-live`, { method: 'POST' })
}

export async function deactivateDomain(companyId: number, domainId: number): Promise<ApiResponse<{ domain: string }>> {
  return platformFetchJson(`/api/admin/companies/${companyId}/domains/${domainId}/deactivate`, { method: 'POST' })
}

// ═══════════════════════════════════════════════════════════════════════
//  PLANS
// ═══════════════════════════════════════════════════════════════════════

export async function fetchAdminPlans(params?: {
  status?: string
  search?: string
  page?: number
  limit?: number
}): Promise<ApiResponse<PlatformSubscriptionPlan[]>> {
  const query = new URLSearchParams()
  if (params?.status) query.set('status', params.status)
  if (params?.search) query.set('search', params.search)
  const qs = query.toString()
  return platformFetchJson(`/api/admin/plans${qs ? `?${qs}` : ''}`)
}

export async function createPlan(data: Partial<PlatformSubscriptionPlan>): Promise<ApiResponse<PlatformSubscriptionPlan>> {
  return platformFetchJson('/api/admin/plans', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updatePlan(id: number, data: Partial<PlatformSubscriptionPlan>): Promise<ApiResponse<PlatformSubscriptionPlan>> {
  return platformFetchJson(`/api/admin/plans/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function deletePlan(id: number): Promise<ApiResponse<void>> {
  return platformFetchJson(`/api/admin/plans/${id}`, { method: 'DELETE' })
}

// ═══════════════════════════════════════════════════════════════════════
//  REGISTRATIONS
// ═══════════════════════════════════════════════════════════════════════

export async function fetchRegistrations(params?: {
  page?: number
  limit?: number
  search?: string
  status?: string
}): Promise<PaginatedResponse<PlatformRegistration>> {
  const query = new URLSearchParams()
  if (params?.page) query.set('page', String(params.page))
  if (params?.limit) query.set('limit', String(params.limit))
  if (params?.search) query.set('search', params.search)
  if (params?.status) query.set('status', params.status)
  const qs = query.toString()
  return platformFetchJson(`/api/admin/registrations${qs ? `?${qs}` : ''}`)
}

export async function approveRegistration(id: number): Promise<ApiResponse<{ registration: PlatformRegistration }>> {
  return platformFetchJson(`/api/admin/registrations/${id}/approve`, { method: 'POST' })
}

export async function rejectRegistration(id: number, reason?: string): Promise<ApiResponse<void>> {
  return platformFetchJson(`/api/admin/registrations/${id}/reject`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  })
}

// ═══════════════════════════════════════════════════════════════════════
//  ADMIN USERS
// ═══════════════════════════════════════════════════════════════════════

export async function fetchAdmins(params?: {
  page?: number
  limit?: number
  search?: string
}): Promise<PaginatedResponse<PlatformAdminUser>> {
  const query = new URLSearchParams()
  if (params?.page) query.set('page', String(params.page))
  if (params?.limit) query.set('limit', String(params.limit))
  if (params?.search) query.set('search', params.search)
  const qs = query.toString()
  return platformFetchJson(`/api/admin/users${qs ? `?${qs}` : ''}`)
}

export async function createAdmin(data: {
  email: string
  password: string
  name: string
  role?: string
  permissions?: Record<string, boolean>
}): Promise<ApiResponse<PlatformAdminUser>> {
  return platformFetchJson('/api/admin/users', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateAdmin(
  id: number,
  data: Partial<{ name: string; email: string; role: string; permissions: Record<string, boolean>; is_active: boolean }>
): Promise<ApiResponse<PlatformAdminUser>> {
  return platformFetchJson(`/api/admin/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function deleteAdmin(id: number): Promise<ApiResponse<void>> {
  return platformFetchJson(`/api/admin/users/${id}`, { method: 'DELETE' })
}

// ═══════════════════════════════════════════════════════════════════════
//  SETTINGS
// ═══════════════════════════════════════════════════════════════════════

export async function fetchAllSettings(): Promise<ApiResponse<PlatformSetting[]>> {
  return platformFetchJson('/api/admin/settings')
}

export async function fetchSettingsByCategory(category: string): Promise<ApiResponse<PlatformSetting[]>> {
  return platformFetchJson(`/api/admin/settings/${category}`)
}

export async function updateSettings(
  category: string,
  settings: Record<string, unknown>
): Promise<ApiResponse<PlatformSetting>> {
  return platformFetchJson(`/api/admin/settings/${category}`, {
    method: 'PUT',
    body: JSON.stringify(settings),
  })
}

// ═══════════════════════════════════════════════════════════════════════
//  MODULES
// ═══════════════════════════════════════════════════════════════════════

export async function fetchModules(params?: {
  status?: string
  category?: string
  search?: string
  page?: number
  limit?: number
}): Promise<ApiResponse<PlatformModule[]>> {
  const query = new URLSearchParams()
  if (params?.status) query.set('status', params.status)
  if (params?.category) query.set('category', params.category)
  if (params?.search) query.set('search', params.search)
  const qs = query.toString()
  return platformFetchJson(`/api/admin/modules${qs ? `?${qs}` : ''}`)
}

export async function createModule(data: Partial<PlatformModule>): Promise<ApiResponse<PlatformModule>> {
  return platformFetchJson('/api/admin/modules', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateModule(id: number, data: Partial<PlatformModule>): Promise<ApiResponse<PlatformModule>> {
  return platformFetchJson(`/api/admin/modules/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function deleteModule(id: number): Promise<ApiResponse<void>> {
  return platformFetchJson(`/api/admin/modules/${id}`, { method: 'DELETE' })
}

// ═══════════════════════════════════════════════════════════════════════
//  BILLING
// ═══════════════════════════════════════════════════════════════════════

export async function fetchBillingOverview(): Promise<ApiResponse<PlatformBillingOverview>> {
  return platformFetchJson('/api/admin/billing/overview')
}

export async function fetchBillingRevenue(period?: string): Promise<ApiResponse<PlatformRevenueStat[]>> {
  const qs = period ? `?period=${period}` : ''
  return platformFetchJson(`/api/admin/billing/revenue${qs}`)
}

export async function fetchBillingTransactions(params?: {
  page?: number
  limit?: number
  status?: string
  companyId?: number
  dateFrom?: string
  dateTo?: string
}): Promise<PaginatedResponse<PlatformTransaction>> {
  const query = new URLSearchParams()
  if (params?.page) query.set('page', String(params.page))
  if (params?.limit) query.set('limit', String(params.limit))
  if (params?.status) query.set('status', params.status)
  if (params?.companyId) query.set('companyId', String(params.companyId))
  if (params?.dateFrom) query.set('dateFrom', params.dateFrom)
  if (params?.dateTo) query.set('dateTo', params.dateTo)
  const qs = query.toString()
  return platformFetchJson(`/api/admin/billing/transactions${qs ? `?${qs}` : ''}`)
}

// ═══════════════════════════════════════════════════════════════════════
//  BILLING — INVOICES & STRIPE
// ═══════════════════════════════════════════════════════════════════════

export async function fetchBillingInvoices(params?: {
  page?: number
  limit?: number
  status?: string
  companyId?: number
}): Promise<PaginatedResponse<PlatformInvoice>> {
  const query = new URLSearchParams()
  if (params?.page) query.set('page', String(params.page))
  if (params?.limit) query.set('limit', String(params.limit))
  if (params?.status) query.set('status', params.status)
  if (params?.companyId) query.set('companyId', String(params.companyId))
  const qs = query.toString()
  return platformFetchJson(`/api/admin/billing/invoices${qs ? `?${qs}` : ''}`)
}

export async function fetchBillingInvoice(id: number): Promise<ApiResponse<PlatformInvoice>> {
  return platformFetchJson(`/api/admin/billing/invoices/${id}`)
}

export async function fetchStripeOverview(): Promise<ApiResponse<PlatformStripeOverview>> {
  return platformFetchJson('/api/admin/billing/stripe/overview')
}

export async function fetchStripeCustomers(limit?: number): Promise<ApiResponse<PlatformStripeCustomer[]>> {
  const qs = limit ? `?limit=${limit}` : ''
  return platformFetchJson(`/api/admin/billing/stripe/customers${qs}`)
}

export async function fetchStripeSubscriptions(): Promise<ApiResponse<PlatformSubscription[]>> {
  return platformFetchJson('/api/admin/billing/stripe/subscriptions')
}

// ═══════════════════════════════════════════════════════════════════════
//  SUBSCRIPTIONS
// ═══════════════════════════════════════════════════════════════════════

export async function fetchSubscriptions(params?: {
  page?: number
  limit?: number
  search?: string
  status?: string
}): Promise<PaginatedResponse<PlatformSubscription>> {
  const query = new URLSearchParams()
  if (params?.page) query.set('page', String(params.page))
  if (params?.limit) query.set('limit', String(params.limit))
  if (params?.search) query.set('search', params.search)
  if (params?.status) query.set('status', params.status)
  const qs = query.toString()
  return platformFetchJson(`/api/admin/subscriptions${qs ? `?${qs}` : ''}`)
}

export async function fetchSubscription(companyId: number): Promise<ApiResponse<PlatformSubscription>> {
  return platformFetchJson(`/api/admin/subscriptions/${companyId}`)
}

export async function updateSubscription(
  companyId: number,
  data: { status?: string; subscription_expires_at?: string | null; plan_id?: number | null }
): Promise<ApiResponse<PlatformSubscription>> {
  return platformFetchJson(`/api/admin/subscriptions/${companyId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

// ═══════════════════════════════════════════════════════════════════════
//  CONTACTS
// ═══════════════════════════════════════════════════════════════════════

export async function fetchContacts(params?: {
  page?: number
  limit?: number
  search?: string
  status?: string
}): Promise<PaginatedResponse<PlatformContact>> {
  const query = new URLSearchParams()
  if (params?.page) query.set('page', String(params.page))
  if (params?.limit) query.set('limit', String(params.limit))
  if (params?.search) query.set('search', params.search)
  if (params?.status) query.set('status', params.status)
  const qs = query.toString()
  return platformFetchJson(`/api/admin/contacts${qs ? `?${qs}` : ''}`)
}

export async function fetchContact(id: number): Promise<ApiResponse<PlatformContact>> {
  return platformFetchJson(`/api/admin/contacts/${id}`)
}

export async function updateContactStatus(id: number, status: string): Promise<ApiResponse<PlatformContact>> {
  return platformFetchJson(`/api/admin/contacts/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })
}

export async function assignContact(id: number, assignedTo: number | null): Promise<ApiResponse<PlatformContact>> {
  return platformFetchJson(`/api/admin/contacts/${id}/assign`, {
    method: 'PATCH',
    body: JSON.stringify({ assigned_to: assignedTo }),
  })
}

export async function updateContactNotes(id: number, notes: string): Promise<ApiResponse<PlatformContact>> {
  return platformFetchJson(`/api/admin/contacts/${id}/notes`, {
    method: 'PATCH',
    body: JSON.stringify({ notes }),
  })
}

export async function deleteContact(id: number): Promise<ApiResponse<void>> {
  return platformFetchJson(`/api/admin/contacts/${id}`, { method: 'DELETE' })
}

// ═══════════════════════════════════════════════════════════════════════
//  ADMIN PROFILE & PASSWORD
// ═══════════════════════════════════════════════════════════════════════

export async function fetchAdminProfile(): Promise<ApiResponse<PlatformAdminUser>> {
  return platformFetchJson('/api/admin/profile')
}

export async function updateAdminProfile(data: { name?: string; email?: string }): Promise<ApiResponse<PlatformAdminUser>> {
  return platformFetchJson('/api/admin/profile', {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function changeAdminPassword(data: {
  oldPassword: string
  newPassword: string
}): Promise<ApiResponse<void>> {
  return platformFetchJson('/api/admin/change-password', {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function toggleAdminActive(id: number): Promise<ApiResponse<PlatformAdminUser>> {
  return platformFetchJson(`/api/admin/users/${id}/toggle-active`, { method: 'PATCH' })
}

// ═══════════════════════════════════════════════════════════════════════
//  PLANS — single (for edit page)
// ═══════════════════════════════════════════════════════════════════════

export async function fetchPlan(id: number): Promise<ApiResponse<PlatformSubscriptionPlan>> {
  return platformFetchJson(`/api/admin/plans/${id}`)
}

// ═══════════════════════════════════════════════════════════════════════
//  REGISTRATIONS — manual create + delete
// ═══════════════════════════════════════════════════════════════════════

export async function createRegistration(data: {
  email: string
  name?: string
  company_name: string
  subdomain: string
  plan_id?: number | null
  cycle?: string
  phone?: string
  admin_password?: string
}): Promise<ApiResponse<PlatformRegistration>> {
  return platformFetchJson('/api/admin/registrations', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function deleteRegistration(id: number): Promise<ApiResponse<void>> {
  return platformFetchJson(`/api/admin/registrations/${id}`, { method: 'DELETE' })
}

// ═══════════════════════════════════════════════════════════════════════
//  PUBLIC — subdomain check (used by registrations page)
// ═══════════════════════════════════════════════════════════════════════

export async function checkSubdomain(subdomain: string): Promise<ApiResponse<{ available: boolean }>> {
  return platformFetchJson(`/api/public/check-subdomain/${encodeURIComponent(subdomain)}`)
}
