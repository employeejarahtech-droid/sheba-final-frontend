import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { useCurrency } from '@/hooks/use-currency'

const data = [
  { name: 'Pathology', value: 45000, color: '#8b5cf6' },
  { name: 'Indoor Services', value: 38000, color: '#3b82f6' },
  { name: 'Outdoor Consult', value: 28000, color: '#10b981' },
  { name: 'Operation Theatre', value: 22000, color: '#f59e0b' },
  { name: 'Pharmacy', value: 15000, color: '#ef4444' },
  { name: 'Other', value: 8000, color: '#6b7280' },
]

export function DepartmentRevenue() {
  const { currencySymbol } = useCurrency()

  return (
    <ResponsiveContainer width='100%' height={300}>
      <PieChart>
        <Pie
          data={data}
          cx='50%'
          cy='45%'
          innerRadius={60}
          outerRadius={90}
          paddingAngle={3}
          dataKey='value'
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value: number) => [`${currencySymbol} ${value.toLocaleString()}`]}
          contentStyle={{
            backgroundColor: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '8px',
            fontSize: '12px',
          }}
        />
        <Legend
          verticalAlign='bottom'
          height={36}
          formatter={(value: string) => (
            <span className='text-xs text-muted-foreground'>{value}</span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}
