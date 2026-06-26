import { createFileRoute, Link } from '@tanstack/react-router'
import {
  Package, DollarSign, Wrench, CheckCircle2, ArrowDownRight, TrendingDown,
  Boxes, CalendarClock, Plus, List, ArrowUpRight,
} from 'lucide-react'
import {
  Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import { AppHeader } from '@/components/layout/app-header'
import { Main } from '@/components/layout/main'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useCurrency } from '@/hooks/use-currency'
import { useAssetDashboardQuery } from '@/features/assets/assetQueries'

export const Route = createFileRoute('/_authenticated/dashboard/assets/')({
  component: AssetsDashboard,
})

const statusVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  active: 'default', in_repair: 'secondary', retired: 'outline', disposed: 'destructive',
}

function AssetsDashboard() {
  const { currencySymbol, format } = useCurrency()
  const { data } = useAssetDashboardQuery()

  const d = data || {
    total_assets: 0, total_value: 0, active: 0, in_repair: 0, retired: 0, disposed: 0,
    by_status: [], by_category: [], upcoming_maintenance: [], recent_assets: [],
  }

  return (
    <>
      <AppHeader fixed />
      <Main>
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Assets Dashboard</h1>
            <p className="text-muted-foreground text-sm">Overview of all hospital assets and their status</p>
          </div>
          <Link to="/dashboard/assets/list/create">
            <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium h-9 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus size={18} /> Add Asset
            </button>
          </Link>
        </div>

        {/* Summary cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <SummaryCard title="Total Assets" value={String(d.total_assets)} icon={Package} gradientClass="from-blue-500 to-indigo-500 shadow-blue-500/20" />
          <SummaryCard title="Total Value" value={format(d.total_value)} icon={DollarSign} gradientClass="from-emerald-500 to-teal-500 shadow-emerald-500/20" />
          <SummaryCard title="Active" value={String(d.active)} subtitle="in service" icon={CheckCircle2} gradientClass="from-violet-500 to-purple-500 shadow-violet-500/20" />
          <SummaryCard title="In Repair" value={String(d.in_repair)} subtitle="under maintenance" icon={Wrench} gradientClass="from-orange-500 to-amber-500 shadow-orange-500/20" />
          <SummaryCard title="Retired" value={String(d.retired)} subtitle="out of use" icon={TrendingDown} gradientClass="from-pink-500 to-rose-500 shadow-pink-500/20" />
          <SummaryCard title="Disposed" value={String(d.disposed)} subtitle="written off" icon={ArrowDownRight} gradientClass="from-red-500 to-orange-500 shadow-red-500/20" />
        </div>

        {/* Quick actions */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <QuickAction to="/dashboard/assets/list" icon={List} title="All Assets" desc="Browse the asset register" />
          <QuickAction to="/dashboard/assets/categories" icon={Boxes} title="Categories" desc="Manage asset categories" />
          <QuickAction to="/dashboard/assets/maintenance" icon={Wrench} title="Maintenance" desc="Schedule maintenance" />
          <QuickAction to="/dashboard/assets/depreciation" icon={TrendingDown} title="Depreciation" desc="Track book value" />
        </div>

        {/* Charts row */}
        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-7">
          <Card className="col-span-1 lg:col-span-4 overflow-hidden transition-all duration-300 gap-0 shadow-none p-0 border">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b py-2 px-4 gap-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg shadow-lg"><Boxes className="h-4 w-4 text-white" /></div>
                <div>
                  <CardTitle className="text-lg font-bold">Assets by Category</CardTitle>
                  <CardDescription className="text-xs text-gray-600 dark:text-gray-400">Count of assets per category</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 ps-2">
              {d.by_category.length === 0 ? (
                <p className="py-16 text-center text-sm text-muted-foreground">No assets yet.</p>
              ) : (
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={d.by_category}>
                      <XAxis dataKey="name" fontSize={12} />
                      <YAxis allowDecimals={false} fontSize={12} />
                      <Tooltip />
                      <Bar dataKey="count" name="Assets" fill="#6366f1" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="col-span-1 lg:col-span-3 overflow-hidden transition-all duration-300 gap-0 shadow-none p-0 border">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b py-2 px-4 gap-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-gradient-to-br from-orange-500 to-amber-500 rounded-lg shadow-lg"><CalendarClock className="h-4 w-4 text-white" /></div>
                <div>
                  <CardTitle className="text-lg font-bold">Upcoming Maintenance</CardTitle>
                  <CardDescription className="text-xs text-gray-600 dark:text-gray-400">Scheduled & in-progress</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              {d.upcoming_maintenance.length === 0 ? (
                <p className="py-16 text-center text-sm text-muted-foreground">No maintenance scheduled.</p>
              ) : (
                <div className="space-y-3">
                  {d.upcoming_maintenance.map((m) => (
                    <div key={m.id} className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
                      <div>
                        <p className="font-medium">{m.asset?.name || `Asset #${m.asset_id}`}</p>
                        <p className="text-sm text-muted-foreground capitalize">{m.type} · {m.scheduled_date || 'No date'}</p>
                      </div>
                      <Badge variant="secondary" className="capitalize">{m.status.replace('_', ' ')}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent assets */}
        <div className="mt-6">
          <Card className="overflow-hidden transition-all duration-300 gap-0 shadow-none p-0 border">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b py-2 px-4 gap-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-gradient-to-br from-violet-500 to-purple-500 rounded-lg shadow-lg"><Package className="h-4 w-4 text-white" /></div>
                <div>
                  <CardTitle className="text-lg font-bold">Recently Added Assets</CardTitle>
                  <CardDescription className="text-xs text-gray-600 dark:text-gray-400">Latest entries in the register</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              {d.recent_assets.length === 0 ? (
                <p className="py-16 text-center text-sm text-muted-foreground">No assets added yet.</p>
              ) : (
                <div className="space-y-3">
                  {d.recent_assets.map((a) => (
                    <div key={a.id} className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
                      <div>
                        <p className="font-medium">{a.name}</p>
                        <p className="text-sm text-muted-foreground">{a.asset_code} · {a.category?.name || 'Uncategorized'} · {currencySymbol} {Number(a.purchase_cost).toLocaleString()}</p>
                      </div>
                      <Badge variant={statusVariant[a.status] || 'outline'} className="capitalize">{a.status.replace('_', ' ')}</Badge>
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
