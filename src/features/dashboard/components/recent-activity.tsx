import { Badge } from '@/components/ui/badge'
import { useCurrency } from '@/hooks/use-currency'
import { DollarSign, LogOut, Stethoscope, TestTube2, UserPlus } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useQuery } from '@tanstack/react-query'
import { getCookie } from '@/lib/cookies'

interface ActivityItem {
  id: number
  type: 'admission' | 'discharge' | 'payment' | 'outdoor' | 'lab'
  patient: string
  detail: string
  amount?: number
  time: string | null
}

const typeConfig: Record<
  ActivityItem['type'],
  { icon: React.ElementType; iconClass: string; label: string }
> = {
  admission: {
    icon: UserPlus,
    iconClass: 'bg-violet-100 text-violet-600',
    label: 'Admission',
  },
  discharge: {
    icon: LogOut,
    iconClass: 'bg-amber-100 text-amber-600',
    label: 'Discharge',
  },
  payment: {
    icon: DollarSign,
    iconClass: 'bg-emerald-100 text-emerald-600',
    label: 'Payment',
  },
  outdoor: {
    icon: Stethoscope,
    iconClass: 'bg-blue-100 text-blue-600',
    label: 'Outdoor',
  },
  lab: {
    icon: TestTube2,
    iconClass: 'bg-pink-100 text-pink-600',
    label: 'Lab',
  },
}

function timeAgo(iso: string | null): string {
  if (!iso) return ''
  const t = new Date(iso).getTime()
  if (Number.isNaN(t)) return ''
  const diff = Date.now() - t
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'just now'
  if (min < 60) return `${min} min ago`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr} hr${hr > 1 ? 's' : ''} ago`
  const day = Math.floor(hr / 24)
  return `${day} day${day > 1 ? 's' : ''} ago`
}

export function RecentActivity({ from, to }: { from?: string; to?: string }) {
  const { currencySymbol } = useCurrency()
  const token = getCookie('accessToken')

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-recent-activity', from, to],
    queryFn: async () => {
      const rangeParam =
        from && to
          ? `&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`
          : ''
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/reports/recent-activity?limit=8${rangeParam}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (!res.ok) throw new Error('Failed to fetch recent activity')
      return res.json()
    },
    enabled: !!token,
  })

  const outdoorActivities: ActivityItem[] = data?.data?.outdoor ?? []
  const indoorActivities: ActivityItem[] = data?.data?.indoor ?? []

  const renderList = (items: ActivityItem[], emptyLabel: string) => {
    if (isLoading) {
      return (
        <p className='text-sm text-muted-foreground text-center py-4'>
          Loading…
        </p>
      )
    }
    if (items.length === 0) {
      return (
        <p className='text-sm text-muted-foreground text-center py-4'>
          {emptyLabel}
        </p>
      )
    }
    return items.map((item, i) => {
      const config = typeConfig[item.type] ?? typeConfig.outdoor
      const Icon = config.icon
      return (
        <div key={`${item.type}-${item.id}-${i}`} className='flex items-start gap-3'>
          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${config.iconClass}`}
          >
            <Icon className='h-4 w-4' />
          </div>
          <div className='min-w-0 flex-1'>
            <div className='flex items-center justify-between gap-2'>
              <p className='truncate text-sm font-medium'>{item.patient}</p>
              <span className='text-muted-foreground shrink-0 text-xs'>
                {timeAgo(item.time)}
              </span>
            </div>
            <div className='flex items-center gap-2 mt-0.5'>
              <Badge variant='outline' className='text-[10px] px-1.5 py-0'>
                {config.label}
              </Badge>
              <p className='text-muted-foreground truncate text-xs'>
                {item.detail}
              </p>
            </div>
            {item.amount !== undefined && item.amount !== null && (
              <p className='mt-0.5 text-sm font-semibold text-emerald-600'>
                {currencySymbol} {item.amount.toLocaleString()}
              </p>
            )}
          </div>
        </div>
      )
    })
  }

  return (
    <Tabs defaultValue='outdoor' className='w-full'>
      <TabsList className='grid w-full grid-cols-2 mb-4'>
        <TabsTrigger value='outdoor'>Outdoor</TabsTrigger>
        <TabsTrigger value='indoor'>Indoor</TabsTrigger>
      </TabsList>

      <TabsContent value='outdoor' className='space-y-4'>
        {renderList(outdoorActivities, 'No recent outdoor activities.')}
      </TabsContent>

      <TabsContent value='indoor' className='space-y-4'>
        {renderList(indoorActivities, 'No recent indoor activities.')}
      </TabsContent>
    </Tabs>
  )
}
