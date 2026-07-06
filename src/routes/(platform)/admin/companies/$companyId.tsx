/**
 * Company Detail Page — Full profile for a single platform company/tenant
 *
 * Route: /(platform)/admin/companies/$companyId
 * Features: company info card, subscription info card, active toggle,
 * Back link to /admin/companies. Uses useCompany + useSubscription
 * (both return unwrapped entities) from @/hooks/usePlatformAdmin.
 */

import { createFileRoute, Link, redirect } from '@tanstack/react-router'
import { useState, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Building2,
  ArrowLeft,
  Mail,
  Globe,
  Database,
  Activity,
  Loader2,
  CreditCard,
  Calendar,
  Hash,
  ToggleLeft,
  ToggleRight,
<<<<<<< HEAD
  Lock,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Server,
  RefreshCw,
=======
  ShieldCheck,
  Lock,
  Rocket,
  PowerOff,
  RefreshCw,
  AlertCircle,
  LogIn,
  Pencil,
>>>>>>> recovered-work
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { getBaseDomain } from '@/lib/subdomain'
import {
  useCompany,
  useSubscription,
  useToggleCompanyActive,
<<<<<<< HEAD
  useCompanyDomains,
  useRecheckDomainSSL,
  useInstallDomainSSL,
  useVerifyDomainDNS,
  useGoLiveDomain,
  useDeactivateDomain,
} from '@/hooks/usePlatformAdmin'
import type { PlatformCompany, PlatformSubscription, CompanyDomain } from '@/types/platform.types'
=======
  useUpdateCompany,
  useLoginAsCompany,
  useAdminPlans,
  useCompanyDomains,
  useVerifyDomainDNS,
  useInstallDomainSSL,
  useGoLiveDomain,
  useDeactivateDomain,
  useRecheckDomainSSL,
} from '@/hooks/usePlatformAdmin'
import type { PlatformCompany, PlatformCompanyDomain, PlatformSubscription } from '@/types/platform.types'
>>>>>>> recovered-work
import { getAdminRoleFromToken } from '@/stores/platform-auth-store'

export const Route = createFileRoute('/(platform)/admin/companies/$companyId')({
  beforeLoad: () => {
    // Companies management is restricted to super admins (backend enforces too)
    if (getAdminRoleFromToken() !== 'super_admin') {
      throw redirect({ to: '/admin' })
    }
  },
  component: CompanyDetailPage,
})

// ── Status Color Map ────────────────────────────────────────────────────

const statusColorMap: Record<string, string> = {
  active: 'bg-emerald-500',
  trialing: 'bg-blue-500',
  past_due: 'bg-amber-500',
  expired: 'bg-red-500',
  canceled: 'bg-gray-400',
  pending: 'bg-amber-500',
  approved: 'bg-emerald-500',
  rejected: 'bg-red-500',
  unpaid: 'bg-red-500',
}

// ── Helpers ─────────────────────────────────────────────────────────────

const fmtDate = (value?: string | null): string => {
  if (!value) return '—'
  const d = new Date(value)
  return isNaN(d.getTime()) ? '—' : d.toLocaleDateString()
}

const fmtDateTime = (value?: string | null): string => {
  if (!value) return '—'
  const d = new Date(value)
  return isNaN(d.getTime()) ? '—' : d.toLocaleString()
}

const orDash = (value: string | null | undefined): string =>
  value && value.trim() !== '' ? value : '—'

// ── Component ───────────────────────────────────────────────────────────

function CompanyDetailPage() {
  const { companyId } = Route.useParams()
  const id = Number(companyId)

  const { data: company, isLoading: companyLoading } = useCompany(id)
  const { data: subscription, isLoading: subLoading } = useSubscription(id)
  const { data: domains = [], isLoading: domainsLoading, error: domainsError } = useCompanyDomains(id)
  const toggleActive = useToggleCompanyActive()
  const loginAs = useLoginAsCompany()
  const [showEditDialog, setShowEditDialog] = useState(false)

  // SSL and domain management mutations
  const recheckSSL = useRecheckDomainSSL()
  const installSSL = useInstallDomainSSL()
  const verifyDNS = useVerifyDomainDNS()
  const goLive = useGoLiveDomain()
  const deactivateDomain = useDeactivateDomain()

  // Debug logging
  console.log('[CompanyDetailPage] Company ID:', id)
  console.log('[CompanyDetailPage] Domains data:', domains)
  console.log('[CompanyDetailPage] Domains loading:', domainsLoading)
  console.log('[CompanyDetailPage] Domains error:', domainsError)
  console.log('[CompanyDetailPage] Domains length:', domains?.length)

  const isLoading = companyLoading || subLoading
  const active = Boolean(company?.is_active)

  const handleLoginAs = () => {
    loginAs.mutate(id, {
      onSuccess: (res) => {
        if (!res.success) return
        const { token, subdomain, user } = res.data
        const baseDomain = getBaseDomain()
        const url = `${window.location.protocol}//${subdomain}.${baseDomain}/auth-callback?token=${encodeURIComponent(token)}&user=${encodeURIComponent(JSON.stringify(user))}`
        window.open(url, '_blank', 'noopener')
      },
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Activity className="h-6 w-6 animate-pulse text-purple-500" />
      </div>
    )
  }

  if (!company) {
    return (
      <div className="space-y-6">
        <BackLink />
        <div className="rounded-lg border border-dashed p-8 text-center">
          <Building2 className="mx-auto h-10 w-10 text-purple-300" />
          <p className="mt-2 text-sm text-muted-foreground">
            Company not found.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <BackLink />

      {/* Page Header — Purple Gradient */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-600 to-purple-400 p-6 shadow-lg shadow-purple-500/30">
        <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-black/10 blur-2xl" />
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="rounded-xl bg-white/20 p-3 backdrop-blur-sm">
              <Building2 className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{company.name}</h1>
              <p className="text-sm text-white/80">
                Tenant detail &amp; subscription overview
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setShowEditDialog(true)}
              variant="outline"
              className="bg-white/10 text-white border-white/30 hover:bg-white/20 font-medium"
            >
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button
              onClick={handleLoginAs}
              disabled={loginAs.isPending}
              variant="outline"
              className="bg-white/10 text-white border-white/30 hover:bg-white/20 font-medium"
            >
              {loginAs.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <LogIn className="h-4 w-4 mr-2" />
              )}
              Login as Tenant
            </Button>
            <Button
              onClick={() => toggleActive.mutate(company.id)}
              disabled={toggleActive.isPending}
              className="bg-white text-purple-700 hover:bg-white/90 font-medium"
            >
              {toggleActive.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : active ? (
                <ToggleRight className="h-4 w-4 mr-2" />
              ) : (
                <ToggleLeft className="h-4 w-4 mr-2" />
              )}
              {active ? 'Deactivate' : 'Activate'}
            </Button>
          </div>
        </div>
      </div>

      <EditCompanyDialog company={company} open={showEditDialog} onOpenChange={setShowEditDialog} />

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Company Info */}
        <section className="rounded-lg border bg-card p-5">
          <div className="mb-4 flex items-center gap-2">
            <Building2 className="h-5 w-5 text-purple-500" />
            <h2 className="font-semibold">Company Info</h2>
          </div>
          <dl className="space-y-3 text-sm">
            <DetailRow icon={<Mail className="h-4 w-4" />} label="Email" value={orDash(company.email)} />
            <DetailRow icon={<Globe className="h-4 w-4" />} label="Subdomain" value={orDash(company.subdomain)} />
            <DetailRow icon={<Globe className="h-4 w-4" />} label="Domain" value={orDash(company.domain)} />
            <DetailRow icon={<Database className="h-4 w-4" />} label="DB Name" value={orDash(company.db_name)} />
            <DetailRow icon={<Database className="h-4 w-4" />} label="DB Type" value={company.db_type} />
            <DetailRow
              icon={<Activity className="h-4 w-4" />}
              label="Active"
              value={
                <span
                  className={cn(
                    'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white',
                    active ? 'bg-emerald-500' : 'bg-gray-400'
                  )}
                >
                  {active ? 'Active' : 'Inactive'}
                </span>
              }
            />
          </dl>
        </section>

        {/* Subscription Info */}
        <section className="rounded-lg border bg-card p-5">
          <div className="mb-4 flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-purple-500" />
            <h2 className="font-semibold">Subscription</h2>
          </div>
          <dl className="space-y-3 text-sm">
            <DetailRow
              icon={<Activity className="h-4 w-4" />}
              label="Status"
              value={
                <span
                  className={cn(
                    'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white',
                    statusColorMap[company.subscription_status || ''] ||
                      'bg-gray-400'
                  )}
                >
                  {company.subscription_status || 'none'}
                </span>
              }
            />
            <DetailRow
              icon={<Hash className="h-4 w-4" />}
              label="Plan"
              value={orDash(company.plan_name ?? subscription?.plan_name) || '—'}
            />
            <DetailRow
              icon={<Calendar className="h-4 w-4" />}
              label="Expires"
              value={fmtDate(
                company.subscription_expires_at ??
                  subscription?.subscription_expires_at
              )}
            />
            <DetailRow
              icon={<CreditCard className="h-4 w-4" />}
              label="Stripe Customer"
              value={
                <span className="font-mono text-xs">
                  {orDash(company.stripe_customer_id)}
                </span>
              }
            />
            <DetailRow
              icon={<CreditCard className="h-4 w-4" />}
              label="Stripe Subscription"
              value={
                <span className="font-mono text-xs">
                  {orDash(
                    company.stripe_subscription_id ??
                      subscription?.stripe_subscription_id
                  )}
                </span>
              }
            />
            <DetailRow
              icon={<Calendar className="h-4 w-4" />}
              label="Created"
              value={fmtDateTime(company.created_at)}
            />
          </dl>
        </section>

        {/* Domain Configuration Info */}
        <section className="rounded-lg border bg-card p-5">
          <div className="mb-4 flex items-center gap-2">
            <Server className="h-5 w-5 text-purple-500" />
            <h2 className="font-semibold">Custom Domain</h2>
          </div>
          {domainsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : domainsError ? (
            <div className="text-center py-6">
              <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
              <p className="text-sm text-red-600">Error loading domain information</p>
              <p className="text-xs text-muted-foreground mt-1">{domainsError.message}</p>
            </div>
          ) : domains.length === 0 ? (
            <div className="text-center py-6">
              <Globe className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No custom domain configured</p>
            </div>
          ) : (
            <div className="space-y-4">
              {domains.map((domain) => (
                <div key={domain.id} className="border rounded-lg p-3 space-y-2">
                  {/* Domain Header */}
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{domain.domain}</span>
                    <DomainStatusBadge status={domain.status} />
                  </div>

                  {/* Error Message */}
                  {domain.error && (
                    <div className="flex items-start gap-2 text-xs text-red-600 bg-red-50 dark:bg-red-950/20 p-2 rounded">
                      <AlertTriangle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                      <span>{domain.error}</span>
                    </div>
                  )}

                  {/* Domain Details */}
                  <dl className="space-y-1.5 text-xs">
                    {/* Real SSL Verification */}
                    {domain.realSSL ? (
                      <>
                        <div className={`p-2 rounded text-xs ${domain.realSSL.valid ? 'bg-green-50 dark:bg-green-950/20' : 'bg-amber-50 dark:bg-amber-950/20'}`}>
                          <div className="flex items-center gap-1.5 mb-1">
                            {domain.realSSL.valid ? (
                              <CheckCircle className="h-3 w-3 text-green-600" />
                            ) : (
                              <AlertTriangle className="h-3 w-3 text-amber-600" />
                            )}
                            <span className="font-medium">
                              {domain.realSSL.valid ? 'SSL Verified' : 'SSL Check Failed'}
                            </span>
                          </div>
                          <div className="space-y-0.5 text-muted-foreground">
                            {domain.realSSL.subject && (
                              <div>Subject: {domain.realSSL.subject}</div>
                            )}
                            {domain.realSSL.issuer && (
                              <div>Issuer: {domain.realSSL.issuer}</div>
                            )}
                            {domain.realSSL.expiresAt && (
                              <div>Expires: {fmtDate(domain.realSSL.expiresAt)}</div>
                            )}
                            {domain.realSSL.daysUntilExpiry !== undefined && (
                              <div>
                                {domain.realSSL.daysUntilExpiry > 0
                                  ? `${domain.realSSL.daysUntilExpiry} days until expiry`
                                  : `Expired by ${Math.abs(domain.realSSL.daysUntilExpiry)} days`}
                              </div>
                            )}
                            <div className="text-[10px] opacity-75">{domain.realSSL.message}</div>
                          </div>
                        </div>

                        {/* Domain Management */}
                        <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700 space-y-2">
                          <div className="flex gap-2">
                            {!domain.dnsVerifiedAt && (
                              <Button
                                onClick={() => verifyDNS.mutate({ companyId: id, domainId: domain.id })}
                                disabled={verifyDNS.isPending}
                                className="flex-1 bg-blue-600 hover:bg-blue-700 text-xs"
                                size="sm"
                              >
                                {verifyDNS.isPending ? (
                                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                ) : (
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                )}
                                Verify DNS
                              </Button>
                            )}
                            <Button
                              onClick={() => recheckSSL.mutate({ companyId: id, domainId: domain.id })}
                              disabled={recheckSSL.isPending}
                              variant="outline"
                              size="sm"
                              className="flex-1 text-xs"
                            >
                              {recheckSSL.isPending ? (
                                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                              ) : (
                                <RefreshCw className="h-3 w-3 mr-1" />
                              )}
                              Re-Check SSL
                            </Button>
                            {domain.dnsVerifiedAt && !domain.realSSL?.valid && (
                              <Button
                                onClick={() => installSSL.mutate({ companyId: id, domainId: domain.id })}
                                disabled={installSSL.isPending}
                                className="flex-1 bg-green-600 hover:bg-green-700 text-xs"
                                size="sm"
                              >
                                {installSSL.isPending ? (
                                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                ) : (
                                  <Lock className="h-3 w-3 mr-1" />
                                )}
                                Install SSL
                              </Button>
                            )}
                          </div>
                          {domain.status === 'ssl_installed' && (
                            <Button
                              onClick={() => goLive.mutate({ companyId: id, domainId: domain.id })}
                              disabled={goLive.isPending}
                              className="w-full bg-emerald-600 hover:bg-emerald-700 text-xs"
                              size="sm"
                            >
                              {goLive.isPending ? (
                                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                              ) : (
                                <Globe className="h-3 w-3 mr-1" />
                              )}
                              Go Live
                            </Button>
                          )}
                        </div>
                      </>
                    ) : (
                      <DetailRow
                        icon={<Lock className="h-3 w-3" />}
                        label="SSL (DB)"
                        value={domain.sslExpiry ? `Expires: ${fmtDate(domain.sslExpiry)}` : 'Not configured'}
                      />
                    )}
                    <DetailRow
                      icon={<Server className="h-3 w-3" />}
                      label="DNS"
                      value={domain.dnsVerifiedAt ? `Verified: ${fmtDateTime(domain.dnsVerifiedAt)}` : 'Not verified'}
                    />
                    <DetailRow
                      icon={<Clock className="h-3 w-3" />}
                      label="Created"
                      value={fmtDateTime(domain.createdAt)}
                    />
                  </dl>

                {/* Domain Management */}
                {domain.status === 'live' && (
                  <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                      <Button
                        onClick={() => deactivateDomain.mutate({ companyId: id, domainId: domain.id })}
                        disabled={deactivateDomain.isPending}
                        variant="outline"
                        size="sm"
                        className="w-full text-xs"
                      >
                        {deactivateDomain.isPending ? (
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        ) : (
                          <Globe className="h-3 w-3 mr-1" />
                        )}
                        Deactivate Domain
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Custom Domain — superadmin review workflow */}
      <DomainReviewSection companyId={company.id} />
    </div>
  )
}

// ── Edit Company Dialog ──────────────────────────────────────────────────

const editCompanySchema = z.object({
  name: z.string().min(1, 'Company name is required'),
  email: z.string().email('Invalid email address').or(z.literal('')).optional(),
  plan_id: z.string().optional(),
  subscription_status: z.string().optional(),
  subscription_expires_at: z.string().optional(),
})

type EditCompanyFormValues = z.infer<typeof editCompanySchema>

const SUBSCRIPTION_STATUSES = ['trialing', 'active', 'past_due', 'expired', 'canceled']

function EditCompanyDialog({
  company,
  open,
  onOpenChange,
}: {
  company: PlatformCompany
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const updateCompany = useUpdateCompany()
  const { data: plansData } = useAdminPlans({ status: 'active' })

  const plans: Array<Record<string, unknown>> = useMemo(() => {
    if (Array.isArray(plansData)) return plansData as Array<Record<string, unknown>>
    const maybe = plansData as
      | { items?: Array<Record<string, unknown>>; data?: Array<Record<string, unknown>> }
      | undefined
    return maybe?.items ?? maybe?.data ?? []
  }, [plansData])

  const form = useForm<EditCompanyFormValues>({
    resolver: zodResolver(editCompanySchema),
    values: {
      name: company.name,
      email: company.email ?? '',
      plan_id: company.plan_id ? String(company.plan_id) : '',
      subscription_status: company.subscription_status || '',
      subscription_expires_at: company.subscription_expires_at
        ? company.subscription_expires_at.slice(0, 10)
        : '',
    },
  })

  const onSubmit = (values: EditCompanyFormValues) => {
    const payload: Record<string, unknown> = { name: values.name }
    if (values.email !== undefined) payload.email = values.email || null
    if (values.plan_id) payload.plan_id = Number(values.plan_id)
    if (values.subscription_status) payload.subscription_status = values.subscription_status
    if (values.subscription_expires_at) payload.subscription_expires_at = values.subscription_expires_at

    updateCompany.mutate(
      { id: company.id, data: payload },
      { onSuccess: () => onOpenChange(false) }
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Company</DialogTitle>
          <DialogDescription>
            Update {company.name}'s details, plan, and subscription status.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="plan_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subscription Plan</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a plan" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {plans.length === 0 ? (
                        <SelectItem value="_none" disabled>
                          No plans available
                        </SelectItem>
                      ) : (
                        plans.map((plan) => (
                          <SelectItem key={String(plan.id)} value={String(plan.id)}>
                            {String(plan.name)}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="subscription_status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subscription Status</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {SUBSCRIPTION_STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="subscription_expires_at"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subscription Expires</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={updateCompany.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={updateCompany.isPending}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {updateCompany.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

// ── Domain Review Section ────────────────────────────────────────────────

const domainStatusColorMap: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  verifying: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  verified: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  ssl_generating: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  ssl_installed: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  live: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  error: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

function DomainReviewSection({ companyId }: { companyId: number }) {
  const { data: domains, isLoading } = useCompanyDomains(companyId)
  const verifyDNS = useVerifyDomainDNS(companyId)
  const installSSL = useInstallDomainSSL(companyId)
  const goLive = useGoLiveDomain(companyId)
  const deactivate = useDeactivateDomain(companyId)
  const recheckSSL = useRecheckDomainSSL(companyId)

  return (
    <section className="rounded-lg border bg-card p-5">
      <div className="mb-4 flex items-center gap-2">
        <Globe className="h-5 w-5 text-purple-500" />
        <h2 className="font-semibold">Custom Domain Requests</h2>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-purple-500" />
        </div>
      ) : !domains || domains.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No custom domain has been requested by this tenant yet.
        </p>
      ) : (
        <div className="space-y-4">
          {domains.map((d) => (
            <DomainReviewRow
              key={d.id}
              domain={d}
              onVerifyDNS={() => verifyDNS.mutate(d.id)}
              onInstallSSL={() => installSSL.mutate(d.id)}
              onGoLive={() => goLive.mutate(d.id)}
              onDeactivate={() => deactivate.mutate(d.id)}
              onRecheckSSL={() => recheckSSL.mutate(d.id)}
              verifyPending={verifyDNS.isPending}
              installPending={installSSL.isPending}
              goLivePending={goLive.isPending}
              deactivatePending={deactivate.isPending}
              recheckPending={recheckSSL.isPending}
            />
          ))}
        </div>
      )}
    </section>
  )
}

interface DomainReviewRowProps {
  domain: PlatformCompanyDomain
  onVerifyDNS: () => void
  onInstallSSL: () => void
  onGoLive: () => void
  onDeactivate: () => void
  onRecheckSSL: () => void
  verifyPending: boolean
  installPending: boolean
  goLivePending: boolean
  deactivatePending: boolean
  recheckPending: boolean
}

function DomainReviewRow({
  domain,
  onVerifyDNS,
  onInstallSSL,
  onGoLive,
  onDeactivate,
  onRecheckSSL,
  verifyPending,
  installPending,
  goLivePending,
  deactivatePending,
  recheckPending,
}: DomainReviewRowProps) {
  return (
    <div className="rounded-lg border p-4 space-y-3">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="font-medium">{domain.domain}</p>
          <p className="text-xs text-muted-foreground">
            Requested {fmtDateTime(domain.createdAt)}
          </p>
        </div>
        <Badge
          className={cn(
            'font-medium',
            domainStatusColorMap[domain.status] || 'bg-gray-100 text-gray-700'
          )}
        >
          {domain.status.replace('_', ' ')}
        </Badge>
      </div>

      {domain.error && (
        <div className="flex items-start gap-2 rounded-md bg-red-50 dark:bg-red-950/30 p-3 text-xs text-red-700 dark:text-red-400">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{domain.error}</span>
        </div>
      )}

      {domain.status !== 'live' && domain.status !== 'verified' && domain.status !== 'ssl_installed' && (
        <div className="rounded-md bg-blue-50 dark:bg-blue-950/20 p-3 text-xs space-y-2">
          <div>
            <p className="text-blue-900 dark:text-blue-100 mb-1">
              Expected A record (host <span className="font-mono">@</span>) — required before SSL install:
            </p>
            <p className="font-mono text-blue-800 dark:text-blue-200 break-all">
              {domain.ipAddress || 'not set — install will fail until this domain has an A record'}
            </p>
          </div>
          {domain.dnsToken && (
            <div>
              <p className="text-blue-900 dark:text-blue-100 mb-1">
                Expected DNS TXT record (host <span className="font-mono">@</span>):
              </p>
              <p className="font-mono text-blue-800 dark:text-blue-200 break-all">{domain.dnsToken}</p>
            </div>
          )}
        </div>
      )}

      {domain.status === 'live' && domain.realSSL && (
        <p className="text-xs text-muted-foreground">
          Live SSL check: {domain.realSSL.valid ? '✅ ' : '⚠️ '}
          {domain.realSSL.message}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        {(domain.status === 'pending' || domain.status === 'error') && (
          <Button size="sm" onClick={onVerifyDNS} disabled={verifyPending}>
            {verifyPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <ShieldCheck className="h-4 w-4 mr-2" />
            )}
            Verify DNS
          </Button>
        )}

        {domain.status === 'verified' && (
          <Button size="sm" onClick={onInstallSSL} disabled={installPending}>
            {installPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Lock className="h-4 w-4 mr-2" />
            )}
            Install SSL
          </Button>
        )}

        {domain.status === 'ssl_installed' && (
          <Button size="sm" onClick={onGoLive} disabled={goLivePending}>
            {goLivePending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Rocket className="h-4 w-4 mr-2" />
            )}
            Go Live
          </Button>
        )}

        {domain.status === 'live' && (
          <>
            <Button size="sm" variant="outline" onClick={onRecheckSSL} disabled={recheckPending}>
              {recheckPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Recheck SSL
            </Button>
            <Button size="sm" variant="destructive" onClick={onDeactivate} disabled={deactivatePending}>
              {deactivatePending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <PowerOff className="h-4 w-4 mr-2" />
              )}
              Deactivate
            </Button>
          </>
        )}
      </div>
    </div>
  )
}

// ── Sub-components ──────────────────────────────────────────────────────

function BackLink() {
  return (
    <div>
      <Button asChild variant="ghost" size="sm" className="text-muted-foreground">
        <Link to="/admin/companies">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Companies
        </Link>
      </Button>
    </div>
  )
}

interface DetailRowProps {
  icon: React.ReactNode
  label: string
  value: React.ReactNode
}

function DetailRow({ icon, label, value }: DetailRowProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="flex items-center gap-2 text-muted-foreground">
        <span className="text-purple-400">{icon}</span>
        {label}
      </dt>
      <dd className="font-medium text-right break-all">{value}</dd>
    </div>
  )
}

interface DomainStatusBadgeProps {
  status: CompanyDomain['status']
}

function DomainStatusBadge({ status }: DomainStatusBadgeProps) {
  const statusConfig: Record<CompanyDomain['status'], { label: string; color: string; icon: React.ReactNode }> = {
    pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400', icon: <Clock className="h-3 w-3" /> },
    verifying: { label: 'Verifying', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', icon: <Loader2 className="h-3 w-3 animate-spin" /> },
    verified: { label: 'Verified', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', icon: <CheckCircle className="h-3 w-3" /> },
    ssl_generating: { label: 'SSL Gen', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', icon: <Loader2 className="h-3 w-3 animate-spin" /> },
    ssl_installed: { label: 'SSL Ready', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400', icon: <Lock className="h-3 w-3" /> },
    live: { label: 'Live', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', icon: <Globe className="h-3 w-3" /> },
    error: { label: 'Error', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', icon: <XCircle className="h-3 w-3" /> },
  }

  const config = statusConfig[status]
  return (
    <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium', config.color)}>
      {config.icon}
      {config.label}
    </span>
  )
}
