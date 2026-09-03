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
  companyDomains: (id: number) => ['platform-admin', 'companies', id, 'domains'] as const,
  plans: (params?: Record<string, unknown>) => ['platform-admin', 'plans', params] as const,
  plan: (id: number) => ['platform-admin', 'plans', id] as const,
  registrations: (params?: Record<string, unknown>) => ['platform-admin', 'registrations', params] as const,
  admins: (params?: Record<string, unknown>) => ['platform-admin', 'admins', params] as const,
  profile: ['platform-admin', 'profile'] as const,
  settings: () => ['platform-admin', 'settings'] as const,
  settingsCategory: (cat: string) => ['platform-admin', 'settings', cat] as const,
  modules: (params?: Record<string, unknown>) => ['platform-admin', 'modules', params] as const,
  contacts: (params?: Record<string, unknown>) => ['platform-admin', 'contacts', params] as const,
  contact: (id: number) => ['platform-admin', 'contacts', id] as const,
  subscriptions: (params?: Record<string, unknown>) => ['platform-admin', 'subscriptions', params] as const,
  subscription: (companyId: number) => ['platform-admin', 'subscriptions', companyId] as const,
  billingOverview: ['platform-admin', 'billing', 'overview'] as const,
  billingRevenue: (period?: string) => ['platform-admin', 'billing', 'revenue', period] as const,
  billingTransactions: (params?: Record<string, unknown>) => ['platform-admin', 'billing', 'transactions', params] as const,
  billingInvoices: (params?: Record<string, unknown>) => ['platform-admin', 'billing', 'invoices', params] as const,
  billingInvoice: (id: number) => ['platform-admin', 'billing', 'invoices', id] as const,
  stripeOverview: ['platform-admin', 'billing', 'stripe', 'overview'] as const,
  stripeCustomers: ['platform-admin', 'billing', 'stripe', 'customers'] as const,
  stripeSubscriptions: ['platform-admin', 'billing', 'stripe', 'subscriptions'] as const,
  migrations: ['platform-admin', 'migrations'] as const,
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

export function useLoginAsCompany() {
  return useMutation({
    mutationFn: adminService.loginAsCompany,
    onError: (err: Error) => toast.error(err.message),
  })
}

// ── Nginx Domains (diagnostic) ──────────────────────────────────────────

export function useNginxDomains() {
  return useQuery({
    queryKey: ['platform-admin', 'nginx-domains'],
    queryFn: () => adminService.fetchNginxDomains().then((r) => r.data),
  })
}

export function useDeleteNginxDomain() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: adminService.deleteNginxDomain,
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['platform-admin', 'nginx-domains'] })
      toast.success(res.success ? res.message || 'Deleted' : 'Deleted')
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export function useNginxDomainContent(file: string | null) {
  return useQuery({
    queryKey: ['platform-admin', 'nginx-domain-content', file],
    queryFn: () => adminService.fetchNginxDomainContent(file as string).then((r) => r.data),
    enabled: !!file,
  })
}

export function useUpdateNginxDomain() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ file, content }: { file: string; content: string }) =>
      adminService.updateNginxDomain(file, content),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['platform-admin', 'nginx-domains'] })
      toast.success('Saved and reloaded nginx')
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

// ── Server Commands (whitelisted remote execution) ──────────────────────

export function useRunServerCommand() {
  return useMutation({
    mutationFn: ({ id, confirm }: { id: string; confirm?: boolean }) =>
      adminService.runServerCommand(id, confirm),
    onError: (err: Error) => toast.error(err.message),
  })
}

// ── Database migration status (per-tenant migration version) ────────────

export function useMigrationStatus() {
  return useQuery({
    queryKey: KEYS.migrations,
    queryFn: () => adminService.fetchMigrationStatus().then((r) => r.data),
  })
}

// ── Terminal (unrestricted remote shell) ────────────────────────────────

export function useRunTerminalCommand() {
  return useMutation({
    mutationFn: ({ command, cwd }: { command: string; cwd?: string }) =>
      adminService.runTerminalCommand(command, cwd),
    onError: (err: Error) => toast.error(err.message),
  })
}

// ── Company Custom Domain (superadmin review workflow) ─────────────────

export function useCompanyDomains(companyId: number) {
  return useQuery({
    queryKey: KEYS.companyDomains(companyId),
    queryFn: () => adminService.fetchCompanyDomains(companyId).then((r) => r.data),
    enabled: !!companyId,
  })
}

export function useRecheckDomainSSL(companyId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (domainId: number) => adminService.recheckDomainSSL(companyId, domainId),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: KEYS.companyDomains(companyId) })
      toast.success(res.data?.message || 'SSL re-checked')
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export function useVerifyDomainDNS(companyId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (domainId: number) => adminService.verifyDomainDNS(companyId, domainId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.companyDomains(companyId) })
      toast.success('DNS verified')
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export function useInstallDomainSSL(companyId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (domainId: number) => adminService.installDomainSSL(companyId, domainId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.companyDomains(companyId) })
      toast.success('SSL installed')
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export function useGoLiveDomain(companyId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (domainId: number) => adminService.goLiveDomain(companyId, domainId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.companyDomains(companyId) })
      qc.invalidateQueries({ queryKey: KEYS.company(companyId) })
      toast.success('Domain is now live')
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export function useDeactivateDomain(companyId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (domainId: number) => adminService.deactivateDomain(companyId, domainId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.companyDomains(companyId) })
      qc.invalidateQueries({ queryKey: KEYS.company(companyId) })
      toast.success('Domain deactivated')
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

export function useModules(params?: { status?: string; category?: string; search?: string; page?: number; limit?: number }) {
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

// ═══════════════════════════════════════════════════════════════════════
//  BILLING — INVOICES & STRIPE
// ═══════════════════════════════════════════════════════════════════════

export function useBillingInvoices(params?: { page?: number; limit?: number; status?: string; companyId?: number }) {
  return useQuery({
    queryKey: KEYS.billingInvoices(params),
    queryFn: () => adminService.fetchBillingInvoices(params),
  })
}

export function useBillingInvoice(id: number) {
  return useQuery({
    queryKey: KEYS.billingInvoice(id),
    queryFn: () => adminService.fetchBillingInvoice(id).then((r) => r.data),
    enabled: !!id,
  })
}

export function useStripeOverview() {
  return useQuery({
    queryKey: KEYS.stripeOverview,
    queryFn: () => adminService.fetchStripeOverview().then((r) => r.data),
  })
}

export function useStripeCustomers(limit?: number) {
  return useQuery({
    queryKey: KEYS.stripeCustomers,
    queryFn: () => adminService.fetchStripeCustomers(limit).then((r) => r.data),
  })
}

export function useStripeSubscriptions() {
  return useQuery({
    queryKey: KEYS.stripeSubscriptions,
    queryFn: () => adminService.fetchStripeSubscriptions().then((r) => r.data),
  })
}

// ═══════════════════════════════════════════════════════════════════════
//  SUBSCRIPTIONS
// ═══════════════════════════════════════════════════════════════════════

export function useSubscriptions(params?: { page?: number; limit?: number; search?: string; status?: string }) {
  return useQuery({
    queryKey: KEYS.subscriptions(params),
    queryFn: () => adminService.fetchSubscriptions(params),
  })
}

export function useSubscription(companyId: number) {
  return useQuery({
    queryKey: KEYS.subscription(companyId),
    queryFn: () => adminService.fetchSubscription(companyId).then((r) => r.data),
    enabled: !!companyId,
  })
}

export function useUpdateSubscription() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ companyId, data }: { companyId: number; data: Record<string, unknown> }) =>
      adminService.updateSubscription(companyId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['platform-admin', 'subscriptions'] })
      qc.invalidateQueries({ queryKey: ['platform-admin', 'companies'] })
      toast.success('Subscription updated')
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

// ═══════════════════════════════════════════════════════════════════════
//  CONTACTS
// ═══════════════════════════════════════════════════════════════════════

export function useContacts(params?: { page?: number; limit?: number; search?: string; status?: string }) {
  return useQuery({
    queryKey: KEYS.contacts(params),
    queryFn: () => adminService.fetchContacts(params),
  })
}

export function useUpdateContactStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      adminService.updateContactStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['platform-admin', 'contacts'] })
      toast.success('Contact status updated')
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export function useAssignContact() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, assignedTo }: { id: number; assignedTo: number | null }) =>
      adminService.assignContact(id, assignedTo),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['platform-admin', 'contacts'] })
      toast.success('Contact assigned')
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export function useUpdateContactNotes() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, notes }: { id: number; notes: string }) =>
      adminService.updateContactNotes(id, notes),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['platform-admin', 'contacts'] })
      toast.success('Notes saved')
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export function useDeleteContact() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: adminService.deleteContact,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['platform-admin', 'contacts'] })
      toast.success('Contact deleted')
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

// ═══════════════════════════════════════════════════════════════════════
//  ADMIN PROFILE & PASSWORD
// ═══════════════════════════════════════════════════════════════════════

export function useAdminProfile() {
  return useQuery({
    queryKey: KEYS.profile,
    queryFn: () => adminService.fetchAdminProfile().then((r) => r.data),
  })
}

export function useUpdateAdminProfile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { name?: string; email?: string }) => adminService.updateAdminProfile(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.profile })
      toast.success('Profile updated')
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export function useChangeAdminPassword() {
  return useMutation({
    mutationFn: (data: { oldPassword: string; newPassword: string }) => adminService.changeAdminPassword(data),
    onSuccess: () => toast.success('Password changed successfully'),
    onError: (err: Error) => toast.error(err.message),
  })
}

export function useToggleAdminActive() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: adminService.toggleAdminActive,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['platform-admin', 'admins'] })
      toast.success('Admin status updated')
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

// ═══════════════════════════════════════════════════════════════════════
//  PLAN — single (edit page)
// ═══════════════════════════════════════════════════════════════════════

export function usePlan(id: number) {
  return useQuery({
    queryKey: KEYS.plan(id),
    queryFn: () => adminService.fetchPlan(id).then((r) => r.data),
    enabled: !!id,
  })
}

// ═══════════════════════════════════════════════════════════════════════
//  REGISTRATIONS — manual create + delete
// ═══════════════════════════════════════════════════════════════════════

export function useCreateRegistration() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: adminService.createRegistration,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['platform-admin', 'registrations'] })
      toast.success('Registration created')
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export function useDeleteRegistration() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: adminService.deleteRegistration,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['platform-admin', 'registrations'] })
      toast.success('Registration deleted')
    },
    onError: (err: Error) => toast.error(err.message),
  })
}
