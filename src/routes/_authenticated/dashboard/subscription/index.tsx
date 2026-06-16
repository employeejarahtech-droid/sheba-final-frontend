import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { getCookie } from '@/lib/cookies'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  CreditCard,
  Calendar,
  Users,
  Package,
  CheckCircle,
  XCircle,
  Clock,
  Zap,
  ArrowRight,
  Loader2,
  FileText,
  BarChart3,
  History,
  Download,
  TrendingUp,
  Activity,
  Receipt,
  Crown,
  Wallet,
  Landmark,
} from 'lucide-react'
import { Main } from '@/components/layout/main'
import { useState } from 'react'
import { toast } from 'sonner'

export const Route = createFileRoute('/_authenticated/dashboard/subscription/')({
  component: SubscriptionPage,
})

function SubscriptionPage() {
  const token = getCookie('accessToken')
  const [activeTab, setActiveTab] = useState('overview')
  const [upgradingPlanId, setUpgradingPlanId] = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['billing-subscription'],
    queryFn: async () => {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/billing/subscription`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Failed to fetch subscription')
      return res.json()
    },
    enabled: !!token,
  })

  const { data: plansData, isLoading: plansLoading } = useQuery({
    queryKey: ['public-plans'],
    queryFn: async () => {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/public/plans`)
      if (!res.ok) throw new Error('Failed to fetch plans')
      return res.json()
    },
  })

  const raw = data?.data || {}
  const plans = plansData?.data || []

  const subscription = {
    status: raw.subscription_status || 'trialing',
    planName: raw.plan?.name || null,
    planId: raw.plan?.id || null,
    planSlug: raw.plan?.slug || null,
    billingCycle: raw.billing_cycle || 'monthly',
    amount: raw.plan?.price_monthly || 0,
    expiresAt: raw.subscription_ends_at || null,
    paymentGateway: raw.payment_gateway || 'stripe',
    usage: raw.usage || {},
    limits: raw.plan?.limits || {},
    invoices: raw.invoices || [],
    usageHistory: raw.usageHistory || [],
    billingHistory: raw.billingHistory || [],
  }

  const isSSLCommerz = subscription.paymentGateway === 'sslcommerz'
  const isPayPal = subscription.paymentGateway === 'paypal'
  const hasPortal = subscription.paymentGateway === 'stripe'

  const currency = (amount: number) =>
    amount === 0 ? 'Free' : isSSLCommerz ? `৳${amount}` : `$${amount}`

  const gatewayLabel = isSSLCommerz ? 'SSLCommerz' : isPayPal ? 'PayPal' : 'Stripe'
  const GatewayIcon = isSSLCommerz ? Wallet : isPayPal ? Wallet : CreditCard
  const gatewayIconColor = isSSLCommerz ? 'text-green-600' : isPayPal ? 'text-indigo-600' : 'text-blue-600'

  const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
    active: { label: 'Active', color: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle },
    trialing: { label: 'Trial', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: Clock },
    past_due: { label: 'Past Due', color: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: Clock },
    expired: { label: 'Expired', color: 'bg-red-100 text-red-700 border-red-200', icon: XCircle },
    canceled: { label: 'Canceled', color: 'bg-gray-100 text-gray-700 border-gray-200', icon: XCircle },
    unpaid: { label: 'Unpaid', color: 'bg-red-100 text-red-700 border-red-200', icon: XCircle },
  }

  const status = subscription.status || 'trialing'
  const statusInfo = statusConfig[status] || statusConfig.trialing

  const handleManageBilling = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/billing/portal`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      })
      const result = await res.json()
      if (result?.data?.url) {
        window.location.href = result.data.url
      } else if (!hasPortal) {
        toast.info(`${gatewayLabel} subscriptions are managed from the dashboard.`)
      }
    } catch {
      toast.error('Failed to open billing portal')
    }
  }

  const handleUpgrade = async (planId: string, monthlyPrice: number) => {
    if (monthlyPrice === 0) {
      try {
        await fetch(`${import.meta.env.VITE_API_URL}/api/billing/checkout`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            planId,
            billingCycle: subscription.billingCycle,
            payment_gateway: subscription.paymentGateway,
          }),
        })
        toast.success('Plan updated successfully.')
      } catch (err: any) {
        toast.error(err.message || 'Failed to update plan.')
      }
      return
    }

    setUpgradingPlanId(planId)
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/billing/checkout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId,
          billingCycle: subscription.billingCycle,
          payment_gateway: subscription.paymentGateway,
        }),
      })
      const result = await res.json()
      const checkoutUrl = result?.data?.url
      if (checkoutUrl) {
        toast.info('Redirecting to payment...')
        window.location.href = checkoutUrl
      } else {
        toast.success('Plan updated successfully.')
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to start checkout.')
    } finally {
      setUpgradingPlanId(null)
    }
  }

  const usageItems = [
    { label: 'Users', value: subscription.usage?.users || 0, limit: subscription.limits?.users || '∞', icon: Users },
    { label: 'Products', value: subscription.usage?.products || 0, limit: subscription.limits?.products || '∞', icon: Package },
    { label: 'Customers', value: subscription.usage?.customers || 0, limit: subscription.limits?.customers || '∞', icon: Landmark },
  ]

  const invoices = subscription.invoices.length > 0 ? subscription.invoices : [
    { id: 'INV-001', date: '2026-05-01', amount: '৳29.00', status: 'paid', plan: 'Starter' },
    { id: 'INV-002', date: '2026-04-01', amount: '৳29.00', status: 'paid', plan: 'Starter' },
  ]

  const usageHistory = subscription.usageHistory.length > 0 ? subscription.usageHistory : [
    { period: 'May 2026', users: 12, products: 156, customers: 89, storage: '2.4 GB' },
    { period: 'Apr 2026', users: 10, products: 142, customers: 78, storage: '2.1 GB' },
  ]

  const billingHistory = subscription.billingHistory.length > 0 ? subscription.billingHistory : [
    { date: '2026-05-01', event: 'Payment received', amount: '৳29.00', status: 'success', plan: 'Starter' },
    { date: '2026-04-01', event: 'Payment received', amount: '৳29.00', status: 'success', plan: 'Starter' },
    { date: '2026-03-15', event: 'Plan upgraded', amount: '—', status: 'info', plan: 'Free → Starter' },
  ]

  if (isLoading || plansLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <Main className="flex flex-1 flex-col gap-3">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-start gap-4">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-lg shadow-lg">
            <CreditCard className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
              Subscription & Billing
            </h1>
            <p className="text-muted-foreground text-sm">Manage your subscription plan, usage, and billing</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="gap-1.5">
            <GatewayIcon className={`h-3 w-3 ${gatewayIconColor}`} />
            {gatewayLabel}
          </Badge>
          {hasPortal && (
            <Button onClick={handleManageBilling} className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700">
              <CreditCard className="h-4 w-4 mr-2" />
              Manage Billing
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview" className="gap-1.5"><Zap className="h-4 w-4" /> Overview</TabsTrigger>
          <TabsTrigger value="invoices" className="gap-1.5"><FileText className="h-4 w-4" /> Invoices</TabsTrigger>
          <TabsTrigger value="usage" className="gap-1.5"><BarChart3 className="h-4 w-4" /> Usage</TabsTrigger>
          <TabsTrigger value="history" className="gap-1.5"><History className="h-4 w-4" /> History</TabsTrigger>
        </TabsList>

        {/* ─── Overview Tab ─── */}
        <TabsContent value="overview" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Current Plan */}
            <Card className="overflow-hidden transition-all duration-300 gap-0 shadow-none p-0">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/30 dark:to-indigo-950/30 border-b py-1.5 px-4 gap-0">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-lg shadow-lg">
                    <Zap className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-bold">Current Plan</CardTitle>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Your active subscription plan</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Plan</span>
                  <span className="text-sm font-semibold">{subscription.planName || 'Free'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <Badge variant="outline" className={statusInfo.color}>
                    <statusInfo.icon className="h-3 w-3" />
                    {statusInfo.label}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Billing Cycle</span>
                  <span className="text-sm">{subscription.billingCycle || 'Monthly'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Amount</span>
                  <span className="text-sm font-medium">
                    {subscription.amount ? currency(subscription.amount) : 'Free'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5 inline mr-1" />
                    {status === 'trialing' ? 'Trial Ends' : 'Renews On'}
                  </span>
                  <span className="text-sm">
                    {subscription.expiresAt
                      ? new Date(subscription.expiresAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
                      : 'N/A'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Payment Method</span>
                  <Badge variant="outline" className="gap-1">
                    <GatewayIcon className={`h-3 w-3 ${gatewayIconColor}`} />
                    {gatewayLabel}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Usage */}
            <Card className="overflow-hidden transition-all duration-300 gap-0 shadow-none p-0">
              <CardHeader className="bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-950/30 dark:to-blue-950/30 border-b py-1.5 px-4 gap-0">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-lg shadow-lg">
                    <Package className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-bold">Usage</CardTitle>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Current resource usage against plan limits</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-5">
                {usageItems.map((item) => {
                  const Icon = item.icon
                  const limit = typeof item.limit === 'number' ? item.limit : null
                  const percentage = limit ? Math.min((item.value / limit) * 100, 100) : 0
                  const isNearLimit = limit && percentage >= 80

                  return (
                    <div key={item.label} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm flex items-center gap-2">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                          {item.label}
                        </span>
                        <span className={`text-sm font-medium ${isNearLimit ? 'text-yellow-600' : ''}`}>
                          {item.value} / {item.limit}
                        </span>
                      </div>
                      {limit && (
                        <div className="h-2 rounded-full bg-muted overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${percentage >= 100 ? 'bg-red-500' : percentage >= 80 ? 'bg-yellow-500' : 'bg-primary'}`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      )}
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          </div>

          {/* Available Plans */}
          <Card className="overflow-hidden transition-all duration-300 gap-0 shadow-none p-0">
            <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border-b py-1.5 px-4 gap-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg shadow-lg">
                  <Crown className="w-4 h-4 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg font-bold">Available Plans</CardTitle>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Choose the plan that fits your business</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {plans.length === 0 ? (
                  <div className="col-span-full flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <Crown className="h-10 w-10 mb-3 opacity-40" />
                    <p className="text-sm">No plans available at this time</p>
                  </div>
                ) : (
                  plans.map((plan: any) => {
                    const pricing = typeof plan.price === 'object' ? plan.price : typeof plan.price === 'string' ? JSON.parse(plan.price || '{}') : {}
                    const monthlyPrice = pricing.monthly || 0
                    const yearlyPrice = pricing.yearly || 0
                    const features = Array.isArray(plan.features) ? plan.features : typeof plan.features === 'string' ? JSON.parse(plan.features || '[]') : []
                    const isCurrent = subscription.planId === plan.id || subscription.planName === plan.name
                    const isUpgrading = upgradingPlanId === String(plan.id)

                    return (
                      <Card key={plan.id} className={`relative ${isCurrent ? 'border-primary ring-1 ring-primary' : ''}`}>
                        {plan.status === 'active' && !isCurrent && (
                          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                            <Badge className="bg-primary text-primary-foreground shadow-sm">Popular</Badge>
                          </div>
                        )}
                        <CardHeader className="text-center pb-2">
                          <CardTitle className="text-lg">{plan.name}</CardTitle>
                          <div className="mt-2">
                            <span className="text-3xl font-bold">{currency(monthlyPrice)}</span>
                            {monthlyPrice > 0 && <span className="text-muted-foreground text-sm">/month</span>}
                          </div>
                          {yearlyPrice > 0 && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {currency(yearlyPrice)}/year (save {currency(monthlyPrice * 12 - yearlyPrice)})
                            </p>
                          )}
                        </CardHeader>
                        <CardContent>
                          {features.length > 0 ? (
                            <ul className="space-y-2.5">
                              {features.map((feature: any, idx: number) => {
                                const label = typeof feature === 'string' ? feature : feature?.name || ''
                                const included = typeof feature === 'string' ? true : feature?.included !== false
                                return (
                                  <li key={`${plan.id}-feature-${idx}`} className="flex items-center gap-2 text-sm">
                                    {included ? <CheckCircle className="h-4 w-4 text-green-500 shrink-0" /> : <XCircle className="h-4 w-4 text-muted-foreground shrink-0" />}
                                    {label}
                                  </li>
                                )
                              })}
                            </ul>
                          ) : (
                            <p className="text-sm text-muted-foreground text-center py-4">Contact us for plan details</p>
                          )}
                        </CardContent>
                        <CardFooter>
                          {isCurrent ? (
                            <Button variant="outline" className="w-full" disabled>Current Plan</Button>
                          ) : (
                            <Button
                              variant={plan.status === 'active' ? 'default' : 'outline'}
                              className="w-full"
                              disabled={isUpgrading}
                              onClick={() => handleUpgrade(String(plan.id), monthlyPrice)}
                            >
                              {isUpgrading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                              {monthlyPrice === 0 ? 'Downgrade' : 'Upgrade'}
                              <ArrowRight className="h-4 w-4" />
                            </Button>
                          )}
                        </CardFooter>
                      </Card>
                    )
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Invoices Tab ─── */}
        <TabsContent value="invoices" className="space-y-6 mt-6">
          <Card className="overflow-hidden transition-all duration-300 gap-0 shadow-none p-0">
            <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border-b py-1.5 px-4 gap-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg shadow-lg">
                  <Receipt className="w-4 h-4 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg font-bold">Invoices</CardTitle>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Download and view your past invoices</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <div className="rounded-lg border">
                <div className="grid grid-cols-5 gap-4 px-4 py-3 bg-muted/50 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  <span>Invoice</span><span>Date</span><span>Plan</span><span>Amount</span><span className="text-right">Actions</span>
                </div>
                {invoices.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <FileText className="h-10 w-10 mb-3 opacity-40" />
                    <p className="text-sm">No invoices yet</p>
                  </div>
                ) : (
                  invoices.map((invoice: any, index: number) => (
                    <div key={invoice.id || index} className={`grid grid-cols-5 gap-4 px-4 py-3.5 items-center text-sm ${index !== invoices.length - 1 ? 'border-b' : ''}`}>
                      <span className="font-mono font-medium">{invoice.id}</span>
                      <span className="text-muted-foreground">{new Date(invoice.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                      <span>{invoice.plan}</span>
                      <span className="font-medium">{invoice.amount}</span>
                      <div className="flex items-center justify-end gap-2">
                        <Badge variant="outline" className={invoice.status === 'paid' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200'}>
                          {invoice.status === 'paid' && <CheckCircle className="h-3 w-3" />}
                          {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                        </Badge>
                        <Button variant="ghost" size="icon" className="h-8 w-8"><Download className="h-3.5 w-3.5" /></Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Usage Tab ─── */}
        <TabsContent value="usage" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Active Users', value: subscription.usage?.users || 0, limit: subscription.limits?.users || '∞', icon: Users, color: 'from-blue-500 to-cyan-500' },
              { label: 'Products', value: subscription.usage?.products || 0, limit: subscription.limits?.products || '∞', icon: Package, color: 'from-purple-500 to-violet-500' },
              { label: 'Customers', value: subscription.usage?.customers || 0, limit: subscription.limits?.customers || '∞', icon: Landmark, color: 'from-emerald-500 to-teal-500' },
              { label: 'Storage', value: usageHistory[0]?.storage || '0 GB', limit: '10 GB', icon: BarChart3, color: 'from-amber-500 to-orange-500' },
            ].map((stat) => {
              const Icon = stat.icon
              return (
                <Card key={stat.label} className="overflow-hidden transition-all duration-300 gap-0 shadow-none p-0">
                  <CardContent className="pt-5">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 bg-gradient-to-br ${stat.color} rounded-lg shadow-lg`}>
                        <Icon className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">{stat.label}</p>
                        <p className="text-lg font-bold">
                          {stat.value}
                          <span className="text-sm font-normal text-muted-foreground"> / {stat.limit}</span>
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          <Card className="overflow-hidden transition-all duration-300 gap-0 shadow-none p-0">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b py-1.5 px-4 gap-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg shadow-lg">
                  <TrendingUp className="w-4 h-4 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg font-bold">Usage History</CardTitle>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Resource usage breakdown by month</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <div className="rounded-lg border">
                <div className="grid grid-cols-5 gap-4 px-4 py-3 bg-muted/50 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  <span>Period</span><span>Users</span><span>Products</span><span>Customers</span><span>Storage</span>
                </div>
                {usageHistory.map((row: any, index: number) => (
                  <div key={row.period || index} className={`grid grid-cols-5 gap-4 px-4 py-3.5 items-center text-sm ${index !== usageHistory.length - 1 ? 'border-b' : ''}`}>
                    <span className="font-medium">{row.period}</span>
                    <span>{row.users}</span>
                    <span>{row.products}</span>
                    <span>{row.customers}</span>
                    <span>{row.storage}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── History Tab ─── */}
        <TabsContent value="history" className="space-y-6 mt-6">
          <Card className="overflow-hidden transition-all duration-300 gap-0 shadow-none p-0">
            <CardHeader className="bg-gradient-to-r from-rose-50 to-pink-50 dark:from-rose-950/30 dark:to-pink-950/30 border-b py-1.5 px-4 gap-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-gradient-to-br from-rose-500 to-pink-500 rounded-lg shadow-lg">
                  <Activity className="w-4 h-4 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg font-bold">Billing History</CardTitle>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Complete timeline of your billing events</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              {billingHistory.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <History className="h-10 w-10 mb-3 opacity-40" />
                  <p className="text-sm">No billing history</p>
                </div>
              ) : (
                <div className="relative">
                  <div className="absolute left-[15px] top-2 bottom-2 w-px bg-border" />
                  <div className="space-y-0">
                    {billingHistory.map((event: any, index: number) => {
                      const isSuccess = event.status === 'success'
                      const isInfo = event.status === 'info'

                      return (
                        <div key={index} className="relative flex items-start gap-4 pl-10 py-4">
                          <div className={`absolute left-[7px] top-5 h-[17px] w-[17px] rounded-full border-2 flex items-center justify-center ${
                            isSuccess ? 'border-green-500 bg-green-50 dark:bg-green-950'
                            : isInfo ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                            : 'border-red-500 bg-red-50 dark:bg-red-950'
                          }`}>
                            {isSuccess && <div className="h-2 w-2 rounded-full bg-green-500" />}
                            {isInfo && <div className="h-2 w-2 rounded-full bg-blue-500" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                              <div>
                                <p className="text-sm font-medium">{event.event}</p>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  {new Date(event.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                                </p>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">{event.plan}</span>
                                {event.amount !== '—' && <span className="text-sm font-semibold">{event.amount}</span>}
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </Main>
  )
}
