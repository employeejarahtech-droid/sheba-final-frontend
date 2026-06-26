import { createFileRoute, Link } from '@tanstack/react-router'
import {
  ShoppingCart, FileText, Clock, Truck, CheckCircle2, DollarSign, Bell, Plus, BarChart3,
} from 'lucide-react'
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { AppHeader } from '@/components/layout/app-header'
import { Main } from '@/components/layout/main'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useCurrency } from '@/hooks/use-currency'
import { usePurchaseDashboardQuery } from '@/features/purchase/purchaseQueries'

export const Route = createFileRoute('/_authenticated/dashboard/purchase/')({
  component: PurchaseDashboard,
})

const priorityVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  high: 'destructive', medium: 'secondary', low: 'outline',
}

function PurchaseDashboard() {
  const { format } = useCurrency()
  const { data } = usePurchaseDashboardQuery()
  const d = data || {
    total_requests: 0, pending_requests: 0, approved_requests: 0, active_suppliers: 0,
    total_received_value: 0, by_status: [], recent_requests: [], pending_list: [],
  }

  return (
    <>
      <AppHeader fixed />
      <Main>
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Purchase Dashboard</h1>
            <p className="text-muted-foreground text-sm">Overview of procurement activity</p>
          </div>
          <Link to="/dashboard/purchase/requests/create">
            <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium h-9 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus size={18} /> New Request
            </button>
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <SummaryCard title="Total Requests" value={String(d.total_requests)} icon={FileText} gradientClass="from-blue-500 to-indigo-500 shadow-blue-500/20" />
          <SummaryCard title="Pending" value={String(d.pending_requests)} subtitle="awaiting approval" icon={Clock} gradientClass="from-amber-500 to-orange-500 shadow-amber-500/20" />
          <SummaryCard title="Approved" value={String(d.approved_requests)} subtitle="ready to order" icon={CheckCircle2} gradientClass="from-emerald-500 to-teal-500 shadow-emerald-500/20" />
          <SummaryCard title="Active Suppliers" value={String(d.active_suppliers)} icon={Truck} gradientClass="from-violet-500 to-purple-500 shadow-violet-500/20" />
          <SummaryCard title="Goods Received" value={format(d.total_received_value)} icon={DollarSign} gradientClass="from-pink-500 to-rose-500 shadow-pink-500/20" />
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <QuickAction to="/dashboard/purchase/requests" icon={FileText} title="Purchase Requests" desc="Manage requisitions" />
          <QuickAction to="/dashboard/purchase/requests/pending" icon={Bell} title="Pending Approvals" desc="Approve or reject" />
          <QuickAction to="/dashboard/purchase/goods-receipt" icon={Truck} title="Goods Receipts" desc="Record received goods" />
          <QuickAction to="/dashboard/purchase/suppliers" icon={ShoppingCart} title="Suppliers" desc="Manage vendors" />
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-7">
          <Card className="col-span-1 lg:col-span-4 overflow-hidden transition-all duration-300 gap-0 shadow-none p-0 border">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b py-2 px-4 gap-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg shadow-lg"><BarChart3 className="h-4 w-4 text-white" /></div>
                <div><CardTitle className="text-lg font-bold">Requests by Status</CardTitle><CardDescription className="text-xs text-gray-600 dark:text-gray-400">Count of requisitions</CardDescription></div>
              </div>
            </CardHeader>
            <CardContent className="p-4 ps-2">
              {d.by_status.length === 0 ? <p className="py-16 text-center text-sm text-muted-foreground">No requests yet.</p> : (
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={d.by_status.map((s) => ({ name: s.status, count: s.count }))}>
                      <XAxis dataKey="name" fontSize={12} /><YAxis allowDecimals={false} fontSize={12} /><Tooltip />
                      <Bar dataKey="count" name="Requests" fill="#6366f1" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="col-span-1 lg:col-span-3 overflow-hidden transition-all duration-300 gap-0 shadow-none p-0 border">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b py-2 px-4 gap-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg shadow-lg"><Bell className="h-4 w-4 text-white" /></div>
                <div><CardTitle className="text-lg font-bold">Pending Approvals</CardTitle><CardDescription className="text-xs text-gray-600 dark:text-gray-400">Latest awaiting action</CardDescription></div>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              {d.pending_list.length === 0 ? <p className="py-16 text-center text-sm text-muted-foreground">Nothing pending.</p> : (
                <div className="space-y-3">
                  {d.pending_list.map((r) => (
                    <div key={r.id} className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
                      <div>
                        <p className="font-medium">{r.item_name}</p>
                        <p className="text-sm text-muted-foreground">{r.request_no} · {r.department || '—'}</p>
                      </div>
                      <Badge variant={priorityVariant[r.priority] || 'outline'} className="capitalize">{r.priority}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="mt-6">
          <Card className="overflow-hidden transition-all duration-300 gap-0 shadow-none p-0 border">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b py-2 px-4 gap-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-gradient-to-br from-violet-500 to-purple-500 rounded-lg shadow-lg"><FileText className="h-4 w-4 text-white" /></div>
                <div><CardTitle className="text-lg font-bold">Recent Requests</CardTitle><CardDescription className="text-xs text-gray-600 dark:text-gray-400">Latest requisitions raised</CardDescription></div>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              {d.recent_requests.length === 0 ? <p className="py-16 text-center text-sm text-muted-foreground">No requests yet.</p> : (
                <div className="space-y-3">
                  {d.recent_requests.map((r) => (
                    <div key={r.id} className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
                      <div>
                        <p className="font-medium">{r.item_name}</p>
                        <p className="text-sm text-muted-foreground">{r.request_no} · {r.supplier?.name || 'No supplier'} · {format(r.estimated_cost)}</p>
                      </div>
                      <Badge variant="secondary" className="capitalize">{r.status}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </Main>
    </>
  )
}

function SummaryCard({ title, value, subtitle, icon: Icon, gradientClass }: {
  title: string; value: string; subtitle?: string; icon: React.ElementType; gradientClass: string
}) {
  return (
    <Card className="overflow-hidden transition-all duration-300 gap-0 shadow-none p-0 border">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b py-2 px-4 gap-0">
        <div className="flex items-center gap-2.5">
          <div className={`p-2 bg-gradient-to-br ${gradientClass} rounded-lg shadow-lg`}><Icon className="h-4 w-4 text-white" /></div>
          <CardTitle className="text-sm font-semibold">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <div className="text-2xl font-bold">{value}</div>
        {subtitle && <div className="mt-1 text-muted-foreground text-xs">{subtitle}</div>}
      </CardContent>
    </Card>
  )
}

function QuickAction({ to, icon: Icon, title, desc }: { to: string; icon: React.ElementType; title: string; desc: string }) {
  return (
    <Link to={to}>
      <Card className="cursor-pointer transition-colors hover:border-primary/50 hover:bg-muted/50">
        <CardContent className="flex items-center gap-4 p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10"><Icon className="text-primary h-5 w-5" /></div>
          <div>
            <p className="text-sm font-medium">{title}</p>
            <p className="text-muted-foreground text-xs">{desc}</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
