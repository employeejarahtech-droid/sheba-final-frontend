import { createFileRoute } from '@tanstack/react-router'
import {
  Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend,
} from 'recharts'
import { DollarSign, PieChart as PieIcon, MapPin, Boxes } from 'lucide-react'
import { AppHeader } from '@/components/layout/app-header'
import { Main } from '@/components/layout/main'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useCurrency } from '@/hooks/use-currency'
import { useAssetStatisticsQuery } from '@/features/assets/assetQueries'

export const Route = createFileRoute('/_authenticated/dashboard/assets/statistics/')({
  component: AssetStatisticsPage,
})

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6']

function AssetStatisticsPage() {
  const { currencySymbol } = useCurrency()
  const { data } = useAssetStatisticsQuery()
  const d = data || { total_value: 0, by_status: [], by_category: [], by_location: [] }
  const statusData = d.by_status.map((s) => ({ name: s.status.replace('_', ' '), value: s.count }))

  return (
    <>
      <AppHeader fixed />
      <Main>
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">Asset Statistics</h1>
          <p className="text-muted-foreground text-sm">Analytics across categories, locations and status</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
          <Card className="overflow-hidden transition-all duration-300 gap-0 shadow-none p-0 border">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b py-2 px-4 gap-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg shadow-lg"><DollarSign className="h-4 w-4 text-white" /></div>
                <CardTitle className="text-sm font-semibold">Total Asset Value</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-4"><div className="text-2xl font-bold">{currencySymbol} {Number(d.total_value).toLocaleString()}</div></CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card className="overflow-hidden transition-all duration-300 gap-0 shadow-none p-0 border">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b py-2 px-4 gap-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg shadow-lg"><Boxes className="h-4 w-4 text-white" /></div>
                <div><CardTitle className="text-lg font-bold">Value by Category</CardTitle><CardDescription className="text-xs text-gray-600 dark:text-gray-400">Total purchase value</CardDescription></div>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              {d.by_category.length === 0 ? <p className="py-16 text-center text-sm text-muted-foreground">No data.</p> : (
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={d.by_category}>
                      <XAxis dataKey="name" fontSize={12} /><YAxis fontSize={12} /><Tooltip />
                      <Bar dataKey="value" name="Value" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="overflow-hidden transition-all duration-300 gap-0 shadow-none p-0 border">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b py-2 px-4 gap-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-gradient-to-br from-violet-500 to-purple-500 rounded-lg shadow-lg"><PieIcon className="h-4 w-4 text-white" /></div>
                <div><CardTitle className="text-lg font-bold">Assets by Status</CardTitle><CardDescription className="text-xs text-gray-600 dark:text-gray-400">Distribution by lifecycle</CardDescription></div>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              {statusData.length === 0 ? <p className="py-16 text-center text-sm text-muted-foreground">No data.</p> : (
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={statusData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={4} dataKey="value" label={(p: any) => `${p.name} (${p.value})`}>
                        {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip /><Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="mt-4">
          <Card className="overflow-hidden transition-all duration-300 gap-0 shadow-none p-0 border">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b py-2 px-4 gap-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-gradient-to-br from-orange-500 to-amber-500 rounded-lg shadow-lg"><MapPin className="h-4 w-4 text-white" /></div>
                <div><CardTitle className="text-lg font-bold">Assets by Location</CardTitle><CardDescription className="text-xs text-gray-600 dark:text-gray-400">Count per location</CardDescription></div>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              {d.by_location.length === 0 ? <p className="py-16 text-center text-sm text-muted-foreground">No data.</p> : (
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={d.by_location} layout="vertical">
                      <XAxis type="number" allowDecimals={false} fontSize={12} /><YAxis type="category" dataKey="name" width={140} fontSize={12} /><Tooltip />
                      <Bar dataKey="count" name="Assets" fill="#6366f1" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </Main>
    </>
  )
}
