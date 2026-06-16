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
        <div className='mb-6 flex items-center justify-between gap-4'>
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
            iconClass='text-emerald-600 bg-emerald-100'
          />
          <SummaryCard
            title='Outdoor Patients'
            value={String(s.todayOutdoorPatients)}
            subtitle='today'
            change={s.outdoorChange}
            icon={Stethoscope}
            iconClass='text-blue-600 bg-blue-100'
          />
          <SummaryCard
            title='Admitted'
            value={String(s.currentlyAdmitted)}
            subtitle='currently'
            change={s.admittedChange}
            icon={BedDouble}
            iconClass='text-violet-600 bg-violet-100'
          />
          <SummaryCard
            title='Available Beds'
            value={`${s.availableBeds}/${s.totalBeds}`}
            subtitle={`${Math.round((s.availableBeds / (s.totalBeds || 1)) * 100)}% free`}
            icon={Users}
            iconClass='text-orange-600 bg-orange-100'
          />
          <SummaryCard
            title='Lab Tests'
            value={String(s.todayLabTests)}
            subtitle='today'
            change={s.labChange}
            icon={TestTube2}
            iconClass='text-pink-600 bg-pink-100'
          />
          <SummaryCard
            title='Pending Bills'
            value={String(s.pendingBills)}
            subtitle={format(s.pendingAmount)}
            icon={Receipt}
            iconClass='text-red-600 bg-red-100'
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
          <Card className='col-span-1 lg:col-span-4'>
            <CardHeader>
              <CardTitle>Revenue Trend</CardTitle>
              <CardDescription>Daily revenue — last 30 days</CardDescription>
            </CardHeader>
            <CardContent className='ps-2'>
              <Overview />
            </CardContent>
          </Card>
          <Card className='col-span-1 lg:col-span-3'>
            <CardHeader>
              <CardTitle>Department Revenue</CardTitle>
              <CardDescription>Revenue breakdown — current month</CardDescription>
            </CardHeader>
            <CardContent>
              <DepartmentRevenue />
            </CardContent>
          </Card>
        </div>

        {/* ===== Bottom Row ===== */}
        <div className='mt-6 grid grid-cols-1 gap-4 lg:grid-cols-7'>
          <Card className='col-span-1 lg:col-span-3'>
            <CardHeader>
              <CardTitle>Bed Occupancy</CardTitle>
              <CardDescription>Current bed & cabin status</CardDescription>
            </CardHeader>
            <CardContent>
              <BedOccupancy />
            </CardContent>
          </Card>
          <Card className='col-span-1 lg:col-span-4'>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest admissions, discharges & payments</CardDescription>
            </CardHeader>
            <CardContent>
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
  iconClass,
}: {
  title: string
  value: string
  subtitle?: string
  change?: number
  icon: React.ElementType
  iconClass: string
}) {
  const isPositive = change !== undefined && change >= 0
  return (
    <Card>
      <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
        <CardTitle className='text-sm font-medium'>{title}</CardTitle>
        <div
          className={`flex h-8 w-8 items-center justify-center rounded-md ${iconClass}`}
        >
          <Icon className='h-4 w-4' />
        </div>
      </CardHeader>
      <CardContent>
        <div className='text-2xl font-bold'>{value}</div>
        <div className='flex items-center gap-1'>
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
