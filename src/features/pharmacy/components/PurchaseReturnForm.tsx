import { useNavigate } from '@tanstack/react-router'
import { useFieldArray, useForm, Controller } from 'react-hook-form'
import { toast } from 'sonner'
import { ArrowLeft, Undo2, Plus, Trash2 } from 'lucide-react'
import { AppHeader } from '@/components/layout/app-header'
import { Main } from '@/components/layout/main'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { DateField } from '@/components/date-field'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useCreatePurchaseReturnMutation, usePharmacySuppliersQuery, useStockInBatchesQuery, useStockInsQuery } from '@/features/pharmacy/pharmacyQueries'
import { useCurrency } from '@/hooks/use-currency'
import type { PharmacyBatch } from '@/types/pharmacy.types'

type ItemValues = { batch_id: string; quantity: string; unit_price: string }
type Values = {
  supplier_id: string
  stock_in_id: string
  return_date: string
  reason: string
  notes: string
  items: ItemValues[]
}

const BACK = '/dashboard/pharmacy/purchase-returns'
const today = () => new Date().toISOString().slice(0, 10)
const emptyItem: ItemValues = { batch_id: '', quantity: '', unit_price: '' }
const REASONS = ['Wrong Item', 'Damaged on Arrival', 'Expired', 'Overstock', 'Other']

const fmtDate = (d?: string | null) => (d ? new Date(d).toLocaleDateString() : '—')

/** Human label for a batch line: B123 · exp 2026-12-31 · 40 left · @2.50 */
const batchLabel = (b: PharmacyBatch) =>
  `${b.batch_no || `#${b.id}`}${b.expiry_date ? ` · exp ${b.expiry_date}` : ''} · ${b.quantity_remaining} left · ${b.medicine?.name || ''}`

export function PurchaseReturnForm() {
  const navigate = useNavigate()
  const { currencySymbol } = useCurrency()
  const create = useCreatePurchaseReturnMutation()
  const { data: suppliers } = usePharmacySuppliersQuery()
  const { data: stockInsResult } = useStockInsQuery({ limit: 200 })
  const stockIns = (stockInsResult?.rows || []).filter((s) => s.supplier_id != null)

  const { control, handleSubmit, watch, setValue } = useForm<Values>({
    defaultValues: {
      supplier_id: '',
      stock_in_id: '',
      return_date: today(),
      reason: '',
      notes: '',
      items: [{ ...emptyItem }],
    },
  })
  const { fields, append, remove } = useFieldArray({ control, name: 'items' })
  const supplierId = watch('supplier_id')
  const stockInId = watch('stock_in_id')
  const items = watch('items')

  const supplierStockIns = stockIns.filter((s) => String(s.supplier_id) === String(supplierId))
  // Live (still-unsold) batches of the chosen purchase — the returnable pool.
  const { data: stockIn, isPending: batchesLoading } = useStockInBatchesQuery(stockInId || undefined)
  const batches = (stockIn?.batches || []).filter((b) => b.quantity_remaining > 0)
  const batchById = new Map(batches.map((b) => [String(b.id), b]))

  const total = items.reduce((sum, it) => sum + (Number(it.quantity) || 0) * (Number(it.unit_price) || 0), 0)

  const onSubmit = async (values: Values) => {
    if (!values.stock_in_id) { toast.error('Select the purchase (stock-in) being returned'); return }
    const lineItems = values.items
      .filter((it) => it.batch_id && Number(it.quantity) > 0)
      .map((it) => {
        const batch = batchById.get(it.batch_id)
        return {
          medicine_id: batch?.medicine_id,
          batch_id: Number(it.batch_id),
          quantity: Number(it.quantity),
          unit_price: Number(it.unit_price) || 0,
        }
      })
    if (lineItems.length === 0) { toast.error('Add at least one line item'); return }
    for (const it of lineItems) {
      if (!it.medicine_id) { toast.error('Selected batch is no longer available — reload the batches'); return }
    }

    try {
      await create.mutateAsync({
        supplier_id: values.supplier_id ? Number(values.supplier_id) : null,
        stock_in_id: Number(values.stock_in_id),
        return_date: values.return_date || null,
        reason: values.reason || null,
        notes: values.notes || null,
        items: lineItems,
      } as any)
      toast.success('Purchase return recorded')
      navigate({ to: BACK })
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to record purchase return')
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
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Purchase Return</h1>
              <p className="text-muted-foreground text-sm">Send purchased stock back to a supplier — batch by batch</p>
            </div>
          </div>

          <Card className="overflow-hidden transition-all duration-300 gap-0 shadow-none p-0">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b py-1.5 px-4 gap-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-gradient-to-br from-rose-500 to-red-500 rounded-lg shadow-lg"><Undo2 className="w-4 h-4 text-white" /></div>
                <div>
                  <CardTitle className="text-lg font-bold">Return Details</CardTitle>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Supplier, purchase and reason</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Supplier</label>
                  <Controller control={control} name="supplier_id" render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={(val) => {
                        field.onChange(val)
                        setValue('stock_in_id', '')
                        setValue('items', [{ ...emptyItem }])
                      }}
                    >
                      <SelectTrigger className="w-full"><SelectValue placeholder="Select supplier" /></SelectTrigger>
                      <SelectContent>
                        {(suppliers || []).map((s) => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  )} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Purchase (Stock-In)</label>
                  <Controller control={control} name="stock_in_id" render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={(val) => { field.onChange(val); setValue('items', [{ ...emptyItem }]) }}
                      disabled={!supplierId}
                    >
                      <SelectTrigger className="w-full"><SelectValue placeholder={supplierId ? 'Select purchase' : 'Select a supplier first'} /></SelectTrigger>
                      <SelectContent>
                        {supplierStockIns.map((s) => (
                          <SelectItem key={s.id} value={String(s.id)}>
                            {s.stock_in_no || `#${s.id}`} · {fmtDate(s.stock_in_date)}{s.invoice_no ? ` · ${s.invoice_no}` : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )} />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium">Date</label>
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
                <div className="md:col-span-3 space-y-2">
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
                    <CardTitle className="text-lg font-bold">Batch Line Items</CardTitle>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {stockInId
                        ? `Unsold batches from ${stockIn?.stock_in_no || `#${stockInId}`}`
                        : 'Select a purchase above to list its unsold batches'}
                    </p>
                  </div>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={() => append({ ...emptyItem })} disabled={!stockInId}>
                  <Plus className="h-4 w-4 mr-1" /> Add Line
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {batchesLoading && stockInId && <p className="text-sm text-muted-foreground">Loading batches…</p>}
              {stockInId && !batchesLoading && batches.length === 0 && (
                <p className="text-sm text-muted-foreground">No unsold batches remain from this purchase.</p>
              )}
              {fields.map((f, idx) => {
                const selected = batchById.get(items[idx]?.batch_id)
                const maxQty = selected ? selected.quantity_remaining : undefined
                const qty = Number(items[idx]?.quantity) || 0
                const overQty = maxQty != null && qty > maxQty
                return (
                  <div key={f.id} className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_auto] gap-2 items-end border-b pb-3 last:border-b-0 last:pb-0">
                    <div className="space-y-1">
                      {idx === 0 && <label className="text-xs text-muted-foreground">Batch (from this purchase)</label>}
                      <Controller control={control} name={`items.${idx}.batch_id`} render={({ field }) => (
                        <Select
                          value={field.value}
                          onValueChange={(val) => {
                            field.onChange(val)
                            const batch = batchById.get(val)
                            setValue(`items.${idx}.unit_price`, batch ? String(batch.purchase_price) : '')
                            setValue(`items.${idx}.quantity`, '')
                          }}
                          disabled={!stockInId}
                        >
                          <SelectTrigger className="w-full"><SelectValue placeholder={stockInId ? 'Select batch' : 'Select a purchase first'} /></SelectTrigger>
                          <SelectContent>
                            {batches.map((b) => (
                              <SelectItem key={b.id} value={String(b.id)}>{batchLabel(b)}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )} />
                      {selected && (
                        <p className={`text-xs ${overQty ? 'text-rose-600 font-medium' : 'text-muted-foreground'}`}>
                          {selected.medicine?.name} — returning {qty} of {selected.quantity_remaining} {selected.medicine?.unit || ''} remaining
                          {overQty ? ' (too many)' : ''}
                        </p>
                      )}
                    </div>
                    <div className="space-y-1">
                      {idx === 0 && <label className="text-xs text-muted-foreground">Quantity</label>}
                      <Controller control={control} name={`items.${idx}.quantity`} render={({ field }) => (
                        <Input type="number" min="1" placeholder="0" {...field} />
                      )} />
                    </div>
                    <div className="space-y-1">
                      {idx === 0 && <label className="text-xs text-muted-foreground">Cost / Unit</label>}
                      <Controller control={control} name={`items.${idx}.unit_price`} render={({ field }) => (
                        <Input type="number" step="0.01" min="0" placeholder="0.00" {...field} />
                      )} />
                    </div>
                    <Button type="button" variant="ghost" size="icon" onClick={() => remove(idx)} disabled={fields.length === 1}>
                      <Trash2 className="h-4 w-4 text-rose-600" />
                    </Button>
                  </div>
                )
              })}

              <div className="flex justify-end pt-2">
                <div className="text-sm font-semibold">
                  Total: <span className="text-lg text-rose-600">{currencySymbol} {total.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center justify-end gap-3 pb-10">
            <Button type="button" variant="outline" size="lg" onClick={() => navigate({ to: BACK })} disabled={create.isPending}>Cancel</Button>
            <Button type="submit" size="lg" disabled={create.isPending} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white min-w-[180px]">
              {create.isPending ? 'Saving…' : 'Record Return'}
            </Button>
          </div>
        </form>
      </Main>
    </>
  )
}
