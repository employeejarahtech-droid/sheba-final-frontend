import { useMemo, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useFieldArray, useForm, Controller } from 'react-hook-form'
import { toast } from 'sonner'
import { ArrowLeft, FileText, Plus, Trash2, Check, ChevronsUpDown } from 'lucide-react'
import { AppHeader } from '@/components/layout/app-header'
import { Main } from '@/components/layout/main'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { DateField } from '@/components/date-field'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { cn } from '@/lib/utils'
import { useCreateStandaloneSaleReturnMutation, useMedicinesQuery, usePharmacyTaxModeQuery } from '@/features/pharmacy/pharmacyQueries'
import { useCurrency } from '@/hooks/use-currency'

const REASONS = ['Wrong Item', 'Patient Changed Mind', 'Adverse Reaction', 'Damaged/Defective', 'Other']
const today = () => new Date().toISOString().slice(0, 10)

type ItemValues = { medicine_id: string; quantity: string; unit_price: string }
type Values = {
  patient_name: string
  phone: string
  return_date: string
  reason: string
  notes: string
  items: ItemValues[]
}
const emptyItem: ItemValues = { medicine_id: '', quantity: '1', unit_price: '' }
const BACK = '/dashboard/pharmacy/sales-returns'

export function StandaloneSaleReturnForm() {
  const navigate = useNavigate()
  const { currencySymbol, format } = useCurrency()
  const create = useCreateStandaloneSaleReturnMutation()
  const { data: medicinesResult } = useMedicinesQuery({ limit: 500, status: 'active' })
  const { data: taxModeData } = usePharmacyTaxModeQuery()
  const medicines = medicinesResult?.rows || []
  const medicineById = useMemo(() => new Map(medicines.map((m) => [String(m.id), m])), [medicines])

  const [openMedIdx, setOpenMedIdx] = useState<number | null>(null)

  const { control, handleSubmit, watch } = useForm<Values>({
    defaultValues: {
      patient_name: '', phone: '', return_date: today(), reason: '', notes: '',
      items: [{ ...emptyItem }],
    },
  })
  const { fields, append, remove } = useFieldArray({ control, name: 'items' })
  const items = watch('items')

  const subtotal = items.reduce((sum, it) => sum + (Number(it.quantity) || 0) * (Number(it.unit_price) || 0), 0)
  const taxMode = taxModeData?.tax_mode ?? 'exclusive'
  const tax = useMemo(() => {
    let t = 0
    for (const it of items) {
      const rate = Number(medicineById.get(it.medicine_id)?.tax_rate || 0)
      if (!rate) continue
      const line = (Number(it.quantity) || 0) * (Number(it.unit_price) || 0)
      t += taxMode === 'inclusive' ? (line * rate) / (100 + rate) : (line * rate) / 100
    }
    return Math.round(t * 100) / 100
  }, [items, medicineById, taxMode])
  const total = taxMode === 'inclusive' ? subtotal : Math.round((subtotal + tax) * 100) / 100

  const onSubmit = async (values: Values) => {
    const lineItems = values.items
      .filter((it) => it.medicine_id && Number(it.quantity) > 0)
      .map((it) => ({
        medicine_id: Number(it.medicine_id),
        quantity: Number(it.quantity),
        unit_price: Number(it.unit_price) || 0,
      }))
    if (lineItems.length === 0) { toast.error('Add at least one item'); return }

    try {
      const res = await create.mutateAsync({
        patient_name: values.patient_name || null,
        phone: values.phone || null,
        return_date: values.return_date || null,
        reason: values.reason || null,
        notes: values.notes || null,
        items: lineItems,
      } as any)
      const ret = (res as any)?.data ?? res
      toast.success(`Return ${ret?.return_no || ''} recorded`)
      navigate({ to: BACK })
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to record return')
    }
  }

  return (
    <>
      <AppHeader fixed />
      <Main className="flex flex-1 flex-col gap-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 w-full max-w-[1000px] mx-auto px-4">
          <div className="flex items-center gap-4 mb-2">
            <Button type="button" variant="ghost" size="icon" onClick={() => navigate({ to: BACK })}><ArrowLeft className="h-5 w-5" /></Button>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">Standalone Return</h1>
              <p className="text-muted-foreground text-sm">With sales invoice — not tied to a sale already in this system</p>
            </div>
          </div>

          <Card className="overflow-hidden transition-all duration-300 gap-0 shadow-none p-0">
            <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border-b py-1.5 px-4 gap-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg shadow-lg"><FileText className="w-4 h-4 text-white" /></div>
                <div>
                  <CardTitle className="text-lg font-bold">Invoice Details</CardTitle>
                  <p className="text-xs text-gray-600 dark:text-gray-400">From the customer's paper receipt</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Patient / Buyer Name</label>
                  <Controller control={control} name="patient_name" render={({ field }) => (
                    <Input placeholder="Optional" {...field} />
                  )} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Phone</label>
                  <Controller control={control} name="phone" render={({ field }) => (
                    <Input placeholder="Optional" {...field} />
                  )} />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium">Return Date</label>
                  <Controller control={control} name="return_date" render={({ field }) => (
                    <DateField value={field.value} onChange={field.onChange} placeholder="Return date" className="w-full" />
                  )} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Reason</label>
                  <Controller control={control} name="reason" render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full"><SelectValue placeholder="Select reason" /></SelectTrigger>
                      <SelectContent>
                        {REASONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  )} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden transition-all duration-300 gap-0 shadow-none p-0">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b py-1.5 px-4 gap-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg shadow-lg"><Plus className="w-4 h-4 text-white" /></div>
                  <div>
                    <CardTitle className="text-lg font-bold">Items Being Returned</CardTitle>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Medicine, quantity and the price charged on the original invoice</p>
                  </div>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={() => append({ ...emptyItem })}>
                  <Plus className="h-4 w-4 mr-1" /> Add Item
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {fields.map((f, idx) => {
                const lineTotal = (Number(items[idx]?.quantity) || 0) * (Number(items[idx]?.unit_price) || 0)
                return (
                  <div key={f.id} className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_1fr_auto] gap-2 items-end border-b pb-3 last:border-b-0 last:pb-0">
                    <div className="space-y-1">
                      {idx === 0 && <label className="block text-xs text-muted-foreground">Medicine</label>}
                      <Controller control={control} name={`items.${idx}.medicine_id`} render={({ field }) => {
                        const med = medicineById.get(field.value)
                        const isOpen = openMedIdx === idx
                        const selectMedicine = (id: string) => {
                          field.onChange(id)
                          setOpenMedIdx(null)
                        }
                        return (
                          <Popover open={isOpen} onOpenChange={(o) => setOpenMedIdx(o ? idx : null)}>
                            <PopoverTrigger asChild>
                              <Button
                                type="button"
                                variant="outline"
                                role="combobox"
                                aria-expanded={isOpen}
                                className={cn('w-full justify-between font-normal', !med && 'text-muted-foreground')}
                              >
                                <span className="truncate">{med ? med.name : 'Select medicine'}</span>
                                <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[360px] p-0" align="start">
                              <Command>
                                <CommandInput placeholder="Search medicine by name…" />
                                <CommandList>
                                  <CommandEmpty>No medicine found.</CommandEmpty>
                                  <CommandGroup>
                                    {medicines.map((m) => (
                                      <CommandItem
                                        key={m.id}
                                        value={`${m.name} ${m.generic_name || ''}`}
                                        onSelect={() => selectMedicine(String(m.id))}
                                      >
                                        <Check className={cn('mr-2 h-4 w-4', field.value === String(m.id) ? 'opacity-100' : 'opacity-0')} />
                                        <span className="truncate">{m.name}</span>
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                        )
                      }} />
                    </div>
                    <div className="space-y-1">
                      {idx === 0 && <label className="text-xs text-muted-foreground">Quantity</label>}
                      <Controller control={control} name={`items.${idx}.quantity`} render={({ field }) => (
                        <Input type="number" min="1" placeholder="1" className="text-right" {...field} />
                      )} />
                    </div>
                    <div className="space-y-1">
                      {idx === 0 && <label className="block text-xs text-muted-foreground">Unit Price</label>}
                      <Controller control={control} name={`items.${idx}.unit_price`} render={({ field }) => (
                        <Input type="number" step="0.01" min="0" placeholder="0.00" className="text-right" {...field} />
                      )} />
                    </div>
                    <div className="space-y-1">
                      {idx === 0 && <label className="block text-xs text-muted-foreground">Subtotal</label>}
                      <p className="flex h-9 items-center justify-end text-sm font-semibold">{format(lineTotal)}</p>
                    </div>
                    <Button type="button" variant="ghost" size="icon" onClick={() => remove(idx)} disabled={fields.length === 1}>
                      <Trash2 className="h-4 w-4 text-rose-600" />
                    </Button>
                  </div>
                )
              })}

              <div className="pt-3">
                <table className="w-full max-w-[320px] ml-auto text-sm">
                  <tbody>
                    <tr>
                      <td className="py-1 text-muted-foreground">Subtotal</td>
                      <td className="py-1 text-right">{format(subtotal)}</td>
                    </tr>
                    {tax > 0 && (
                      <tr>
                        <td className="py-1 text-muted-foreground">VAT</td>
                        <td className="py-1 text-right">{format(tax)}</td>
                      </tr>
                    )}
                    <tr className="border-t-2 border-emerald-500/40">
                      <td className="py-2 text-base font-bold">Total Refund</td>
                      <td className="py-2 text-right text-lg font-bold text-rose-600">{format(total)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="space-y-2 pt-2">
                <label className="text-sm font-medium">Notes</label>
                <Controller control={control} name="notes" render={({ field }) => (
                  <Textarea placeholder="Optional — e.g. reference to the paper invoice" className="min-h-[60px]" {...field} />
                )} />
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center justify-end gap-3 pb-10">
            <Button type="button" variant="outline" size="lg" onClick={() => navigate({ to: BACK })} disabled={create.isPending}>Cancel</Button>
            <Button type="submit" size="lg" disabled={create.isPending} className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white min-w-[180px]">
              {create.isPending ? 'Saving…' : 'Record Return'}
            </Button>
          </div>
        </form>
      </Main>
    </>
  )
}
