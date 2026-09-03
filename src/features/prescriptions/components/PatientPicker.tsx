import { useState } from 'react'
import { toast } from 'sonner'
import { Check, ChevronDown, UserPlus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { useDebounce } from '@/hooks/useDebounce'
import { usePatientSearchQuery, useCreatePatientMutation } from '@/features/prescriptions/patientsQueries'
import type { Patient } from '@/types/prescriptions.types'

const SEX_OPTIONS = ['Male', 'Female', 'Other']

const patientAgeLabel = (p: Patient) =>
  p.age_years != null ? `${p.age_years}y` : p.age_text || (p.dob ? '' : '—')

interface PatientPickerProps {
  patient: Patient | null
  onSelect: (patient: Patient | null) => void
}

/** Popover+Command search over the patient registry with an inline
 *  "create new patient" dialog. Clearing returns to walk-in entry. */
export function PatientPicker({ patient, onSelect }: PatientPickerProps) {
  const [open, setOpen] = useState(false)
  const [term, setTerm] = useState('')
  const debounced = useDebounce(term, 350)
  const { data: results, isFetching } = usePatientSearchQuery(debounced)

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            className={cn('w-full justify-between font-normal', !patient && 'text-muted-foreground')}
          >
            {patient ? (
              <span className="flex min-w-0 items-center gap-2">
                <span className="truncate font-medium">
                  {patient.patient_no ? `${patient.patient_no} · ` : ''}{patient.name}
                </span>
                {patient.age_years != null || patient.age_text ? (
                  <span className="text-xs text-muted-foreground">{patientAgeLabel(patient)}</span>
                ) : null}
                {patient.sex ? <span className="text-xs text-muted-foreground">{patient.sex[0]}</span> : null}
              </span>
            ) : (
              'Search registered patient (or type walk-in below)'
            )}
            <span className="flex items-center gap-1">
              {patient && (
                <X
                  className="h-4 w-4 opacity-60 hover:opacity-100"
                  onClick={(e) => { e.stopPropagation(); onSelect(null) }}
                />
              )}
              <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[440px] p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Search by name, phone or patient no…"
              value={term}
              onValueChange={setTerm}
            />
            <CommandList>
              <CommandEmpty>
                {isFetching ? 'Searching…' : debounced ? 'No patient found.' : 'No registered patients yet.'}
              </CommandEmpty>
              <CommandGroup>
                {(results ?? []).map((p) => (
                  <CommandItem
                    key={p.id}
                    value={`${p.name} ${p.phone ?? ''} ${p.patient_no ?? ''} ${p.id}`}
                    onSelect={() => { onSelect(p); setOpen(false); setTerm('') }}
                  >
                    <Check className={cn('mr-2 h-4 w-4', patient?.id === p.id ? 'opacity-100' : 'opacity-0')} />
                    <div className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate text-sm font-medium">
                        {p.patient_no ? `${p.patient_no} · ` : ''}{p.name}
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        {[patientAgeLabel(p), p.sex, p.phone].filter(Boolean).join(' · ')}
                      </span>
                      {p.allergies && p.allergies.length > 0 && (
                        <span className="mt-0.5 flex flex-wrap gap-1">
                          {p.allergies.map((a) => (
                            <Badge key={a} variant="destructive" className="h-4 px-1.5 text-[10px]">{a}</Badge>
                          ))}
                        </span>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
            <div className="border-t p-1">
              <QuickCreatePatient
                seedName={term}
                onCreated={(p) => { onSelect(p); setOpen(false); setTerm('') }}
              />
            </div>
          </Command>
        </PopoverContent>
      </Popover>
    </>
  )
}

/** Inline "create patient" row + dialog shown at the bottom of the picker. */
function QuickCreatePatient({ seedName, onCreated }: { seedName: string; onCreated: (p: Patient) => void }) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [age, setAge] = useState('')
  const [ageText, setAgeText] = useState('')
  const [sex, setSex] = useState('')
  const [phone, setPhone] = useState('')
  const [allergies, setAllergies] = useState<string[]>([])
  const create = useCreatePatientMutation()

  const openDialog = () => {
    setName(seedName)
    setOpen(true)
  }

  const submit = async () => {
    if (!name.trim()) { toast.error('Patient name is required'); return }
    try {
      const res = await create.mutateAsync({
        name: name.trim(),
        age_years: age ? Number(age) : null,
        age_text: ageText || null,
        sex: sex || null,
        phone: phone || null,
        allergies,
      } as any)
      const row = (res as any)?.data ?? res
      toast.success(`Patient ${row?.patient_no ?? ''} created`)
      setOpen(false)
      if (row) onCreated(row)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to create patient')
    }
  }

  return (
    <>
      <Button type="button" variant="ghost" size="sm" className="w-full justify-start text-sm" onClick={openDialog}>
        <UserPlus className="mr-2 h-4 w-4" /> Create new patient{seedName ? ` “${seedName}”` : ''}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle>Quick add patient</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-1">
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-3 space-y-1.5">
                <Label>Name *</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" />
              </div>
              <div className="space-y-1.5">
                <Label>Age (years)</Label>
                <Input type="number" min="0" value={age} onChange={(e) => setAge(e.target.value)} placeholder="35" />
              </div>
              <div className="space-y-1.5">
                <Label>Age text</Label>
                <Input value={ageText} onChange={(e) => setAgeText(e.target.value)} placeholder="2 months" />
              </div>
              <div className="space-y-1.5">
                <Label>Sex</Label>
                <Select value={sex} onValueChange={setSex}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {SEX_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>Phone</Label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Optional" />
              </div>
              <div className="col-span-3 space-y-1.5">
                <Label>Known allergies</Label>
                <Input
                  placeholder="e.g. Penicillin (comma separated)"
                  onChange={(e) => {
                    const v = e.target.value
                    setAllergies(v.split(',').map((s) => s.trim()).filter(Boolean))
                  }}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="button" onClick={submit} disabled={create.isPending}>
              {create.isPending ? 'Saving…' : 'Create & select'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
