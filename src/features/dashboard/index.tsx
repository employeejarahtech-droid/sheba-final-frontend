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
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Overview } from './components/overview'
import { RecentActivity } from './components/recent-activity'
import { DepartmentRevenue } from './components/department-revenue'
import { BedOccupancy } from './components/bed-occupancy'

export function Dashboard() {
  const { currencySymbol, format } = useCurrency()
  const token = getCookie('accessToken')

  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/reports/dashboard-stats`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (!res.ok) throw new Error('Failed to fetch dashboard stats')
      return res.json()
    },
    enabled: !!token,
    placeholderData: (prev) =>
      prev ?? {
        data: {
          todayRevenue: 0,
          revenueChange: 0,
          todayOutdoorPatients: 0,
          outdoorChange: 0,
          currentlyAdmitted: 0,
          admittedChange: 0,
          availableBeds: 0,
          totalBeds: 0,
          todayLabTests: 0,
          labChange: 0,
          pendingBills: 0,
          pendingAmount: 0,
        },
      },
  })

  const s = stats?.data ?? {
    todayRevenue: 0,
    revenueChange: 0,
    todayOutdoorPatients: 0,
    outdoorChange: 0,
    currentlyAdmitted: 0,
    admittedChange: 0,
    availableBeds: 0,
    totalBeds: 0,
    todayLabTests: 0,
    labChange: 0,
    pendingBills: 0,
    pendingAmount: 0,
  }

  return (
    <>
      <AppHeader fixed />
      <Main>
        <div className='mb-3 flex items-center justify-between gap-3'>
          <div>
            <h1 className='text-2xl font-bold tracking-tight'>Dashboard</h1>
            <p className='text-muted-foreground text-sm'>
              Hospital overview for today
            </p>
          </div>
        </div>

        {/* ===== Summary Cards ===== */}
        <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6'>
          <SummaryCard
            title="Today's Revenue"
            value={format(s.todayRevenue)}
            change={s.revenueChange}
            icon={DollarSign}
            gradientClass='from-emerald-500 to-teal-500 shadow-emerald-500/20'
          />
          <SummaryCard
            title='Outdoor Patients'
            value={String(s.todayOutdoorPatients)}
            subtitle='today'
            change={s.outdoorChange}
            icon={Stethoscope}
            gradientClass='from-blue-500 to-indigo-500 shadow-blue-500/20'
          />
          <SummaryCard
            title='Admitted'
            value={String(s.currentlyAdmitted)}
            subtitle='currently'
            change={s.admittedChange}
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
            value={String(s.todayLabTests)}
            subtitle='today'
            change={s.labChange}
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
                  <CardDescription className='text-xs text-gray-600 dark:text-gray-400'>Daily revenue — last 30 days</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className='p-4 ps-2'>
              <Overview />
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
              <RecentActivity />
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
  icon: Icon,
  gradientClass,
}: {
  title: string
  value: string
  subtitle?: string
  change?: number
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
              <span className='text-muted-foreground text-xs'>vs yesterday</span>
            </>
          ) : subtitle ? (
            <span className='text-muted-foreground text-xs'>{subtitle}</span>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}
