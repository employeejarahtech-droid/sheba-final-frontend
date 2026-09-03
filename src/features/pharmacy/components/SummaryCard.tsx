import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function SummaryCard({
  title,
  value,
  subtitle,
  icon: Icon,
  gradientClass,
}: {
  title: string
  value: string | number
  subtitle?: string
  icon: React.ElementType
  gradientClass: string
}) {
  return (
    <Card className='overflow-hidden transition-all duration-300 gap-0 shadow-none p-0 border'>
      <CardHeader className='bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b py-2 px-4 gap-0'>
        <div className='flex items-center gap-2.5'>
          <div className={`p-2 bg-gradient-to-br ${gradientClass} rounded-lg shadow-lg`}>
            <Icon className='h-4 w-4 text-white' />
          </div>
          <div>
            <CardTitle className='text-sm font-semibold'>{title}</CardTitle>
          </div>
        </div>
      </CardHeader>
      <CardContent className='p-4'>
        <div className='text-2xl font-bold'>{value}</div>
        {subtitle ? (
          <div className='flex items-center gap-1 mt-1'>
            <span className='text-muted-foreground text-xs'>{subtitle}</span>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
