import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { useCurrency } from '@/hooks/use-currency'
import { BedDouble, DollarSign, LogOut, Stethoscope, TestTube2, UserPlus } from 'lucide-react'

interface ActivityItem {
  id: number
  type: 'admission' | 'discharge' | 'payment' | 'outdoor' | 'lab'
  patient: string
  detail: string
  amount?: number
  time: string
}

const recentActivity: ActivityItem[] = [
  {
    id: 1,
    type: 'admission',
    patient: 'Rahim Uddin',
    detail: 'Admitted to Bed #204',
    time: '10 min ago',
  },
  {
    id: 2,
    type: 'payment',
    patient: 'Fatima Akter',
    detail: 'Final bill payment',
    amount: 12500,
    time: '25 min ago',
  },
  {
    id: 3,
    type: 'outdoor',
    patient: 'Karim Hossain',
    detail: 'Outdoor invoice — CBC, Lipid Profile',
    amount: 1800,
    time: '45 min ago',
  },
  {
    id: 4,
    type: 'discharge',
    patient: 'Nasima Begum',
    detail: 'Discharged — Bed #112',
    time: '1 hr ago',
  },
  {
    id: 5,
    type: 'lab',
    patient: 'Imran Khan',
    detail: 'Lab results ready — Blood Group, ESR',
    time: '1 hr ago',
  },
  {
    id: 6,
    type: 'admission',
    patient: 'Salma Khatun',
    detail: 'Admitted to Cabin #7',
    time: '2 hrs ago',
  },
  {
    id: 7,
    type: 'payment',
    patient: 'Jamal Ahmed',
    detail: 'Advance payment',
    amount: 5000,
    time: '2 hrs ago',
  },
  {
    id: 8,
    type: 'outdoor',
    patient: 'Rina Das',
    detail: 'Outdoor invoice — Urine RE, Sugar',
    amount: 600,
    time: '3 hrs ago',
  },
]

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

export function RecentActivity() {
  const { currencySymbol } = useCurrency()

  return (
    <div className='space-y-4'>
      {recentActivity.map((item) => {
        const config = typeConfig[item.type]
        const Icon = config.icon
        return (
          <div key={item.id} className='flex items-start gap-3'>
            <div
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${config.iconClass}`}
            >
              <Icon className='h-4 w-4' />
            </div>
            <div className='min-w-0 flex-1'>
              <div className='flex items-center justify-between gap-2'>
                <p className='truncate text-sm font-medium'>{item.patient}</p>
                <span className='text-muted-foreground shrink-0 text-xs'>
                  {item.time}
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
              {item.amount !== undefined && (
                <p className='mt-0.5 text-sm font-semibold text-emerald-600'>
                  {currencySymbol}
                  {item.amount.toLocaleString()}
                </p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
