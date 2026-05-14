import { Progress } from '@/components/ui/progress'

interface BedSection {
  label: string
  occupied: number
  total: number
  color: string
}

const bedData: BedSection[] = [
  { label: 'General Ward', occupied: 28, total: 40, color: 'bg-blue-500' },
  { label: 'Semi-Private', occupied: 8, total: 12, color: 'bg-violet-500' },
  { label: 'Private Cabin', occupied: 5, total: 8, color: 'bg-emerald-500' },
  { label: 'ICU', occupied: 6, total: 8, color: 'bg-red-500' },
  { label: 'CCU', occupied: 3, total: 4, color: 'bg-amber-500' },
  { label: 'Post-Op', occupied: 4, total: 6, color: 'bg-pink-500' },
]

export function BedOccupancy() {
  const totalOccupied = bedData.reduce((s, b) => s + b.occupied, 0)
  const totalBeds = bedData.reduce((s, b) => s + b.total, 0)
  const overallPercent = Math.round((totalOccupied / totalBeds) * 100)

  return (
    <div className='space-y-5'>
      {/* Overall gauge */}
      <div className='text-center'>
        <div className='relative mx-auto h-28 w-28'>
          <svg className='h-28 w-28 -rotate-90' viewBox='0 0 100 100'>
            <circle
              cx='50'
              cy='50'
              r='42'
              fill='none'
              stroke='hsl(var(--muted))'
              strokeWidth='8'
            />
            <circle
              cx='50'
              cy='50'
              r='42'
              fill='none'
              stroke='hsl(var(--primary))'
              strokeWidth='8'
              strokeLinecap='round'
              strokeDasharray={`${overallPercent * 2.64} 264`}
            />
          </svg>
          <div className='absolute inset-0 flex flex-col items-center justify-center'>
            <span className='text-2xl font-bold'>{overallPercent}%</span>
            <span className='text-muted-foreground text-[10px]'>Occupied</span>
          </div>
        </div>
        <p className='text-muted-foreground mt-1 text-xs'>
          {totalOccupied} of {totalBeds} beds occupied
        </p>
      </div>

      {/* Section breakdown */}
      <div className='space-y-3'>
        {bedData.map((section) => {
          const percent = Math.round((section.occupied / section.total) * 100)
          return (
            <div key={section.label}>
              <div className='mb-1 flex items-center justify-between text-xs'>
                <span className='font-medium'>{section.label}</span>
                <span className='text-muted-foreground'>
                  {section.occupied}/{section.total}
                </span>
              </div>
              <div className='bg-muted h-2 w-full rounded-full'>
                <div
                  className={`${section.color} h-2 rounded-full transition-all`}
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
