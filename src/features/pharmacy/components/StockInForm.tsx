import { useNavigate } from '@tanstack/react-router'
import { useFieldArray, useForm, Controller } from 'react-hook-form'
import { toast } from 'sonner'
import { ArrowLeft, PackageCheck, Plus, Trash2 } from 'lucide-react'
import { AppHeader } from '@/components/layout/app-header'
import { Main } from '@/components/layout/main'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { DateField } from '@/components/date-field'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useCreateStockInMutation, useMedicinesQuery, usePharmacySuppliersQuery } from '@/features/pharmacy/pharmacyQueries'
import { useCurrency } from '@/hooks/use-currency'

type ItemValues = {
  medicine_id: string
  batch_no: string
  quantity: string
  purchase_price: string
  expiry_date: string
}
type Values = {
  supplier_id: string
  invoice_no: string
  stock_in_date: string
  paid_now: string
  notes: string
  items: ItemValues[]
}

const BACK = '/dashboard/pharmacy/stock-in'
const today = () => new Date().toISOString().slice(0, 10)
const emptyItem: ItemValues = { medicine_id: '', batch_no: '', quantity: '', purchase_price: '', expiry_date: '' }

export function StockInForm() {
  const navigate = useNavigate()
  const { currencySymbol } = useCurrency()
  const create = useCreateStockInMutation()
  const { data: suppliers } = usePharmacySuppliersQuery()
  const { data: medicinesResult } = useMedicinesQuery({ limit: 500 })
  const medicines = medicinesResult?.rows || []

  const { control, handleSubmit, watch } = useForm<Values>({
    defaultValues: {
      supplier_id: '',
      invoice_no: '',
      stock_in_date: today(),
      paid_now: '',
      notes: '',
      items: [{ ...emptyItem }],
    },
  })
  const { fields, append, remove } = useFieldArray({ control, name: 'items' })
  const items = watch('items')

  const total = items.reduce((sum, it) => sum + (Number(it.quantity) || 0) * (Number(it.purchase_price) || 0), 0)
  const paidNow = watch('paid_now')
  const due = paidNow === '' ? null : Math.max(0, Math.round((total - (Number(paidNow) || 0)) * 100) / 100)

  const onSubmit = async (values: Values) => {
    const lineItems = values.items
      .filter((it) => it.medicine_id && Number(it.quantity) > 0)
      .map((it) => ({
        medicine_id: Number(it.medicine_id),
        batch_no: it.batch_no || null,
        quantity: Number(it.quantity),
        purchase_price: Number(it.purchase_price) || 0,
        expiry_date: it.expiry_date || null,
      }))
    if (lineItems.length === 0) { toast.error('Add at least one line item'); return }

    try {
      await create.mutateAsync({
        supplier_id: values.supplier_id ? Number(values.supplier_id) : null,
        invoice_no: values.invoice_no || null,
        stock_in_date: values.stock_in_date || null,
        paid_amount: values.paid_now === '' ? null : Number(values.paid_now),
        notes: values.notes || null,
        items: lineItems,
      } as any)
      toast.success('Stock-in recorded')
      navigate({ to: BACK })
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to record stock-in')
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
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Record Stock-In</h1>
              <p className="text-muted-foreground text-sm">Medicines received from a supplier</p>
            </div>
          </div>

          <Card className="overflow-hidden transition-all duration-300 gap-0 shadow-none p-0">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b py-1.5 px-4 gap-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg shadow-lg"><PackageCheck className="w-4 h-4 text-white" /></div>
                <div>
                  <CardTitle className="text-lg font-bold">Stock-In Details</CardTitle>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Supplier and reference</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  <label className="text-sm font-medium">Invoice No.</label>
                  <Controller control={control} name="invoice_no" render={({ field }) => (
                    <Input placeholder="Supplier's invoice/reference" {...field} />
                  )} />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium">Date</label>
                  <Controller control={control} name="stock_in_date" render={({ field }) => (
                    <DateField value={field.value} onChange={field.onChange} placeholder="Stock-in date" className="w-full" />
                  )} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Paid Now</label>
                  <Controller control={control} name="paid_now" render={({ field }) => (
                    <Input type="number" step="0.01" min="0" placeholder="Blank = fully paid" {...field} />
                  )} />
                  {due != null && <p className="text-xs text-muted-foreground">Payable to supplier: {currencySymbol} {due.toFixed(2)}</p>}
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
                    <CardTitle className="text-lg font-bold">Line Items</CardTitle>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Medicine, batch, quantity and cost</p>
                  </div>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={() => append({ ...emptyItem })}>
                  <Plus className="h-4 w-4 mr-1" /> Add Line
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {fields.map((f, idx) => (
                <div key={f.id} className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] gap-2 items-end border-b pb-3 last:border-b-0 last:pb-0">
                  <div className="space-y-1">
                    {idx === 0 && <label className="text-xs text-muted-foreground">Medicine</label>}
                    <Controller control={control} name={`items.${idx}.medicine_id`} render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className="w-full"><SelectValue placeholder="Select medicine" /></SelectTrigger>
                        <SelectContent>
                          {medicines.map((m) => <SelectItem key={m.id} value={String(m.id)}>{m.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    )} />
                  </div>
                  <div className="space-y-1">
                    {idx === 0 && <label className="text-xs text-muted-foreground">Batch No.</label>}
                    <Controller control={control} name={`items.${idx}.batch_no`} render={({ field }) => (
                      <Input placeholder="Optional" {...field} />
                    )} />
                  </div>
                  <div className="space-y-1">
                    {idx === 0 && <label className="text-xs text-muted-foreground">Quantity</label>}
                    <Controller control={control} name={`items.${idx}.quantity`} render={({ field }) => (
                      <Input type="number" min="1" placeholder="0" {...field} />
                    )} />
                  </div>
                  <div className="space-y-1">
                    {idx === 0 && <label className="text-xs text-muted-foreground">Cost / Unit</label>}
                    <Controller control={control} name={`items.${idx}.purchase_price`} render={({ field }) => (
                      <Input type="number" step="0.01" min="0" placeholder="0.00" {...field} />
                    )} />
                  </div>
                  <div className="space-y-1">
                    {idx === 0 && <label className="block text-xs text-muted-foreground">Expiry</label>}
                    <Controller control={control} name={`items.${idx}.expiry_date`} render={({ field }) => (
                      <DateField value={field.value} onChange={field.onChange} placeholder="Optional" className="w-full" />
                    )} />
                  </div>
                  <Button type="button" variant="ghost" size="icon" onClick={() => remove(idx)} disabled={fields.length === 1}>
                    <Trash2 className="h-4 w-4 text-rose-600" />
                  </Button>
                </div>
              ))}

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
              {create.isPending ? 'Saving…' : 'Record Stock-In'}
            </Button>
          </div>
        </form>
      </Main>
    </>
  )
}
