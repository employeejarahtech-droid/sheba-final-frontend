import { useQuery } from '@tanstack/react-query'
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useCurrency } from '@/hooks/use-currency'
import { getCookie } from '@/lib/cookies'

interface TrendPoint {
  date: string
  name: string
  indoor: number
  outdoor: number
  total: number
}

/**
 * Daily revenue area chart (total / indoor / outdoor) for the given date
 * range, backed by /api/reports/revenue-trend.
 */
export function Overview({ from, to }: { from: string; to: string }) {
  const { currencySymbol } = useCurrency()
  const token = getCookie('accessToken')

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-revenue-trend', from, to],
    queryFn: async () => {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/reports/revenue-trend?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (!res.ok) throw new Error('Failed to fetch revenue trend')
      return res.json()
    },
    enabled: !!token,
    placeholderData: (prev) => prev ?? { data: { trend: [] } },
  })

  const trend: TrendPoint[] = data?.data?.trend ?? []

  if (isLoading && trend.length === 0) {
    return (
      <div className='flex h-[350px] items-center justify-center text-sm text-muted-foreground'>
        Loading…
      </div>
    )
  }
  if (trend.length === 0) {
    return (
      <div className='flex h-[350px] items-center justify-center text-sm text-muted-foreground'>
        No revenue in this period.
      </div>
    )
  }

  return (
    <ResponsiveContainer width='100%' height={350}>
      <AreaChart data={trend}>
        <defs>
          <linearGradient id='colorTotal' x1='0' y1='0' x2='0' y2='1'>
            <stop offset='5%' stopColor='hsl(var(--primary))' stopOpacity={0.3} />
            <stop offset='95%' stopColor='hsl(var(--primary))' stopOpacity={0} />
          </linearGradient>
          <linearGradient id='colorIndoor' x1='0' y1='0' x2='0' y2='1'>
            <stop offset='5%' stopColor='#8b5cf6' stopOpacity={0.2} />
            <stop offset='95%' stopColor='#8b5cf6' stopOpacity={0} />
          </linearGradient>
          <linearGradient id='colorOutdoor' x1='0' y1='0' x2='0' y2='1'>
            <stop offset='5%' stopColor='#10b981' stopOpacity={0.2} />
            <stop offset='95%' stopColor='#10b981' stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis
          dataKey='name'
          stroke='#888888'
          fontSize={12}
          tickLine={false}
          axisLine={false}
          interval='preserveStartEnd'
          minTickGap={20}
        />
        <YAxis
          stroke='#888888'
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `${currencySymbol} ${(value / 1000).toFixed(0)}k`}
        />
        <Tooltip
          formatter={(value: number) => [`${currencySymbol} ${value.toLocaleString()}`]}
          contentStyle={{
            backgroundColor: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '8px',
            fontSize: '12px',
          }}
        />
        <Area
          type='monotone'
          dataKey='total'
          stroke='hsl(var(--primary))'
          fillOpacity={1}
          fill='url(#colorTotal)'
          strokeWidth={2}
          name='Total Revenue'
        />
        <Area
          type='monotone'
          dataKey='indoor'
          stroke='#8b5cf6'
          fillOpacity={1}
          fill='url(#colorIndoor)'
          strokeWidth={2}
          name='Indoor'
        />
        <Area
          type='monotone'
          dataKey='outdoor'
          stroke='#10b981'
          fillOpacity={1}
          fill='url(#colorOutdoor)'
          strokeWidth={2}
          name='Outdoor'
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
