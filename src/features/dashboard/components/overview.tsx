import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useCurrency } from '@/hooks/use-currency'

const data = [
  { name: '1 May', indoor: 12400, outdoor: 8200, total: 20600 },
  { name: '2 May', indoor: 9800, outdoor: 7600, total: 17400 },
  { name: '3 May', indoor: 15200, outdoor: 11400, total: 26600 },
  { name: '4 May', indoor: 11000, outdoor: 9800, total: 20800 },
  { name: '5 May', indoor: 18600, outdoor: 14200, total: 32800 },
  { name: '6 May', indoor: 16400, outdoor: 12800, total: 29200 },
  { name: '7 May', indoor: 13800, outdoor: 10600, total: 24400 },
  { name: '8 May', indoor: 20200, outdoor: 15600, total: 35800 },
  { name: '9 May', indoor: 14600, outdoor: 11200, total: 25800 },
  { name: '10 May', indoor: 17800, outdoor: 13400, total: 31200 },
  { name: '11 May', indoor: 22400, outdoor: 16800, total: 39200 },
  { name: '12 May', indoor: 19200, outdoor: 14600, total: 33800 },
  { name: '13 May', indoor: 15600, outdoor: 12000, total: 27600 },
  { name: '14 May', indoor: 24800, outdoor: 18200, total: 43000 },
]

export function Overview() {
  const { currencySymbol } = useCurrency()

  return (
    <ResponsiveContainer width='100%' height={350}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id='colorTotal' x1='0' y1='0' x2='0' y2='1'>
            <stop offset='5%' stopColor='hsl(var(--primary))' stopOpacity={0.3} />
            <stop offset='95%' stopColor='hsl(var(--primary))' stopOpacity={0} />
          </linearGradient>
          <linearGradient id='colorIndoor' x1='0' y1='0' x2='0' y2='1'>
            <stop offset='5%' stopColor='#8b5cf6' stopOpacity={0.2} />
            <stop offset='95%' stopColor='#8b5cf6' stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis
          dataKey='name'
          stroke='#888888'
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke='#888888'
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `${currencySymbol}${(value / 1000).toFixed(0)}k`}
        />
        <Tooltip
          formatter={(value: number) => [`${currencySymbol}${value.toLocaleString()}`]}
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
      </AreaChart>
    </ResponsiveContainer>
  )
}
