/**
 * Platform Admin Hooks — TanStack Query queries and mutations
 *
 * All admin data fetching and mutations for the platform admin panel.
 * Query keys use ['platform-admin', resource, ...params] convention.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import * as adminService from '@/services/platform-admin'

// ── Query Keys ──────────────────────────────────────────────────────────
const KEYS = {
  dashboard: ['platform-admin', 'dashboard'] as const,
  companies: (params?: Record<string, unknown>) => ['platform-admin', 'companies', params] as const,
  company: (id: number) => ['platform-admin', 'companies', id] as const,
  plans: (params?: Record<string, unknown>) => ['platform-admin', 'plans', params] as const,
  registrations: (params?: Record<string, unknown>) => ['platform-admin', 'registrations', params] as const,
  admins: (params?: Record<string, unknown>) => ['platform-admin', 'admins', params] as const,
  settings: () => ['platform-admin', 'settings'] as const,
  settingsCategory: (cat: string) => ['platform-admin', 'settings', cat] as const,
  modules: (params?: Record<string, unknown>) => ['platform-admin', 'modules', params] as const,
  billingOverview: ['platform-admin', 'billing', 'overview'] as const,
  billingRevenue: (period?: string) => ['platform-admin', 'billing', 'revenue', period] as const,
  billingTransactions: (params?: Record<string, unknown>) => ['platform-admin', 'billing', 'transactions', params] as const,
}

// ═══════════════════════════════════════════════════════════════════════
//  DASHBOARD
// ═══════════════════════════════════════════════════════════════════════

export function useDashboardStats() {
  return useQuery({
    queryKey: KEYS.dashboard,
    queryFn: () => adminService.fetchDashboardStats().then((r) => r.data),
  })
}

// ═══════════════════════════════════════════════════════════════════════
//  COMPANIES
// ═══════════════════════════════════════════════════════════════════════

export function useCompanies(params?: { page?: number; limit?: number; search?: string; status?: string }) {
  return useQuery({
    queryKey: KEYS.companies(params),
    queryFn: () => adminService.fetchCompanies(params),
  })
}

export function useCompany(id: number) {
  return useQuery({
    queryKey: KEYS.company(id),
    queryFn: () => adminService.fetchCompany(id).then((r) => r.data),
    enabled: !!id,
  })
}

export function useCreateCompany() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: adminService.createCompany,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['platform-admin', 'companies'] })
      qc.invalidateQueries({ queryKey: KEYS.dashboard })
      toast.success('Company created successfully')
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export function useUpdateCompany() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Record<string, unknown> }) =>
      adminService.updateCompany(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['platform-admin', 'companies'] })
      toast.success('Company updated')
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export function useToggleCompanyActive() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: adminService.toggleCompanyActive,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['platform-admin', 'companies'] })
      toast.success('Company status updated')
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export function useDeleteCompany() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: adminService.deleteCompany,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['platform-admin', 'companies'] })
      qc.invalidateQueries({ queryKey: KEYS.dashboard })
      toast.success('Company deleted')
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

// ═══════════════════════════════════════════════════════════════════════
//  PLANS
// ═══════════════════════════════════════════════════════════════════════

export function useAdminPlans(params?: { status?: string; search?: string }) {
  return useQuery({
    queryKey: KEYS.plans(params),
    queryFn: () => adminService.fetchAdminPlans(params).then((r) => r.data),
  })
}

export function useCreatePlan() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: adminService.createPlan,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['platform-admin', 'plans'] })
      toast.success('Plan created')
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export function useUpdatePlan() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Record<string, unknown> }) =>
      adminService.updatePlan(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['platform-admin', 'plans'] })
      toast.success('Plan updated')
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export function useDeletePlan() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: adminService.deletePlan,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['platform-admin', 'plans'] })
      toast.success('Plan deleted')
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

// ═══════════════════════════════════════════════════════════════════════
//  REGISTRATIONS
// ═══════════════════════════════════════════════════════════════════════

export function useRegistrations(params?: { page?: number; limit?: number; search?: string; status?: string }) {
  return useQuery({
    queryKey: KEYS.registrations(params),
    queryFn: () => adminService.fetchRegistrations(params),
  })
}

export function useApproveRegistration() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: adminService.approveRegistration,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['platform-admin', 'registrations'] })
      qc.invalidateQueries({ queryKey: ['platform-admin', 'companies'] })
      qc.invalidateQueries({ queryKey: KEYS.dashboard })
      toast.success('Registration approved — tenant created')
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export function useRejectRegistration() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, reason }: { id: number; reason?: string }) =>
      adminService.rejectRegistration(id, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['platform-admin', 'registrations'] })
      toast.success('Registration rejected')
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

// ═══════════════════════════════════════════════════════════════════════
//  ADMIN USERS
// ═══════════════════════════════════════════════════════════════════════

export function useAdmins(params?: { page?: number; limit?: number; search?: string }) {
  return useQuery({
    queryKey: KEYS.admins(params),
    queryFn: () => adminService.fetchAdmins(params),
  })
}

export function useCreateAdmin() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: adminService.createAdmin,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['platform-admin', 'admins'] })
      toast.success('Admin user created')
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export function useUpdateAdmin() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Record<string, unknown> }) =>
      adminService.updateAdmin(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['platform-admin', 'admins'] })
      toast.success('Admin user updated')
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export function useDeleteAdmin() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: adminService.deleteAdmin,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['platform-admin', 'admins'] })
      toast.success('Admin user deactivated')
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

// ═══════════════════════════════════════════════════════════════════════
//  SETTINGS
// ═══════════════════════════════════════════════════════════════════════

export function useAllSettings() {
  return useQuery({
    queryKey: KEYS.settings(),
    queryFn: () => adminService.fetchAllSettings().then((r) => r.data),
  })
}

export function useSettingsByCategory(category: string) {
  return useQuery({
    queryKey: KEYS.settingsCategory(category),
    queryFn: () => adminService.fetchSettingsByCategory(category).then((r) => r.data),
    enabled: !!category,
  })
}

export function useUpdateSettings() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ category, settings }: { category: string; settings: Record<string, unknown> }) =>
      adminService.updateSettings(category, settings),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['platform-admin', 'settings'] })
      toast.success('Settings updated')
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

// ═══════════════════════════════════════════════════════════════════════
//  MODULES
// ═══════════════════════════════════════════════════════════════════════

export function useModules(params?: { status?: string; category?: string; search?: string }) {
  return useQuery({
    queryKey: KEYS.modules(params),
    queryFn: () => adminService.fetchModules(params).then((r) => r.data),
  })
}

export function useCreateModule() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: adminService.createModule,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['platform-admin', 'modules'] })
      toast.success('Module created')
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export function useUpdateModule() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Record<string, unknown> }) =>
      adminService.updateModule(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['platform-admin', 'modules'] })
      toast.success('Module updated')
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export function useDeleteModule() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: adminService.deleteModule,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['platform-admin', 'modules'] })
      toast.success('Module deleted')
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

// ═══════════════════════════════════════════════════════════════════════
//  BILLING
// ═══════════════════════════════════════════════════════════════════════

export function useBillingOverview() {
  return useQuery({
    queryKey: KEYS.billingOverview,
    queryFn: () => adminService.fetchBillingOverview().then((r) => r.data),
  })
}

export function useBillingRevenue(period?: string) {
  return useQuery({
    queryKey: KEYS.billingRevenue(period),
    queryFn: () => adminService.fetchBillingRevenue(period).then((r) => r.data),
  })
}

export function useBillingTransactions(params?: {
  page?: number
  limit?: number
  status?: string
  companyId?: number
  dateFrom?: string
  dateTo?: string
}) {
  return useQuery({
    queryKey: KEYS.billingTransactions(params),
    queryFn: () => adminService.fetchBillingTransactions(params),
  })
}
