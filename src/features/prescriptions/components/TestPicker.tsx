import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Check, ChevronDown, FlaskConical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { cn } from '@/lib/utils'
import { useDebounce } from '@/hooks/useDebounce'
import api from '@/lib/axios'

export interface LabTestOption {
  id: number
  name: string
  category_id?: number
}

interface TestPickerProps {
  value: LabTestOption | null
  onSelect: (test: LabTestOption | null) => void
  disabled?: boolean
}

/** Popover+Command over the lab `tests` master (read-only soft dependency —
 *  when the endpoint is unavailable the picker degrades to free-text entry). */
export function TestPicker({ value, onSelect, disabled }: TestPickerProps) {
  const [open, setOpen] = useState(false)
  const [term, setTerm] = useState('')
  const debounced = useDebounce(term, 300)

  const { data: tests, isFetching, isError } = useQuery({
    queryKey: ['prescription-tests-picker', debounced],
    queryFn: async () => {
      const res = await api.get('/tests', { params: { search: debounced, status: 'active', limit: 20, page: 1 } })
      return (res.data?.data?.items ?? []) as LabTestOption[]
    },
    staleTime: 60_000,
    retry: 1,
  })

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          disabled={disabled}
          className={cn('w-full justify-between font-normal', !value && 'text-muted-foreground')}
        >
          {value ? (
            <span className="truncate text-sm">{value.name}</span>
          ) : (
            <span className="flex items-center gap-1.5"><FlaskConical className="h-3.5 w-3.5" />Pick from lab list</span>
          )}
          <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[360px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput placeholder="Search lab tests…" value={term} onValueChange={setTerm} />
          <CommandList>
            {isError ? (
              <div className="px-3 py-4 text-xs text-muted-foreground">
                Lab test list unavailable — type the test name manually.
              </div>
            ) : (
              <>
                <CommandEmpty>
                  {isFetching ? 'Searching…' : debounced ? 'No test found — type it manually.' : 'Type to search lab tests.'}
                </CommandEmpty>
                <CommandGroup>
                  {(tests ?? []).map((t) => (
                    <CommandItem
                      key={t.id}
                      value={`${t.name} ${t.id}`}
                      onSelect={() => { onSelect(t); setOpen(false); setTerm('') }}
                    >
                      <Check className={cn('mr-2 h-4 w-4', value?.id === t.id ? 'opacity-100' : 'opacity-0')} />
                      <span className="truncate text-sm">{t.name}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
