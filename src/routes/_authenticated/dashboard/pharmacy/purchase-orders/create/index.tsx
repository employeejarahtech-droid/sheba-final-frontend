import { useMemo, useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useFieldArray, useForm, Controller } from 'react-hook-form'
import { toast } from 'sonner'
import { ArrowLeft, Check, ChevronsUpDown, ClipboardList, Plus, Trash2, Wand2 } from 'lucide-react'
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
import {
  useCreatePurchaseOrderMutation, useMedicinesQuery, usePharmacySuppliersQuery, useReorderSuggestionsQuery,
} from '@/features/pharmacy/pharmacyQueries'
import { useCurrency } from '@/hooks/use-currency'

type ItemValues = { medicine_id: string; quantity: string; unit_price: string; discount: string }
type Values = {
  supplier_id: string
  order_date: string
  expected_date: string
  notes: string
  status: string
  items: ItemValues[]
}

const BACK = '/dashboard/pharmacy/purchase-orders'
const today = () => new Date().toISOString().slice(0, 10)
const emptyItem: ItemValues = { medicine_id: '', quantity: '', unit_price: '', discount: '0' }

/** Line-level discount is a PERCENTAGE (0–100) of that line's gross total,
 *  folded into an effective per-unit cost on submit — pharmacy_purchase_
 *  order_items has no separate discount column, same pattern as the Sale
 *  form's per-line discount. */
const lineGross = (it: ItemValues) => (Number(it.quantity) || 0) * (Number(it.unit_price) || 0)
const lineDiscountPct = (it: ItemValues) => Math.min(Math.max(Number(it.discount) || 0, 0), 100)
const lineDiscountAmt = (it: ItemValues) => Math.round(lineGross(it) * (lineDiscountPct(it) / 100) * 100) / 100
const lineNet = (it: ItemValues) => Math.max(0, lineGross(it) - lineDiscountAmt(it))
const lineNetUnitPrice = (it: ItemValues) => {
  const qty = Number(it.quantity) || 0
  if (qty <= 0) return Number(it.unit_price) || 0
  return Math.round((lineNet(it) / qty) * 100) / 100
}

export const Route = createFileRoute('/_authenticated/dashboard/pharmacy/purchase-orders/create/')({
  component: PurchaseOrderCreatePage,
})

function PurchaseOrderCreatePage() {
  const navigate = useNavigate()
  const { currencySymbol } = useCurrency()
  const create = useCreatePurchaseOrderMutation()
  const { data: suppliers } = usePharmacySuppliersQuery()
  const { data: medicinesResult } = useMedicinesQuery({ limit: 500 })
  const { data: suggestions } = useReorderSuggestionsQuery()
  const medicines = medicinesResult?.rows || []
  const medicineById = useMemo(() => new Map(medicines.map((m) => [String(m.id), m])), [medicines])

  const { control, handleSubmit, watch, setValue } = useForm<Values>({
    defaultValues: {
      supplier_id: '',
      order_date: today(),
      expected_date: '',
      notes: '',
      status: 'ordered',
      items: [{ ...emptyItem }],
    },
  })
  const { fields, append, remove } = useFieldArray({ control, name: 'items' })
  const items = watch('items')
  const supplierId = watch('supplier_id')
  const [openMedIdx, setOpenMedIdx] = useState<number | null>(null)

  const total = items.reduce((sum, it) => sum + lineNet(it), 0)

  /** Fill empty lines with reorder suggestions (optionally just one
   *  supplier's). Lines already filled are left untouched. */
  const prefillFromSuggestions = () => {
    const pool = (suggestions || []).filter((s) => !supplierId || String(s.supplier_id) === supplierId)
    if (pool.length === 0) {
      toast.info(supplierId
        ? 'No reorder suggestions for this supplier — clear the supplier filter or pick another'
        : 'No medicines are at/below reorder level right now')
      return
    }
    let idx = 0
    const used = new Set(items.filter((it) => it.medicine_id).map((it) => it.medicine_id))
    const fresh: ItemValues[] = []
    for (const s of pool) {
      if (used.has(String(s.id))) continue
      const med = medicineById.get(String(s.id))
      if (!med) continue
      if (idx < items.length && !items[idx].medicine_id) {
        setValue(`items.${idx}.medicine_id`, String(s.id))
        setValue(`items.${idx}.quantity`, String(s.suggested_qty))
        setValue(`items.${idx}.unit_price`, '')
        setValue(`items.${idx}.discount`, '0')
        used.add(String(s.id))
        idx++
      } else {
        fresh.push({ medicine_id: String(s.id), quantity: String(s.suggested_qty), unit_price: '', discount: '0' })
        used.add(String(s.id))
      }
    }
    // Drop still-empty seed line when suggestions replaced it
    if (fresh.length || idx > 0) {
      if (items.length === 1 && !items[0].medicine_id && idx === 0) remove(0)
      fresh.forEach((f) => append(f))
    }
    toast.success(`Loaded ${idx + fresh.length} reorder suggestion(s) — set the cost prices before saving`)
  }

  const onSubmit = async (values: Values) => {
    const lineItems = values.items
      .filter((it) => it.medicine_id && Number(it.quantity) > 0)
      .map((it) => ({
        medicine_id: Number(it.medicine_id),
        quantity: Number(it.quantity),
        unit_price: lineNetUnitPrice(it),
      }))
    if (lineItems.length === 0) { toast.error('Add at least one line item'); return }

    try {
      await create.mutateAsync({
        supplier_id: values.supplier_id ? Number(values.supplier_id) : null,
        order_date: values.order_date || null,
        expected_date: values.expected_date || null,
        notes: values.notes || null,
        status: values.status === 'draft' ? 'draft' : 'ordered',
        items: lineItems,
      } as any)
      toast.success('Purchase order created')
      navigate({ to: BACK })
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to create purchase order')
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
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">New Purchase Order</h1>
              <p className="text-muted-foreground text-sm">Plan a supplier order; receive it into batch stock later</p>
            </div>
          </div>

          <Card className="overflow-hidden transition-all duration-300 gap-0 shadow-none p-0">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b py-1.5 px-4 gap-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg shadow-lg"><ClipboardList className="w-4 h-4 text-white" /></div>
                <div>
                  <CardTitle className="text-lg font-bold">Order Details</CardTitle>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Supplier and dates</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Supplier</label>
                  <Controller control={control} name="supplier_id" render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full"><SelectValue placeholder="Select supplier" /></SelectTrigger>
                      <SelectContent>
                        {(suppliers || []).map((s) => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  )} />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium">Order Date</label>
                  <Controller control={control} name="order_date" render={({ field }) => (
                    <DateField value={field.value} onChange={field.onChange} placeholder="Today" className="w-full" />
                  )} />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium">Expected Delivery</label>
                  <Controller control={control} name="expected_date" render={({ field }) => (
                    <DateField value={field.value} onChange={field.onChange} placeholder="Optional" className="w-full" />
                  )} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Save As</label>
                  <Controller control={control} name="status" render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ordered">Ordered (confirmed with supplier)</SelectItem>
                        <SelectItem value="draft">Draft (not yet ordered)</SelectItem>
                      </SelectContent>
                    </Select>
                  )} />
                </div>
                <div className="md:col-span-4 space-y-2">
                  <label className="text-sm font-medium">Notes</label>
                  <Controller control={control} name="notes" render={({ field }) => (
                    <Textarea placeholder="Optional" className="min-h-[60px]" {...field} />
                  )} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden transition-all duration-300 gap-0 shadow-none p-0">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b py-1.5 px-4 gap-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg shadow-lg"><Plus className="w-4 h-4 text-white" /></div>
                  <div>
                    <CardTitle className="text-lg font-bold">Line Items</CardTitle>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Medicine, quantity and expected cost</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={prefillFromSuggestions}>
                    <Wand2 className="h-4 w-4 mr-1" /> Prefill Reorder
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => append({ ...emptyItem })}>
                    <Plus className="h-4 w-4 mr-1" /> Add Line
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {fields.map((f, idx) => {
                const selected = medicineById.get(items[idx]?.medicine_id)
                return (
                  <div key={f.id} className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] gap-2 items-end border-b pb-3 last:border-b-0 last:pb-0">
                    <div className="space-y-1">
                      {idx === 0 && <label className="block text-xs text-muted-foreground">Medicine</label>}
                      <Controller control={control} name={`items.${idx}.medicine_id`} render={({ field }) => {
                        const isOpen = openMedIdx === idx
                        const med = medicineById.get(field.value)
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
                                <span className="truncate">
                                  {med ? `${med.name} · stock: ${med.stock_quantity}` : 'Select medicine'}
                                </span>
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
                                        onSelect={() => { field.onChange(String(m.id)); setOpenMedIdx(null) }}
                                      >
                                        <Check className={cn('mr-2 h-4 w-4', field.value === String(m.id) ? 'opacity-100' : 'opacity-0')} />
                                        <span className="truncate">{m.name} · stock: {m.stock_quantity}</span>
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                        )
                      }} />
                      <p className={cn('text-xs h-4', !selected && 'invisible')}>
                        <span className="text-muted-foreground">In Stock:</span> <span className="font-medium">{selected?.stock_quantity ?? 0}</span>
                        {' · '}
                        <span className="text-muted-foreground">Reorder At:</span> <span className="font-medium">{selected?.reorder_level ?? 0}</span>
                      </p>
                    </div>
                    <div className="space-y-1">
                      {idx === 0 && <label className="block text-xs text-muted-foreground">Quantity</label>}
                      <Controller control={control} name={`items.${idx}.quantity`} render={({ field }) => (
                        <Input type="number" min="1" placeholder="0" className="text-right" {...field} />
                      )} />
                      <p className="text-xs h-4 invisible">placeholder</p>
                    </div>
                    <div className="space-y-1">
                      {idx === 0 && <label className="block text-xs text-muted-foreground">Cost / Unit</label>}
                      <Controller control={control} name={`items.${idx}.unit_price`} render={({ field }) => (
                        <Input type="number" step="0.01" min="0" placeholder="0.00" className="text-right" {...field} />
                      )} />
                      <p className="text-xs h-4 invisible">placeholder</p>
                    </div>
                    <div className="space-y-1">
                      {idx === 0 && <label className="block text-xs text-muted-foreground">Discount (%)</label>}
                      <Controller control={control} name={`items.${idx}.discount`} render={({ field }) => (
                        <Input type="number" step="0.01" min="0" max="100" placeholder="0" className="text-right" {...field} />
                      )} />
                      <p className="text-xs h-4 invisible">placeholder</p>
                    </div>
                    <div className="space-y-1">
                      {idx === 0 && <label className="block text-xs text-muted-foreground">Total</label>}
                      <p className="flex h-9 items-center justify-end text-sm font-semibold">
                        {currencySymbol} {lineNet(items[idx] || emptyItem).toFixed(2)}
                      </p>
                      <p className="text-xs h-4 invisible">placeholder</p>
                    </div>
                    <div className="space-y-1">
                      {idx === 0 && <label className="block text-xs text-muted-foreground invisible">Remove</label>}
                      <Button type="button" variant="ghost" size="icon" onClick={() => remove(idx)} disabled={fields.length === 1}>
                        <Trash2 className="h-4 w-4 text-rose-600" />
                      </Button>
                      <p className="text-xs h-4 invisible">placeholder</p>
                    </div>
                  </div>
                )
              })}

              <div className="flex justify-end pt-2">
                <div className="text-sm font-semibold">
                  Total: <span className="text-lg text-emerald-600">{currencySymbol} {total.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center justify-end gap-3 pb-10">
            <Button type="button" variant="outline" size="lg" onClick={() => navigate({ to: BACK })} disabled={create.isPending}>Cancel</Button>
            <Button type="submit" size="lg" disabled={create.isPending} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white min-w-[180px]">
              {create.isPending ? 'Saving…' : 'Create Purchase Order'}
            </Button>
          </div>
        </form>
      </Main>
    </>
  )
}
