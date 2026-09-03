import { useState } from 'react'
import { Check, ChevronDown, Pill } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
import { useRxMedicineSearchQuery } from '@/features/prescriptions/rxMedicinesQueries'
import type { RxMedicine } from '@/types/prescriptions.types'

interface MedicinePickerProps {
  /** Currently selected master row (null = free-text / walk-in medicine). */
  value: RxMedicine | null
  onSelect: (medicine: RxMedicine | null) => void
  disabled?: boolean
  placeholder?: string
}

/** Combobox over the tenant Rx medicine master, results grouped by
 *  therapeutic group. Picking a row links the prescription line to the
 *  master (generic, presets, caution). */
export function MedicinePicker({ value, onSelect, disabled, placeholder = 'Pick from list' }: MedicinePickerProps) {
  const [open, setOpen] = useState(false)
  const [term, setTerm] = useState('')
  const debounced = useDebounce(term, 300)
  const { data: results, isFetching } = useRxMedicineSearchQuery(debounced)

  const groups = new Map<string, RxMedicine[]>()
  for (const med of results ?? []) {
    const key = med.group?.name || 'Ungrouped'
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(med)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          disabled={disabled}
          className={cn('w-full justify-between gap-1 font-normal', !value && 'text-muted-foreground')}
        >
          {value ? (
            <span className="flex min-w-0 items-center gap-1.5">
              <span className="truncate text-sm">{value.name}{value.strength ? ` ${value.strength}` : ''}</span>
              {value.generic_name && (
                <span className="hidden truncate text-[11px] text-muted-foreground md:inline">({value.generic_name})</span>
              )}
              {value.is_controlled && <Badge variant="destructive" className="h-4 px-1 text-[9px]">CD</Badge>}
            </span>
          ) : (
            <span className="flex items-center gap-1.5"><Pill className="h-3.5 w-3.5" />{placeholder}</span>
          )}
          <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[420px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search medicine or generic…"
            value={term}
            onValueChange={setTerm}
          />
          <CommandList>
            <CommandEmpty>
              {isFetching ? 'Searching…' : 'No medicine found — type the name manually.'}
            </CommandEmpty>
            {[...groups.entries()].map(([groupName, meds]) => (
              <CommandGroup key={groupName} heading={groupName}>
                {meds.map((med) => (
                  <CommandItem
                    key={med.id}
                    value={`${med.name} ${med.generic_name ?? ''} ${med.id}`}
                    onSelect={() => { onSelect(med); setOpen(false); setTerm('') }}
                  >
                    <Check className={cn('mr-2 h-4 w-4', value?.id === med.id ? 'opacity-100' : 'opacity-0')} />
                    <div className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate text-sm font-medium">
                        {med.name}{med.strength ? ` ${med.strength}` : ''}
                        {med.form ? <span className="ml-1 text-[11px] text-muted-foreground">{med.form}</span> : null}
                        {med.is_controlled && <Badge variant="destructive" className="ml-1.5 h-4 px-1 text-[9px]">CD</Badge>}
                      </span>
                      {med.generic_name && (
                        <span className="truncate text-[11px] text-muted-foreground">
                          {med.generic_name}
                          {med.caution_note ? ` — ⚠ ${med.caution_note}` : ''}
                        </span>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
