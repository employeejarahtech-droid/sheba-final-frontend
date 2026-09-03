import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import {
  DollarSign,
  Stethoscope,
  BedDouble,
  TestTube2,
  Receipt,
  UserPlus,
  FilePlus,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Users,
  TrendingUp,
  Activity,
} from 'lucide-react'

import { AppHeader } from '@/components/layout/app-header'
import { Main } from '@/components/layout/main'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useCurrency } from '@/hooks/use-currency'
import { getCookie } from '@/lib/cookies'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DateField } from '@/components/date-field'
import { Overview } from './components/overview'
import { RecentActivity } from './components/recent-activity'
import { DepartmentRevenue } from './components/department-revenue'
import { BedOccupancy } from './components/bed-occupancy'

function toYMD(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

type DashboardProps = {
  /** Selected range from the URL (?from=&to=). Empty until the default is written back. */
  from: string
  to: string
  onRangeChange: (from: string, to: string, replace?: boolean) => void
}

export function Dashboard({ from, to, onRangeChange }: DashboardProps) {
  const { currencySymbol, format } = useCurrency()
  const token = getCookie('accessToken')
  const todayStr = useMemo(() => toYMD(new Date()), [])

  // Default to Today on first load — the range is always reflected in the URL.
  useEffect(() => {
    if (!from || !to) onRangeChange(todayStr, todayStr, true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const effFrom = from || todayStr
  const effTo = to || todayStr

  const datePresets = useMemo(() => {
    const today = () => {
      const d = new Date()
      d.setHours(0, 0, 0, 0)
      return d
    }
    const shift = (n: number) => {
      const d = today()
      d.setDate(d.getDate() - n)
      return d
    }
    return {
      today: { label: 'Today', from: toYMD(today()), to: toYMD(today()) },
      last7: { label: 'Last 7 days', from: toYMD(shift(6)), to: toYMD(today()) },
      last15: { label: 'Last 15 days', from: toYMD(shift(14)), to: toYMD(today()) },
      last30: { label: 'Last 30 days', from: toYMD(shift(29)), to: toYMD(today()) },
      last45: { label: 'Last 45 days', from: toYMD(shift(44)), to: toYMD(today()) },
      last60: { label: 'Last 60 days', from: toYMD(shift(59)), to: toYMD(today()) },
      last90: { label: 'Last 90 days', from: toYMD(shift(89)), to: toYMD(today()) },
      last180: { label: 'Last 180 days', from: toYMD(shift(179)), to: toYMD(today()) },
      last365: { label: 'Last 365 days', from: toYMD(shift(364)), to: toYMD(today()) },
    } as const
  }, [])

  const activePreset = useMemo(() => {
    const match = Object.entries(datePresets).find(
      ([, v]) => v.from === effFrom && v.to === effTo
    )
    return match ? match[0] : 'custom'
  }, [effFrom, effTo, datePresets])

  // Selecting "Custom" reveals the date pickers even while the current
  // from/to still matches a preset.
  const [customSelected, setCustomSelected] = useState(false)
  const showCustomFields = customSelected || activePreset === 'custom'
  const [presetOpen, setPresetOpen] = useState(false)

  const applyPreset = (key: string) => {
    if (key === 'custom') {
      setCustomSelected(true)
    } else {
      setCustomSelected(false)
      const p = (datePresets as any)[key]
      if (p) onRangeChange(p.from, p.to)
    }
    setPresetOpen(false)
  }

  const presetLabel =
    activePreset !== 'custom'
      ? datePresets[activePreset as keyof typeof datePresets].label
      : ''

  const isToday = activePreset === 'today'
  const periodText = isToday
    ? 'today'
    : activePreset === 'custom'
      ? 'in selected dates'
      : presetLabel.toLowerCase()
  const changeLabel = isToday ? 'vs yesterday' : 'vs prev. period'

  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats', effFrom, effTo],
    queryFn: async () => {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/reports/dashboard-stats?from=${encodeURIComponent(effFrom)}&to=${encodeURIComponent(effTo)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (!res.ok) throw new Error('Failed to fetch dashboard stats')
      return res.json()
    },
    enabled: !!token,
    placeholderData: (prev) =>
      prev ?? {
        data: {
          revenue: 0,
          revenueChange: 0,
          outdoorPatients: 0,
          outdoorChange: 0,
          admissions: 0,
          admissionsChange: 0,
          currentlyAdmitted: 0,
          availableBeds: 0,
          totalBeds: 0,
          labTests: 0,
          labChange: 0,
          pendingBills: 0,
          pendingAmount: 0,
        },
      },
  })

  const s = stats?.data ?? {
    revenue: 0,
    revenueChange: 0,
    outdoorPatients: 0,
    outdoorChange: 0,
    admissions: 0,
    admissionsChange: 0,
    currentlyAdmitted: 0,
    availableBeds: 0,
    totalBeds: 0,
    labTests: 0,
    labChange: 0,
    pendingBills: 0,
    pendingAmount: 0,
  }

  // The trend chart needs multiple days: single-day selections (Today) keep
  // the default trailing-30-days window instead of a one-point chart.
  const isSingleDay = effFrom === effTo
  const trendFrom = isSingleDay ? toYMD(new Date(new Date(`${todayStr}T00:00:00`).getTime() - 29 * 86400000)) : effFrom
  const trendTo = effTo
  const trendLabel = isSingleDay
    ? 'last 30 days'
    : activePreset === 'custom'
      ? `${effFrom} to ${effTo}`
      : presetLabel.toLowerCase()

  return (
    <>
      <AppHeader fixed />
      <Main>
        <div className='mb-3 flex flex-wrap items-center justify-between gap-3'>
          <div>
            <h1 className='text-2xl font-bold tracking-tight'>Dashboard</h1>
            <p className='text-muted-foreground text-sm'>
              {isToday
                ? 'Hospital overview for today'
                : `Hospital overview — ${activePreset === 'custom' ? `${effFrom} to ${effTo}` : presetLabel.toLowerCase()}`}
            </p>
          </div>

          {/* Date range filter (right) — presets + custom range, kept in the URL */}
          <div className='flex items-center gap-1.5'>
            <Select
              value={showCustomFields ? 'custom' : activePreset}
              onValueChange={applyPreset}
              open={presetOpen}
              onOpenChange={setPresetOpen}
            >
              <SelectTrigger className='w-[150px] h-9'>
                <SelectValue placeholder='Filter by' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='today'>Today</SelectItem>
                <SelectItem value='last7'>Last 7 days</SelectItem>
                <SelectItem value='last15'>Last 15 days</SelectItem>
                <SelectItem value='last30'>Last 30 days</SelectItem>
                <SelectItem value='last45'>Last 45 days</SelectItem>
                <SelectItem value='last60'>Last 60 days</SelectItem>
                <SelectItem value='last90'>Last 90 days</SelectItem>
                <SelectItem value='last180'>Last 180 days</SelectItem>
                <SelectItem value='last365'>Last 365 days</SelectItem>
                <SelectItem value='custom'>Custom range</SelectItem>
              </SelectContent>
            </Select>
            {showCustomFields && (
              <>
                <DateField
                  value={effFrom}
                  onChange={(v: string) => onRangeChange(v, effTo)}
                  placeholder='From'
                />
                <span className='text-xs text-muted-foreground'>to</span>
                <DateField
                  value={effTo}
                  onChange={(v: string) => onRangeChange(effFrom, v)}
                  placeholder='To'
                />
              </>
            )}
          </div>
        </div>

        {/* ===== Summary Cards ===== */}
        <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6'>
          <SummaryCard
            title={isToday ? "Today's Revenue" : 'Revenue'}
            value={format(s.revenue)}
            change={s.revenueChange}
            changeLabel={changeLabel}
            icon={DollarSign}
            gradientClass='from-emerald-500 to-teal-500 shadow-emerald-500/20'
          />
          <SummaryCard
            title='Outdoor Patients'
            value={String(s.outdoorPatients)}
            subtitle={periodText}
            change={s.outdoorChange}
            changeLabel={changeLabel}
            icon={Stethoscope}
            gradientClass='from-blue-500 to-indigo-500 shadow-blue-500/20'
          />
          <SummaryCard
            title='Admitted'
            value={String(isToday ? s.currentlyAdmitted : s.admissions)}
            subtitle={isToday ? 'currently' : periodText}
            change={s.admissionsChange}
            changeLabel={changeLabel}
            icon={BedDouble}
            gradientClass='from-violet-500 to-purple-500 shadow-violet-500/20'
          />
          <SummaryCard
            title='Available Beds'
            value={`${s.availableBeds}/${s.totalBeds}`}
            subtitle={`${Math.round((s.availableBeds / (s.totalBeds || 1)) * 100)}% free`}
            icon={Users}
            gradientClass='from-orange-500 to-amber-500 shadow-orange-500/20'
          />
          <SummaryCard
            title='Lab Tests'
            value={String(s.labTests)}
            subtitle={periodText}
            change={s.labChange}
            changeLabel={changeLabel}
            icon={TestTube2}
            gradientClass='from-pink-500 to-rose-500 shadow-pink-500/20'
          />
          <SummaryCard
            title='Pending Bills'
            value={String(s.pendingBills)}
            subtitle={format(s.pendingAmount)}
            icon={Receipt}
            gradientClass='from-red-500 to-orange-500 shadow-red-500/20'
          />
        </div>

        {/* ===== Quick Actions ===== */}
        <div className='mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
          <Link to='/dashboard/admission/new-admission'>
            <Card className='cursor-pointer transition-colors hover:border-primary/50 hover:bg-muted/50'>
              <CardContent className='flex items-center gap-4 p-4'>
                <div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10'>
                  <UserPlus className='text-primary h-5 w-5' />
                </div>
                <div>
                  <p className='text-sm font-medium'>New Admission</p>
                  <p className='text-muted-foreground text-xs'>
                    Admit a new patient
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link to='/dashboard/outdoor/reception/invoices/create'>
            <Card className='cursor-pointer transition-colors hover:border-primary/50 hover:bg-muted/50'>
              <CardContent className='flex items-center gap-4 p-4'>
                <div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10'>
                  <FilePlus className='text-primary h-5 w-5' />
                </div>
                <div>
                  <p className='text-sm font-medium'>Outdoor Invoice</p>
                  <p className='text-muted-foreground text-xs'>
                    Create outpatient bill
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link to='/dashboard/outdoor/reception/due-collection'>
            <Card className='cursor-pointer transition-colors hover:border-primary/50 hover:bg-muted/50'>
              <CardContent className='flex items-center gap-4 p-4'>
                <div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10'>
                  <Wallet className='text-primary h-5 w-5' />
                </div>
                <div>
                  <p className='text-sm font-medium'>Due Collection</p>
                  <p className='text-muted-foreground text-xs'>
                    Collect pending payments
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link to='/dashboard/reports/my/outdoor/today-collection'>
            <Card className='cursor-pointer transition-colors hover:border-primary/50 hover:bg-muted/50'>
              <CardContent className='flex items-center gap-4 p-4'>
                <div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10'>
                  <TrendingUp className='text-primary h-5 w-5' />
                </div>
                <div>
                  <p className='text-sm font-medium'>Today's Collection</p>
                  <p className='text-muted-foreground text-xs'>
                    View today's report
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* ===== Charts Row ===== */}
        <div className='mt-6 grid grid-cols-1 gap-4 lg:grid-cols-7'>
          <Card className='col-span-1 lg:col-span-4 overflow-hidden transition-all duration-300 gap-0 shadow-none p-0 border'>
            <CardHeader className='bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b py-2 px-4 gap-0'>
              <div className='flex items-center gap-2.5'>
                <div className='p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg shadow-lg'>
                  <TrendingUp className='h-4 w-4 text-white' />
                </div>
                <div>
                  <CardTitle className='text-lg font-bold'>Revenue Trend</CardTitle>
                  <CardDescription className='text-xs text-gray-600 dark:text-gray-400'>Daily revenue — {trendLabel}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className='p-4 ps-2'>
              <Overview from={trendFrom} to={trendTo} />
            </CardContent>
          </Card>
          <Card className='col-span-1 lg:col-span-3 overflow-hidden transition-all duration-300 gap-0 shadow-none p-0 border'>
            <CardHeader className='bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b py-2 px-4 gap-0'>
              <div className='flex items-center gap-2.5'>
                <div className='p-2 bg-gradient-to-br from-violet-500 to-purple-500 rounded-lg shadow-lg'>
                  <DollarSign className='h-4 w-4 text-white' />
                </div>
                <div>
                  <CardTitle className='text-lg font-bold'>Department Revenue</CardTitle>
                  <CardDescription className='text-xs text-gray-600 dark:text-gray-400'>Revenue breakdown — current month</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className='p-4'>
              <DepartmentRevenue />
            </CardContent>
          </Card>
        </div>

        {/* ===== Bottom Row ===== */}
        <div className='mt-6 grid grid-cols-1 gap-4 lg:grid-cols-7'>
          <Card className='col-span-1 lg:col-span-3 overflow-hidden transition-all duration-300 gap-0 shadow-none p-0 border'>
            <CardHeader className='bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b py-2 px-4 gap-0'>
              <div className='flex items-center gap-2.5'>
                <div className='p-2 bg-gradient-to-br from-orange-500 to-amber-500 rounded-lg shadow-lg'>
                  <BedDouble className='h-4 w-4 text-white' />
                </div>
                <div>
                  <CardTitle className='text-lg font-bold'>Bed Occupancy</CardTitle>
                  <CardDescription className='text-xs text-gray-600 dark:text-gray-400'>Current bed & cabin status</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className='p-4'>
              <BedOccupancy />
            </CardContent>
          </Card>
          <Card className='col-span-1 lg:col-span-4 overflow-hidden transition-all duration-300 gap-0 shadow-none p-0 border'>
            <CardHeader className='bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b py-2 px-4 gap-0'>
              <div className='flex items-center gap-2.5'>
                <div className='p-2 bg-gradient-to-br from-pink-500 to-rose-500 rounded-lg shadow-lg'>
                  <Activity className='h-4 w-4 text-white' />
                </div>
                <div>
                  <CardTitle className='text-lg font-bold'>Recent Activity</CardTitle>
                  <CardDescription className='text-xs text-gray-600 dark:text-gray-400'>Latest admissions, discharges & payments</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className='p-4'>
              <RecentActivity from={effFrom} to={effTo} />
            </CardContent>
          </Card>
        </div>
      </Main>
    </>
  )
}

// ===== Summary Card Component =====
function SummaryCard({
  title,
  value,
  subtitle,
  change,
  changeLabel = 'vs yesterday',
  icon: Icon,
  gradientClass,
}: {
  title: string
  value: string
  subtitle?: string
  change?: number
  changeLabel?: string
  icon: React.ElementType
  gradientClass: string
}) {
  const isPositive = change !== undefined && change >= 0
  return (
    <Card className='overflow-hidden transition-all duration-300 gap-0 shadow-none p-0 border'>
      <CardHeader className='bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b py-2 px-4 gap-0'>
        <div className='flex items-center gap-2.5'>
          <div
            className={`p-2 bg-gradient-to-br ${gradientClass} rounded-lg shadow-lg`}
          >
            <Icon className='h-4 w-4 text-white' />
          </div>
          <div>
            <CardTitle className='text-sm font-semibold'>{title}</CardTitle>
          </div>
        </div>
      </CardHeader>
      <CardContent className='p-4'>
        <div className='text-2xl font-bold'>{value}</div>
        <div className='flex items-center gap-1 mt-1'>
          {change !== undefined ? (
            <>
              {isPositive ? (
                <ArrowUpRight className='text-emerald-600 h-3 w-3' />
              ) : (
                <ArrowDownRight className='text-red-600 h-3 w-3' />
              )}
              <span
                className={`text-xs ${isPositive ? 'text-emerald-600' : 'text-red-600'}`}
              >
                {Math.abs(change)}%
              </span>
              <span className='text-muted-foreground text-xs'>{changeLabel}</span>
            </>
          ) : subtitle ? (
            <span className='text-muted-foreground text-xs'>{subtitle}</span>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}
