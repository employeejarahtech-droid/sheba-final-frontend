import { CalendarIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { cn } from '@/lib/utils'
import { useDateFormat } from '@/hooks/use-date-format'

type DateFieldProps = {
  /** ISO date string (YYYY-MM-DD). Empty string = no date. */
  value: string
  onChange: (iso: string) => void
  placeholder?: string
  className?: string
}

/** Parse an ISO YYYY-MM-DD string into a local Date (avoids UTC off-by-one). */
function isoToDate(iso: string): Date | undefined {
  if (!iso) return undefined
  const parts = iso.split('-').map(Number)
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return undefined
  const [y, m, d] = parts
  return new Date(y, m - 1, d)
}

/**
 * A compact date picker used in table filter toolbars. The selected date is held
 * as an ISO YYYY-MM-DD string (for the URL / backend) but DISPLAYED in the
 * tenant's configured date format from company settings (via useDateFormat).
 */
export function DateField({ value, onChange, placeholder = 'Pick a date', className }: DateFieldProps) {
  const { formatDate, toISODate } = useDateFormat()
  const date = isoToDate(value)

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={cn('h-9 justify-start text-left font-normal', !value && 'text-muted-foreground', className)}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value && date ? formatDate(date) : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={(d) => onChange(d ? toISODate(d) : '')}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )
}
